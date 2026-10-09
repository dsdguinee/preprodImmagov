import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import toast from "react-hot-toast";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import Erreurs from "../../components/Erreurs/Erreurs";
import PaymentSummary from "../../components/PaymentSummary/PaymentSummary";
import { ChoiceTiles, ConfirmDialog, Field, FormSection, PhoneInput, SegmentedControl, ToggleCard } from "../../components/FormKit/FormKit";
import { ElementContext, UserContext } from "../../services/Context/Context";
import { commission, formatStringNumber, LIBELLES_OPERATION, MONTANT_MIN_REFORME, objecttoFormData } from "../../services/Helpers/fonctions";
import { libelleTranche, MESURES, trancheCorrespond } from "../../services/Helpers/carteGrise";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";

const MONTANT_PLAQUE = 350000; // plaques EP et VA
const TYPES_CLIENT = [
  { value: "Particulier", label: "Particulier", hint: "Personne physique" },
  { value: "Société", label: "Société", hint: "NIF obligatoire" },
  { value: "Gouvernement", label: "Gouvernement", hint: "Ministère, structure" },
];
const LIBELLE_NOM = {
  Particulier: ["Prénom et nom", "Prénom et nom de la personne"],
  Société: ["Nom de la société", "Nom de la société"],
  Gouvernement: ["Nom du ministère ou de la structure", "Nom du ministère ou de la structure"],
};

// Champs attendus par /paiement/new (mêmes clés que l'ancien formulaire en étapes)
const PAIEMENT_VIDE = {
  typeClient: "", modeExp: "Personnel", fullName: "", tel: "", nif: "", chassis: "", modeImma: "1",
  categorieCg: 0, typeCg: 0, typeVignette: 0, autorisation_id: 0, expressionCg: "",
  pf: "", nbrePlace: "", pv: "", cu: "", ptra: "",
  isIT: false, isEP: false, isVA: false, vignetteExo: false, dateExpCg: "", ancienNumMat: "", isNextStep: 1,
};
const DOCUMENTS_VIDES = { cg: false, vg: false, au: false };
// Immatriculation / réimmatriculation (modeImma) ou opération sur un véhicule déjà immatriculé
const OPERATIONS = [
  { value: "1", label: "Immatriculation" },
  { value: "2", label: "Réimmatriculation" },
  { value: "mutation", label: "Mutation" },
  { value: "reforme", label: "Réforme" },
];

const aLePrivilege = (privileges, nom) => privileges?.some((p) => p.privilege === nom);
const positif = (v) => parseFloat(v) > 0;

const Payment = () => {
  const api = new Api();
  const navigate = useNavigate();
  const { elementsData } = useContext(ElementContext);
  const { agence, privileges } = useContext(UserContext);
  const [, setIsLoading] = useRecoilState(loadingState);
  const [p, setP] = useState(PAIEMENT_VIDE);
  const [docs, setDocs] = useState(DOCUMENTS_VIDES);
  const [plaque, setPlaque] = useState("");
  const [touches, setTouches] = useState({});
  const [chassisInfo, setChassisInfo] = useState();
  const [confirmation, setConfirmation] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState();
  // Mutation / réforme : véhicule retrouvé par son paiement d'immatriculation utilisé
  const [operationVehicule, setOperationVehicule] = useState("");
  const [vehicule, setVehicule] = useState();
  const [vehiculeErreur, setVehiculeErreur] = useState("");
  const [montantReforme, setMontantReforme] = useState("");

  const maj = (champs) => setP((prev) => ({ ...prev, ...champs }));
  const toucher = (champ) => setTouches((t) => ({ ...t, [champ]: true }));
  const cat = parseInt(p.categorieCg, 10) || 0;
  const mesure = MESURES[cat];
  const gouvernement = p.typeClient === "Gouvernement";
  const transport = p.modeExp === "Transport";
  const isVA = plaque === "VA";
  const surVehicule = !!operationVehicule;

  // Listes filtrées comme dans l'ancien formulaire
  const vignettes = useMemo(() => {
    if (!elementsData || !cat) return [];
    const exoneree = aLePrivilege(privileges, "Vignette Exonérée");
    let liste = elementsData.typeVignette.filter((v) => parseInt(v.typecg_id, 10) === cat);
    if (!transport) {
      if (cat !== 3) liste = liste.filter((v) => v.nomType.indexOf("transport") === -1);
      if (!exoneree) liste = liste.filter((v) => v.nomType !== "Vignette Exonérée");
    }
    return liste;
  }, [elementsData, cat, transport, privileges]);
  const autorisations = useMemo(
    () => (elementsData && cat ? elementsData.autorisations.filter((a) => parseInt(a.categorie_id, 10) === cat) : []),
    [elementsData, cat]
  );

  // Capacité saisie et tranches de carte grise de la catégorie pour le mode choisi
  const ptac = (parseFloat(p.pv) || 0) / 1000 + (parseFloat(p.cu) || 0) / 1000;
  const valeurCapacite = !mesure ? null : mesure.poids ? (positif(p.pv) && positif(p.cu) ? ptac : null) : (positif(p[mesure.champ]) ? p[mesure.champ] : null);
  const tranches = useMemo(() => {
    if (!elementsData || !cat) return [];
    return elementsData.typeCarteGrise
      .filter((c) => parseInt(c.categorie_id, 10) === cat && String(c.type) === String(p.modeImma))
      .map((c) => ({
        ...c,
        libelle: libelleTranche(c),
        correspond: valeurCapacite === null ? null : trancheCorrespond(c, valeurCapacite, !mesure?.poids),
      }));
  }, [elementsData, cat, p.modeImma, valeurCapacite, mesure]);
  const tranchesValides = tranches.filter((t) => t.correspond);
  const trancheChoisie = tranches.find((t) => String(t.typecg_id) === String(p.typeCg));

  // Sélection automatique : une seule tranche possible ; on retire un choix devenu incompatible
  useEffect(() => {
    if (!tranches.length) return;
    const uniques = tranches.length === 1 ? tranches : tranchesValides.length === 1 ? tranchesValides : null;
    const choixInvalide = trancheChoisie && mesure?.controleServeur && trancheChoisie.correspond === false;
    if (uniques && String(uniques[0].typecg_id) !== String(p.typeCg)) maj({ typeCg: uniques[0].typecg_id });
    else if (!uniques && (choixInvalide || !trancheChoisie) && p.typeCg !== 0) maj({ typeCg: 0 });
  }, [tranches]);

  useEffect(() => {
    if (vignettes.length && !vignettes.some((v) => String(v.typevg_id) === String(p.typeVignette))) maj({ typeVignette: vignettes[0].typevg_id });
  }, [vignettes]);
  useEffect(() => {
    if (autorisations.length && !autorisations.some((a) => String(a.autorisation_id) === String(p.autorisation_id))) maj({ autorisation_id: autorisations[0].autorisation_id });
  }, [autorisations]);

  // Changements qui invalident d'autres choix
  const choisirOperation = (v) => {
    const operation = v === "mutation" || v === "reforme" ? v : "";
    setOperationVehicule(operation);
    if (!operation) maj({ modeImma: v, typeCg: 0 });
    setVehicule(); setVehiculeErreur(""); setMontantReforme("");
    if (p.chassis.trim().length >= 10) verifierChassis(operation);
  };
  const choisirTypeClient = (v) => {
    maj({ typeClient: v, nif: v === "Société" ? p.nif : "" });
    if (v !== "Gouvernement" && plaque === "VA") setPlaque("");
  };
  const choisirUsage = (v) => {
    maj({ modeExp: v });
    if (v !== "Transport") setDocs((d) => ({ ...d, au: false }));
  };
  const choisirCategorie = (v) => {
    maj({ categorieCg: v, typeCg: 0, typeVignette: 0, autorisation_id: 0, pf: "", nbrePlace: "", pv: "", cu: "", ptra: "" });
    setDocs({ cg: true, vg: true, au: false });
  };

  // Le châssis a-t-il déjà un paiement non autorisé ? (le serveur refuserait le nouveau paiement)
  const verifierChassis = async (operation = operationVehicule) => {
    toucher("chassis");
    const valeur = p.chassis.trim();
    setChassisInfo(); setVehicule(); setVehiculeErreur("");
    if (valeur.length < 10) return;
    if (operation) {
      // Mutation / réforme : le châssis doit avoir servi à une immatriculation ou réimmatriculation
      const resp = await api.apiData("get", `/paiement/vehicule-utilise/${encodeURIComponent(valeur)}`);
      if (resp?.status === 200) setVehicule(resp.vehicule);
      else setVehiculeErreur(resp?.messages?.numChassis?.[0] || "Vérification du châssis impossible. Réessayez.");
      return;
    }
    const resp = await api.apiData("get", `/paiement/getpaiementByNumChassis/${encodeURIComponent(valeur)}`);
    // Véhicule réformé (réforme validée ou en attente) : plus aucun paiement possible
    const reforme = resp?.payment?.find((x) => x.type_document === "reforme" && [0, 1].includes(Number(x.status)));
    if (reforme) {
      setChassisInfo({ reference: reforme.reference, bloquant: true, reforme: true });
      return;
    }
    const dernier = resp?.payment?.[resp.payment.length - 1];
    if (dernier) setChassisInfo({ reference: dernier.reference, bloquant: dernier.isautoriser === 0 });
  };

  // Validation
  const telValide = /^6\d{8}$/.test(p.tel);
  const erreursChamps = {
    fullName: p.fullName.trim().length < 2 && "Saisissez au moins 2 caractères.",
    tel: !telValide && "9 chiffres commençant par 6 (ex. 620 00 00 00).",
    nif: p.typeClient === "Société" && p.nif.trim().length < 3 && "Le NIF est obligatoire pour une société.",
    chassis: p.chassis.trim().length < 10 ? "Le numéro de châssis compte au moins 10 caractères."
      : surVehicule ? vehiculeErreur
      : chassisInfo?.reforme ? `Ce véhicule a été réformé (réf. ${chassisInfo.reference}) : aucun paiement n'est plus possible pour ce châssis.`
      : chassisInfo?.bloquant && `Ce véhicule a déjà un paiement non autorisé (réf. ${chassisInfo.reference}).`,
  };
  const montantReformeSaisi = parseInt(montantReforme, 10) || 0;
  const erreurReforme = operationVehicule === "reforme" && montantReforme !== "" && montantReformeSaisi < MONTANT_MIN_REFORME
    && `Le montant minimum est de ${formatStringNumber(MONTANT_MIN_REFORME)} GNF.`;
  const operationOk = operationVehicule === "mutation" ? !!vehicule
    : operationVehicule === "reforme" && !!vehicule && montantReformeSaisi >= MONTANT_MIN_REFORME;
  const clientOk = !!p.typeClient && !erreursChamps.fullName && !erreursChamps.tel && !erreursChamps.nif;
  const capaciteOk = isVA || (mesure && (mesure.poids ? positif(p.pv) && positif(p.cu) && positif(p.ptra) : valeurCapacite !== null));
  const vehiculeOk = !erreursChamps.chassis && !!cat && capaciteOk;
  const docsActifs = isVA ? [] : ["cg", "vg", "au"].filter((k) => docs[k]);
  const documentsOk = (docsActifs.length > 0 || isVA)
    && (!docs.cg || isVA || !!trancheChoisie)
    && (!docs.vg || isVA || !!p.typeVignette)
    && (!docs.au || isVA || !!p.autorisation_id);
  const formulaireOk = clientOk && (surVehicule ? !erreursChamps.chassis && operationOk : vehiculeOk && documentsOk);

  // Montants
  const vignette = vignettes.find((v) => String(v.typevg_id) === String(p.typeVignette));
  const autorisation = autorisations.find((a) => String(a.autorisation_id) === String(p.autorisation_id));
  const lignes = [];
  if (surVehicule) {
    // Pas de plaque ni d'autre document ; les frais de service s'ajoutent selon la catégorie du véhicule
    if (operationVehicule === "mutation" && vehicule)
      lignes.push({ label: vehicule.type_plaque === "VA" ? "Mutation (plaque VA, gratuite)" : "Mutation (carte grise)", montant: parseFloat(vehicule.montantMutation) || 0 });
    if (operationVehicule === "reforme" && montantReformeSaisi > 0) lignes.push({ label: "Réforme", montant: montantReformeSaisi });
  }
  if (!surVehicule && !isVA && docs.cg && trancheChoisie) lignes.push({ label: "Carte grise", montant: parseFloat(trancheChoisie.montant) });
  if (!surVehicule && !isVA && docs.vg && vignette) lignes.push({ label: "Vignette", montant: parseFloat(vignette.montant) });
  if (!surVehicule && !isVA && docs.au && autorisation) lignes.push({ label: "Autorisation de transport", montant: parseFloat(autorisation.montant) });
  if (!surVehicule && plaque) lignes.push({ label: `Plaque ${plaque}`, montant: MONTANT_PLAQUE });
  const frais = surVehicule ? (vehicule ? commission(vehicule.categorie_id) : 0) : cat ? commission(cat) : 0;
  if (frais) lignes.push({ label: "Frais de service", montant: frais, frais: true });
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  const categorie = surVehicule ? { nomCategorie: vehicule?.nomCategorie } : elementsData?.categories.find((c) => parseInt(c.categorie_id, 10) === cat);

  const plaques = [{ value: "", label: "Sans plaque", hint: "Documents uniquement" }];
  if (aLePrivilege(privileges, "Paiement EP")) plaques.push({ value: "EP", label: "Plaque EP", hint: `${formatStringNumber(MONTANT_PLAQUE)} GNF` });
  if (aLePrivilege(privileges, "Paiement VA")) plaques.push({ value: "VA", label: "Plaque VA", hint: gouvernement ? `${formatStringNumber(MONTANT_PLAQUE)} GNF` : "Réservée au Gouvernement", disabled: !gouvernement });

  const recommencer = () => {
    setP(PAIEMENT_VIDE); setDocs(DOCUMENTS_VIDES); setPlaque(""); setTouches({}); setChassisInfo(); setErreurs();
    setOperationVehicule(""); setVehicule(); setVehiculeErreur(""); setMontantReforme("");
  };

  const payer = async () => {
    setConfirmation(false);
    setEnCours(true); setIsLoading(true); setErreurs();
    const donnees = {
      ...p,
      typeCg: !isVA && docs.cg ? p.typeCg : 0,
      typeVignette: !isVA && docs.vg ? p.typeVignette : 0,
      autorisation_id: !isVA && docs.au ? p.autorisation_id : 0,
      expressionCg: !isVA && docs.cg && trancheChoisie ? trancheChoisie.libelle : "",
      pf: p.pf || 0, nbrePlace: p.nbrePlace || 0, pv: p.pv || 0, cu: p.cu || 0, ptra: p.ptra || 0,
      isEP: plaque === "EP", isVA, document: plaque || "Ordinaire",
      agence_id: agence?.agence_id, commune_id: agence?.commune_id,
    };
    try {
      const resp = surVehicule
        ? await api.apiData("post", "/paiement/operation-vehicule", objecttoFormData({
            document: operationVehicule, chassis: p.chassis.trim(), typeClient: p.typeClient,
            fullName: p.fullName.trim(), tel: p.tel, nif: p.nif,
            montant_operation: operationVehicule === "reforme" ? montantReformeSaisi : "",
          }))
        : await api.apiData("post", "/paiement/new", objecttoFormData(donnees));
      if (resp?.status === 200) {
        toast.success("Paiement enregistré.");
        navigate(`/payment/invoice/${resp.data.paiement_id}`);
      } else {
        setErreurs(resp?.messages || ["L'enregistrement a échoué. Réessayez."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setEnCours(false); setIsLoading(false);
    }
  };

  const [libelleNom, placeholderNom] = LIBELLE_NOM[p.typeClient] || LIBELLE_NOM.Particulier;
  const erreurVisible = (champ) => touches[champ] && erreursChamps[champ];

  return (
    <div className="payment page">
      <DocumentTitle title="Nouveau paiement" />
      <header className="payment-head">
        <h3>Nouveau paiement</h3>
        <p>Remplissez les trois sections. Le montant se met à jour pendant la saisie.</p>
      </header>
      <Erreurs validation={erreurs} />

      <div className="payment-layout">
        <form className="payment-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <FormSection numero={1} titre="Client" complete={clientOk}>
            <ChoiceTiles name="typeClient" label="Type de client" options={TYPES_CLIENT} value={p.typeClient} onChange={choisirTypeClient} />
            <div className="fk-grid">
              <Field label={libelleNom} htmlFor="fullName" full erreur={erreurVisible("fullName")}>
                <input id="fullName" value={p.fullName} placeholder={placeholderNom} autoComplete="off"
                  onChange={(e) => maj({ fullName: e.target.value.toUpperCase() })} onBlur={() => toucher("fullName")}
                  aria-invalid={!!erreurVisible("fullName")} />
              </Field>
              <Field label="Téléphone" htmlFor="tel" erreur={erreurVisible("tel")}>
                <PhoneInput id="tel" value={p.tel} onChange={(tel) => maj({ tel })} onBlur={() => toucher("tel")}
                  aria-invalid={!!erreurVisible("tel")} />
              </Field>
              {p.typeClient === "Société" && (
                <Field label="NIF" htmlFor="nif" erreur={erreurVisible("nif")}>
                  <input id="nif" className="mono" value={p.nif} placeholder="Code NIF"
                    onChange={(e) => maj({ nif: e.target.value.toUpperCase() })} onBlur={() => toucher("nif")}
                    aria-invalid={!!erreurVisible("nif")} />
                </Field>
              )}
            </div>
            <SegmentedControl name="modeExp" label="Usage du véhicule" value={p.modeExp} onChange={choisirUsage}
              options={[{ value: "Personnel", label: "Usage personnel" }, { value: "Transport", label: "Transport" }]} />
          </FormSection>

          <FormSection numero={2} titre="Véhicule" complete={vehiculeOk}>
            <div className="fk-grid">
              <Field label="Numéro de châssis" htmlFor="chassis" erreur={erreurVisible("chassis")}
                hint={chassisInfo && !chassisInfo.bloquant ? `Paiement précédent autorisé (réf. ${chassisInfo.reference}).` : undefined}>
                <input id="chassis" className="mono" value={p.chassis} placeholder="Ex. VF1RFB00X62345678" maxLength={17}
                  onChange={(e) => { maj({ chassis: e.target.value.toUpperCase() }); setChassisInfo(); setVehicule(); setVehiculeErreur(""); }}
                  onBlur={() => verifierChassis()}
                  aria-invalid={!!erreurVisible("chassis")} />
              </Field>
              <SegmentedControl name="modeImma" label="Opération" value={operationVehicule || p.modeImma} onChange={choisirOperation}
                options={OPERATIONS} />
            </div>
            {surVehicule && vehicule && (
              <div className="payment-vehicule" role="status">
                <b>Véhicule immatriculé{vehicule.type_plaque ? ` · plaque ${vehicule.type_plaque}` : ""}</b>
                <span>
                  {vehicule.nomCategorie}
                  {vehicule.numero_immatriculation ? ` · ${vehicule.numero_immatriculation}` : ""}
                  {` · ${String(vehicule.modeImma) === "2" ? "Réimmatriculation" : "Immatriculation"} réf. ${vehicule.reference}`}
                </span>
                <span>Propriétaire enregistré : {vehicule.fullName}</span>
              </div>
            )}
            {!surVehicule && (
            <div className="fk-seg-wrap">
              <span className="fk-label">Catégorie</span>
              <ChoiceTiles name="categorieCg" label="Catégorie" value={p.categorieCg} onChange={choisirCategorie}
                options={(elementsData?.categories || []).map((c) => ({
                  value: c.categorie_id,
                  label: c.nomCategorie,
                  hint: MESURES[c.categorie_id]?.poids ? "Poids à vide + charge utile" : MESURES[c.categorie_id]?.label,
                }))} />
            </div>
            )}

            {mesure && !isVA && !surVehicule && (
              <div className="fk-grid">
                {mesure.poids ? (
                  <>
                    <Field label="Poids à vide (kg)" htmlFor="pv">
                      <input id="pv" type="number" min={1} value={p.pv} onChange={(e) => maj({ pv: e.target.value })} />
                    </Field>
                    <Field label="Charge utile (kg)" htmlFor="cu" hint={positif(p.pv) && positif(p.cu) ? `PTAC : ${ptac.toFixed(2).replace(".", ",")} T` : undefined}>
                      <input id="cu" type="number" min={1} value={p.cu} onChange={(e) => maj({ cu: e.target.value })} />
                    </Field>
                    <Field label="Poids total roulant autorisé (T)" htmlFor="ptra">
                      <input id="ptra" type="number" min={1} value={p.ptra} onChange={(e) => maj({ ptra: e.target.value })} />
                    </Field>
                    <Field label="Puissance fiscale (CV)" htmlFor="pf" hint="Facultatif">
                      <input id="pf" type="number" min={0} value={p.pf} onChange={(e) => maj({ pf: e.target.value })} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label={mesure.label} htmlFor={mesure.champ}>
                      <input id={mesure.champ} type="number" min={1} placeholder={mesure.placeholder} value={p[mesure.champ]}
                        onChange={(e) => maj({ [mesure.champ]: e.target.value })} />
                    </Field>
                    {cat === 3 && (
                      <Field label="Puissance fiscale (CV)" htmlFor="pf" hint="Facultatif">
                        <input id="pf" type="number" min={0} value={p.pf} onChange={(e) => maj({ pf: e.target.value })} />
                      </Field>
                    )}
                  </>
                )}
              </div>
            )}
          </FormSection>

          {surVehicule ? (
          <FormSection numero={3} titre={`Montant de la ${LIBELLES_OPERATION[operationVehicule].toLowerCase()}`} complete={operationOk}>
            {!vehicule ? (
              <p className="fk-hint">Saisissez le numéro de châssis d'un véhicule déjà immatriculé pour calculer le montant.</p>
            ) : operationVehicule === "mutation" ? (
              <div className="fk-toggle on">
                <div className="fk-toggle-top">
                  <div className="fk-toggle-text">
                    <b>Mutation</b>
                    <span>{vehicule.type_plaque === "VA" ? "Gratuite pour une plaque VA" : "Même prix que la carte grise du véhicule"}</span>
                  </div>
                  <span className="fk-amount">{formatStringNumber(vehicule.montantMutation)}</span>
                </div>
              </div>
            ) : (
              <Field label="Montant de la réforme (GNF)" htmlFor="montantReforme" erreur={erreurReforme}
                hint={`Minimum ${formatStringNumber(MONTANT_MIN_REFORME)} GNF`}>
                <input id="montantReforme" type="number" min={MONTANT_MIN_REFORME} step={1000} value={montantReforme}
                  placeholder={String(MONTANT_MIN_REFORME)} onChange={(e) => setMontantReforme(e.target.value)}
                  aria-invalid={!!erreurReforme} />
              </Field>
            )}
          </FormSection>
          ) : (
          <FormSection numero={3} titre="Documents à payer" complete={documentsOk} etat="Au moins un document">
            <div className="payment-docs">
              <ToggleCard id="doc-cg" titre="Carte grise" checked={docs.cg && !isVA} disabled={!cat || isVA}
                onChange={(v) => setDocs((d) => ({ ...d, cg: v }))}
                description={trancheChoisie ? trancheChoisie.libelle : "Tranche déterminée par la capacité"}
                montant={trancheChoisie ? formatStringNumber(trancheChoisie.montant) : "—"}>
                <div className="fk-seg-wrap">
                  <span className="fk-label">
                    Tranche{valeurCapacite !== null && ` (${mesure?.poids ? `PTAC ${ptac.toFixed(2).replace(".", ",")} T` : `${valeurCapacite} saisi`})`}
                  </span>
                  {valeurCapacite === null && tranches.length > 1 && (
                    <span className="fk-hint">Saisissez la capacité du véhicule pour repérer la tranche.</span>
                  )}
                  {mesure?.controleServeur && valeurCapacite !== null && tranchesValides.length === 0 && (
                    <span className="fk-error" role="alert">Aucune tranche ne correspond à cette capacité. Vérifiez la valeur saisie.</span>
                  )}
                  <ChoiceTiles name="typeCg" label="Tranche de carte grise" value={p.typeCg} onChange={(v) => maj({ typeCg: v })}
                    options={tranches.map((t) => ({
                      value: t.typecg_id,
                      label: t.libelle,
                      hint: `${formatStringNumber(t.montant)} GNF${t.correspond ? " · correspond" : ""}`,
                      disabled: mesure?.controleServeur && t.correspond === false,
                    }))} />
                </div>
              </ToggleCard>

              <ToggleCard id="doc-vg" titre="Vignette" checked={docs.vg && !isVA} disabled={!vignettes.length || isVA}
                onChange={(v) => setDocs((d) => ({ ...d, vg: v }))}
                description={cat && !vignettes.length ? "Aucune vignette pour cette catégorie" : "Valable jusqu'au 31/12 de l'année"}
                montant={vignette ? formatStringNumber(vignette.montant) : "—"}>
                <Field label="Type de vignette" htmlFor="typeVignette">
                  <select id="typeVignette" value={p.typeVignette} onChange={(e) => maj({ typeVignette: e.target.value })}>
                    {vignettes.map((v) => (
                      <option key={v.typevg_id} value={v.typevg_id}>{v.nomType} · {formatStringNumber(v.montant)} GNF</option>
                    ))}
                  </select>
                </Field>
              </ToggleCard>

              <ToggleCard id="doc-au" titre="Autorisation de transport" checked={docs.au && !isVA}
                disabled={!transport || !autorisations.length || isVA}
                onChange={(v) => setDocs((d) => ({ ...d, au: v }))}
                description={transport ? "Usage Transport" : "Disponible pour l'usage Transport"}
                montant={autorisation ? formatStringNumber(autorisation.montant) : "—"}>
                <Field label="Type d'autorisation" htmlFor="autorisation_id">
                  <select id="autorisation_id" value={p.autorisation_id} onChange={(e) => maj({ autorisation_id: e.target.value })}>
                    {autorisations.map((a) => (
                      <option key={a.autorisation_id} value={a.autorisation_id}>{a.nomAutorisation} · {formatStringNumber(a.montant)} GNF</option>
                    ))}
                  </select>
                </Field>
              </ToggleCard>

              <div className={`fk-toggle ${plaque ? "on" : ""}`}>
                <div className="fk-toggle-top">
                  <div className="fk-toggle-text"><b>Plaque</b><span>{isVA ? "La plaque VA se paie seule, sans autre document" : "Selon vos privilèges et le type de client"}</span></div>
                  <span className={`fk-amount ${plaque ? "" : "off"}`}>{plaque ? formatStringNumber(MONTANT_PLAQUE) : "—"}</span>
                </div>
                <ChoiceTiles name="plaque" label="Type de plaque" options={plaques} value={plaque} onChange={setPlaque} />
              </div>
            </div>
          </FormSection>
          )}
        </form>

        <PaymentSummary
          titre={surVehicule ? LIBELLES_OPERATION[operationVehicule] : plaque ? `Paiement ${plaque}` : p.modeImma === "2" ? "Réimmatriculation" : "Immatriculation"}
          infos={[
            { label: "Client", value: p.fullName.trim() },
            { label: "Châssis", value: p.chassis.trim(), mono: true },
            { label: "Catégorie", value: categorie?.nomCategorie },
          ]}
          lignes={lignes}
          total={total}
          note={surVehicule ? (vehicule ? undefined : "Les frais de service s'ajoutent selon la catégorie du véhicule.") : cat ? undefined : "Les frais de service s'ajoutent selon la catégorie."}
          aCompleter={surVehicule ? [
            { ok: clientOk, label: `Client : type, nom, téléphone${p.typeClient === "Société" ? " et NIF" : ""}` },
            { ok: !!vehicule, label: vehiculeErreur ? "Châssis non utilisé pour une immatriculation" : "Châssis d'un véhicule déjà immatriculé" },
            ...(operationVehicule === "reforme" ? [{ ok: operationOk, label: `Montant de la réforme (min. ${formatStringNumber(MONTANT_MIN_REFORME)} GNF)` }] : []),
          ] : [
            { ok: clientOk, label: `Client : type, nom, téléphone${p.typeClient === "Société" ? " et NIF" : ""}` },
            { ok: !erreursChamps.chassis, label: chassisInfo?.reforme ? "Véhicule réformé" : chassisInfo?.bloquant ? "Châssis déjà en attente d'autorisation" : "Numéro de châssis" },
            { ok: !!cat && capaciteOk, label: "Catégorie et capacité du véhicule" },
            { ok: documentsOk, label: docs.cg && !isVA && !trancheChoisie ? "Tranche de carte grise" : "Au moins un document à payer" },
          ]}
          desactive={!formulaireOk}
          enCours={enCours}
          onValider={() => setConfirmation(true)}
          onRecommencer={recommencer}
        />
      </div>

      <ConfirmDialog open={confirmation} titre="Confirmer le paiement ?" confirmer="Confirmer" onConfirm={payer} onCancel={() => setConfirmation(false)}>
        Vous allez enregistrer un paiement de <b>{formatStringNumber(total)} GNF</b> pour <b>{p.fullName.trim()}</b> (châssis {p.chassis.trim()}).
        Le reçu s'ouvrira ensuite.
      </ConfirmDialog>
    </div>
  );
};

export default Payment;
