import { useState,useEffect,useContext } from "react";
import StepFive from "../../components/Immatriculation/StepFive";
import StepFour from "../../components/Immatriculation/StepFour";
import StepOne from "../../components/Immatriculation/StepOne";
import StepThree from "../../components/Immatriculation/StepThree";
import StepTwo from "../../components/Immatriculation/StepTwo";
import { ComboContext } from "../../services/Context/Contexts";
import Spinner from "../../components/Spinner/Spinner";
import { Helmet } from 'react-helmet-async';
import { useLocation } from "react-router-dom";
import moment from "moment";
import { getPaiementSipim, getReservationList, dossierParChassis } from "../../services/immatriculation.service";
import { MutationVehicule, MutationAffectation, MutationSoumission } from "../../components/Immatriculation/Mutation";
import { ReformeVehicule, ReformeProprietaire, ReformePiece, ReformeSoumission, proprietaireVide } from "../../components/Immatriculation/Reforme";
import ImmatStepper from "../../components/Immatriculation/ui/ImmatStepper";
import DossierPanel from "../../components/Immatriculation/ui/DossierPanel";

const ETAPES = [
  { label: "Paiement", hint: "Référence SIPIM" },
  { label: "Véhicule", hint: "Caractéristiques" },
  { label: "Propriétaire", hint: "Affectation" },
  { label: "Pièce jointe", hint: "PDF, JPEG ou PNG" },
  { label: "Soumission", hint: "Vérification" },
];
// Référence de réforme : le véhicule est cédé à un particulier
const ETAPES_REFORME = [
  { label: "Paiement", hint: "Référence SIPIM" },
  { label: "Véhicule", hint: "Dossier existant" },
  { label: "Nouveau propriétaire", hint: "Coordonnées" },
  { label: "Pièce d'identité", hint: "Photo JPEG ou PNG" },
  { label: "Soumission", hint: "Vérification" },
];
// modeImmat SIPIM : « Réforme » (avec ou sans accent)
const estReforme = (paiement) => String(paiement?.modeImmat || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === "reforme";
// État de départ du dossier (aussi utilisé pour vider le formulaire après l'enregistrement)
const dossierVide = () => (
    {modeImmatriculation:'',
      reservation_id:'',
      idpays: 0,
      marque: 0,
      model: '0',
      carrosserie: 0,
      genre: '0',
      type: '0',
      annee:'',
      energie:'',
      numChassie:'',
      nbPorte:0,
      proprietaire: 0,
      acquisition:'achat',
      transmission:'Manuelle',
      nbPlaceAssise:0,
      nbPlaceDebout:0,
      dateP:'',
      carosserie:'',
      ancienNumMat:'',
      cylindre:0,
      kilometrage:0,
      couleur:'',
      dateImmat:'',
      ministere: 0,
      direction:'',
      autreministere:'',
      nbreEssuie:0,
      autredirection:'',
      typeOrganisme:"",
      paiementReference:'',
      isReferenceValid:false,
      categories:{
       AllGenres:[],
       AllTypes:[],
      },
      brands:{
        allMarques:[],
        allModeles:[]
      },
      organisations:{
       allMinisteres:[],
       allDirections:[],
      },
      ptc:0,
      pv:0,
      cu:0,
      pa:0,
      image4:'',
  });

const Immatriculation = () => {
  const [step, setStep] = useState(1);
  const [stepChk, setStepChk] = useState({step1:false,step2:false,step3:false,step4:false,step5:false});
  const { genres, modeles, marques, typeVehicules, ministeres,directions } = useContext(ComboContext);
  //const [models,setModels] = useState();
  const [items,setItems] = useState({});
  const [isLoading,setIsLoading] = useState(false);
  const [paiement,setPaiement] = useState();
  const [erreurs,setErreurs] = useState('');
  const [reservationListe,setReservationListe] = useState([]);
  // Référence saisie depuis le tableau de bord agent (« Vérifier et commencer »)
  const location = useLocation();
  const referenceInitiale = location.state?.reference || '';
  const [verifierAuto, setVerifierAuto] = useState(!!referenceInitiale);
  const [immatriculation,setImmatriculation] = useState(() => ({ ...dossierVide(), paiementReference: referenceInitiale }));

   async function ComboElements(){
    setIsLoading(true);
     const {status,ReserationList} = await getReservationList();
     if(status === 200 ) setReservationListe(ReserationList);
    setIsLoading(false);
   }
   const getPaiement = async (reference) => {
    setErreurs('');setIsLoading(true);setPaiement('');setStepChk({...stepChk,step1:false});
      // Le backend immagov interroge SIPIM avec la cle API : on n'envoie que la reference
      const resp = {data: await getPaiementSipim(reference)};
      //console.log(resp.data.paiement.typeOrganisme);
      setPaiement(resp.data.paiement);
      
      // Reference deja consommee par un autre dossier d'immatriculation (indique par SIPIM)
      const dejaUtilisee = resp.data.status === 200 && resp.data?.paiement?.utilise;
      // Paiement de MUTATION ou de RÉFORME : le véhicule est déjà immatriculé, son dossier est repris (même numéro)
      const reforme = estReforme(resp.data?.paiement);
      if(resp.data.status === 200 && resp.data?.paiement?.status === 'Validé' && !dejaUtilisee && (resp.data.paiement.modeImmat === 'Mutation' || reforme)){
        const reponse = await dossierParChassis(resp.data.paiement.chassis, reforme ? 'reforme' : 'mutation');
        if(!reponse?.success || !reponse.mutable){
          setErreurs(reponse?.raison || (reponse?.messages ? Object.values(reponse.messages).flat().join(' ') : "Dossier du véhicule introuvable."));
          setImmatriculation({...immatriculation,isReferenceValid:false,mutation:null,reforme:null});
          setStepChk({...stepChk,step1:false,step2:false,step3:false,step4:false,step5:false});
        }else{
          const dossier = reponse.dossier;
          setImmatriculation({...immatriculation,isReferenceValid:true,
            mutation:reforme ? null : {dossier},
            reforme:reforme ? {dossier,proprietaire:proprietaireVide()} : null,
            numChassie:dossier.numChassie,modeImmatriculation:dossier.modeImmatriculation,
            typeOrganisme:resp.data.paiement.typeOrganisme || dossier.typeOrganisme || '',
            ministere:0,direction:0,image4:''});
          setStepChk({...stepChk,step1:true,step2:true,step3:false,step4:false}); setStep(step + 1);
        }
      }
      else if(resp.data.status === 200 && resp.data?.paiement?.status === 'Validé' && !dejaUtilisee){
        const getCategorie= immatriculation?.categories.AllGenres?immatriculation.categories.AllGenres.filter((c) => c.nom.toUpperCase().trim() === resp.data.paiement.genre.toUpperCase().trim()):[];
        let genreID = 0;
        if(getCategorie.length > 0)
           genreID = getCategorie[0]?.genre_id;
 
        setImmatriculation({...immatriculation,isReferenceValid:true,mutation:null,reforme:null,
          numChassie:resp.data.paiement.chassis,genre:genreID,pa:resp.data?.paiement.pf,          cu:resp.data?.paiement.cu,pv:resp.data?.paiement.pv,nbPlaceAssise:resp.data?.paiement.nbrePlace,
           modeImmatriculation:resp.data?.paiement?.type_plaque,typeOrganisme:resp.data.paiement.typeOrganisme || ''});
        setStepChk({...stepChk,step1:true}); setStep(step + 1);
       // console.log(resp.data.paiement)

      }
      else {
        if(dejaUtilisee){
          const { dateUtilisation, numeroImmatriculation } = resp.data.paiement;
          setErreurs("Cette référence de paiement a déjà été utilisée"
            + (dateUtilisation ? ` le ${moment(dateUtilisation).format("DD/MM/YYYY [à] HH:mm")}` : "")
            + (numeroImmatriculation ? ` (immatriculation ${numeroImmatriculation})` : "") + ".");
        }
        else if(resp.data?.paiement?.status === 'Non Validé')
          setErreurs("Paiement Non Validé."); 
        else setErreurs(resp.data?.messages); 

          setImmatriculation({...immatriculation,isReferenceValid:false,mutation:null,reforme:null});
          setStepChk({...stepChk,step1:false,step2:false,step3:false,step4:false,step5:false});
        }  
    setIsLoading(false);
   }
  useEffect(() => {
    ComboElements();
  },[]);
  // Vérification automatique de la référence reçue, une fois les genres chargés (nécessaires pour pré-remplir le genre)
  useEffect(() => {
    if(verifierAuto && immatriculation.categories.AllGenres?.length > 0){
      setVerifierAuto(false);
      window.history.replaceState({}, '');
      getPaiement(referenceInitiale);
    }
  },[verifierAuto, immatriculation.categories.AllGenres]);
  //Les listes arrivent de App.js les unes après les autres : on les recopie à chaque arrivée
  useEffect(() => {
    setImmatriculation((prev) => ({...prev,brands:{
      allMarques:marques,
      allModeles:modeles,
    },categories:{
      AllGenres:genres,
      AllTypes:typeVehicules
    },organisations:{
      allMinisteres:ministeres,
      allDirections:directions
    }}));
  },[genres,typeVehicules,marques,modeles,ministeres,directions]);

  const handleNextStep = () => {
  
    if(step === 1){
      // if(immatriculation.typeOrganisme === 'Privé' || immatriculation.typeOrganisme === 'Publique')
        getPaiement(immatriculation.paiementReference);
    
    }
    else{
       setStep(step + 1);
       if(erreurs !== '') setStep(1);
     }
    
    // else  //si c'est pas une immatriculation
    //   setStep(step + 1);
    
  }

  // Après l'enregistrement : formulaire, détails du paiement et étapes remis à zéro (listes déjà chargées conservées)
  const reinitialiser = () => {
    setImmatriculation((prev) => ({ ...dossierVide(), brands: prev.brands, categories: prev.categories, organisations: prev.organisations }));
    setPaiement(undefined);
    setErreurs('');
    setStepChk({step1:false,step2:false,step3:false,step4:false,step5:false});
    setStep(1);
  }

  const handlePrevStep = () => {
   if(step === 1 )
     setStepChk({...stepChk,step1:false});
    setStep(step - 1);
  }

  // Étape n accessible si l'étape précédente est valide (comme avant)
  const canGo = (n) => n === 1 || stepChk[`step${n - 1}`];
  const plaque = String(immatriculation.modeImmatriculation || "").toUpperCase();
  // Référence de mutation ou de réforme : dossier existant repris
  const mutation = immatriculation.mutation;
  const reforme = immatriculation.reforme;
  const repris = mutation || reforme;
  const etapes = reforme ? ETAPES_REFORME : ETAPES;
  const progression = Math.round(((step - 1) / (etapes.length - 1)) * 100);
  const props = { immatriculation, setImmatriculation, handleNextStep, handlePrevStep, stepChk, setStepChk };

  return (
    <div className="immat-page">
      <Helmet>
        <title>Nouvelle immatriculation</title>
      </Helmet>
      {isLoading && <Spinner />}

      <div className="immat-head">
        <div>
          <h1 className="immat-head__title">
            {mutation ? <>Mutation du véhicule <span className="immat-mono">{mutation.dossier.immatriculation_number}</span></>
              : reforme ? <>Réforme du véhicule <span className="immat-mono">{reforme.dossier.immatriculation_number}</span></>
              : "Nouvelle immatriculation"}
          </h1>
          <p className="immat-head__sub">Étape {step} sur {etapes.length} · {etapes[step - 1].label}</p>
        </div>
        <div className="immat-progress">
          <div className="immat-progress__labels"><span>Progression</span><span>{progression} %</span></div>
          <div className="immat-progress__track"><div className="immat-progress__bar" style={{ width: `${Math.max(progression, 4)}%` }} /></div>
        </div>
      </div>


      <div className="immat-layout">
        <ImmatStepper steps={etapes} current={step} canGo={canGo} onGo={setStep} />

        <div className="immat-card immat-main">
          {step === 1 && <StepOne handleNextStep={handleNextStep} immatriculation={immatriculation} setImmatriculation={setImmatriculation}
            erreurs={erreurs} setErreurs={setErreurs} stepChk={stepChk} reservationListe={reservationListe} paiement={paiement} />}
          {step === 2 && mutation && <MutationVehicule immatriculation={immatriculation} handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} stepChk={stepChk} setStepChk={setStepChk} />}
          {step === 2 && reforme && <ReformeVehicule {...props} />}
          {step === 2 && !repris && <StepTwo handleNextStep={handleNextStep} handlePrevStep={handlePrevStep}
            immatriculation={immatriculation} setImmatriculation={setImmatriculation} items={items}
            stepChk={stepChk} setStepChk={setStepChk} erreurs={erreurs} setStep={setStep} paiement={paiement} />}
          {step === 3 && mutation && <MutationAffectation immatriculation={immatriculation} setImmatriculation={setImmatriculation} handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} stepChk={stepChk} setStepChk={setStepChk} />}
          {step === 3 && reforme && <ReformeProprietaire {...props} />}
          {step === 3 && !repris && <StepThree handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} immatriculation={immatriculation} setImmatriculation={setImmatriculation} stepChk={stepChk} setStepChk={setStepChk} />}
          {step === 4 && reforme && <ReformePiece {...props} />}
          {step === 4 && !reforme && <StepFour handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} immatriculation={immatriculation} setImmatriculation={setImmatriculation} stepChk={stepChk} setStepChk={setStepChk} />}
          {step === 5 && mutation && <MutationSoumission immatriculation={immatriculation} handlePrevStep={handlePrevStep} setStep={setStep} onTermine={reinitialiser} />}
          {step === 5 && reforme && <ReformeSoumission immatriculation={immatriculation} handlePrevStep={handlePrevStep} setStep={setStep} onTermine={reinitialiser} />}
          {step === 5 && !repris && <StepFive handlePrevStep={handlePrevStep} setImmatriculation={setImmatriculation} immatriculation={immatriculation} stepChk={stepChk} setStepChk={setStepChk} setStep={setStep} onTermine={reinitialiser} />}
        </div>

        <DossierPanel
          reference={immatriculation.isReferenceValid ? immatriculation.paiementReference : ""}
          chassis={immatriculation.numChassie}
          genre={immatriculation.isReferenceValid ? paiement?.genre : ""}
          plaque={plaque}
          organisme={immatriculation.typeOrganisme}
        />
      </div>
    </div>
  );
};

export default Immatriculation;
