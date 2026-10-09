import { useState, useEffect } from "react";
import StepOne from "../../components/ResoumissionImmatriculation/StepOne";
import StepTwo from "../../components/ResoumissionImmatriculation/StepTwo";
import StepThree from "../../components/ResoumissionImmatriculation/StepThree";
import StepFour from "../../components/ResoumissionImmatriculation/StepFour";
import StepFive from "../../components/ResoumissionImmatriculation/StepFive";
import { getAllGenre, getAlltype, getAllMarques, getAllmodel } from "../../utils/vehicule.util";
import { getministeres, getAllDirections } from "../../services/organisation.service";
import { getImmatriculationById, ImmatriculationRejeter } from "../../services/immatriculation.service";
import Spinner from "../../components/Spinner/Spinner";
import { useParams, useLocation, Link } from "react-router-dom";
import moment from "moment";
import 'moment/locale/fr';
import { Helmet } from 'react-helmet-async';
import ImmatStepper from "../../components/Immatriculation/ui/ImmatStepper";
import DossierPanel from "../../components/Immatriculation/ui/DossierPanel";

const ETAPES = [
  { label: "Plaque", hint: "Type d'immatriculation" },
  { label: "Véhicule", hint: "Caractéristiques" },
  { label: "Propriétaire", hint: "Affectation" },
  { label: "Pièce jointe", hint: "PDF, JPEG ou PNG" },
  { label: "Soumission", hint: "Vérification" },
];

const ResoumissionImmatriculation = () => {
  // Rejet d'organisme : la resoumission s'ouvre directement à l'étape 3 (affectation)
  const location = useLocation();
  const [step, setStep] = useState(location.state?.etape || 1);
  const [stepChk, setStepChk] = useState({ step1: false, step2: false, step3: false, step4: false,step5:false, });
  const [isLoading, setIsLoading] = useState(false);
  // Dossier chargé : tant que ce n'est pas le cas, aucune étape n'est affichée (elles lisent ses listes et ses valeurs)
  const [charge, setCharge] = useState(false);
  const [erreurChargement, setErreurChargement] = useState('');
  const [immatriculation, setImmatriculation] = useState({
    modeImmatriculation: "",
    idpays: "",
    marque: 0,
    model: "0",
    carrosserie: "",
    genre: "0",
    type: "",
    annee: "",
    energie: "",
    numChassie: "",
    nbPorte: 0,
    proprietaire: 0,
    acquisition: "achat",
    transmission: "",
    nbPlaceAssise: 4,
    nbPlaceDebout: 4,
    dateP: "",
    carosserie: "",
    ancienNumMat: "",
    cylindre: 0,
    kilometrage: 0,
    couleur: "",
    dateImmat: "",
    ministere: 0,
    direction: "",
    autreministere: "",
    typeOrganisme:'',
    nbreEssuie: 0,
    autredirection: "",
    categories: {
      AllGenres: [],
      AllTypes: [],
    },
    brands: {
      allMarques: [],
      allModeles: [],
    },
    organisations: {
      allMinisteres: [],
      allDirections: [],
    },
    pa:'',
    ptc: 0,
    pv: 0,
    cu: 0,

    image4: "",
  });
  const {id} = useParams();
  async function ComboElements() {
    setIsLoading(true);
    const marques = await getAllMarques();
    const modeles = await getAllmodel();
    const genres = await getAllGenre();
    const typeVehicule = await getAlltype();
    const ministeres = await getministeres();
    const directions = await getAllDirections();
    const {status,immatriculation,vehicule,ministere} = await getImmatriculationById(id);
    //console.log(immatriculation)
    if(status) {     
        setImmatriculation({
          ...immatriculation,
          vehiculeID:vehicule.vehicule_id,
          immatriculation_id:immatriculation.immatriculation_id,
          modeImmatriculation:immatriculation.modeImmatriculation,
          idpays: vehicule.provenance,
          model: vehicule.model_id,
          marque:vehicule.marque_id,
          carrosserie: vehicule.carosserie,
          genre: vehicule.genre,
          type: vehicule.typeVehicule,
          annee: vehicule.madeYear,
          energie: vehicule.energy,
          numChassie: vehicule.numChassie,
          nbPorte: vehicule.nbPorte,
          acquisition: vehicule.acquisition,
          transmission: vehicule.transmission,
          nbPlaceAssise: vehicule.placeNumberAssis,
          nbPlaceDebout:vehicule.placeNumberDebout,
          dateP: vehicule.releaseYear,
          ancienNumMat: immatriculation.ancienImmatriculation,
          cylindre: vehicule.cylinderNumber,
          kilometrage: vehicule.kilometrage,
          couleur: vehicule.colorVehicule,
          updatedDay:moment(vehicule.updated_at).fromNow(),
          createdDay:moment(vehicule.created_at).fromNow(),
          ministere: immatriculation.minister_id || 0,
          direction: immatriculation.direction_id,
          created_by:immatriculation.created_by,
          validate_by:immatriculation.valided_by,
          nbreEssuie:vehicule.nbreEssuie,
          pv:vehicule.pv,
          cu:vehicule.cu,
          pa:vehicule.pa,
          typeOrganisme:ministere?.typeorganisme || immatriculation.typeOrganisme || '',
          image4: vehicule.pieceJointe,
          brands: {
            allMarques: marques,
            allModeles: modeles,
          },
          categories: {
            AllGenres: genres,
            AllTypes: typeVehicule,
          },
          organisations: {
            allMinisteres: ministeres,
            allDirections: directions,
          },
        });
        setStepChk({...stepChk,step1:true})
        setCharge(true);
      }
      else setErreurChargement("Ce dossier est introuvable.");
    setIsLoading(false);
  }

  useEffect(() => {
    ComboElements().catch(() => {
      setIsLoading(false);
      setErreurChargement("Impossible de charger le dossier. Vérifiez votre connexion puis rechargez la page.");
    });
  }, []);

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Dernier rejet : motif affiché en haut de la page pour que l'agent sache quoi corriger
  const [rejet, setRejet] = useState(null);
  useEffect(() => {
    ImmatriculationRejeter(id).then((r) => r && setRejet(r)).catch(() => {});
  }, [id]);
  const motif = rejet ? [rejet.raison, rejet.autreraison].filter((t) => t && String(t).trim()).join(" — ") : "";

  // Étape accessible : 1 et 2 toujours (dossier déjà rempli), les suivantes une fois la précédente valide
  const canGo = (n) => n <= 2 ? (n === 1 || !!immatriculation.modeImmatriculation) : !!stepChk[`step${n}`];
  const nomOrganisme = String(immatriculation.ministere) === "1000000"
    ? immatriculation.autreministere
    : (immatriculation.organisations.allMinisteres || []).find((m) => m.ministere_id == immatriculation.ministere)?.nom;
  const etapeProps = { handleNextStep, handlePrevStep, immatriculation, setImmatriculation, stepChk, setStepChk };

  return (
    <div className="immat-page">
      <Helmet>
        <title>Resoumission d'immatriculation</title>
      </Helmet>
      {isLoading && <Spinner />}

      <div className="immat-head">
        <div>
          <Link to={`/details-immatriculation/${id}`} className="immat-retour">← Retour au dossier</Link>
          <h1 className="immat-head__title">Resoumission {immatriculation.immatriculation_number ? <span className="immat-mono">{immatriculation.immatriculation_number}</span> : "d'immatriculation"}</h1>
          <p className="immat-head__sub">Étape {step} sur {ETAPES.length} · {ETAPES[step - 1].label} · le numéro d'immatriculation est conservé</p>
        </div>
      </div>

      {motif && (
        <div className="immat-alert immat-alert--error" role="status">
          <span><strong>{rejet?.typeRejet === "organisme" ? "Organisme proposé rejeté :" : "Motif du rejet :"}</strong> {motif}</span>
        </div>
      )}
      {erreurChargement && <div className="immat-alert immat-alert--error" role="alert">{erreurChargement}</div>}

      <div className="immat-layout">
        <ImmatStepper steps={ETAPES} current={step} canGo={canGo} onGo={setStep} />

        <div className="immat-card immat-main">
          {!charge && !erreurChargement && <p className="immat-muted" style={{ padding: 28 }}>Chargement du dossier…</p>}
          {charge && step === 1 && <StepOne {...etapeProps} />}
          {charge && step === 2 && <StepTwo {...etapeProps} />}
          {charge && step === 3 && <StepThree {...etapeProps} />}
          {charge && step === 4 && <StepFour {...etapeProps} />}
          {charge && step === 5 && <StepFive {...etapeProps} setStep={setStep} />}
        </div>

        <DossierPanel
          reference={immatriculation.paiementReference}
          chassis={immatriculation.numChassie}
          plaque={String(immatriculation.modeImmatriculation || "").toUpperCase()}
          organisme={nomOrganisme || immatriculation.typeOrganisme}
        />
      </div>
    </div>
  );
};

export default ResoumissionImmatriculation;
