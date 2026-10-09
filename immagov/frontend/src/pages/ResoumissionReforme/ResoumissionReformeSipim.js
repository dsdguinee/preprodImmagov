import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import moment from "moment";
import "moment/locale/fr";
import ImmatStepper from "../../components/Immatriculation/ui/ImmatStepper";
import DossierPanel from "../../components/Immatriculation/ui/DossierPanel";
import StepActions from "../../components/Immatriculation/ui/StepActions";
import { ReformeVehicule, ReformeProprietaire, ReformePiece, ReformeSoumission } from "../../components/Immatriculation/Reforme";

const ETAPES = [
  { label: "Rejet", hint: "Motif du validateur" },
  { label: "Véhicule", hint: "Dossier existant" },
  { label: "Nouveau propriétaire", hint: "Coordonnées" },
  { label: "Pièce d'identité", hint: "Photo JPEG ou PNG" },
  { label: "Soumission", hint: "Vérification" },
];

// Réponse de GET /reforme/reforme/{id} → dossier au format des étapes de la réforme (comme dossierParChassis)
export const dossierDepuisReforme = (r) => ({
  ...r,
  modele: r.model, genre_nom: r.genre, type_nom: r.typeVehicule,
  ministere: r.ancienMinistere, direction: r.ancienDirection,
});

/*
 * Reprise d'une réforme SIPIM rejetée : le motif est rappelé, l'agent corrige le nouveau propriétaire et/ou la photo
 * de sa pièce, puis resoumet. La référence SIPIM déjà payée est conservée : aucun nouveau paiement.
 */
const ResoumissionReformeSipim = ({ reforme }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stepChk, setStepChk] = useState({ step1: true, step2: true, step3: true, step4: !!reforme.piece, step5: false });
  const [immatriculation, setImmatriculation] = useState(() => ({
    paiementReference: reforme.paiementReference,
    image4: reforme.piece || "",
    reforme: {
      reforme_id: reforme.reforme_id,
      dossier: dossierDepuisReforme(reforme),
      proprietaire: {
        prenom: reforme.PrenomProprietaire || "", nom: reforme.nomProprietaire || "",
        telephone: reforme.telephone || "", email: reforme.email || "", adresse: reforme.adresse || "",
      },
    },
  }));

  const handleNextStep = () => setStep((s) => Math.min(s + 1, ETAPES.length));
  const handlePrevStep = () => setStep((s) => Math.max(s - 1, 1));
  const canGo = (n) => n === 1 || stepChk[`step${n - 1}`];
  const progression = Math.round(((step - 1) / (ETAPES.length - 1)) * 100);
  const props = { immatriculation, setImmatriculation, handleNextStep, handlePrevStep, stepChk, setStepChk };
  const mode = String(reforme.modeImmatriculation || "").toUpperCase();

  return (
    <div className="immat-page">
      <Helmet>
        <title>Reprise de la réforme</title>
      </Helmet>

      <div className="immat-head">
        <div>
          <h1 className="immat-head__title">Reprise de la réforme <span className="immat-mono">{reforme.immatriculation_number}</span></h1>
          <p className="immat-head__sub">Étape {step} sur {ETAPES.length} · {ETAPES[step - 1].label}</p>
        </div>
        <div className="immat-progress">
          <div className="immat-progress__labels"><span>Progression</span><span>{progression} %</span></div>
          <div className="immat-progress__track"><div className="immat-progress__bar" style={{ width: `${Math.max(progression, 4)}%` }} /></div>
        </div>
      </div>

      <div className="immat-layout">
        <ImmatStepper steps={ETAPES} current={step} canGo={canGo} onGo={setStep} />

        <div className="immat-card immat-main">
          {step === 1 && (
            <div>
              <div className="immat-body">
                <div className="immat-alert immat-alert--error" role="status">
                  <span>
                    <strong>Réforme rejetée</strong>{reforme.dateDecision ? ` le ${moment(reforme.dateDecision).format("DD/MM/YYYY")}` : ""}
                    {reforme.validePar ? ` par ${reforme.validePar}` : ""}. <strong>Motif :</strong> {reforme.motifRejet || "non précisé"}
                  </span>
                </div>
                <div className="immat-section__head">
                  <h2 className="immat-section__title" style={{ fontSize: 18 }}>Corriger puis resoumettre</h2>
                  <p className="immat-section__desc">
                    Le paiement SIPIM de cette réforme reste valable : aucun nouveau paiement n'est demandé.
                    Corrigez le nouveau propriétaire ou remplacez la photo de sa pièce d'identité, puis resoumettez.
                  </p>
                </div>
                <div className="immat-kv">
                  <div><span>Référence de réforme</span><strong className="immat-mono">{reforme.paiementReference}</strong></div>
                  <div><span>Nouveau propriétaire</span><strong>{[reforme.PrenomProprietaire, reforme.nomProprietaire].filter(Boolean).join(" ") || "—"}</strong></div>
                  <div><span>Demandée le</span><strong>{reforme.dateDemande ? moment(reforme.dateDemande).format("DD/MM/YYYY") : "—"}</strong></div>
                </div>
              </div>
              <StepActions onPrev={() => navigate(`/details-reforme/${reforme.reforme_id}`)} prevLabel="Retour à la fiche" nextType="button" onNext={handleNextStep} />
            </div>
          )}
          {step === 2 && <ReformeVehicule {...props} />}
          {step === 3 && <ReformeProprietaire {...props} />}
          {step === 4 && <ReformePiece {...props} />}
          {step === 5 && <ReformeSoumission immatriculation={immatriculation} handlePrevStep={handlePrevStep} setStep={setStep} resoumission
            onTermine={() => navigate(`/details-reforme/${reforme.reforme_id}`)} />}
        </div>

        <DossierPanel reference={reforme.paiementReference} chassis={reforme.numChassie} genre={reforme.genre} plaque={mode} organisme="" />
      </div>
    </div>
  );
};

export default ResoumissionReformeSipim;
