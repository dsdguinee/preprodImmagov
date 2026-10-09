import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Field from "./ui/Field";
import StepActions from "./ui/StepActions";
import Input from "../ui/Input/Input";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
import { VehiculeRepris } from "./Mutation";
import { reformeDepuisPaiement, resoumettreReforme } from "../../services/immatriculation.service";

/*
 * Nouvelle immatriculation avec une référence de RÉFORME (SIPIM) :
 * le véhicule déjà immatriculé dans IMMAGOV quitte l'administration et devient la propriété d'un particulier.
 * L'agent vérifie le véhicule, saisit le nouveau propriétaire et ajoute la photo de sa pièce d'identité.
 * La réforme part en validation chez le Directeur ; validée, elle ouvre une période « Réforme » dans l'historique.
 */

const ou = (v, defaut = "—") => (v === undefined || v === null || v === "" ? defaut : v);

export const PIECE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
export const PIECE_MAX_MO = 10;
// Message d'erreur pour la photo choisie, ou '' si elle est acceptable
export const erreurPiece = (file) => {
  if (!file || !/\.(jpe?g|png)$/i.test(file.name || "")) return "La photo de la pièce d'identité doit être au format JPEG ou PNG.";
  if (file.size > PIECE_MAX_MO * 1024 * 1024) return `La photo est trop volumineuse (${(file.size / 1048576).toFixed(1)} Mo). Taille maximale : ${PIECE_MAX_MO} Mo.`;
  return "";
};

export const proprietaireVide = () => ({ prenom: "", nom: "", telephone: "", email: "", adresse: "" });

// Mêmes règles que le serveur (reforme/depuisPaiement)
export const erreursProprietaire = (p) => {
  const e = {};
  if (p.prenom.trim().length < 2) e.prenom = "Le prénom est obligatoire (2 caractères minimum).";
  if (p.nom.trim().length < 2) e.nom = "Le nom est obligatoire (2 caractères minimum).";
  if (!/^\+?[0-9 ]{8,20}$/.test(p.telephone.trim())) e.telephone = "Numéro invalide : chiffres uniquement, 8 à 20 (ex. 620 00 00 00).";
  if (p.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) e.email = "Adresse e-mail invalide.";
  if (p.adresse.trim().length < 3) e.adresse = "L'adresse est obligatoire.";
  return e;
};

const BandeauReforme = ({ dossier }) => (
  <div className="immat-alert immat-alert--warning" role="status">
    <span>
      <strong>Réforme</strong> du véhicule <strong className="immat-mono">{dossier.immatriculation_number}</strong> :
      il quitte {dossier.ministere ? <strong>{dossier.ministere}</strong> : "son organisme"} et devient la propriété d'un particulier.
      Le dossier passe en validation chez le Directeur.
    </span>
  </div>
);

// Étape 2 : véhicule (lecture seule) et historique
export const ReformeVehicule = (props) => (
  <VehiculeRepris {...props} dossier={props.immatriculation.reforme.dossier}
    bandeau={<BandeauReforme dossier={props.immatriculation.reforme.dossier} />}
    description="Informations reprises du dossier existant : elles ne se modifient pas lors d'une réforme."
    historiqueDescription="Tous ceux qui ont utilisé ce véhicule ; le nouveau propriétaire y sera ajouté une fois la réforme validée." />
);

// Étape 3 : nouveau propriétaire
export const ReformeProprietaire = ({ immatriculation, setImmatriculation, handleNextStep, handlePrevStep, stepChk, setStepChk }) => {
  const { dossier, proprietaire: p } = immatriculation.reforme;
  const [vus, setVus] = useState({});
  const erreurs = useMemo(() => erreursProprietaire(p), [p]);
  const valide = Object.keys(erreurs).length === 0;
  useEffect(() => { setStepChk({ ...stepChk, step3: valide }); }, [valide]);

  const changer = (champ) => (e) =>
    setImmatriculation({ ...immatriculation, reforme: { ...immatriculation.reforme, proprietaire: { ...p, [champ]: e.target.value } } });
  const quitter = (champ) => () => setVus({ ...vus, [champ]: true });
  const erreur = (champ) => (vus[champ] ? erreurs[champ] : undefined);
  const continuer = () => {
    if (!valide) { setVus({ prenom: true, nom: true, telephone: true, email: true, adresse: true }); return; }
    handleNextStep();
  };

  return (
    <div>
      <div className="immat-body">
        <BandeauReforme dossier={dossier} />
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Nouveau propriétaire</h2>
          <p className="immat-section__desc">La personne qui reçoit le véhicule réformé.</p>
        </div>
        <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Prénom" required error={erreur("prenom")}>
            <Input name="prenom" value={p.prenom} onChange={changer("prenom")} onBlur={quitter("prenom")} invalid={!!erreur("prenom")} autoComplete="given-name" maxLength={150} />
          </Field>
          <Field label="Nom" required error={erreur("nom")}>
            <Input name="nom" value={p.nom} onChange={changer("nom")} onBlur={quitter("nom")} invalid={!!erreur("nom")} autoComplete="family-name" maxLength={150} />
          </Field>
          <Field label="Téléphone" required error={erreur("telephone")}>
            <Input name="telephone" type="tel" inputMode="tel" value={p.telephone} onChange={changer("telephone")} onBlur={quitter("telephone")}
              invalid={!!erreur("telephone")} placeholder="620 00 00 00" autoComplete="tel" maxLength={20} />
          </Field>
          <Field label="E-mail (facultatif)" error={erreur("email")}>
            <Input name="email" type="email" value={p.email} onChange={changer("email")} onBlur={quitter("email")}
              invalid={!!erreur("email")} placeholder="nom@exemple.com" autoComplete="email" maxLength={150} />
          </Field>
        </div>
        <div className="immat-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Field label="Adresse" required error={erreur("adresse")}>
            <textarea className={`ui-input${erreur("adresse") ? " is-invalid" : ""}`} name="adresse" rows={3} maxLength={255}
              value={p.adresse} onChange={changer("adresse")} onBlur={quitter("adresse")} aria-invalid={!!erreur("adresse") || undefined}
              placeholder="Quartier, commune, ville…" />
          </Field>
        </div>
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={continuer} />
    </div>
  );
};

// Étape 4 : photo de la pièce d'identité du nouveau propriétaire (image4)
export const ReformePiece = ({ immatriculation, setImmatriculation, handleNextStep, handlePrevStep, stepChk, setStepChk }) => {
  const [erreur, setErreur] = useState("");
  const photo = immatriculation.image4;
  // Reprise d'une réforme : la photo déjà enregistrée est un chemin (texte), une nouvelle photo est un fichier
  const enregistree = typeof photo === "string" && photo !== "";
  const apercu = useMemo(() => (!photo ? "" : enregistree ? `${process.env.REACT_APP_URL}/storage/${photo}` : URL.createObjectURL(photo)), [photo]);
  useEffect(() => () => { if (apercu && !enregistree) URL.revokeObjectURL(apercu); }, [apercu]);
  useEffect(() => { setStepChk({ ...stepChk, step4: !!photo }); }, [photo]);

  const choisir = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const message = erreurPiece(file);
    setErreur(message);
    if (!message) setImmatriculation({ ...immatriculation, image4: file });
  };

  return (
    <div>
      <div className="immat-body">
        <BandeauReforme dossier={immatriculation.reforme.dossier} />
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Pièce d'identité du nouveau propriétaire <span className="immat-req">*</span></h2>
          <p className="immat-section__desc">Photo lisible de la carte d'identité ou du passeport : JPEG ou PNG, {PIECE_MAX_MO} Mo maximum.</p>
        </div>
        {!photo ? (
          <label className="immat-dropzone">
            <input type="file" name="piece" accept={PIECE_ACCEPT} onChange={choisir} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#017A60" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.2" /><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4" /><path d="M14 10h4M14 13h3" /></svg>
            <span className="immat-dropzone__title">Déposez la photo ici ou cliquez pour choisir</span>
            <span className="immat-muted">JPEG · PNG — {PIECE_MAX_MO} Mo max.</span>
          </label>
        ) : (
          <div className="immat-file" style={{ alignItems: "flex-start" }}>
            <img src={apercu} alt="Pièce d'identité du nouveau propriétaire" style={{ width: 160, maxHeight: 110, objectFit: "contain", borderRadius: 6, border: "1px solid #E1E8E5", background: "#F3F6F5" }} />
            <div className="immat-file__info">
              <span>{enregistree ? photo.split("/").pop() : photo.name}</span>
              <span className="immat-muted">{enregistree ? "Photo déjà enregistrée · remplacez-la si besoin" : `${(photo.size / 1048576).toFixed(1).replace(".", ",")} Mo · prête à l'envoi`}</span>
            </div>
            <button type="button" className="immat-btn immat-btn--link" onClick={() => window.open(apercu)}>Ouvrir</button>
            <label className="immat-btn immat-btn--secondary" style={{ position: "relative", display: "inline-flex", alignItems: "center", height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #CBD5D1", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#14201C" }}>
              Remplacer
              <input type="file" name="piece" accept={PIECE_ACCEPT} onChange={choisir} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
            </label>
            <button type="button" className="immat-btn immat-btn--link" onClick={() => { setErreur(""); setImmatriculation({ ...immatriculation, image4: "" }); }}>Retirer</button>
          </div>
        )}
        {erreur && <div className="immat-alert immat-alert--error" role="alert">{erreur}</div>}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={handleNextStep} nextDisabled={!photo} />
    </div>
  );
};

// Étape 5 : vérification et envoi de la réforme
// resoumission : reprise d'une réforme rejetée (même référence SIPIM, aucun nouveau paiement)
export const ReformeSoumission = ({ immatriculation, handlePrevStep, setStep, onTermine, resoumission = false }) => {
  const { dossier: d, proprietaire: p } = immatriculation.reforme;
  const [erreurs, setErreurs] = useState([]);
  const [chargement, setChargement] = useState(false);
  const photo = immatriculation.image4;

  const envoyer = async () => {
    setErreurs([]);
    setChargement(true);
    const resp = await (resoumission ? resoumettreReforme : reformeDepuisPaiement)(immatriculation);
    setChargement(false);
    if (!resp?.success) {
      setErreurs(resp?.messages || { erreur: ["Échec de l'enregistrement de la réforme."] });
      toast.error(resoumission ? "Échec de la resoumission de la réforme." : "Échec de l'enregistrement de la réforme.");
      return;
    }
    toast.success(`Réforme du véhicule ${resp.numero} ${resoumission ? "resoumise" : "envoyée"} au Directeur pour validation.`);
    onTermine();
  };

  const blocs = [
    { titre: "Paiement", etape: resoumission ? 0 : 1, lignes: [["Référence de réforme", immatriculation.paiementReference, true]] },
    { titre: "Véhicule", etape: 2, lignes: [
      ["Immatriculation", d.immatriculation_number, true], ["Châssis", d.numChassie, true],
      ["Véhicule", [d.marque, d.modele].filter(Boolean).join(" ")], ["Organisme actuel", d.ministere],
    ]},
    { titre: "Nouveau propriétaire", etape: 3, lignes: [
      ["Prénom et nom", `${p.prenom.trim()} ${p.nom.trim().toUpperCase()}`], ["Téléphone", p.telephone],
      ["E-mail", ou(p.email.trim(), "Non renseigné")], ["Adresse", p.adresse],
    ]},
  ];
  return (
    <div>
      {chargement && <Spinner />}
      <div className="immat-body">
        <BandeauReforme dossier={d} />
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>{resoumission ? "Vérification avant resoumission" : "Vérification de la réforme"}</h2>
          <p className="immat-section__desc">Contrôlez chaque bloc ; « Modifier » ramène à l'étape concernée.</p>
        </div>
        {blocs.map((bloc) => (
          <div key={bloc.titre} className="immat-recap">
            <div className="immat-recap__head">
              <h3 className="immat-recap__title">{bloc.titre}</h3>
              {bloc.etape !== 2 && bloc.etape !== 0 && <button type="button" className="immat-btn immat-btn--link" onClick={() => setStep(bloc.etape)}>Modifier</button>}
            </div>
            <div className="immat-kv">
              {bloc.lignes.map(([label, valeur, mono]) => (
                <div key={label}><span>{label}</span><strong className={mono ? "immat-mono" : ""}>{ou(valeur)}</strong></div>
              ))}
            </div>
          </div>
        ))}
        <div className="immat-recap">
          <div className="immat-recap__head">
            <h3 className="immat-recap__title">Pièce d'identité</h3>
            <button type="button" className="immat-btn immat-btn--link" onClick={() => setStep(4)}>Modifier</button>
          </div>
          {photo ? <p className="immat-muted">{typeof photo === "string" ? `${photo.split("/").pop()} (déjà enregistrée)` : photo.name}</p> : <p className="immat-muted">Aucune photo</p>}
        </div>
        {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={envoyer} nextDisabled={chargement || !photo} nextLabel={resoumission ? "Resoumettre la réforme" : "Envoyer la réforme"} />
    </div>
  );
};
