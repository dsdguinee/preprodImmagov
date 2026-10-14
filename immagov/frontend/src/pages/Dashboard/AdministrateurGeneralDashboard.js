import { useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/fr";
import { AiOutlineEye } from "react-icons/ai";
import { dashboardAdministrateurGeneral } from "../../services/immatriculation.service";
import Spinner from "../../components/Spinner/Spinner";

const FORMAT = "YYYY-MM-DD";
// Périodes : dates calculées ici, envoyées au backend en du / au
const PERIODES = [
  { cle: "mois", libelle: "Ce mois-ci", dates: () => [moment().startOf("month"), moment()], precedente: "au mois précédent" },
  { cle: "trim", libelle: "3 derniers mois", dates: () => [moment().subtract(3, "months").add(1, "day"), moment()], precedente: "aux 3 mois précédents" },
  { cle: "an", libelle: "12 derniers mois", dates: () => [moment().subtract(12, "months").add(1, "day"), moment()], precedente: "aux 12 mois précédents" },
  { cle: "perso", libelle: "Personnalisée", precedente: "à la période précédente" },
];
const LIGNES = [
  { cle: "immatriculations", libelle: "Immatriculations" },
  { cle: "mutations", libelle: "Mutations" },
  { cle: "reformes", libelle: "Réformes" },
];

const nombre = (n) => Number(n || 0).toLocaleString("fr-FR");
const jours = (d) => (d === null || d === undefined ? "—" : `${String(d).replace(".", ",")} j`);
const taux = (o) => (o.validees + o.rejetees ? Math.round((o.rejetees / (o.validees + o.rejetees)) * 100) : null);
const pluriel = (n, mot) => `${nombre(n)} ${mot}${n > 1 ? "s" : ""}`;
const ecart = (n, prec, suffixe) => {
  const d = n - prec;
  return { texte: d === 0 ? `Autant que ${suffixe}` : `${d > 0 ? "+" : ""}${nombre(d)} par rapport ${suffixe}`, ton: d > 0 ? "up" : d < 0 ? "down" : "" };
};

// Taux de rejet anormal : au moins 5 dossiers traités et plus du double de la moyenne sur 12 mois
const tauxAnormal = (o) => {
  const t = taux(o);
  return t !== null && o.validees + o.rejetees >= 5 && o.tauxRejet12Mois !== null && t > Math.max(2 * o.tauxRejet12Mois, 5);
};

// Points d'attention calculés à partir des données : critique, à surveiller, normal
const pointsAttention = (data) => {
  const { operations: ops, retardJours, aApprouver } = data;
  const points = [];
  const retards = LIGNES.reduce((s, l) => s + ops[l.cle].retard, 0);
  if (retards > 0) {
    const plusAncien = Math.max(...LIGNES.map((l) => ops[l.cle].plusAncien));
    points.push({ ton: "crit", titre: `${pluriel(retards, "dossier")} en attente depuis plus de ${retardJours} jours`,
      detail: `Le plus ancien attend depuis ${pluriel(plusAncien, "jour")}.` });
  }
  LIGNES.filter((l) => tauxAnormal(ops[l.cle])).forEach((l) => points.push({ ton: "warn",
    titre: `Taux de rejet des ${l.libelle.toLowerCase()} à ${taux(ops[l.cle])} %`,
    detail: `Moyenne des 12 derniers mois : ${String(ops[l.cle].tauxRejet12Mois).replace(".", ",")} %.` }));
  if (aApprouver > 0)
    points.push({ ton: "warn", titre: `${nombre(aApprouver)} ${aApprouver > 1 ? "nouveaux organismes" : "nouvel organisme"} en attente d'approbation`,
      detail: `${aApprouver > 1 ? "Ils bloquent" : "Il bloque"} la validation de ${pluriel(aApprouver, "dossier")}.` });
  const cartes = ops.cartesGrises;
  if (cartes.retard > 0)
    points.push({ ton: "warn", titre: `${pluriel(cartes.retard, "carte grise")} à imprimer depuis plus de ${retardJours} jours`,
      detail: `${pluriel(cartes.attente, "carte grise")} validée${cartes.attente > 1 ? "s" : ""} non imprimée${cartes.attente > 1 ? "s" : ""} au total.` });
  else if (cartes.attente > 0)
    points.push({ ton: "good", titre: `Cartes grises : ${nombre(cartes.attente)} à imprimer`, detail: `Toutes validées depuis moins de ${retardJours} jours.` });
  if (points.length === 0) points.push({ ton: "good", titre: "Aucun point d'attention", detail: "Pas de retard ni de rejet anormal." });
  return points;
};
const NIVEAUX = { crit: "Critique", warn: "À surveiller", good: "Normal" };

const AdministrateurGeneralDashboard = ({ user }) => {
  const [periode, setPeriode] = useState("mois");
  const [perso, setPerso] = useState({ du: moment().startOf("month").format(FORMAT), au: moment().format(FORMAT) });
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [survol, setSurvol] = useState(-1);

  const choisie = PERIODES.find((p) => p.cle === periode);
  const [du, au] = periode === "perso" ? [perso.du, perso.au] : choisie.dates().map((d) => d.format(FORMAT));

  useEffect(() => {
    // Intervalle incomplet ou inversé : on garde les données affichées
    if (!du || !au || du > au) return;
    let actif = true;
    setChargement(true);
    dashboardAdministrateurGeneral(du, au).then((resp) => {
      if (!actif) return;
      if (resp?.success) { setData(resp); setErreur(""); }
      else setErreur(resp?.messages ? Object.values(resp.messages).flat().join(" ") : "Impossible de charger le tableau de bord.");
      setChargement(false);
    });
    return () => { actif = false; };
  }, [du, au]);

  if (!data) return <div className="agent-dash dir-dash ag-dash">{chargement ? <Spinner /> : <p className="agent-muted">{erreur}</p>}</div>;

  const { operations: ops, precedente, serie, parc, organismes, nbOrganismes, genres, retardJours } = data;
  const immat = ops.immatriculations;
  const attenteTotale = LIGNES.reduce((s, l) => s + ops[l.cle].attente, 0);
  const retardTotal = LIGNES.reduce((s, l) => s + ops[l.cle].retard, 0);
  const resume = `Du ${moment(data.periode.du).format("DD/MM/YYYY")} au ${moment(data.periode.au).format("DD/MM/YYYY")}`;
  const ecartValidees = ecart(immat.validees, precedente.validees, choisie.precedente);
  const ecartReformes = ecart(ops.reformes.validees, precedente.reformes, choisie.precedente);

  const kpis = [
    { libelle: "Parc de l'État immatriculé", valeur: nombre(parc.total), note: `${nombre(parc.ep)} EP · ${nombre(parc.va)} VA · toutes périodes` },
    { libelle: "Immatriculations validées", valeur: nombre(immat.validees), note: ecartValidees.texte, ton: ecartValidees.ton },
    { libelle: "Dossiers en attente", valeur: nombre(attenteTotale), alerte: retardTotal > 0,
      note: retardTotal ? `Dont ${nombre(retardTotal)} depuis plus de ${retardJours} jours` : "Aucun retard" },
    { libelle: "Délai moyen de validation", valeur: jours(immat.delai), note: "Immatriculations, entre le dépôt et la décision" },
    { libelle: "Véhicules sortis du parc", valeur: nombre(ops.reformes.validees), note: `Réformes validées · ${ecartReformes.texte.toLowerCase()}` },
  ];

  const totaux = LIGNES.reduce((t, l) => ({ deposees: t.deposees + ops[l.cle].deposees, validees: t.validees + ops[l.cle].validees,
    rejetees: t.rejetees + ops[l.cle].rejetees, attente: t.attente + ops[l.cle].attente }), { deposees: 0, validees: 0, rejetees: 0, attente: 0 });
  const maxSerie = Math.max(4, ...serie.map((p) => Math.max(p.entrees, p.sorties))) * 1.15;
  const maxOrg = Math.max(1, ...organismes.map((o) => o.n));
  const maxGenre = Math.max(1, ...genres.map((g) => g.n));
  const pctEp = parc.total ? Math.round((parc.ep / parc.total) * 100) : 0;

  return (
    <div className="agent-dash dir-dash ag-dash">
      {chargement && <Spinner />}
      <div className="agent-dash__head">
        <div>
          <h1 className="agent-dash__title">Bonjour, {user?.prenom}</h1>
          <p className="agent-dash__sub">{moment().locale("fr").format("dddd D MMMM YYYY")} · Situation du parc automobile de l'État et des opérations en cours.</p>
        </div>
        <span className="ag-lecture"><AiOutlineEye aria-hidden="true" />Consultation seule</span>
      </div>

      <div className="dir-periode">
        <span className="dir-periode__label">Période</span>
        <div className="agent-filtres" role="group" aria-label="Période">
          {PERIODES.map((p) => (
            <button key={p.cle} type="button" aria-pressed={periode === p.cle}
              className={`agent-filtre${periode === p.cle ? " is-active" : ""}`} onClick={() => setPeriode(p.cle)}>
              {p.libelle}
            </button>
          ))}
        </div>
        {periode === "perso" && (
          <div className="dir-periode__dates">
            <label>Du<input type="date" value={perso.du} max={perso.au || moment().format(FORMAT)} onChange={(e) => setPerso({ ...perso, du: e.target.value })} /></label>
            <label>Au<input type="date" value={perso.au} min={perso.du} max={moment().format(FORMAT)} onChange={(e) => setPerso({ ...perso, au: e.target.value })} /></label>
          </div>
        )}
        <span className="dir-periode__resume">{resume}</span>
        {erreur && <span className="agent-error" role="alert">{erreur}</span>}
      </div>

      <div className="dir-kpis">
        {kpis.map((k) => (
          <div key={k.libelle} className={`dir-kpi${k.alerte ? " ag-kpi--alerte" : ""}`}>
            <span className="agent-kpi__label">{k.libelle}</span>
            <span className="agent-kpi__value">{k.valeur}</span>
            <span className={`agent-kpi__note${k.alerte ? " dir-kpi__alerte" : ""}${k.ton ? ` ag-note--${k.ton}` : ""}`}>{k.note}</span>
          </div>
        ))}
      </div>

      <div className="agent-dash__layout">
        <div className="agent-dash__main">
          {/* Tableau des opérations */}
          <section className="agent-card">
            <div className="agent-card__head">
              <h2 className="agent-card__title">Tableau des opérations</h2>
              <span className="agent-muted">{resume} · en attente : toutes périodes</span>
            </div>
            <div className="agent-table-wrap">
              <table className="agent-table ag-ops">
                <thead>
                  <tr>
                    <th>Opération</th><th className="is-right">Déposées</th><th className="is-right">Validées</th><th className="is-right">Rejetées</th>
                    <th className="is-right">Taux de rejet</th><th className="is-right">En attente</th><th className="is-right">Délai moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGNES.map((l) => {
                    const o = ops[l.cle];
                    const t = taux(o);
                    return (
                      <tr key={l.cle}>
                        <td><span className="agent-cell-main">{l.libelle}</span></td>
                        <td className="is-right">{nombre(o.deposees)}</td>
                        <td className="is-right">{nombre(o.validees)}</td>
                        <td className="is-right">{nombre(o.rejetees)}</td>
                        <td className="is-right">
                          {t === null ? "—" : (
                            <span className="ag-taux">
                              {t} %
                              <span className="ag-taux__track"><span className="ag-taux__bar" style={{ width: `${Math.min(100, t)}%` }} /></span>
                            </span>
                          )}
                          {tauxAnormal(o) && <span className="ag-pill ag-pill--warn">À surveiller</span>}
                        </td>
                        <td className="is-right">
                          {nombre(o.attente)}
                          {o.retard > 0 && <span className="ag-pill ag-pill--crit">{nombre(o.retard)} &gt; {retardJours} j</span>}
                        </td>
                        <td className="is-right">{jours(o.delai)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td><span className="agent-cell-main">Cartes grises imprimées</span></td>
                    <td className="is-right">—</td>
                    <td className="is-right">{nombre(ops.cartesGrises.imprimees)}</td>
                    <td className="is-right">—</td>
                    <td className="is-right">—</td>
                    <td className="is-right">
                      {nombre(ops.cartesGrises.attente)}
                      {ops.cartesGrises.retard > 0 && <span className="ag-pill ag-pill--crit">{nombre(ops.cartesGrises.retard)} &gt; {retardJours} j</span>}
                    </td>
                    <td className="is-right">{jours(ops.cartesGrises.delai)}</td>
                  </tr>
                  <tr className="ag-ops__total">
                    <td>Total des dossiers</td>
                    <td className="is-right">{nombre(totaux.deposees)}</td>
                    <td className="is-right">{nombre(totaux.validees)}</td>
                    <td className="is-right">{nombre(totaux.rejetees)}</td>
                    <td className="is-right">{taux(totaux) === null ? "—" : `${taux(totaux)} %`}</td>
                    <td className="is-right">{nombre(totaux.attente)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Entrées et sorties du parc */}
          <section className="agent-card agent-chart">
            <div className="agent-card__head">
              <div>
                <h2 className="agent-card__title">Entrées et sorties du parc</h2>
                <span className="agent-muted">12 derniers mois · survolez un mois pour le détail</span>
              </div>
              <div className="ag-legende">
                <span><i className="ag-serie--entrees" />Entrées · immatriculations validées</span>
                <span><i className="ag-serie--sorties" />Sorties · réformes validées</span>
              </div>
            </div>
            <div className="agent-chart__plot" onMouseLeave={() => setSurvol(-1)}>
              <span className="agent-chart__grid" style={{ bottom: "50%" }} />
              {serie.map((p, i) => {
                const lib = moment(`${p.mois}-01`).locale("fr").format("MMMM YYYY");
                const haut = (n) => `${n ? Math.max(Math.round((n / maxSerie) * 100), 2) : 0}%`;
                const actif = survol === i;
                return (
                  <div key={p.mois} className="agent-chart__col" tabIndex={0}
                    onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} onBlur={() => setSurvol(-1)}
                    aria-label={`${lib} : ${p.entrees} entrées, ${p.sorties} sorties`}>
                    {actif && (
                      <div className="agent-chart__tip" style={{ bottom: `calc(${Math.round((Math.max(p.entrees, p.sorties) / maxSerie) * 100)}% + 8px)` }}>
                        <strong>{lib}</strong>
                        <span>{p.entrees} entrée{p.entrees > 1 ? "s" : ""} · {p.sorties} sortie{p.sorties > 1 ? "s" : ""} · solde {p.entrees - p.sorties >= 0 ? "+" : ""}{p.entrees - p.sorties}</span>
                      </div>
                    )}
                    <div className={`ag-paire${actif ? " is-active" : ""}`}>
                      <div className="ag-barre ag-serie--entrees" style={{ height: haut(p.entrees) }} />
                      <div className="ag-barre ag-serie--sorties" style={{ height: haut(p.sorties) }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="agent-chart__labels">
              {serie.map((p) => <span key={p.mois}>{moment(`${p.mois}-01`).locale("fr").format("MMM")}</span>)}
            </div>
          </section>

          {/* Parc par organisme */}
          <section className="agent-card">
            <div className="agent-card__head">
              <div>
                <h2 className="agent-card__title">Parc par organisme</h2>
                <span className="agent-muted">Véhicules en service · {organismes.length} premier{organismes.length > 1 ? "s" : ""} sur {nombre(nbOrganismes)}</span>
              </div>
              <div className="ag-legende">
                <span><i className="ag-serie--ep" />EP</span>
                <span><i className="ag-serie--va" />VA</span>
              </div>
            </div>
            <div className="dir-orgs__list">
              {organismes.map((o) => (
                <div key={o.nom} className="ag-org">
                  <span className="ag-org__nom" title={o.nom}>{o.nom}</span>
                  <div className="ag-org__track" role="img" aria-label={`${o.nom} : ${o.ep} EP, ${o.va} VA`}>
                    {o.ep > 0 && <div className="ag-org__seg ag-serie--ep" style={{ width: `${(o.ep / maxOrg) * 100}%` }} />}
                    {o.va > 0 && <div className="ag-org__seg ag-serie--va" style={{ width: `${(o.va / maxOrg) * 100}%` }} />}
                  </div>
                  <strong className="ag-org__n">{nombre(o.n)}</strong>
                </div>
              ))}
              {organismes.length === 0 && <p className="agent-muted">Aucun véhicule immatriculé.</p>}
            </div>
          </section>
        </div>

        <aside className="agent-dash__side">
          {/* Points d'attention */}
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">Points d'attention</h2>
            <div className="ag-alertes">
              {pointsAttention(data).map((p) => (
                <div key={p.titre} className={`ag-alerte ag-alerte--${p.ton}`}>
                  <span className="ag-alerte__niveau">{NIVEAUX[p.ton]}</span>
                  <strong>{p.titre}</strong>
                  <span>{p.detail}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Répartition EP / VA */}
          <section className="agent-card agent-side-card">
            <div>
              <h2 className="agent-card__title">Répartition EP / VA</h2>
              <p className="agent-muted">Mode d'immatriculation · parc en service</p>
            </div>
            <div className="ag-repartition" role="img" aria-label={`EP ${pctEp} %, VA ${100 - pctEp} %`}>
              {parc.ep > 0 && <div className="ag-serie--ep" style={{ width: `${pctEp}%` }} />}
              {parc.va > 0 && <div className="ag-serie--va" style={{ width: `${100 - pctEp}%` }} />}
            </div>
            <div className="ag-repartition__legende">
              <span>EP · <strong>{nombre(parc.ep)}</strong> ({pctEp} %)</span>
              <span>VA · <strong>{nombre(parc.va)}</strong> ({parc.total ? 100 - pctEp : 0} %)</span>
            </div>
          </section>

          {/* Parc par genre */}
          <section className="agent-card agent-side-card">
            <div>
              <h2 className="agent-card__title">Parc par genre de véhicule</h2>
              <p className="agent-muted">Parc en service · {pluriel(parc.total, "véhicule")}</p>
            </div>
            <div className="ag-genres">
              {genres.map((g) => (
                <div key={g.nom} className="dir-org">
                  <div className="dir-org__top"><span title={g.nom}>{g.nom}</span><strong>{nombre(g.n)}</strong></div>
                  <div className="dir-org__track"><div className="dir-org__bar" style={{ width: `${Math.max(2, Math.round((g.n / maxGenre) * 100))}%` }} /></div>
                </div>
              ))}
              {genres.length === 0 && <p className="agent-muted">Aucun véhicule immatriculé.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AdministrateurGeneralDashboard;
