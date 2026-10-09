import { useState, useContext, useMemo, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import StepOne from "../../components/ResoumissionMutation/StepOne";
import StepThree from "../../components/ResoumissionMutation/StepThree";
import StepTwo from "../../components/ResoumissionMutation/StepTwo";
import { ComboContext } from "../../services/Context/Contexts";
import { getImmatriculationById, getMutationById, getMutationStatus, ImmatriculationRejeter } from "../../services/immatriculation.service";
import { getPaysByID } from "../../utils/helper/functions";
import moment from "moment";
import "moment/locale/fr";
import Spinner from "../../components/Spinner/Spinner";
import { Helmet } from 'react-helmet-async';


const ResoumissionMutation = () => {
  const { id } = useParams();
  const location = useLocation();
  const url = process.env.REACT_APP_URL + "/storage/";
  const [isLoading, setIsLoading] = useState(false);
  const [pays, setPays] = useState();
  const [step, setStep] = useState(1);
  const [mutationInfo, setMutationInfo] = useState({});
  const [raisonRejet,setRaisonRejet] = useState('');
  const [status,setStatus] = useState();
  const { ministeres } = useContext(ComboContext);
  const [stepChk, setStepChk] = useState({step1:false,step2:false,step3:false});
  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  useMemo(() => {
    setPays(getPaysByID(mutationInfo.provenance));
    if(mutationInfo.nouveauStatus == 0)
       setStatus("En Attente");
     else if(mutationInfo.nouveauStatus == 1)
       setStatus("Validé");
     else if(mutationInfo.nouveauStatus == 2){  
        ImmatriculationRejeter(mutationInfo.immatriculation_id).then((resp) => {
          if(resp.raison)
              setRaisonRejet(resp.raison);
          else
             setRaisonRejet(resp.autreraison);      
      
        })
       
        setStatus("Rejété");
    }
  
  }, [mutationInfo]);
  
  useEffect(() => {
    setIsLoading(true);
   
    if(location.state.mutationInfo)
    {
      
       const mutationInfo = location.state.mutationInfo;
       setMutationInfo({...mutationInfo,
          mutation_id:mutationInfo.mutation_id,
          immatriculation_id:mutationInfo.immatriculation_id,
          provenance:mutationInfo.provenance,
          NouveMinistere:mutationInfo.NouveMinistere,
          nouveauMinistere_id:mutationInfo.NouveauMinistere_id,
          nouveauDirection_id:mutationInfo.NouveauDirection_id?mutationInfo.NouveauDirection_id:0,
          ancienMinistere_id : mutationInfo.minister_id,
          ancienDirection_id:mutationInfo.ancienDirection_id,
          nouveauStatus:mutationInfo.NouveauStatus,
          acquisition:mutationInfo.acquisition,
          ancienMinistere:mutationInfo.ancienMinistere,
          ancienDteAttribution:mutationInfo.ancienDteAttribution? moment(mutationInfo?.ancienDteAttribution).format("DD-MMMM-YYYY"):'Non Fournie',
          ancienImmatriculation:mutationInfo.ancienImmatriculation,
          carosserie:mutationInfo.carosserie,
          colorVehicule:mutationInfo.colorVehicule,
          cylinderNumber:mutationInfo.cylinderNumber,
          energy:mutationInfo.energy,
          genre:mutationInfo.genre,
          immatriculation_number:mutationInfo.immatriculation_number,
          kilometrage:mutationInfo.kilometrage,
          madeYear:mutationInfo.madeYear,
          releaseYear:mutationInfo.releaseYear,
          marque:mutationInfo.marque,
          model:mutationInfo.model,
          modeImmatriculation:mutationInfo.modeImmatriculation,
          motif:mutationInfo.motif,
          nbPorte:mutationInfo.nbPorte,
          nbreEssuie:mutationInfo.nbreEssuie,
          numChassie:mutationInfo.numChassie,
          placeNumberAssis:mutationInfo.placeNumberAssis,
          placeNumberDebout:mutationInfo.placeNumberDebout,
          transmission:mutationInfo.transmission,
          typeVehicule:mutationInfo.typeVehicule,
          pieceJointe:mutationInfo.pieceJointe,
          
          fonction:mutationInfo.fonction,
          document1:mutationInfo.document1,
          document2:mutationInfo.document2,
       })
    }else {
      getMutationById(id).then((resp) => {
      
        if(resp.success){
          const mutationInfo = resp.mutation[0];
          setMutationInfo({...mutationInfo,
            mutation_id:mutationInfo.mutation_id,
            provenance:mutationInfo.provenance,
            NouveMinistere:mutationInfo.NouveMinistere,
            nouveauMinistere_id:mutationInfo.NouveauMinistere_id,
            nouveauDirection_id:mutationInfo.NouveauDirection_id?mutationInfo.NouveauDirection_id:0,
            ancienDirection_id:mutationInfo.ancienDirection_id,
            nouveauStatus:mutationInfo.NouveauStatus,
            acquisition:mutationInfo.acquisition,
            ancienMinistere:mutationInfo.ancienMinistere,
            ancienDteAttribution:mutationInfo.ancienDteAttribution? moment(mutationInfo?.ancienDteAttribution).format("DD-MMMM-YYYY"):'Non Fournie',
            ancienImmatriculation:mutationInfo.ancienImmatriculation,
            carosserie:mutationInfo.carosserie,
            colorVehicule:mutationInfo.colorVehicule,
            cylinderNumber:mutationInfo.cylinderNumber,
            energy:mutationInfo.energy,
            genre:mutationInfo.genre,
            immatriculation_number:mutationInfo.immatriculation_number,
            kilometrage:mutationInfo.kilometrage,
            madeYear:mutationInfo.madeYear,
            releaseYear:mutationInfo.releaseYear,
            marque:mutationInfo.marque,
            model:mutationInfo.model,
            modeImmatriculation:mutationInfo.modeImmatriculation,
            motif:mutationInfo.motif,
            nbPorte:mutationInfo.nbPorte,
            nbreEssuie:mutationInfo.nbreEssuie,
            numChassie:mutationInfo.numChassie,
            placeNumberAssis:mutationInfo.placeNumberAssis,
            placeNumberDebout:mutationInfo.placeNumberDebout,
            transmission:mutationInfo.transmission,
            typeVehicule:mutationInfo.typeVehicule,
            pieceJointe:mutationInfo.pieceJointe,
            fonction:mutationInfo.fonction,
            document1:mutationInfo.document1,
            document2:mutationInfo.document2,
         })
        }
      });
    }
    setIsLoading(false);
    setStepChk({...stepChk,step2:true})
  }, [id]);
  //console.log(mutationInfo)
  return (
    <div className="nouvelle-mutation-page page">
      <Helmet>
        <title>Resoumission de mutation</title>
      </Helmet>
      <h2>Resoumission de mutation</h2>
      <div className="stepper">
        <div
          className={`step ${step === 1 && "step-active"}`}
          onClick={() => stepChk.step1 && setStep(1)}
        >
          <div className="step-number">
            <span>1</span>
          </div>
          <div className="step-label">
            <p>Infos du vehicule</p>
          </div>
        </div>
        <div
          className={`step ${step === 2 && "step-active"}`}
          onClick={() => stepChk.step2 &&  setStep(2)}
        >
          <div className="step-number">
            <span>2</span>
          </div>
          <div className="step-label">
            <p>Infos du proprietaire</p>
          </div>
        </div>
        <div
          className={`step ${step === 3 && "step-active"}`}
          onClick={() => stepChk.step3 && setStep(3)}
        >
          <div className="step-number">
            <span>3</span>
          </div>
          <div className="step-label">
            <p>Soumission</p>
          </div>
        </div>
      </div>
      <div className="step-components">
        {step === 1 && (
          <StepOne
            handleNextStep={handleNextStep}
            setMutationInfo = {setMutationInfo}
            mutationInfo = {mutationInfo}
            setRaisonRejet={setRaisonRejet}
            raisonRejet={raisonRejet}
            status={status}
            setStatus={setStatus}
            pays={pays}
          />
        )}
        {step === 2 && (
          <StepTwo
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            setMutationInfo = {setMutationInfo}
            mutationInfo = {mutationInfo}
            ministeres={ministeres}
            setStepChk={setStepChk}
            stepChk={stepChk}
          />
        )}
        {step === 3 && (
          <StepThree
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            setMutationInfo = {setMutationInfo}
            mutationInfo = {mutationInfo}
            status={status}
            pays={pays}
            ministeres={ministeres}
          />
        )}
      </div>
    </div>
  );
};

export default ResoumissionMutation;
