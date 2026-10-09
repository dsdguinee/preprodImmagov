import { useNavigate, useParams } from "react-router-dom";
import StepActions from "../Immatriculation/ui/StepActions";

const LIBELLES = { VA: "Véhicule administratif", EP: "Entreprise publique" };

// Étape 1 : type d'immatriculation du dossier (non modifiable à la resoumission : il fixe le numéro conservé)
const StepOne = ({ handleNextStep, immatriculation }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = String(immatriculation.modeImmatriculation || "").toUpperCase();

  return (
    <div>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Type d'immatriculation</h2>
          <p className="immat-section__desc">
            Le type de plaque ne change pas à la resoumission : le dossier garde son numéro d'immatriculation.
            Corrigez les informations signalées dans le motif du rejet aux étapes suivantes.
          </p>
        </div>
        {mode ? (
          <div className="immat-kv">
            <div><span>Type de plaque</span><strong>{mode}{LIBELLES[mode] ? ` · ${LIBELLES[mode]}` : ""}</strong></div>
            <div><span>Numéro d'immatriculation</span><strong className="immat-mono">{immatriculation.immatriculation_number || "—"}</strong></div>
            <div><span>Référence de paiement</span><strong className="immat-mono">{immatriculation.paiementReference || "—"}</strong></div>
          </div>
        ) : (
          <div className="immat-alert immat-alert--error">Le type d'immatriculation de ce dossier est inconnu.</div>
        )}
      </div>
      <StepActions
        onPrev={() => navigate(`/details-immatriculation/${id}`)}
        nextType="button"
        onNext={handleNextStep}
        nextDisabled={!mode}
      />
    </div>
  );
};

export default StepOne;
