import React, { useEffect, useState, useMemo } from 'react';
import { formatStringNumber, isEmpty } from "../../services/Helpers/fonctions";
import moment from "moment";
import 'moment/locale/fr';
import { ToWords } from 'to-words';
import Api from '../../services/Api';
import logoDsd from '../../assets/images/DSD_logo.jpeg';
import logoGuinee from '../../assets/images/branding-recu.png';
import logoSimandou from '../../assets/images/simandou2040-recu.png';

const COMMUNES_CONAKRY = ["KALOUM", "DIXINN", "MATAM", "MATOTO", "RATOMA"];
const STATUTS = {
  0: { label: "EN ATTENTE", classe: "attente" },
  1: { label: "VALIDÉ", classe: "valide" },
  2: { label: "REJETÉ", classe: "rejete" },
  3: { label: "À RESOUMETTRE", classe: "resoumettre" },
  4: { label: "RESOUMIS", classe: "resoumis" },
};
const MONTANT_PLAQUE = { IT: 300000, EP: 350000, VA: 350000 };

const toWords = new ToWords({
  localeCode: 'fr-FR',
  converterOptions: { currency: false, ignoreDecimal: false, ignoreZeroCurrency: false, doNotAddOnly: false },
});
const montant = (v) => parseFloat(v) || 0;
// Vignette et autorisation : dateExp vaut le 1er janvier de l'année payée, valable jusqu'au 31 décembre
const finAnnee = (date) => (date ? moment(date).endOf('year').format('DD/MM/YYYY') : null);
const dateSimple = (date) => (date ? moment(date).format('DD/MM/YYYY') : null);
const capitaliser = (texte) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : '');

const InvoiceDetails = React.forwardRef((props, ref) => {
  const [agenceInfo, setAgenceInfo] = useState({});
  const [loadingtest, setLoadingtest] = useState(1);
  const paiementDetail = props.elements?.paiementDetail;
  const paiementInfo = props.elements?.paiementInfo;
  const userInfo = props.elements?.user;

  const api = new Api();
  const url = process.env.REACT_APP_URL.replace('api/', '') + 'storage/';

  useEffect(() => {
    setLoadingtest(1);
    if (paiementInfo?.agence_id) {
      api.apiData('get', `/agence/agencebyid2/${paiementInfo.agence_id}/${paiementInfo.commune_id}`).then((resp) => {
        if (resp?.agence) setAgenceInfo(resp.agence);
      });
    }
    setLoadingtest(2);
  }, [paiementInfo?.agence_id, paiementInfo?.commune_id]);

  // Une ligne par élément payé, dans le même ordre et avec les mêmes règles que CartTable
  const lignes = useMemo(() => {
    if (isEmpty(paiementInfo)) return [];
    const categorie = paiementInfo.categorie || paiementInfo.nomCategorie;
    const resultat = [];
    const operation = paiementInfo.type_document;
    if (operation === 'mutation') {
      // Mutation : carte grise du véhicule, gratuite pour une plaque VA
      resultat.push({ cle: 'mutation', document: 'Mutation', validite: dateSimple(paiementInfo.dateExpCg), categorie,
        detail: paiementInfo.cartegrise ? paiementInfo.expressionCg : 'Plaque VA (gratuite)', montant: montant(paiementInfo.cartegrise?.montant) });
      return resultat;
    }
    if (operation === 'reforme') {
      resultat.push({ cle: 'reforme', document: 'Réforme', categorie, detail: 'Réforme du véhicule', montant: montant(paiementInfo.montant_operation) });
      return resultat;
    }
    if (paiementInfo.cartegrise)
      resultat.push({ cle: 'cg', document: 'Carte grise', validite: dateSimple(paiementInfo.dateExpCg), categorie, detail: paiementInfo.expressionCg, montant: montant(paiementInfo.cartegrise.montant) });
    if (paiementInfo.vignette)
      resultat.push({ cle: 'vg', document: 'Vignette', validite: finAnnee(paiementInfo.dateExpVg), categorie, detail: paiementInfo.vignette.nomType, montant: montant(paiementInfo.vignette.montant) });
    if (paiementInfo.autorisation?.montant !== undefined)
      resultat.push({ cle: 'au', document: 'Autorisation de transport', validite: finAnnee(paiementInfo.dateExpAu), categorie, detail: paiementInfo.autorisation.nomAutorisation, montant: montant(paiementInfo.autorisation.montant) });
    const plaque = paiementInfo.type_plaque || (MONTANT_PLAQUE[paiementInfo.document] ? paiementInfo.document : null);
    if (MONTANT_PLAQUE[plaque])
      resultat.push({ cle: 'plaque', document: `Plaque ${plaque}`, categorie: '—', detail: "Plaque d'immatriculation", montant: MONTANT_PLAQUE[plaque] });
    return resultat;
  }, [paiementInfo]);

  const frais = montant(paiementInfo?.commission);
  const sousTotal = lignes.reduce((s, l) => s + l.montant, 0);
  const total = sousTotal + frais;
  const statut = STATUTS[paiementInfo?.status];
  // Plaque EP ou VA : le titre précise le type de plaque payé
  const plaqueTitre = [paiementInfo?.type_plaque, paiementInfo?.document].find((p) => p === 'EP' || p === 'VA');
  const titre = paiementInfo?.type_document === 'mutation' ? 'Reçu de mutation'
    : paiementInfo?.type_document === 'reforme' ? 'Reçu de réforme'
    : plaqueTitre ? `Reçu de Paiement ${plaqueTitre}` : 'Reçu de paiement';
  const modeImma = paiementInfo?.type_document === 'mutation' ? 'Mutation'
    : paiementInfo?.type_document === 'reforme' ? 'Réforme'
    : paiementDetail?.modeImma == 1 ? 'Immatriculation' : paiementDetail?.modeImma == 2 ? 'Réimmatriculation' : '—';
  const prefecture = agenceInfo.nom_prefecture;
  const commune = agenceInfo.nom_commune === 'COMMUNE URBAINE' ? 'CENTRE' : agenceInfo.nom_commune;
  const agent = userInfo ? `${userInfo.prenom} ${userInfo.nom}` : '';

  return (
    <div className="invoice" ref={ref}>
      {paiementInfo?.paiement_id !== '' ? (
        <>
          <header className="invoice-top">
            <img className="dsd" src={logoDsd} alt="DSD Guinée" />
            <div className="org">
              <span className="rep">République de Guinée</span>
              <span className="name">DSD Guinée</span>
              <span className="sys">Plateforme SIPIM · Paiement des documents de circulation</span>
            </div>
            <div className="agence">
              {agenceInfo.logo && <img src={url + agenceInfo.logo} alt={`Agence ${agenceInfo.nom_agence}`} />}
              {agenceInfo.nom_agence && <span>Agence {agenceInfo.nom_agence} · {commune}</span>}
            </div>
          </header>

          <section className="invoice-title">
            <h1><small>Document justificatif</small>{titre}</h1>
            <div className="ref">
              <span className="lbl">Numéro de référence</span>
              <span className="no">{paiementInfo?.reference}</span>
              <span className="date">Émis le {moment(paiementInfo?.created_at).format('DD/MM/YYYY [à] HH:mm')}</span>
            </div>
          </section>

          <section className="invoice-blocks">
            <div className="block">
              <h2>Émis par</h2>
              <div className="kv"><span>Agence</span><b>{agenceInfo.nom_agence}</b></div>
              <div className="kv"><span>Commune</span><b>{commune}</b></div>
              {prefecture && !COMMUNES_CONAKRY.includes(prefecture) && (
                <div className="kv"><span>Préfecture</span><b>{prefecture}</b></div>
              )}
              <div className="kv"><span>Agent</span><b>{agent}</b></div>
            </div>
            <div className="block">
              <h2>Client</h2>
              <div className="kv"><span>Type</span><b>{paiementDetail?.typeClient}</b></div>
              <div className="kv"><span>Nom</span><b>{paiementDetail?.fullName}</b></div>
              {paiementDetail?.nif && <div className="kv"><span>NIF</span><b className="mono">{paiementDetail.nif}</b></div>}
              <div className="kv"><span>Téléphone</span><b>{paiementDetail?.tel}</b></div>
            </div>
            <div className="block">
              <h2>Véhicule</h2>
              <div className="kv"><span>Châssis</span><b className="mono">{paiementDetail?.chassis}</b></div>
              <div className="kv"><span>Catégorie</span><b>{paiementInfo?.categorie}</b></div>
              <div className="kv"><span>Mode</span><b>{modeImma}</b></div>
              <div className="kv">
                <span>Plaque</span>
                <b>{paiementInfo?.type_plaque ? <span className="plaque">{paiementInfo.type_plaque}</span> : '—'}</b>
              </div>
              <div className="kv"><span>Paiement</span><b>{capitaliser(paiementInfo?.type_paiement) || 'Non fourni'}</b></div>
            </div>
          </section>

          <table className="invoice-lines">
            <thead>
              <tr><th style={{ width: '34%' }}>Document</th><th>Catégorie</th><th>Capacité / type</th><th>Montant (GNF)</th></tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.cle}>
                  <td>{l.document}{l.validite && <span className="sub">Valable jusqu'au {l.validite}</span>}</td>
                  <td>{l.categorie}</td>
                  <td>{l.detail}</td>
                  <td className="amt">{formatStringNumber(l.montant)}</td>
                </tr>
              ))}
              {frais !== 0 && (
                <tr className="fee">
                  <td>Frais de service</td>
                  <td colSpan={2}>Commission de l'agence agréée</td>
                  <td className="amt">{formatStringNumber(frais)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {!isNaN(total) && (
            <section className="invoice-totals">
              <div className="words">
                <p>
                  Arrêté le présent reçu à la somme de
                  <b>{toWords.convert(total)} francs guinéens</b>
                </p>
                {statut && (
                  <div className={`stamp ${statut.classe}`}>
                    {statut.label}
                    <small>{moment(paiementInfo?.created_at).format('DD/MM/YYYY')}</small>
                  </div>
                )}
              </div>
              <div className="sum">
                <div className="row"><span>Documents</span><span>{formatStringNumber(sousTotal)}</span></div>
                <div className="row"><span>Frais de service</span><span>{formatStringNumber(frais)}</span></div>
                <div className="grand"><span>Total payé</span><b>{formatStringNumber(total)}<small>GNF</small></b></div>
              </div>
            </section>
          )}

          <section className="invoice-control">
            <div className="qr">
              {paiementInfo?.qrcodepath && <img src={url + paiementInfo.qrcodepath} alt="QR code de vérification" />}
              <span>Scannez pour vérifier l'authenticité du reçu</span>
            </div>
            <div className="sign"><span>Signature et cachet de l'agent</span><i>{agent}</i></div>
            <div className="sign"><span>Signature du client</span><i>Lu et approuvé</i></div>
          </section>

          <footer className="invoice-foot">
            <div className="foot-text">
              <p>
                Pour toute information, appelez le <b>8163</b> ou consultez <b>support.sipimguinee.com</b>.<br />
                Conservez ce reçu : il vous sera demandé au retrait de vos documents. DSD vous remercie.
              </p>
              <p className="meta">
                Imprimé le {moment().format('DD/MM/YYYY HH:mm')} · Réf. {paiementInfo?.reference} · page 1/1
              </p>
            </div>
            <div className="partners">
              <img src={logoGuinee} alt="Guinée" />
              <img src={logoSimandou} alt="Simandou 2040" />
            </div>
          </footer>
        </>
      ) : (
        <>{loadingtest === 2 && <h2>Ce reçu n'existe pas.</h2>}</>
      )}
    </div>
  );
});

export default InvoiceDetails;
