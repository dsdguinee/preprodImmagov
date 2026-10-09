import { useState,useMemo,useContext,useEffect } from "react";
import { useParams} from "react-router-dom";
import StepFour from "../../components/Reforme/StepFour";
import StepOne from "../../components/Reforme/StepOne";
import StepThree from "../../components/Reforme/StepThree";
import StepTwo from "../../components/Reforme/StepTwo";
import { ComboContext } from "../../services/Context/Contexts";
import { getImmatriculationById } from "../../services/immatriculation.service";
import { getPaysByID} from '../../utils/helper/functions';
import Spinner from "../../components/Spinner/Spinner";
import moment from 'moment';
import 'moment/locale/fr';
import { Helmet } from 'react-helmet-async'

const NouvelleReforme = () => {
    moment.locale('fr');
    const url = process.env.REACT_APP_URL + '/storage/';
    const [step, setStep] = useState(1);
    const [vehiculeInfo, setVehiculeInfo] = useState();
    const [isLoading,setIsLoading] = useState(false);
    const { id } = useParams();
 
    const [immatriculationInfo, setImmatriculationInfo] = useState();
    const [affectation, setAffectation] = useState("Non Affecte");
    const {genres,modeles,marques,typeVehicules,ministeres,directions} = useContext(ComboContext);
    const [genre,setGenre] = useState();
    const [status,setStatus] = useState(false);
    const[typeVehicule,setTypeVehicule] = useState();
    const[modele,setModeles] = useState();
    const[marque,setMarque] = useState();
    const [pays,setPays] = useState();
    const [ministere,setMinistere] = useState('');
    const [stepChk, setStepChk] = useState({step1:false,step2:false,step3:false});
    const [proprietaireInfo,setProprietaireInfo] = useState({
        immatriculation_id: id,
        valeurResiduelle:50000,
        nom:'',
        prenom:'',
        date_naissance:'',
        fonction:'',
        ministere:'',
        direction:'',
        piece: '',
        paiement:'',
        oldministere_id:'',
    });
    useMemo(() => {
        setIsLoading(true);
        if(immatriculationInfo){
  
          setPays(getPaysByID(vehiculeInfo?.provenance));
          if(immatriculationInfo.status === 0)
            setStatus('En attente');
          else if(immatriculationInfo.status === 1)
            setStatus('Validée');
          else if(immatriculationInfo.status === 2){
            setStatus('Rejetée');
          }else if(immatriculationInfo.status === 3){
            setStatus('Reformée');
          }else if(immatriculationInfo.status === 4){
            setStatus('Mutée');
          }     
          //console.log(vehiculeInfo.genre)
         if (Array.isArray(ministeres) && ministeres.length > 0) {
           if(immatriculationInfo.minister_id != 1000000){
              setAffectation(ministeres.filter(m => m.ministere_id == immatriculationInfo.minister_id)[0].nom);
              setProprietaireInfo({...proprietaireInfo,oldministere_id:immatriculationInfo.minister_id});
            }
            else setAffectation(immatriculationInfo.autreministere);  
          }
        
         if (Array.isArray(genres) && genres.length != 0) setGenre(genres.filter(g => g.genre_id == vehiculeInfo.genre)[0].nom);
         if (Array.isArray(typeVehicules) && typeVehicules.length != 0) setTypeVehicule(typeVehicules.filter(g=>g.type_id == vehiculeInfo.typeVehicule)[0].nom);
         if (Array.isArray(modeles) && modeles.length != 0) setModeles(modeles.filter(m=>m.id == vehiculeInfo.model_id)[0].title);
         if (Array.isArray(marques) && marques.length != 0) setMarque(marques.filter(m=>m.id == vehiculeInfo.marque_id)[0].title);
        }
        setIsLoading(false);
        
       },[immatriculationInfo,pays]);

       useEffect(() => {
        getDetails(id);
      }, [id]);
      
      const getDetails = async (currentID) => {
        const {immatriculation,vehicule} = await getImmatriculationById(currentID);
        setImmatriculationInfo(immatriculation) 
        setVehiculeInfo(vehicule);
        
      }
      
    const handleNextStep = () => {
         setStep(step + 1);
       
    }
   
    const handlePrevStep = () => {
      setStep(step - 1);
     
    }

    return (
        <div className="reforme-page page">
            <Helmet>
              <title>Nouvelle reforme</title>
            </Helmet>
            <h2>Nouvelle reforme</h2>
            {isLoading && <Spinner />}
            <div className="stepper">
                <div className={`step ${step === 1 && "step-active"}`} onClick={ () => setStep(1) }>
                <div className="step-number">
                    <span>1</span>
                </div>
                <div className="step-label">
                    <p>Infos du vehicule</p>
                </div>
                </div>
                <div className={`step ${step === 2 && "step-active"}`} onClick={ () => stepChk.step1 && setStep(2) }>
                <div className="step-number">
                    <span>2</span>
                </div>
                <div className="step-label">
                    <p>Infos du proprietaire</p>
                </div>
                </div>
                <div className={`step ${step === 3 && "step-active"}`} onClick={ () => stepChk.step2 && setStep(3) }>
                <div className="step-number">
                    <span>3</span>
                </div>
                <div className="step-label">
                    <p>Joindre les fichiers</p>
                </div>
                </div>
                <div className={`step ${step === 4 && "step-active"}`} onClick={ () => stepChk.step3 && setStep(4) }>
                <div className="step-number">
                    <span>4</span>
                </div>
                <div className="step-label">
                    <p>Soumission</p>
                </div>
                </div>
            </div>
      <div className="step-components">
          {step === 1 && <StepOne handleNextStep={handleNextStep}
              vehiculeInfo ={vehiculeInfo} immatriculationInfo={immatriculationInfo} proprietaireInfo={proprietaireInfo} setProprietaireInfo={setProprietaireInfo}
              genre={genre} typeVehicule={typeVehicule} modele={modele} marque={marque} pays ={pays} affectation={affectation} status={status} 
              setStepChk={setStepChk} stepChk={stepChk}
              />}
          {step === 2 && <StepTwo ministeres={ministeres} directions={directions} handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} setProprietaireInfo ={setProprietaireInfo}
             proprietaireInfo={proprietaireInfo} setStepChk={setStepChk} stepChk={stepChk}/>
             }
          {step === 3 && <StepThree handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} 
          setProprietaireInfo ={setProprietaireInfo} proprietaireInfo={proprietaireInfo}
          setStepChk={setStepChk} stepChk={stepChk}
          />}
          {step === 4 && <StepFour handlePrevStep={handlePrevStep} setProprietaireInfo ={setProprietaireInfo} proprietaireInfo={proprietaireInfo} 
            vehiculeInfo ={vehiculeInfo} immatriculationInfo={immatriculationInfo}
            genre={genre} typeVehicule={typeVehicule}modele={modele} marque={marque} pays ={pays} affectation={affectation} status={status} setStep={setStep}
          />}
      </div>
        </div>
    );
}
 
export default NouvelleReforme;