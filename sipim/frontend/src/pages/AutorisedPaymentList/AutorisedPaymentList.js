import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { useContext, useEffect,useState } from "react";
import Api from "../../services/Api";
import { formatStringNumber, fraisService, montantOperation } from "../../services/Helpers/fonctions";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import moment from "moment";
import 'moment/locale/fr';
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Erreurs from "../../components/Erreurs/Erreurs";
import { Link } from "react-router-dom";
import { UserContext } from "../../services/Context/Context";

const AutorisedPaymentList = () => {
  const[paiementData,setPaiementData] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const [totalPaiement,setTotalPaiement] = useState(0);
  const [isAutorise,setIsAutroise] = useState(false);
  const{privileges} = useContext(UserContext);
  const [autoriser,setAutoriser] = useState(privileges.filter((p) => p.privilege === "Resoumettre").length > 0 ? "Resoumettre":'');
  const [voirDetailrejet,setVoirDetailrejet] = useState(privileges.filter((p) => p.privilege === "Voir Detail Rejet").length > 0 ? "Voir Detail Rejet":'');
  const cache = (autoriser !== "" && typeof autoriser !== 'undefined' )?false:true;
  const api = new Api();
  const columns = [
    {
      field: "reference",
      headerName: "Numero de reference",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "numChassis",
      headerName: "Numero de chassis",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      maxWidth: 120,
    },
    {
      field: "modeImm",
      headerName: "Mode Immatriculation",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "document",
      headerName: "Document",
      flex: 1,
      minWidth: 120,
    },

   
    {
      field: "categorieName",
      headerName: "Categorie Engin",
      flex: 1,
      minWidth: 150,
    },

    {
      field: "montant",
      headerName: "Totaux (FG)",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "created_at",
      headerName: "Date",
      flex: 1,
      minWidth: 100,
    },
    {
        field: "options",
        headerName: "Options",
        sortable: false,
       // hide:cache,
        flex: 1,
        minWidth: 100,
        renderCell: (params) => {
          const id = params.id;
          return (
            <div className="options">
            
              {(params.row.status === "Resoumission" && autoriser)&&  <Link to={`/resubmission/new/${id}`}><button className="activate">Resoumettre</button></Link>}
              {(voirDetailrejet === "Voir Detail Rejet" && typeof voirDetailrejet !== 'undefined') && <button className="primary" onClick={()=> voir(params)}>Voir</button>}
             
            </div>
          );
        },
     }
  ];
const voir = async (data) => {
   setIsLoading(true); let raisonText = '';
    const {status,raisons} = await api.apiData('get',`/paiement/raisonRejet/${data.id}`);
   setIsLoading(false);  
   if(status === 200)
     raisonText = raisons?.motif;
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: <p className="modal-title">Motif de rejet</p>,    
      html: (<p>{raisonText}</p>),
      showCancelButton: true,
      showConfirmButton:false,
      cancelButtonColor: "#e63946",
      cancelButtonText: "Fermez",
      
    }).then(() => {})  
}
const getPaiements = async () => {
  setIsLoading(true);  let i = 0;
   const{status,paiements} = await api.apiData('get','paiement/list/autorises');
   if(status === 200)
     setPaiementData(paiements.map((paiement) => {
      i++;
      let status = "En Attente";
      let modeImma = "Immatriculation";
      if(paiement.status === 1)
         status = "Validé";
      else if(paiement.status === 3)
         status = "Resoumission";  
      else if(paiement.status === 4)
         status = "Resoumis";  

     let montantplaque = 0;
     if(paiement?.type_document === "IT")
        montantplaque = 300000.0;
     else if(paiement?.type_document === "EP")  
        montantplaque = 350000.0;

      if(paiement.modeImm === 2)
         modeImma = "ReImmatriculation"; 
      let commission1 = fraisService(paiement);   
      let montant = parseInt(paiement?.montantcartegrise?paiement.montantcartegrise:0) + parseInt(paiement?.montantautorisation?paiement?.montantautorisation:0)
       + parseInt(paiement?.montantvignette?paiement?.montantvignette:0) + parseInt(montantplaque)+ parseInt(commission1) + montantOperation(paiement);
     
       return {
         id:paiement.paiement_id,
         reference:paiement.reference,
         numChassis:paiement.chassis,
         status:status,
         modeImm:modeImma,
         document:paiement.type_document?paiement.type_document:"Non Fournie",
         categorieName:paiement.nomCategorie,
         montant:formatStringNumber(montant),
         created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
       }
     }));
  setTotalPaiement(i);
  setIsLoading(false);    
}

  useEffect(() => {
    setAutoriser(privileges.filter((p) => p.privilege === "Resoumettre").length > 0 ? "Resoumettre":'');
    setVoirDetailrejet(privileges.filter((p) => p.privilege === "Voir Detail Rejet").length > 0 ? "Voir Detail Rejet":'');
    getPaiements();
  
  },[isAutorise,privileges]);
  return (
    <div className="payment-list page">
      <div className="header">
        <h3>Liste des paiements autorisés</h3>
        <p>{totalPaiement} paiements</p>
      </div>
      <Erreurs validation = {erreurs} /> 
      <div className="array">
        <Box sx={{ height: 579, width: "100%" }}>
          <DataGrid
            sx={{ borderRadius: 0}}
            density="compact"
            components={{ Toolbar: GridToolbar }}
            rows={paiementData}
            columns={columns}
            autoPageSize
            pagination
            disableSelectionOnClick
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </div>
    </div>
  );
};

export default AutorisedPaymentList;