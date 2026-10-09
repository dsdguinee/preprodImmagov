import { useRef, useState, useEffect, useMemo, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import Erreurs from "../../components/Erreurs/Erreurs";

import InvoiceDetails from "../../components/InvoiceDetails/InvoiceDetails";
import Api from "../../services/Api";
import { ElementContext, UserContext } from "../../services/Context/Context";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import {expression, fraisService} from "../../services/Helpers/fonctions";
import RejectionModal from "../../components/RejectionModal/RejectionModal";


const PaymentDetails = () => {
  const componentRef = useRef();
  const navigate = useNavigate();
  const [erreurs, setErreurs] = useState([]);
  const { elementsData } = useContext(ElementContext);
  const {privileges} = useContext(UserContext);
  const [nouveauPrivilege,setNouveauPrivilege] = useState();
  const [annulerPaiement,setAnnulerPaiement] = useState();
  const location = useLocation();
  const { id } = useParams();
  const api = new Api();
  const paiement_id = location?.state?.paiementInfo.paiement_id;
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
 
  const [user,setUser] = useState();
  const [validerPaiement,setValiderPaiement] = useState();
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Reçu de paiement",
    // A4 sans marge : le reçu a ses propres marges intérieures, et sans marge le navigateur
    // n'a plus de place pour son en-tête / pied de page (titre, date, URL, n° de page).
    // On garde les fonds colorés (total, blocs) à l'impression.
    pageStyle: "@page { size: A4 portrait; margin: 0; } html, body { margin: 0; padding: 0; height: auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
  });

  const [paiementDetail, setPaiementDetail] = useState({
    typeClient: "",
    modeExp: "",
    fullName: "",
    tel: "",
    nif: "",
    chassis: "",
    modeImma: "",
    categorieCg: 0,
    typeCg: 0,
    typeVignette: 0,
    pv: 0,
    cu: 0,
    autorisation_id: 0,
    expressionCg: "",
    isNextStep: 1,
  });
  const [paiementInfo, setPaiementInfo] = useState({
    categorie: "",
    commission: 0,
    vignette: "",
    cartegrise: "",
    categorie_id: 0,
    autorisation: "",
    qrcodepath: "",
    reference: "",
    paiement_id: "",
    document:'',
    created_at: "",
  });
  const [elements, setElements] = useState();
  const back = async () => {
    navigate('/payment/new');
    //setErreurs([]);
    // var formData = new FormData();
    // formData.append('paiement_id',paiement_id)
    // const {status,messages,} =  await api.apiData('post','/paiement/printed',formData);
    // if(status === 200)
    //   navigate('/payment/new');
    // else
    //   setErreurs(messages)  

  }
  useEffect(() => {
   // console.log(id)
 
    if(id){
      setIsLoading(true);
        api.apiData('get',`/paiement/getpaiementByID/${id}`).then((resp) => {
          //console.log(resp);
          if(resp.status === 200 && resp.paiement){
              const paiement = resp.paiement;
              //console.log(paiement)
              //  console.log(paiement)
              if(elementsData?.categories && paiement && paiement.length > 0){
                  const _categorie = elementsData.categories.filter(c => c.categorie_id == paiement[0]?.categorie_id);
                  const _vignette  = elementsData.typeVignette.filter(c => c.typevg_id == paiement[0]?.typeVignette);
                  const _cartegrise  = elementsData.typeCarteGrise.filter(c => c.typecg_id == paiement[0]?.typecg_id);
                  const _autorisation = elementsData.autorisations.filter(c => c.autorisation_id == paiement[0]?.autorisation_id);
                  let user = '';
                  if(paiement[0]?.user_id){
                    api.apiData('get',`/user/${paiement[0].user_id}`).then((resp) => {
                        setUser(resp.user[0]);
                  });}
            
              // console.log(_categorie[0].nomCategorie)
                let document = paiement[0]?.type_document ? paiement[0]?.type_document:'Non Fournie';
            //     if(paiement[0].type_document === 'tous')
            //       document = 'Tous';
            //     else if(paiement[0].type_document === 'vignette')  
            //       document = 'Vignette';
            //     else if(paiement[0].type_document === 'autorisation')       
            //       document = 'Autorisation de Transport';
            //     else if(paiement[0].type_document === 'mutation')       
            //       document = 'Mutation';    
            //     else if(paiement[0].type_document === 'cartegrise')       
            //       document = 'Carte Grise';     
            //     else if(paiement[0].type_document === 'duplicata')       
            //      document = 'Duplicata';       
            //   else if(paiement[0].type_document === 'changementmodeexp')       
            //      document = 'Changement Mode Exploitation';
            //   else if(paiement[0].type_document === "IT")   
            //      document = "IT";
            //   else if(paiement[0].type_document === "EP")   
            //      document = "EP";   
            //  else if(paiement[0].type_document.toLowerCase() === "ordinaire")   
            //      document = "Ordinaire";    

                setPaiementInfo({...paiementInfo,
                  categorie_id:paiement[0].categorie_id,
                  commission:fraisService(paiement[0]),
                  montant_operation:paiement[0].montant_operation,
                  vignette:paiement[0].typeVignette?paiement[0].typeVignette:'',
                  cartegrise:paiement[0]?paiement[0].typecg_id:'',
                  autorisation:paiement[0].autorisation_id,
                  qrcodepath:paiement[0].qrcode,
                  reference:paiement[0].reference,
                  paiement_id:paiement[0].paiement_id,
                  categorie:_categorie[0].nomCategorie,
                  nomCategorie:_categorie[0].nomCategorie,
                  vignette:_vignette[0]?_vignette[0]:'',cartegrise:_cartegrise[0]?_cartegrise[0]:'',
                  autorisation:_autorisation?_autorisation[0]:[],
                  expressionCg:_cartegrise[0] ? expression(_cartegrise[0]).expression:'',
                  document:document,
                  commune_id:paiement[0].commune_id,
                  agence_id:paiement[0].agence_id,
                  created_at:paiement[0].created_at,
                  user_id:paiement[0].user_id,
                  agent:user ? `${user.prenom} ${user.nom}` : '',
                  status:paiement[0].status,
                  paiement_id:paiement[0].paiement_id,
                  type_paiement:paiement[0].type_paiement,
                  type_document : paiement[0].type_document,
                  type_plaque:paiement[0].type_plaque,
                  dateExpVg:paiement[0].dateExpVg,
                  dateExpCg:paiement[0].dateExpCg,
                  dateExpAu:paiement[0].dateExpAu,
                });
                setPaiementDetail({...paiementDetail,
                  typeClient:paiement[0].typeClient,
                  modeExp:paiement[0].modeExp,
                  fullName:paiement[0].fullName,
                  tel:paiement[0].tel,
                  nif:paiement[0].nif,
                  chassis:paiement[0].chassis,
                  modeImma:paiement[0].modeImma,
                  categorieCg:paiement[0].categorie_id,
                  typeCg:paiement[0].typecg_id,
                  typeVignette:paiement[0].typeVignette,
                  pv:paiement[0].pv,
                  cu:paiement[0].cu,
                  autorisation_id:paiement[0].autorisation_id,
                
                });

            }
          }
          setIsLoading(false);  
        });

        setNouveauPrivilege(); setAnnulerPaiement();setValiderPaiement();
        if(privileges){
          privileges.forEach((privilege) => {
            if(privilege.privilege === "Nouveau Paiement"){
              setNouveauPrivilege(privilege.privilege);
            }else if(privilege.privilege === "Annuler Paiement"){
              setAnnulerPaiement(privilege.privilege);
            }else if(privilege.privilege === "Valider"){
              setValiderPaiement(privilege.privilege);
            }
          })
        }

    }
  }, [elementsData]);
  
  useMemo(() => {
    setElements({...elements,paiementInfo:paiementInfo,paiementDetail:paiementDetail,user:user});
  },[paiementInfo,paiementDetail,user]);
  // console.log(paiementInfo);
  const handleAnnuler =  () => {
      setErreurs([]);
      setIsRejectionModalOpen(true);
      // setIsLoading(true);
      //   const {status,messages} = await api.apiData('get',`/paiement/status/${paiementInfo.paiement_id}&type=Annuler`);
      // setIsLoading(false);
      // if(status === 200)
      //   navigate('/payment/list');
      // else
      //   setErreurs(messages)  

  }
  const handleValider = async () => {
   setErreurs([]);setIsLoading(true);
    const {status,messages} = await api.apiData('get',`/paiement/status/${paiementInfo.paiement_id}&type=Valider`);
    setIsLoading(false);
    if(status === 200)
      navigate('/payment/list');
    else
      setErreurs(messages)  
  }
  return  (
    <div className="payment-invoice page">
       <DocumentTitle title="Details de paiement" />
       <div className="buttons-group space-between">
       <RejectionModal
          isOpen={isRejectionModalOpen}
          setIsOpen={setIsRejectionModalOpen} id={id}
        />
        <div className="left">
          <button className="print-btn"  onClick={handlePrint}>
              Imprimer
          </button>
          {/* {(typeof nouveauPrivilege !== 'undefined' && nouveauPrivilege === "Nouveau Paiement") &&
          <button className="primary new-payment-btn" onClick={back} style={{marginRight:'12px'}}>
              Nouveau Paiement
          </button>
          } */}
           {(validerPaiement === "Valider" && paiementInfo.status === 0) &&
             <button className="primary new-payment-btn" onClick={handleValider}>
               Valider
             </button>
           }
       
         
        </div>
        {(typeof annulerPaiement !== 'undefined' && annulerPaiement === "Annuler Paiement" && paiementInfo.status === 0) &&
          <div className="right">
            <button className="delete cancel-btn"  onClick={handleAnnuler}>Annuler paiement</button>
          </div>
         }
       </div>
          {location?.state?.paiementInfo &&(
            <div className="input-group">
                <div>
                  <Erreurs validation={erreurs} />
                </div>
            </div>)}

      {id !== undefined &&(
        <InvoiceDetails ref={componentRef} elements={elements}/>
      )}
    </div>
  );
};

export default PaymentDetails;
