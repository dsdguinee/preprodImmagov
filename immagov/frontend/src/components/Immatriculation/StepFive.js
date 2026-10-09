import { useState, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { getPaysByID } from "../../utils/helper/functions";
import { nouvelleImmatriculation } from "../../services/immatriculation.service";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
import { ComboContext } from "../../services/Context/Contexts";
import StepActions from "./ui/StepActions";

const ou = (value, defaut = "Non renseigné") => (value === undefined || value === null || value === "" || value == 0 ? defaut : value);
const libelles = { achat: "Achat", don: "Don", "privé": "Privé", Automatic: "Automatique", Electrique: "Électrique" };

const StepFive = ({ handlePrevStep, immatriculation, setStep, onTermine }) => {
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { modeles, marques, genres, typeVehicules, ministeres, directions } = useContext(ComboContext);

  // Libellés lus dans les listes chargées par App.js
  const noms = useMemo(() => ({
    modele: modeles?.find((m) => m.id == immatriculation.model)?.title,
    marque: marques?.find((m) => m.id == immatriculation.marque)?.title,
    genre: genres?.find((m) => m.genre_id == immatriculation.genre)?.nom,
    type: typeVehicules?.find((m) => m.type_id == immatriculation.type)?.nom,
    ministere: String(immatriculation.ministere) === "1000000"
      ? immatriculation.autreministere
      : ministeres?.find((m) => m.ministere_id == immatriculation.ministere)?.nom,
    direction: String(immatriculation.ministere) === "1000000"
      ? immatriculation.autredirection
      : directions?.find((d) => d.direction_id == immatriculation.direction)?.nom,
    pays: getPaysByID(immatriculation.idpays),
  }), [immatriculation, modeles, marques, genres, typeVehicules, ministeres, directions]);

  const ptac = (parseInt(immatriculation.pv) || 0) + (parseInt(immatriculation.cu) || 0);
  const blocs = [
    { titre: "Paiement", etape: 1, lignes: [
      ["Référence", immatriculation.paiementReference, true],
      ["Type de plaque", immatriculation.modeImmatriculation],
      ["Organisme", immatriculation.typeOrganisme],
    ]},
    { titre: "Véhicule", etape: 2, lignes: [
      ["Châssis", immatriculation.numChassie, true],
      ["Marque", noms.marque], ["Modèle", noms.modele],
      ["Genre", noms.genre], ["Type", noms.type],
      ["Carrosserie", immatriculation.carrosserie], ["Couleur", immatriculation.couleur],
      ["Année", immatriculation.annee],
      ["1re mise en circulation", immatriculation.dateP ? moment(immatriculation.dateP).format("DD/MM/YYYY") : ""],
      ["Ancien numéro", immatriculation.ancienNumMat, true],
      ["Énergie", libelles[immatriculation.energie] || immatriculation.energie],
      ["Transmission", libelles[immatriculation.transmission] || immatriculation.transmission],
      ["Cylindres", immatriculation.cylindre], ["Puissance", immatriculation.pa ? immatriculation.pa + " CV" : ""],
      ["Kilométrage", immatriculation.kilometrage],
      ["Places assises", immatriculation.nbPlaceAssise], ["Places debout", ou(immatriculation.nbPlaceDebout, "0")],
      ["Portes", immatriculation.nbPorte], ["Essieux", immatriculation.nbreEssuie],
      ["Poids à vide", immatriculation.pv ? immatriculation.pv + " kg" : ""],
      ["Charge utile", immatriculation.cu ? immatriculation.cu + " kg" : ""],
      ["PTAC", ptac ? ptac + " kg" : ""],
      ["Provenance", noms.pays],
      ["Acquisition", libelles[immatriculation.acquisition] || immatriculation.acquisition],
    ]},
    { titre: "Propriétaire", etape: 3, lignes: [
      ["Ministère ou organisme", noms.ministere],
      ["Direction ou service", noms.direction],
    ]},
  ];

  const submitForm = async () => {
    setErreurs([]);
    setIsLoading(true);
    try {
      const data = await nouvelleImmatriculation(immatriculation);
      if (data.success === false) {
        if(data?.status === 417){
          toast.error("Opération effectuée, mais la synchronisation de la chaîne a échoué.");
          onTermine(); return;
        }
        setErreurs(data.messages);
        toast.error("Échec de l'enregistrement.");
      } else {
        if (immatriculation.ancienNumMat.length > 0)
          toast.success("Réimmatriculation effectuée avec succès.");
        else toast.success("Immatriculation effectuée avec succès.");
        if (data.organismeRattache)
          toast.success(`Organisme existant « ${data.organismeRattache} » affecté au dossier.`);
        onTermine();
      }
    } catch (ex) {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  const lettre = immatriculation.image4;
  return (
    <div>
      {isLoading && <Spinner />}
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Vérification avant envoi</h2>
          <p className="immat-section__desc">Contrôlez chaque bloc ; « Modifier » ramène à l'étape concernée.</p>
        </div>

        {blocs.map((bloc) => (
          <div key={bloc.titre} className="immat-recap">
            <div className="immat-recap__head">
              <h3 className="immat-recap__title">{bloc.titre}</h3>
              <button type="button" className="immat-btn immat-btn--link" onClick={() => setStep(bloc.etape)}>Modifier</button>
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
          {lettre ? (
            <div className="immat-file" style={{ border: "none", padding: 0 }}>
              <div className={`immat-file__icon${/\.pdf$/i.test(lettre.name || "") ? "" : " immat-file__icon--img"}`}>{/\.pdf$/i.test(lettre.name || "") ? "PDF" : "IMG"}</div>
              <div className="immat-file__info"><span>{lettre.name}</span></div>
              <button type="button" className="immat-btn immat-btn--link" onClick={() => window.open(URL.createObjectURL(lettre))}>Ouvrir</button>
            </div>
          ) : <p className="immat-muted">Aucun fichier</p>}
        </div>

        {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={submitForm} nextDisabled={isLoading} nextLabel="Enregistrer l'immatriculation" />
    </div>
  );
};

export default StepFive;
