import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import Field from "./ui/Field";
import StepActions from "./ui/StepActions";
import SearchSelect from "../ui/Select/SearchSelect";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
import { mutationDepuisPaiement } from "../../services/immatriculation.service";
import { getPaysByID } from "../../utils/helper/functions";
import HistoriqueVehicule from "./HistoriqueVehicule";

/*
 * Nouvelle immatriculation avec une référence de MUTATION (SIPIM) :
 * le véhicule est déjà immatriculé dans IMMAGOV ; son dossier est repris (même numéro),
 * l'agent choisit le nouvel organisme et ajoute la pièce jointe. La mutation part en validation chez le Directeur.
 */

const ou = (v, defaut = "—") => (v === undefined || v === null || v === "" ? defaut : v);

// En-tête commun : dossier repris
const BandeauMutation = ({ dossier }) => (
  <div className="immat-alert immat-alert--warning" role="status">
    <span>
      <strong>Mutation</strong> du véhicule déjà immatriculé <strong className="immat-mono">{dossier.immatriculation_number}</strong> :
      le numéro est conservé, seule l'affectation change. Le dossier passe en validation chez le Directeur.
    </span>
  </div>
);

// Étape 2 : véhicule repris du dossier existant (lecture seule), avec son historique d'utilisation.
// Partagé par la mutation et la réforme.
export const VehiculeRepris = ({ dossier: d, bandeau, description, historiqueDescription, handleNextStep, handlePrevStep, stepChk, setStepChk }) => {
  useEffect(() => { setStepChk({ ...stepChk, step2: true }); }, []);
  const lignes = [
    ["Numéro d'immatriculation", d.immatriculation_number, true],
    ["Numéro de châssis", d.numChassie, true],
    ["Marque", d.marque], ["Modèle", d.modele], ["Genre", d.genre_nom], ["Type", d.type_nom],
    ["Carrosserie", d.carosserie], ["Couleur", d.colorVehicule], ["Année", d.madeYear],
    ["1re mise en circulation", d.releaseYear ? moment(d.releaseYear).format("DD/MM/YYYY") : ""],
    ["Énergie", d.energy], ["Transmission", d.transmission === "Automatic" ? "Automatique" : d.transmission],
    ["Cylindres", d.cylinderNumber], ["Puissance", d.pa ? `${d.pa} CV` : ""],
    ["Places assises", d.placeNumberAssis], ["Places debout", d.placeNumberDebout], ["Portes", d.nbPorte],
    ["Poids à vide", d.pv ? `${d.pv} kg` : ""], ["Charge utile", d.cu ? `${d.cu} kg` : ""],
    ["Provenance", getPaysByID(d.provenance)],
    ["Organisme actuel", d.ministere], ["Direction actuelle", d.direction],
  ];
  return (
    <div>
      <div className="immat-body">
        {bandeau}
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Véhicule</h2>
          <p className="immat-section__desc">{description}</p>
        </div>
        <div className="immat-kv">
          {lignes.map(([label, valeur, mono]) => (
            <div key={label}><span>{label}</span><strong className={mono ? "immat-mono" : ""}>{ou(valeur)}</strong></div>
          ))}
        </div>
        <div className="immat-divider" />
        <div className="immat-section__head">
          <h2 className="immat-section__title">Historique d'utilisation</h2>
          <p className="immat-section__desc">{historiqueDescription}</p>
        </div>
        <HistoriqueVehicule immatriculationId={d.immatriculation_id} compact />
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={handleNextStep} />
    </div>
  );
};

export const MutationVehicule = (props) => (
  <VehiculeRepris {...props} dossier={props.immatriculation.mutation.dossier}
    bandeau={<BandeauMutation dossier={props.immatriculation.mutation.dossier} />}
    description="Informations reprises du dossier existant : elles ne se modifient pas lors d'une mutation."
    historiqueDescription="Tous ceux qui ont utilisé ce véhicule ; la mutation ajoutera une nouvelle période une fois validée." />
);

const toutesDirections = (immatriculation) => {
  const liste = immatriculation?.organisations?.allDirections;
  return Array.isArray(liste) ? liste : (liste?.directions || []);
};

// Étape 3 : affectation actuelle (rappel) et nouvel organisme
export const MutationAffectation = ({ immatriculation, setImmatriculation, handleNextStep, handlePrevStep, stepChk, setStepChk }) => {
  const d = immatriculation.mutation.dossier;
  const [erreur, setErreur] = useState("");
  // Organismes existants du type du dossier ; l'organisme actuel n'est pas proposé
  const ministeres = useMemo(() => (immatriculation.organisations.allMinisteres || []).filter((m) =>
    m.typeorganisme?.toLowerCase() === immatriculation.typeOrganisme?.toLowerCase() && m.ministere_id != d.minister_id
  ), [immatriculation.organisations.allMinisteres, immatriculation.typeOrganisme, d.minister_id]);
  const directions = toutesDirections(immatriculation).filter((x) => x.ministere_id == immatriculation.ministere);
  const valide = !!immatriculation.ministere && immatriculation.ministere != 0;
  useEffect(() => { setStepChk({ ...stepChk, step3: valide, step4: valide }); }, [valide]);

  const continuer = () => {
    if (!valide) { setErreur("Choisissez le nouvel organisme d'affectation."); return; }
    handleNextStep();
  };
  return (
    <div>
      <div className="immat-body">
        <BandeauMutation dossier={d} />
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Nouvelle affectation</h2>
          <p className="immat-section__desc">Le véhicule quitte son organisme actuel pour celui que vous choisissez.</p>
        </div>
        <div className="immat-kv">
          <div><span>Organisme actuel</span><strong>{ou(d.ministere)}</strong></div>
          <div><span>Direction actuelle</span><strong>{ou(d.direction)}</strong></div>
          {immatriculation.typeOrganisme && <div><span>Type d'organisme</span><strong>{immatriculation.typeOrganisme}</strong></div>}
        </div>
        <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Nouvel organisme" required error={erreur}>
            <SearchSelect id="ministere-mutation" name="ministere" value={immatriculation.ministere}
              placeholder="Sélectionner le nouvel organisme" searchPlaceholder="Rechercher un ministère ou un organisme…"
              options={ministeres.map((m) => ({ value: String(m.ministere_id), label: m.nom }))}
              onChange={(e) => { setErreur(""); setImmatriculation({ ...immatriculation, ministere: e.target.value, direction: 0 }); }} />
          </Field>
          <Field label="Direction ou service">
            <SearchSelect id="direction-mutation" name="direction" value={immatriculation.direction} disabled={directions.length === 0}
              placeholder={directions.length ? "Sélectionner la direction ou le service" : "Aucune direction pour cet organisme"}
              searchPlaceholder="Rechercher une direction…"
              options={directions.map((x) => ({ value: String(x.direction_id), label: x.nom }))}
              onChange={(e) => setImmatriculation({ ...immatriculation, direction: e.target.value })} />
          </Field>
        </div>
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={continuer} />
    </div>
  );
};

// Étape 5 : vérification et envoi de la mutation
export const MutationSoumission = ({ immatriculation, handlePrevStep, setStep, onTermine }) => {
  const d = immatriculation.mutation.dossier;
  const [erreurs, setErreurs] = useState([]);
  const [chargement, setChargement] = useState(false);
  const nouvelOrganisme = (immatriculation.organisations.allMinisteres || []).find((m) => m.ministere_id == immatriculation.ministere)?.nom;
  const nouvelleDirection = toutesDirections(immatriculation).find((x) => x.direction_id == immatriculation.direction)?.nom;
  const lettre = immatriculation.image4;

  const envoyer = async () => {
    setErreurs([]);
    setChargement(true);
    const resp = await mutationDepuisPaiement(immatriculation);
    setChargement(false);
    if (!resp?.success) {
      setErreurs(resp?.messages || { erreur: ["Échec de l'enregistrement de la mutation."] });
      toast.error("Échec de l'enregistrement de la mutation.");
      return;
    }
    toast.success(`Mutation du véhicule ${resp.numero} envoyée au Directeur pour validation.`);
    onTermine();
  };

  const blocs = [
    { titre: "Paiement", etape: 1, lignes: [["Référence de mutation", immatriculation.paiementReference, true]] },
    { titre: "Véhicule", etape: 2, lignes: [["Numéro conservé", d.immatriculation_number, true], ["Châssis", d.numChassie, true], ["Véhicule", [d.marque, d.modele].filter(Boolean).join(" ")]] },
    { titre: "Affectation", etape: 3, lignes: [
      ["Organisme actuel", d.ministere], ["Nouvel organisme", nouvelOrganisme],
      ["Direction actuelle", d.direction], ["Nouvelle direction", nouvelleDirection],
    ]},
  ];
  return (
    <div>
      {chargement && <Spinner />}
      <div className="immat-body">
        <BandeauMutation dossier={d} />
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Vérification de la mutation</h2>
          <p className="immat-section__desc">Contrôlez chaque bloc ; « Modifier » ramène à l'étape concernée.</p>
        </div>
        {blocs.map((bloc) => (
          <div key={bloc.titre} className="immat-recap">
            <div className="immat-recap__head">
              <h3 className="immat-recap__title">{bloc.titre}</h3>
              {bloc.etape !== 2 && <button type="button" className="immat-btn immat-btn--link" onClick={() => setStep(bloc.etape)}>Modifier</button>}
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
            <h3 className="immat-recap__title">Pièce jointe</h3>
            <button type="button" className="immat-btn immat-btn--link" onClick={() => setStep(4)}>Modifier</button>
          </div>
          {lettre ? <p className="immat-muted">{lettre.name}</p> : <p className="immat-muted">Aucun fichier</p>}
        </div>
        {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={envoyer} nextDisabled={chargement || !lettre} nextLabel="Envoyer la mutation" />
    </div>
  );
};
