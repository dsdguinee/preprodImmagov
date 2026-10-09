import { useState, useMemo, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import StepFour from "../../components/ResoumissionReforme/StepFour";
import StepOne from "../../components/ResoumissionReforme/StepOne";
import StepThree from "../../components/ResoumissionReforme/StepThree";
import StepTwo from "../../components/ResoumissionReforme/StepTwo";
import { ComboContext } from "../../services/Context/Contexts";
import { getImmatriculationById,getReformeByID,ImmatriculationRejeter } from "../../services/immatriculation.service";
import { getPaysByID } from "../../utils/helper/functions";
import Spinner from "../../components/Spinner/Spinner";
import moment from "moment";
import "moment/locale/fr";
import { Helmet } from 'react-helmet-async'
import ResoumissionReformeSipim from "./ResoumissionReformeSipim";

const ResoumissionReforme = () => {
  moment.locale("fr");
  const [step, setStep] = useState(1);
  const [vehiculeInfo, setVehiculeInfo] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();

  const [immatriculationInfo, setImmatriculationInfo] = useState();
  const [stepChk, setStepChk] = useState({step1:false,step2:false,step3:false,step4:false});
 
  const [reformeInfo,setReformeInfo] = useState({});
  const [raisonRejet,setRaisonRejet] = useState()
  const [proprietaireInfo, setProprietaireInfo] = useState({
   
  });

  useMemo(() => {
    setIsLoading(true);
    setProprietaireInfo({...proprietaireInfo,
       reforme_id:reformeInfo.reforme_id,
       nom:reformeInfo.nomProprietaire,
       prenom:reformeInfo.PrenomProprietaire,
       date_naissance:reformeInfo.date_naissance,
       fonction:reformeInfo.fonction,
       ministere:reformeInfo.NouveauMinistere_id,
       direction:reformeInfo.nouvelleDirection_id?reformeInfo.nouvelleDirection_id:0,
       piece: reformeInfo.piece,
       paiement:reformeInfo.paiement,
    }); 
    const pays = getPaysByID(reformeInfo.provenance);
    ImmatriculationRejeter(reformeInfo.immatriculation_id).then((resp) => {
      if(resp !== undefined) {
        if(resp.raison == null)
            setRaisonRejet(resp.autreraison);
          else setRaisonRejet(resp.raison);  
        }
     })   
    var status = 'Rejété';
    if(reformeInfo.statusReforme === 0)
      status="En Attente";
    else if(reformeInfo.statusReforme === 1)  
       status="Validé";
    else if(reformeInfo.statusReforme === 2)
       status="Rejété";  
  
    setImmatriculationInfo({...immatriculationInfo,
       immatriculation_id:reformeInfo.immatriculation_id,
       modeImmatriculation:reformeInfo.modeImmatriculation,
       nouveauMinistere_id:reformeInfo.NouveauMinistere_id,
       NouveauMinistere:reformeInfo.NouveauMinistere,
       immatriculation_number:reformeInfo.immatriculation_number,
       ancienMinistere:reformeInfo.ancienMinistere,
       statusReforme:status,
       pays:pays,
       genre:reformeInfo.genre,
       typeVehicule:reformeInfo.typeVehicule,
       marque:reformeInfo.marque,
       model:reformeInfo.model,
       madeYear:reformeInfo.madeYear,
       carosserie:reformeInfo.carosserie,
       energy:reformeInfo.energy,
       numChassie:reformeInfo.numChassie,
       nbPorte:reformeInfo.nbPorte,
       placeNumberAssis:reformeInfo.placeNumberAssis,
       placeNumberDebout:reformeInfo.placeNumberDebout,
       releaseYear:reformeInfo?.releaseYear
       ? moment(vehiculeInfo?.releaseYear).format("DD-MMMM-YYYY")
       : "Non Fournie",
       ancienImmatriculation:reformeInfo.ancienImmatriculation,
       kilometrage:reformeInfo.kilometrage,
       cylinderNumber:reformeInfo.cylinderNumber,
       valeurResiduelle:reformeInfo.valeurResiduelle,
       pieceJointe:reformeInfo.pieceJointe,
       raisonRejet:raisonRejet,
       acquisition:reformeInfo.acquisition,
       pa:reformeInfo.pa,

    });
    setStepChk({...stepChk,step2:true})
    
    setIsLoading(false);
  }, [reformeInfo]);

  useEffect(() => {
    getDetails(id);
    
  }, [id]);

  const getDetails = async (currentID) => {
    const { immatriculation, vehicule } = await getImmatriculationById(currentID);
    const {reformes} = await getReformeByID(currentID);
    if(Array.isArray(reformes))
        setReformeInfo(reformes[0]);
  };

  const handleNextStep = () => {
    setStep(step + 1);
    //console.log(proprietaireInfo);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Réforme déclarée depuis un paiement SIPIM : reprise dans le parcours de la nouvelle immatriculation
  if (reformeInfo?.paiementReference)
    return <ResoumissionReformeSipim reforme={reformeInfo} />;

  return (
    <div className="reforme-page page">
      <Helmet>
        <title>Resoumission de reforme</title>
      </Helmet>
      <h2>Resoumission de reforme</h2>
      {isLoading && <Spinner />}
      <div className="stepper">
        <div
          className={`step ${step === 1 && "step-active"}`}
          onClick={() => setStep(1)}
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
          onClick={() => stepChk.step2 && setStep(2)}
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
          onClick={() =>stepChk.step3 && setStep(3)}
        >
          <div className="step-number">
            <span>3</span>
          </div>
          <div className="step-label">
            <p>Joindre les fichiers</p>
          </div>
        </div>
        <div
          className={`step ${step === 4 && "step-active"}`}
          onClick={() => stepChk.step4 && setStep(4)}
        >
          <div className="step-number">
            <span>4</span>
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
            immatriculationInfo={immatriculationInfo}
            setImmatriculationInfo={setImmatriculationInfo}          
            raisonRejet ={raisonRejet}
          />
        )}
        {step === 2 && (
          <StepTwo
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            setProprietaireInfo={setProprietaireInfo}
            proprietaireInfo={proprietaireInfo}
            setImmatriculationInfo={setImmatriculationInfo}
            immatriculationInfo={immatriculationInfo}
            stepChk ={stepChk}
            setStepChk = {setStepChk}
          />
        )}
        {step === 3 && (
          <StepThree
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            setProprietaireInfo={setProprietaireInfo}
            proprietaireInfo={proprietaireInfo}
            stepChk ={stepChk}
            setStepChk = {setStepChk}
          />
        )}
        {step === 4 && (
          <StepFour
            handlePrevStep={handlePrevStep}
            setProprietaireInfo={setProprietaireInfo}
            proprietaireInfo={proprietaireInfo}
            vehiculeInfo={vehiculeInfo}
            immatriculationInfo={immatriculationInfo}
            setStep={setStep}
            
          />
        )}
      </div>
    </div>
  );
};

export default ResoumissionReforme;
