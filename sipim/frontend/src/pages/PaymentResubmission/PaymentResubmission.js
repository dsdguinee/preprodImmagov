import { useContext, useState,useEffect,useRef } from "react";
import { paymentSteps } from "../../utils/texts";
import Stepper from "../../components/Stepper/Stepper";
import StepOne from "../../components/PaymentSteps/StepOne";
import StepTwo from "../../components/PaymentSteps/StepTwo";
import StepThree from "../../components/PaymentSteps/StepThree";
import { useParams } from "react-router-dom";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Erreurs from "../../components/Erreurs/Erreurs";
import moment from "moment/moment";
import { ElementContext } from "../../services/Context/Context";
import { expression } from "../../services/Helpers/fonctions";



const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => {htmlElRef.current &&  htmlElRef.current.focus()}
  return [ htmlElRef, setFocus ] 
}
const PaymentResubmission = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const {id} = useParams();
  const { elementsData } = useContext(ElementContext);
  const [custumErr,setCustumErr] = useState('');
  const [inputRef, setInputFocus] = useFocus();
  const [isFound,setIsFound] = useState();
  const api = new Api();
  const [paiement,setPaiement] = useState({
    typeClient:'',
    modeExp:'',
    fullName: '',
    tel:'',
    nif:'',
    chassis:'',
    modeImma:'',
    categorieCg:0,
    typeCg:0, 
    typeVignette:0,
    pv: 0,
    cu: 0,
    pf:0,
    ptra:0,
    autorisation_id:0,
    expressionCg:'',
    isNextStep:1,
    isIT:false,
    isEP:false,
    isResoumission:false,
    paiement_id:'',
    dateExpCg:'',
  });
  const [paiementInfo,setPaiementInfo] = useState({
    categorie:'',
    commission:0,
    vignette:'',
    cartegrise:'',
    categorie_id:0,
    autorisation:'',
    qrcodepath:'',
    reference:'',
    paiement_id:'',
    document:'',
    raisonRaison:''

  });
  const CtrInputPuissance = (cartegrise_id,cartegorie_id) => {
    const cartegrise = elementsData.typeCarteGrise.filter((c) => parseInt(c.typecg_id) === parseInt(cartegrise_id));
    let expressionErrer = '';//expression de l'erreur
    if(cartegrise.length > 0 && parseInt(cartegorie_id) !== 4){
     const signearray = cartegrise[0].signe.split(",");
     const capacitearray  =  cartegrise[0].capacite.split(",");
     if(signearray.length === 1){
  
        switch(signearray[0]){
         case '<': 
                 if(capacitearray.length === 1){
                    const comparaison = parseInt(paiement.pf) < parseInt(capacitearray[0]);
                    if(!comparaison){
                      expressionErrer = "La valeur de la puissance fiscale doit être inférieur à "+capacitearray[0]+ " " +cartegrise[0].unite;;
                      setInputFocus();
                     }
                  }
                  break;
                    
         case '>':
                 if(capacitearray.length === 1){
                   const comparaison = parseInt(paiement.pf) > parseInt(capacitearray[0]);
                   if(!comparaison){
                     expressionErrer = "La valeur de la puissance fiscale doit être supérieur à "+capacitearray[0]+ " " +cartegrise[0].unite;;
                     setInputFocus();
                   }
                 }
                 break; 
        
         case '<=': 
         
                 if(capacitearray.length === 1){
                     const comparaison = parseInt(paiement.pf) <= parseInt(capacitearray[0]);
                     if(!comparaison){
                       expressionErrer = "La valeur de la puissance fiscale doit être inférieur ou égale à "+capacitearray[0] + " " +cartegrise[0].unite;
                       setInputFocus();
                     }
                   }
                 break; 
         case '>=': 
                 if(capacitearray.length === 1){
                     const comparaison = parseInt(paiement.pf) >= parseInt(capacitearray[0]);
                     if(!comparaison){
                       expressionErrer = "La valeur de la puissance fiscale doit être inférieur ou égale à "+ capacitearray[0]+ " " +cartegrise[0].unite;;
                       setInputFocus();
                     }
                   }
                 break;                         
                     
        }
     }
     else if(signearray.length > 1){
       switch(cartegrise[0].signe){
         case '>,<=': 
               
                if(capacitearray.length > 1){
                 
                   const comparaison = parseInt(paiement.pf) > parseInt(capacitearray[0]) && parseInt(paiement.pf) <= parseInt(capacitearray[1]);
                  
                   if(!comparaison){
                     expressionErrer = "La valeur de la puissance fiscale doit être supérieur à "+capacitearray[0]+ " et inférieur ou égale à "+ capacitearray[1] + " " +cartegrise[0].unite;
                     setInputFocus();
                   }
                 }
                 break;
                   
        case '>=,<':
             if(capacitearray.length > 1){
               const comparaison = parseInt(paiement.pf) >= parseInt(capacitearray[0]) && parseInt(paiement.pf) < parseInt(capacitearray[1]);
               if(!comparaison){
                 expressionErrer = "La valeur de la puissance fiscale doit être supérieur ou égale à "+capacitearray[0]+ " et inférieur à "+ capacitearray[1] + " " +cartegrise[0].unite;
                 setInputFocus();
               }
             }
             break;                     
                    
       }
     }
    }
    return expressionErrer; 
  }
 
  useEffect(() => {
    const getPaiement = async (id) => {
      if(elementsData?.typeCarteGrise){ 
          setIsLoading(true);
            const {status,paiement1,messages} = await api.apiData('get',`/paiement/resoumission/${id}`);
  
          setIsLoading(false);
            if(status === 200){
            if(paiement1.length > 0){  
              setIsFound(true);
             const pay = paiement1[0];
            let usage = "Transport";
            if(pay?.modeExp === "Usage Personnel" || pay?.modeExp === "Personnel")
                usage = "Personnel";
              let cartegrse = [];   
              if(elementsData?.typeCarteGrise && pay?.typeCg)  
                cartegrse = elementsData.typeCarteGrise.filter((f) => f.typecg_id === parseInt(pay?.typeCg)); 
              //console.log(cartegrse)   
              setPaiement({...paiement,typeClient:pay?.typeClient,fullName:pay?.fullName,tel:pay?.tel,
                nif:pay?.nif,chassis:pay?.chassis,modeExp:usage,modeImma:pay?.modeImma,categorieCg:pay?.categorie_id,
                typeCg:pay?.typeCg,typeVignette:pay?.typeVignette?pay?.typeVignette:0,autorisation_id:pay?.autorisation_id?pay?.autorisation_id:0,
                isIT:pay?.type_document === "IT"?true:false,
                isEP:pay?.type_document === "EP"?true:false,
                document:pay?.type_document === "IT" || pay?.type_document === "EP"?pay?.type_document:'ordinaire',
                isResoumission:true,
                expressionCg :cartegrse.length > 0 ? expression(cartegrse[0])?.expression:'',paiement_id:pay?.paiement_id,
                pv:pay.pv,
                cu:pay.cu,
                pf:pay.pf,
                ptra:pay.ptra,
                dateExpCg:pay.dateExpCg?moment(pay.dateExpCg).format('YYYY-MM-DD'):''
              });
            setPaiementInfo({paiementInfo,categorie_id:pay?.categorie_id,autorisation:pay?.autorisation_id,
              qrcode:pay?.qrcode,paiement_id:pay?.paiement_id,
            });
            
            }
            else
             setIsFound(false);
            
           }
          else
          setErreurs(messages)  
      }
    }
    getPaiement(id);
  },[elementsData?.typeCarteGrise]);
 // console.log(paiement)
  // useMemo(() => {

  //   if(cartegrise.length > 0)
  //    setPaiement({...paiement,expressionCg:expression(cartegrise[0])?.expression});
  // },[cartegrise])
 // console.log(paiement.modeExp)
  const nextStep = () => {
    setCustumErr('');
    //console.log(paiement)
   if(paiement.isNextStep === 1){
      if(parseInt(paiement.typeCg) === 0 && parseInt(paiement.typeVignette) === 0 && parseInt(paiement.autorisation_id) === 0){
        setCustumErr("Vous n'avez choisi aucun type de paiement.");return;
      }
     if(paiement.dateExpCg === '' && paiement.isIT){
        setCustumErr("La date d'expiration est obligatoire.");return;
     }else if(moment().diff(paiement.dateExpCg,'days') > 0){
        setCustumErr("La date d'expiration ne peut pas être inférieur à celle d'aujourd'hui.");return;
     }
     const expressionErreur = CtrInputPuissance(paiement.typeCg,paiement.categorieCg);
     if(paiement.pf === 0){
      setCustumErr("Veuillez fournir la puissance fiscale.");return;
     }
     else if(expressionErreur !== '' && paiement.categorieCg !== 4){
        setCustumErr(expressionErreur);return;
     } 
     setActiveStep(activeStep + 1);
       if(paiement.isIT)
          setPaiementInfo({...paiementInfo,document:"IT"});
       else if(paiement.isEP)    
          setPaiementInfo({...paiementInfo,document:"EP"});
       else if(!paiement.isIT)  
           setPaiementInfo({...paiementInfo,document:"Ordinaire"}); 
    }
   
   }

  const prevStep = () => {
    setActiveStep(activeStep - 1)
  }
  
  return (
    <div className="payment page">
      {isFound === true ?
        <>
          <div className="header">
          <h3>Resoumission paiement d'immatriculation</h3>
          <p>Suivez les trois étapes suivantes pour resoumettre votre paiement.</p>
        </div>
        <Erreurs validation = {erreurs} /> 
        <div className="payment-zone">
      
          <div className="payment-steps">
            <Stepper steps={paymentSteps} activeStep={activeStep} />
          </div>
          <div className="payment-form">
            {activeStep === 1 && <StepOne nextStep={nextStep} prevStep={prevStep} 
              paiement={paiement} setPaiement={setPaiement}
              setCustumErr={setCustumErr}
              custumErr={custumErr}
              inputRef={inputRef}
            />}
            {activeStep === 2 && <StepTwo nextStep={nextStep} prevStep={prevStep} 
              paiement={paiement}
              setPaiement={setPaiement}
              setPaiementInfo={setPaiementInfo}
              paiementInfo={paiementInfo}
              setActiveStep={setActiveStep}
              activeStep={activeStep}
            />}
            {activeStep === 3 && <StepThree nextStep={nextStep} 
              prevStep={prevStep} 
              paiement={paiement}
              paiementInfo={paiementInfo}
            />}
          </div>
        </div>
        </>
        :<div><h2>Pas de Page Correspondate: 404!</h2></div>
      }
    </div>
  );
};

export default PaymentResubmission;