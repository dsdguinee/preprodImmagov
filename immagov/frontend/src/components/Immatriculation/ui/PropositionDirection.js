import Field from "./Field";
import Input from "../../ui/Input/Input";
import { organismeDeMemeNom, organismesSimilaires } from "../../../utils/organismes";

// Code de la direction proposée par l'agent pour un organisme existant (à approuver par le Directeur)
export const AUTRE_DIRECTION = "1000000";

// Nom de direction proposé invalide : message d'erreur, sinon ""
export const erreurNouvelleDirection = (immatriculation) =>
  String(immatriculation.direction) === AUTRE_DIRECTION && String(immatriculation.autredirection || "").trim().length < 2
    ? "Saisissez le nom de la direction proposée (2 caractères au moins)." : "";

// Options de la liste des directions : celles de l'organisme, puis la proposition d'une nouvelle direction
export const optionsDirections = (directions, organismeChoisi) => [
  ...directions.map((d) => ({ value: String(d.direction_id), label: d.nom })),
  ...(organismeChoisi ? [{ value: AUTRE_DIRECTION, label: "Direction introuvable ? La proposer" }] : []),
];

/**
 * Nouvelle direction proposée par l'agent : envoyée au Directeur des garages du gouvernement,
 * qui la valide (elle est créée) ou la rejette (le dossier passe en « Rejeté » et revient à l'agent).
 */
const PropositionDirection = ({ nom, directions, erreur, onChange, onChoisir }) => {
  const memeNom = organismeDeMemeNom(nom, directions);
  const similaires = !memeNom ? organismesSimilaires(nom, directions) : [];
  return (
    <div className="immat-other immat-section">
      <div className="immat-other__head">
        <strong>Nouvelle direction</strong>
        <span className="immat-badge immat-badge--amber">En attente de validation</span>
      </div>
      <p className="immat-muted">
        Le Directeur des garages du gouvernement validera ou rejettera cette direction. En cas de rejet, le dossier vous revient pour choisir une autre direction.
      </p>
      <Field label="Nom de la direction ou du service" required error={erreur}>
        <Input invalid={!!erreur} type="text" value={nom || ""} name="nouvelleDirection" maxLength={150}
          placeholder="Ex. DIRECTION NATIONALE DES ROUTES" onChange={(e) => onChange(e.target.value.toUpperCase())} />
      </Field>
      {(memeNom || similaires.length > 0) && (
        <div className="immat-suggest" role="status">
          <span className="immat-suggest__title">{memeNom ? "Cette direction existe déjà :" : "Vouliez-vous dire :"}</span>
          {(memeNom ? [memeNom] : similaires).map((d) => (
            <button key={d.direction_id} type="button" className="immat-suggest__item" onClick={() => onChoisir(d)}>
              <span>{d.nom}</span>
              <span className="immat-suggest__action">Choisir cette direction</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropositionDirection;
