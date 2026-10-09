import cachet from "../../assets/cachet.png";
import signature from "../../assets/signature.png";
import { useContext, useEffect, useState, useRef } from "react";
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams } from "react-router-dom";
import { getImmatriculationById,is_printed } from "../../services/immatriculation.service";

import { useReactToPrint } from "react-to-print";
import { AiOutlinePrinter } from "react-icons/ai";
import Spinner from "../../components/Spinner/Spinner";
import moment from "moment";
import 'moment/locale/fr';
import { ComboContext, UserContext } from "../../services/Context/Contexts";
import RectoCarte from "../../components/RectoCarte/RectoCarte";
import VersoCarte from "../../components/VersoCarte/VersoCarte";
import Erreurs from "../../components/erreurs/Erreurs";

const DetailsCarteGrise = () => {
  const url = process.env.REACT_APP_URL + '/storage/';
  const { id } = useParams();
  const[immaData,setImmaData] = useState([]);
  const[vehiculeData,setVehiculeData] = useState([]); 
  const [isLoading,setIsLoading] = useState(false);
  const [ministere,setMinistere] = useState();
  const [direction,setDirection] = useState();
  const [typeVehicule,setTypeVehicules] = useState();
  const [marque,setMarque] = useState();
  const [modele,setModeles] = useState();
  const[isPrivilegeImpression,setIsPrivilegeImpression] = useState(false);
  const {ministeres,directions,typeVehicules,marques,modeles} = useContext(ComboContext);
  const {currentUserPrivilege} = useContext(UserContext);
  const [erreurs,setErreurs] = useState([]);
  const navigate = useNavigate();
  // ? Impression
  const rectoRef = useRef();
  const handlePrintRecto = useReactToPrint({
    content: () => rectoRef.current,
  });

  const versoRef = useRef();
  const handlePrintVerso = useReactToPrint({
    content: () => versoRef.current,
  
  });
  // ? Fin impression

  async function getImmatriculationDetails(immatriculationID){
      setIsLoading(true);
        const {status,immatriculation,vehicule} = await getImmatriculationById(immatriculationID);
         //console.log(immatriculation)
        if(status){
          setImmaData(immatriculation);setVehiculeData(vehicule);
          setMinistere(ministeres.filter(m => m.ministere_id == immatriculation.minister_id)[0]?.nom); 
          setDirection(directions.filter((d => d.direction_id == immatriculation.direction_id))[0]?.nom);
          setTypeVehicules(typeVehicules.filter((t => t.type_id == vehicule.typeVehicule))[0]?.nom);
          setMarque(marques.filter((m => m.id == vehicule.marque_id))[0]?.title);
          setModeles(modeles.filter((m => m.id == vehicule.model_id))[0]?.title);
        
        }
    setIsLoading(false) ;
  }
  useEffect(() => {
      getImmatriculationDetails(id);
      const privilege = currentUserPrivilege.filter((p => p.privilege == "Impressions"));
      if(Array.isArray(privilege) && privilege.length > 0)
        setIsPrivilegeImpression(true);
  }, [modeles]);
  const printed = ()=>{
    is_printed(immaData.immatriculation_id).then((resp) => {
      setErreurs([]);
      if(!resp?.status){
        setErreurs(resp?.messages)
      }else  navigate('/cartes-grises');
    });
  
  }
  const validite = moment().add(5, 'years').format('DD-MMMM-YYYY');
  const currentDate = moment().format("DD-MMMM-YYYY");

  return (
    <div className="details-carte-grise page">
      <Helmet>
        <title>Détails de la carte grise</title>
      </Helmet>
      {isLoading && <Spinner />}
      <h2>Détails carte grise</h2>

       <Erreurs validation={erreurs} />

      {/* {(isPrivilegeImpression && immaData.status !== 3) && <button type="button" className="primary" style={{marginTop:'15px'}}>Imprimer</button>} */}
      {(isPrivilegeImpression && immaData.status !== 3) &&
        <div className="print-btns">
          <button onClick={handlePrintRecto} className="primary"> <AiOutlinePrinter/> Imprimer Recto</button>
          <button onClick={handlePrintVerso} className="secondary"  style={{marginLeft:'15px'}}><AiOutlinePrinter/> Imprimer Verso</button>
          <button type="button" className="secondary" onClick={printed}>Terminer</button>
        </div>
      }

      <div className="carte">
        <RectoCarte ref={rectoRef} immaData={immaData} currentDate={currentDate} validite={validite} />
        <VersoCarte ref={versoRef} ministere={ministere} direction={direction} typeVehicule={typeVehicule} marque={marque} modele={modele} vehiculeData={vehiculeData} />
      </div>
    </div>
  );
};

export default DetailsCarteGrise;
