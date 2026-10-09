import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import moment from "moment";
import { getImmatriculationById, getPaiementSipim, rejeterPropositionOrganisme } from "../../services/immatriculation.service";
import { createNewMinistereandDirectionValided } from "../../services/organisation.service";
import { userByID } from "../../services/auth.service";
import { ComboContext } from "../../services/Context/Contexts";
import Erreurs from "../../components/erreurs/Erreurs";
import Spinner from "../../components/Spinner/Spinner";
import Field from "../../components/Immatriculation/ui/Field";
import Input from "../../components/ui/Input/Input";
import SegmentedControl from "../../components/Immatriculation/ui/SegmentedControl";
import { organismesSimilaires } from "../../utils/organismes";

const TYPES_ORGANISME = ["Publique", "Privé"];
const TYPES_PLAQUE = ["VA", "EP"];
// Motifs de rejet d'une proposition (clés attendues par le backend)
const MOTIFS_REJET = [
  { value: "inexistant", label: "Organisme inexistant ou non habilité" },
  { value: "doublon", label: "Doublon ou mauvaise orthographe" },
  { value: "type", label: "Mauvais type d'organisme" },
  { value: "direction", label: "Direction incorrecte" },
  { value: "autre", label: "Autre motif" },
];

/**
 * Validation de l'organisme (ministère) et de la direction proposés par un agent pour une immatriculation.
 * Le Directeur peut corriger le nom avant de valider, ou rattacher le dossier à un organisme existant.
 */
const ValidationMinistere = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ministeres } = useContext(ComboContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [dossier, setDossier] = useState(null);
  const [agent, setAgent] = useState("");
  const [organisation, setOrganisation] = useState({ ministere: "", direction: "", typeorganisme: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [erreurs, setErreurs] = useState([]);
  // Type d'organisme introuvable (dossier et paiement) : le Directeur le choisit
  const [typeAChoisir, setTypeAChoisir] = useState(false);
  // Rejet de la proposition : le dossier passe en « Rejeté » et l'agent choisit un autre organisme
  const [rejet, setRejet] = useState({ ouvert: false, motif: "", commentaire: "", erreur: "" });

  const getDetails = async (currentID) => {
    setIsLoading(true);
    const { immatriculation } = await getImmatriculationById(currentID);
    if (!immatriculation?.autreministere) {
      setIsLoading(false);
      toast.error("Cette immatriculation est déjà affectée à un ministère.");
      navigate("/liste-immatriculation");
      return;
    }
    setDossier(immatriculation);
    userByID(immatriculation.created_by).then((resp) => {
      if (resp?.success) setAgent(`${resp.user.prenom} ${resp.user.nom}`);
    });

    // Type d'organisme : celui enregistré dans le dossier ; sinon (anciens dossiers) celui du paiement SIPIM,
    // demandé au backend immagov qui garde la clé API (Gouvernement => Publique, sinon Privé)
    // Une valeur hors Publique / Privé (ex. « undefined » des anciens dossiers) est traitée comme absente ;
    // si le paiement ne permet pas non plus de la retrouver, le Directeur la choisit dans le formulaire.
    let typeorganisme = TYPES_ORGANISME.includes(immatriculation.typeOrganisme) ? immatriculation.typeOrganisme : "";
    if (!typeorganisme && immatriculation.paiementReference) {
      const resp = await getPaiementSipim(immatriculation.paiementReference);
      if (resp?.status === 200 && resp.paiement) {
        typeorganisme = resp.paiement.typeOrganisme || (resp.paiement.typeClient === "Gouvernement" ? "Publique" : "Privé");
      }
    }
    const proposition = { ministere: immatriculation.autreministere || "", direction: immatriculation.autredirection || "", typeorganisme };
    setOrganisation(proposition);
    setTypeAChoisir(!typeorganisme);
    reset(proposition);
    setIsLoading(false);
  };

  useEffect(() => {
    getDetails(id);
  }, [id]);

  // Organismes existants du même type qui ressemblent au nom proposé
  const similaires = useMemo(() => organismesSimilaires(
    organisation.ministere,
    (ministeres || []).filter((m) => m.typeorganisme?.toLowerCase() === organisation.typeorganisme?.toLowerCase())
  ), [organisation.ministere, organisation.typeorganisme, ministeres]);

  const handleInput = (e) => setOrganisation({ ...organisation, [e.target.name]: e.target.value });
  const typePlaque = TYPES_PLAQUE.includes(String(dossier?.modeImmatriculation || "").toUpperCase()) ? dossier.modeImmatriculation.toUpperCase() : "";


  const envoyer = async (rattacherA) => {
    setErreurs([]);
    setIsLoading(true);
    const formData = new FormData();
    formData.append("immatriculation_id", id);
    if (rattacherA) formData.append("ministere_id", rattacherA.ministere_id);
    else formData.append("ministere", organisation.ministere);
    formData.append("direction", organisation.direction || "");
    formData.append("typeorganisme", organisation.typeorganisme);
    // Type de plaque du dossier (VA / EP), enregistré avec la proposition
    if (typePlaque) formData.append("typeplaque", typePlaque);
    const resp = await createNewMinistereandDirectionValided(formData);
    setIsLoading(false);
    if (!resp?.success) {
      setErreurs(resp?.messages || { erreur: ["Échec de la validation."] });
      return;
    }
    toast.success(resp.ministereCree
      ? `Organisme « ${resp.ministere} » créé et affecté au dossier.`
      : `Dossier rattaché à l'organisme existant « ${resp.ministere} ».`);
    navigate(`/details-immatriculation/${id}`);
  };

  const rejeter = async () => {
    if (!rejet.motif) return setRejet({ ...rejet, erreur: "Choisissez le motif du rejet." });
    if (rejet.motif === "autre" && !rejet.commentaire.trim()) return setRejet({ ...rejet, erreur: "Précisez le motif du rejet." });
    setIsLoading(true);
    const resp = await rejeterPropositionOrganisme(id, rejet.motif, rejet.commentaire.trim());
    setIsLoading(false);
    if (!resp?.success) {
      return setRejet({ ...rejet, erreur: resp?.messages ? Object.values(resp.messages).flat().join(" ") : "Échec du rejet." });
    }
    toast.success("Proposition rejetée : le dossier est renvoyé à l'agent pour qu'il choisisse un autre organisme.");
    navigate(`/details-immatriculation/${id}`);
  };

  const rattacher = (org) => {
    if (window.confirm(`Rattacher ce dossier à l'organisme existant « ${org.nom} » au lieu de créer « ${organisation.ministere} » ?`)) envoyer(org);
  };

  return (
    <div className="immat-page">
      <Helmet>
        <title>Validation de l'organisme proposé</title>
      </Helmet>
      {isLoading && <Spinner />}

      <div className="immat-head">
        <div>
          <Link to={`/details-immatriculation/${id}`} className="immat-retour">← Retour au dossier</Link>
          <h1 className="immat-head__title">Validation de l'organisme proposé</h1>
          <p className="immat-head__sub">
            {dossier ? <>Dossier <span className="immat-mono">{dossier.immatriculation_number}</span></> : "Dossier"}
            {agent ? ` · proposé par ${agent}` : ""}
            {dossier?.created_at ? ` le ${moment(dossier.created_at).format("DD/MM/YYYY")}` : ""}
          </p>
        </div>
      </div>

      <form className="immat-card" onSubmit={handleSubmit(() => envoyer(null))}>
        <div className="immat-body">
          <div className="immat-section__head">
            <h2 className="immat-section__title" style={{ fontSize: 18 }}>Organisme et direction</h2>
            <p className="immat-section__desc">
              Vérifiez la proposition de l'agent et corrigez l'orthographe si besoin. Si l'organisme existe déjà, rattachez-y le dossier plutôt que d'en créer un doublon.
            </p>
          </div>
          <div className="immat-badges">
            {typePlaque && <span className="immat-badge immat-badge--green">Plaque {typePlaque}</span>}
            {organisation.typeorganisme && !typeAChoisir && <span className="immat-pill">Organisme : {organisation.typeorganisme}</span>}
          </div>
          {typeAChoisir && (
            <>
              <div className="immat-alert immat-alert--warning">Le type d'organisme n'est pas connu pour ce dossier (paiement introuvable) : indiquez-le.</div>
              <SegmentedControl label="Type d'organisme" required value={organisation.typeorganisme}
                options={TYPES_ORGANISME.map((t) => ({ value: t, label: t }))}
                onChange={(t) => setOrganisation({ ...organisation, typeorganisme: t })} />
            </>
          )}

          <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <Field label="Nom du ministère ou de l'organisme" required error={
              errors.ministere?.type === "required" ? "Le nom du ministère est obligatoire."
              : errors.ministere?.type === "minLength" ? "Le nombre minimum de caractères est deux (2)." : ""}>
              <Input value={organisation.ministere} invalid={!!errors.ministere} placeholder="Nom de l'organisme"
                {...register("ministere", { onChange: handleInput, required: true, minLength: 2 })} />
            </Field>
            <Field label="Direction ou service" error={errors.direction?.type === "minLength" && "Le nombre minimum de caractères est deux (2)."}>
              <Input value={organisation.direction} invalid={!!errors.direction} placeholder="Facultatif"
                {...register("direction", { onChange: handleInput, minLength: 2 })} />
            </Field>
          </div>

          {similaires.length > 0 && (
            <div className="immat-suggest" role="status">
              <span className="immat-suggest__title">Organismes existants qui ressemblent à cette proposition :</span>
              {similaires.map((org) => (
                <button key={org.ministere_id} type="button" className="immat-suggest__item" onClick={() => rattacher(org)}>
                  <span>{org.nom}</span>
                  <span className="immat-suggest__action">Rattacher à cet organisme</span>
                </button>
              ))}
            </div>
          )}

          {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}
        </div>

        <div className="immat-actions">
          <Link to={`/details-immatriculation/${id}`} className="immat-btn immat-btn--secondary immat-btn--lien">Annuler</Link>
          <span className="immat-actions__hint">Les champs marqués <span className="immat-req">*</span> sont obligatoires</span>
          <div className="immat-actions__groupe">
            <button type="button" className="immat-btn immat-btn--danger" disabled={isLoading || !dossier}
              onClick={() => setRejet({ ...rejet, ouvert: true, erreur: "" })}>
              Rejeter la proposition
            </button>
            <button type="submit" className="immat-btn immat-btn--primary" disabled={isLoading || !organisation.typeorganisme}>
              Valider la proposition
            </button>
          </div>
        </div>
      </form>

      {rejet.ouvert && (
        <section className="immat-card immat-rejet" aria-labelledby="titre-rejet">
          <div className="immat-body">
            <div className="immat-section__head">
              <h2 id="titre-rejet" className="immat-section__title" style={{ fontSize: 18 }}>Rejeter la proposition</h2>
              <p className="immat-section__desc">
                Le dossier passera en « Rejeté ». L'agent le verra dans ses dossiers à corriger et choisira un autre organisme ; le numéro d'immatriculation est conservé.
              </p>
            </div>
            <SegmentedControl label="Motif du rejet" required value={rejet.motif} options={MOTIFS_REJET}
              onChange={(motif) => setRejet({ ...rejet, motif, erreur: "" })} />
            <Field label="Précision" required={rejet.motif === "autre"}>
              <Input value={rejet.commentaire} maxLength={150} invalid={rejet.motif === "autre" && !!rejet.erreur}
                placeholder={rejet.motif === "autre" ? "Expliquez le motif" : "Facultatif (150 caractères max.)"}
                onChange={(e) => setRejet({ ...rejet, commentaire: e.target.value, erreur: "" })} />
            </Field>
            {rejet.erreur && <div className="immat-alert immat-alert--error" role="alert">{rejet.erreur}</div>}
          </div>
          <div className="immat-actions">
            <button type="button" className="immat-btn immat-btn--secondary" onClick={() => setRejet({ ouvert: false, motif: "", commentaire: "", erreur: "" })}>
              Annuler le rejet
            </button>
            <button type="button" className="immat-btn immat-btn--danger-plein" disabled={isLoading} onClick={rejeter}>
              Confirmer le rejet
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ValidationMinistere;
