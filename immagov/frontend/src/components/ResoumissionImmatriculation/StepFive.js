import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { getPaysByID } from '../../utils/helper/functions';
import { resoumission } from "../../services/immatriculation.service";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
import StepActions from "../Immatriculation/ui/StepActions";

const ou = (value, defaut = "Non renseigné") => (value === undefined || value === null || value === "" || value == 0 ? defaut : value);
const libelles = { achat: "Achat", don: "Don", "privé": "Privé", Automatic: "Automatique", Electrique: "Électrique" };

// Étape 5 : vérification puis resoumission du dossier
const StepFive = ({ handlePrevStep, immatriculation, setStep }) => {
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const navigate = useNavigate();
  const url = process.env.REACT_APP_URL + '/storage/';

  // Libellés lus dans les listes chargées par la page
  const noms = useMemo(() => {
    const i = immatriculation;
    const directions = Array.isArray(i.organisations.allDirections) ? i.organisations.allDirections : (i.organisations.allDirections?.directions || []);
    return {
      marque: (i.brands.allMarques || []).find((m) => m.id == i.marque)?.title,
      modele: (i.brands.allModeles || []).find((m) => m.id == i.model)?.title,
      genre: (i.categories.AllGenres || []).find((g) => g.genre_id == i.genre)?.nom,
      type: (i.categories.AllTypes || []).find((t) => t.type_id == i.type)?.nom,
      ministere: String(i.ministere) === "1000000" ? i.autreministere : (i.organisations.allMinisteres || []).find((m) => m.ministere_id == i.ministere)?.nom,
      direction: String(i.ministere) === "1000000" ? i.autredirection : directions.find((d) => d.direction_id == i.direction)?.nom,
      pays: getPaysByID(i.idpays),
    };
  }, [immatriculation]);

  const ptac = (parseInt(immatriculation.pv) || 0) + (parseInt(immatriculation.cu) || 0);
  const blocs = [
    { titre: "Plaque", etape: 1, lignes: [
      ["Type de plaque", immatriculation.modeImmatriculation],
      ["Numéro conservé", immatriculation.immatriculation_number, true],
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
      ["Cylindres", immatriculation.cylindre], ["Puissance", immatriculation.pa ? `${immatriculation.pa} CV` : ""],
      ["Kilométrage", immatriculation.kilometrage !== undefined && immatriculation.kilometrage !== null ? `${immatriculation.kilometrage} km` : ""],
      ["Places assises", immatriculation.nbPlaceAssise], ["Places debout", ou(immatriculation.nbPlaceDebout, "0")],
      ["Portes", immatriculation.nbPorte], ["Essieux", ou(immatriculation.nbreEssuie, "0")],
      ["Poids à vide", immatriculation.pv ? `${immatriculation.pv} kg` : ""],
      ["Charge utile", immatriculation.cu ? `${immatriculation.cu} kg` : ""],
      ["PTAC", ptac ? `${ptac} kg` : ""],
      ["Provenance", noms.pays],
      ["Acquisition", libelles[immatriculation.acquisition] || immatriculation.acquisition],
    ]},
    { titre: "Propriétaire", etape: 3, lignes: [
      ["Ministère ou organisme", noms.ministere],
      ["Direction ou service", noms.direction],
    ]},
  ];

  const lettre = immatriculation.image4;
  const lettreEnregistree = typeof lettre === 'string' || lettre instanceof String;
  const nomLettre = lettreEnregistree ? String(lettre).split('/').pop() : lettre?.name;

  const submitForm = async () => {
    setErreurs([]);
    setIsLoading(true);
    const result = await resoumission(immatriculation);
    setIsLoading(false);
    if(result.success === false ){
      toast.error("Échec de la resoumission.");
      setErreurs(result.messages);
    }else{
      toast.success("Resoumission effectuée avec succès.");
      navigate('/liste-immatriculation');
    }
  }

  return (
    <div>
      {isLoading && <Spinner />}
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Vérification avant resoumission</h2>
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
              <div className={`immat-file__icon${/\.pdf$/i.test(nomLettre || "") ? "" : " immat-file__icon--img"}`}>{/\.pdf$/i.test(nomLettre || "") ? "PDF" : "IMG"}</div>
              <div className="immat-file__info"><span>{nomLettre}</span><span className="immat-muted">{lettreEnregistree ? "Pièce jointe déjà ajoutée" : "Nouvelle pièce jointe"}</span></div>
              <button type="button" className="immat-btn immat-btn--link" onClick={() => window.open(lettreEnregistree ? url + lettre : URL.createObjectURL(lettre))}>Ouvrir</button>
            </div>
          ) : <p className="immat-muted">Aucun fichier</p>}
        </div>

        {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={submitForm} nextDisabled={isLoading} nextLabel="Resoumettre le dossier" />
    </div>
  );
};

export default StepFive;
