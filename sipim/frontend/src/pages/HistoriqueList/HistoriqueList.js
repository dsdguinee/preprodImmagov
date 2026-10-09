import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { expression, formatStringNumber, isEmpty, objecttoFormData, fraisService, montantOperation } from "../../services/Helpers/fonctions";
import moment from "moment";
import "moment/locale/fr";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { ToWords } from "to-words";
import Api from "../../services/Api";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import { ElementContext, UserContext } from "../../services/Context/Context";
import Erreurs from "../../components/Erreurs/Erreurs";

let nbrePaiement = 0;

const HistoriqueList = () => {
  const api = new Api();
  const [paiementData,setPaiementData] = useState([]);
  const[globalMontant,setGlobalMontant] = useState(0);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const{elementsData} = useContext(ElementContext);
  const {privileges} = useContext(UserContext);
  const [impression,setImpression] = useState(privileges.filter((p) => p.privilege === "Impression").length > 0 ? "Impression":'');
  const [erreurs, setErreurs] = useState([]);
  const [searchData,setSearchData] = useState({
     numRef:'',
     numChassis:'',
     startDate:'',
     endDate:''

  });
  const cache = (impression !== "" && typeof impression !== 'undefined')?false:true;

  const columns = [
    {
      field: "nreference",
      headerName: "Nouvelle Reference",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "oldreference",
      headerName: "Ancien Reference",
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
      field: "document",
      headerName: "Document",
      flex: 1,
      minWidth: 100,
    },
   
    {
      field: "modeImm",
      headerName: "Mode Immatriculation",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "categorieName",
      headerName: "Categorie Engin",
      flex: 1,
      minWidth: 150,
    },
  
    {
      field: "montant",
      headerName: "Montant(FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "user",
      headerName: "Utilisateur",
      flex: 1,
      minWidth: 150,
    },
    
  ];
  const toWords = new ToWords({
    localeCode: "fr-FR",
    converterOptions: {
      currency: false,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
    },
  });

  const location = useLocation();

  useEffect(() => { 
      if(elementsData){
        setIsLoading(true);
          api.apiData('get','/paiement/historique').then((resp) => {
           
            if(resp.status === 200){
              let globalmt = 0;let nbrePaiem = 0;
               setPaiementData(resp.paiements.map((paiement) => {
                 let modeImma = "Immatriculation";
                 if(paiement.modeImma !== 1)
                     modeImma = "ReImmatriculation";
                 const commission1 = fraisService(paiement)
                 const montant  = parseFloat(paiement.montantcartegrise?paiement.montantcartegrise:0) 
                  + parseFloat(paiement.montantvignette?paiement.montantvignette:0)+ parseFloat(paiement.montantautorisation?paiement.montantautorisation:0)
                  + parseFloat(commission1) + montantOperation(paiement);
                  globalmt = montant + globalmt;nbrePaiement = nbrePaiement + 1;
                  
                 return {
                   id:paiement.paiement_id, 
                   nreference:paiement.reference,
                   oldreference:paiement.oldereference,
                   numChassis:paiement.chassis,
                   document:paiement.type_document?paiement.type_document.charAt(0).toUpperCase()+paiement.type_document.slice(1):'',
                   modeImm:modeImma,
                   categorieName:paiement.nomCategorie,
                   montant:formatStringNumber(montant),
                   user:paiement.agent
                 }
               }));
               setGlobalMontant(globalmt)
            } 
           setIsLoading(false);  

    
            
            
          });
        // setIsLoading(false);  

      }

  },[elementsData]);
  
  return (
    <div className="payment-list page">
      <DocumentTitle title="Historique des paiements" />
      <div className="header">
        <h3>Historique des paiements</h3>
        <p>
          {nbrePaiement} paiements |{" "}
          <span>
            <strong>Montant Global : </strong>{" "}
            {toWords.convert(globalMontant) + " Francs Guinéens"} (
            <strong>{formatStringNumber(globalMontant) + " fg"}</strong>)
          </span>
        </p>
      </div>
      
      <Erreurs validation = {erreurs} />
      {/* {paiementData.length > 0 ? ( */}
        <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={paiementData}
              columns={columns}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>
        {/* ) : <p>Aucun paiement dans le tableau.</p>} */}
    </div>
  );
};

export default HistoriqueList;