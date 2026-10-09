import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Field from "./ui/Field";
import Input from "../ui/Input/Input";
import StepActions from "./ui/StepActions";

// Erreur renvoyée par la recherche : texte, ou objet { champ: [messages] }
const texteErreur = (erreurs) => {
  if (!erreurs) return "";
  if (typeof erreurs === "string") return erreurs;
  return Object.values(erreurs).flat().join(" ");
};

const StepOne = ({ handleNextStep, immatriculation, setImmatriculation, erreurs, setErreurs, reservationListe, paiement }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      immatriculation
    }
  });
  useEffect(() => {
    reset(immatriculation);
  }, [immatriculation]);

  const handleInput = (e) => {
    if (erreurs) setErreurs('');
    if (e.target.name === "paiementReference") {
      if (e.target.value.length <= 22)
        setImmatriculation({ ...immatriculation, [e.target.name]: e.target.value.toUpperCase() });
    } else if (e.target.name === 'reservation_id') {
      setImmatriculation({ ...immatriculation, [e.target.name]: e.target.value });
    }
  }

  const erreurReference =
    errors.paiementReference?.type === "required" ? "Le numéro de référence de paiement est obligatoire."
      : errors.paiementReference?.type === "minLength" ? "Le nombre minimum de caractères est dix (10)."
      : errors.paiementReference?.type === "maxLength" ? "Le nombre maximum de caractères est vingt-deux (22)."
      : "";
  const message = texteErreur(erreurs);
  const valide = immatriculation.isReferenceValid && paiement;

  return (
    <form onSubmit={handleSubmit(handleNextStep)}>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Référence de paiement</h2>
          <p className="immat-section__desc">Saisissez la référence SIPIM : les informations du véhicule seront pré-remplies.</p>
        </div>

        <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Référence SIPIM" required error={erreurReference}>
            <Input mono invalid={!!errors.paiementReference}
              type="text"
             
              name="paiementReference"
              value={immatriculation.paiementReference}
              placeholder="Numéro de référence du paiement"
              autoComplete="off"
              {...register('paiementReference', {
                onChange: (e) => handleInput(e),
                required: true, maxLength: 22, minLength: 10
              })}
            />
          </Field>
          <Field label="Réservation (facultatif)">
            <select name="reservation_id" onChange={handleInput} value={immatriculation.reservation_id}>
              <option value="">Aucune réservation</option>
              {reservationListe?.length > 0 && reservationListe.map((reservation) => (
                <option value={reservation.reservation_id} key={reservation.reservation_id}>{reservation.nomReservation}</option>
              ))}
            </select>
          </Field>
        </div>

        {message && (
          <div className="immat-alert immat-alert--error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
            <span>{message}</span>
          </div>
        )}

        {valide && (
          <div className="immat-success">
            <div className="immat-success__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></svg>
              <strong>Paiement validé · référence disponible</strong>
            </div>
            <div className="immat-kv">
              <div><span>Genre</span><strong>{paiement.genre || "—"}</strong></div>
              <div><span>Châssis</span><strong className="immat-mono">{paiement.chassis || "—"}</strong></div>
              <div><span>Type de plaque</span><strong>{paiement.type_plaque || "—"}</strong></div>
              <div><span>Organisme</span><strong>{paiement.typeOrganisme || "—"}</strong></div>
            </div>
          </div>
        )}
      </div>
      <StepActions nextLabel={valide ? "Continuer" : "Vérifier la référence"} />
    </form>
  );
};

export default StepOne;
