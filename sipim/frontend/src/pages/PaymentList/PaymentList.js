import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { expression, formatStringNumber, isEmpty, montantPlaque, objecttoFormData, fraisService, montantOperation, libelleOperation } from "../../services/Helpers/fonctions";
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

// Référence déjà utilisée pour une immatriculation (paiements.utilise)
const statutUtilisation = (paiement) =>
  Number(paiement.utilise) === 1
    ? `Utilisée${paiement.date_utilisation ? " le " + moment(paiement.date_utilisation).format("DD/MM/YYYY") : ""}`
    : "Non utilisée";

const PaymentList = () => {
  const api = new Api();
  const [paiementData,setPaiementData] = useState([]);
  const[globalMontant,setGlobalMontant] = useState(0);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const {privileges} = useContext(UserContext);
  const{elementsData} = useContext(ElementContext);
  const [erreurs, setErreurs] = useState([]);
  const [checkboxSelection,setCheckboxSelection] = useState(false);
  const [searchData,setSearchData] = useState({
     numRef:'',
     numChassis:'',
     startDate:'',
     endDate:''

  });
  const [cache,setCache] = useState(true);


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
      minWidth: 120,
    },
    {
      field: "modeExp",
      headerName: "Mode d'exploitation",
      flex: 1,
      minWidth: 150,
    },

    {
      field: "document",
      headerName: "Document",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "type_plaque",
      headerName: "Plaque",
      flex: 1,
      minWidth: 80,
    },
    {
      field: "typeClient",
      headerName: "Type Client",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "fullName",
      headerName: "Client",
      flex: 1,
      minWidth: 150,
    },
   
    // {
    //   field: "fullName",
    //   headerName: "Client",
    //   description: "Le Nom du CLient.",
    //   sortable: false,
    //   flex: 1,
    //   minWidth: 150,
    //   valueGetter: (params) =>
    //     `${params.row.firstName || ""} ${params.row.lastName || ""}`,
    // },
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
      field: "expressionCg",
      headerName: "Nom Carte Grise",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "cartgriseMontant",
      headerName: "Montant C.Grise(FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "expressionVg",
      headerName: "Nom Vignette",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "numVignette",
      headerName: "Num. Vignette",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "codev",
      headerName: "C.Vignette",
      flex: 1,
      minWidth: 80,
    },
    {
      field: "vignetteMontant",
      headerName: "Montant Vignette(FG)",
      flex: 1,
      minWidth: 150,
    },
    ,
    {
      field: "typeAutorisation",
      headerName: "Nom Auto. Transport",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "montantAutorisation",
      headerName: "Montant Auto. Transport(FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "immatriculation",
      headerName: "Immatriculation",
      flex: 1,
      minWidth: 170,
    },
    {
      field: "montantPlaque",
      headerName: "Montant Plaque(FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "commission",
      headerName: "Commission(FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "sumMontant",
      headerName: "Totaux (FG)",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "region",
      headerName: "Region",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "banque",
      headerName: "Banque",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "created_at",
      headerName: "Date",
      flex: 1,
      minWidth: 150,
    },
      {
        field: "options",
        headerName: "Options",
        sortable: false,
        hide:cache,
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const id = params.id;
          return (
            <div className="options">
              <Link to={`/payment/invoice/${id}`}>
                <button>Voir facture</button>
              </Link>
            </div>
          );
        },
     }
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
        const impression = privileges.filter((p) => p.privilege === "Impression").length > 0 ? "Impression":''
        setCache((impression !== "" && typeof impression !== 'undefined')?false:true);
        setIsLoading(true);
          api.apiData('get','/paiement/getPaiements').then((resp) => {
            nbrePaiement = 0;
           
            if(resp.status === 200){
              setIsLoading(false);  
              let commission1 = 0;let globalsom = 0;setPaiementData([]);
              // console.log(resp);
              if( isEmpty(location.state) ){
                setPaiementData(resp.paiements.map((paiement) => {
                  commission1 = fraisService(paiement)
                  let montautorisation = 0;let modeImm = "Immatriculation";
                  let montantplaque = montantPlaque(paiement);

                  if(paiement.montantautorisation != null)
                      montautorisation = paiement.montantautorisation;
                      let sumMontant = parseFloat(paiement.montantcartegrise !== null ?paiement.montantcartegrise:0) + parseFloat(paiement.montantvignette !== null?paiement.montantvignette :0) 
                      + parseFloat(montautorisation) + parseFloat(montantplaque)+ parseFloat(commission1) + montantOperation(paiement);
                  let categorieName = elementsData.categories.filter((c) => c.categorie_id === parseInt(paiement.categorie_id));
                  let cartgriseMontant = [] ;
                  if(paiement.typecg_id){
                    cartgriseMontant = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(paiement.typecg_id))
                  }
              
                  let vignetteMontant = 0;
                  let codeVignette = '';
                  if(paiement.typevg_id){
                    vignetteMontant = elementsData.typeVignette.filter((c) => c.typevg_id === parseInt(paiement.typevg_id));
                    codeVignette = vignetteMontant[0].code;
                  }   
                  if(paiement.modeImma != 1)
                    modeImm = "RéImmatriculation";
                  if(paiement.status === 1) {
                    globalsom = sumMontant + parseFloat(globalsom);
                    nbrePaiement = nbrePaiement + 1;
                  }
                  let typeAutorisation = [];
                  if(paiement.autorisation_id){
                    typeAutorisation = elementsData.autorisations.filter((c) => c.autorisation_id === parseInt(paiement.autorisation_id))
                  }
                 
                  let document = paiement.type_document? paiement.type_document:"NON Fournie" 

                    let status = "En attente";
                    if(paiement.status === 1)
                      status = "Validé";
                    else if(paiement.status === 2)  
                       status = "Réjété";
                    else if(paiement.status === 3)  
                       status = "Resoumission";    
                    else if(paiement.status === 4)  
                       status = "Resoumis";  
                  
                  return {
                    id:paiement.paiement_id,
                    typeClient:paiement.typeClient,
                    modeExp:paiement.modeExp,
                    fullName:paiement.fullName,
                    reference:paiement.reference,
                    document:document,
                    modeImm:libelleOperation(paiement, modeImm),
                    created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
                    categorieName:(Array.isArray(categorieName) && categorieName.length > 0 ? categorieName[0]?.nomCategorie:''),
                    cartgriseMontant:(Array.isArray(cartgriseMontant) && cartgriseMontant.length > 0 ? cartgriseMontant[0]?.montant:0),
                    expressionCg:(Array.isArray(cartgriseMontant) &&  cartgriseMontant.length > 0)? expression(cartgriseMontant[0]).expression:'Non Fournie',
                    vignetteMontant:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.montant:0),
                    expressionVg:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.nomType:'Non Fournie'),
                    typeAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.nomAutorisation:"Non Fournie"),
                    montantAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.montant:"0"),
                    sumMontant:sumMontant,
                    numChassis:paiement.chassis,
                    commission:commission1,
                    status:status,
                    numVignette:paiement.vignette_code? paiement.vignette_code:"Non Fournie",
                    region:paiement.regionName,
                    codev:codeVignette?codeVignette:'Non Fournie',
                    banque:paiement.agence,
                    fullName:paiement.fullName,
                    type_plaque:paiement.type_plaque,
                    montantPlaque:montantPlaque(paiement),
                    immatriculation:statutUtilisation(paiement)

                  }
                }));
              }else{
                  const status = location.state.filter_id;setPaiementData([]);
                  //  console.log(status);
                  if(status == 1){
                      setPaiementData(resp.paiements.filter((p) => p.status === 1).map((paiement) => {
                      
                        commission1 = fraisService(paiement);
                        let montantplaque = montantPlaque(paiement);
                
                        let montautorisation = 0;let modeImm = "Immatriculation";
                
                        if(paiement.montantautorisation !== null)
                            montautorisation = paiement.montantautorisation;
                            let sumMontant = parseFloat(paiement.montantcartegrise !== null ?paiement.montantcartegrise:0) + parseFloat(paiement.montantvignette !== null?paiement.montantvignette :0) + parseFloat(montantplaque)+parseFloat(montautorisation) + parseFloat(commission1) + montantOperation(paiement);
                        if(paiement.modeImma != 1)
                          modeImm = "RéImmatriculation";
                          let cartgriseMontant = [];
                          let categorieName = elementsData.categories.filter((c) => c.categorie_id === parseInt(paiement.categorie_id));
                          if(paiement.typecg_id){
                            cartgriseMontant = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(paiement.typecg_id))
                          } 
                        globalsom = sumMontant + parseFloat(globalsom);
                        nbrePaiement = nbrePaiement + 1;
                        let vignetteMontant = 0;
                        let codeVignette = '';
                        if(paiement.typevg_id){
                          vignetteMontant = elementsData.typeVignette.filter((c) => c.typevg_id === parseInt(paiement.typevg_id));
                          codeVignette = vignetteMontant[0].code;
                        } 
                        let typeAutorisation = [];
                        if(paiement.autorisation_id){
                          typeAutorisation = elementsData.autorisations.filter((c) => c.autorisation_id === parseInt(paiement.autorisation_id))
                        }
                        let document = paiement.type_document 

                        let status = "En attente";
                        if(paiement.status === 1)
                          status = "Validé";
                        else if(paiement.status === 2)  
                           status = "Réjété";
                        else if(paiement.status === 3)  
                           status = "Resoumission";    
                        else if(paiement.status === 4)  
                           status = "Resoumis";  

                        return {
                          id:paiement.paiement_id,
                          typeClient:paiement.typeClient,
                          modeExp:paiement.modeExp,
                          fullName:paiement.fullName,
                          reference:paiement.reference,
                          document:document,
                          modeImm:libelleOperation(paiement, modeImm),
                          created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
                          categorieName:(Array.isArray(categorieName) && categorieName.length > 0 ? categorieName[0]?.nomCategorie:''),
                          commission:commission1,
                          cartgriseMontant:(Array.isArray(cartgriseMontant) && cartgriseMontant.length > 0 ? cartgriseMontant[0]?.montant:0),
                          expressionCg:(Array.isArray(cartgriseMontant) &&  cartgriseMontant.length > 0) ? expression(cartgriseMontant[0]).expression:'Non Fournie',
                          vignetteMontant:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.montant:0),
                          expressionVg:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.nomType:'Non Fournie'),
                          typeAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.nomAutorisation:"Non Fournie"),
                          montantAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.montant:"0"),
                          sumMontant:sumMontant,
                          numChassis:paiement.chassis,
                          status:status,
                          numVignette:paiement.vignette_code? paiement.vignette_code:"Non Fournie",
                          region:paiement.regionName,
                          codev:codeVignette?codeVignette:'Non Fournie',
                          banque:paiement.agence,
                          type_plaque:paiement.type_plaque,
                    montantPlaque:montantPlaque(paiement),
                    immatriculation:statutUtilisation(paiement)
                          
                        }
                      }));
                  }
                  else if(status == 2){
                   
                    setPaiementData(resp.paiements.filter(p => p.typeClient === "Particulier" && p.status === 1).map((paiement) => {
                      commission1 = fraisService(paiement)
                      let montantplaque = montantPlaque(paiement);
                      let montautorisation = 0;let modeImm = "Immatriculation";
                      
                      if(paiement.montantautorisation != null)
                          montautorisation = paiement.montantautorisation;
                          let sumMontant = parseFloat(paiement.montantcartegrise !== null ?paiement.montantcartegrise:0) +parseFloat(montantplaque)+ parseFloat(paiement.montantvignette !== null?paiement.montantvignette :0) + parseFloat(montautorisation) + parseFloat(commission1) + montantOperation(paiement);
                      if(paiement.modeImma != 1)
                        modeImm = "RéImmatriculation";
                      globalsom = sumMontant + parseFloat(globalsom);
                      let cartgriseMontant = [];
                      let categorieName = elementsData.categories.filter((c) => c.categorie_id === parseInt(paiement.categorie_id));
                      if(paiement.typecg_id){
                        cartgriseMontant = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(paiement.typecg_id))
                      }  
                  
                      nbrePaiement = nbrePaiement + 1;
                      let vignetteMontant = 0;let codeVignette = '';
                      if(paiement.typevg_id){
                        vignetteMontant = elementsData.typeVignette.filter((c) => c.typevg_id === parseInt(paiement.typevg_id));
                        codeVignette = vignetteMontant[0].code;
                      } 
                      let typeAutorisation = 0;
                      if(paiement.autorisation_id){
                        typeAutorisation = elementsData.autorisations.filter((c) => c.autorisation_id === parseInt(paiement.autorisation_id))
                      }
                      let document = paiement.type_document 

                      let status = "En attente";
                      if(paiement.status === 1)
                        status = "Validé";
                      else if(paiement.status === 2)  
                         status = "Réjété";
                      else if(paiement.status === 3)  
                         status = "Resoumission";    
                      else if(paiement.status === 4)  
                         status = "Resoumis";  
                
                      return {
                        id:paiement.paiement_id,
                        typeClient:paiement.typeClient,
                        modeExp:paiement.modeExp,
                        fullName:paiement.fullName,
                        reference:paiement.reference,
                        document:document,
                        modeImm:libelleOperation(paiement, modeImm),
                        created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
                        sumMontant:sumMontant,
                        categorieName:(Array.isArray(categorieName) && categorieName.length > 0 ? categorieName[0]?.nomCategorie:''),
                        cartgriseMontant:(Array.isArray(cartgriseMontant) && cartgriseMontant.length > 0 ? cartgriseMontant[0]?.montant:0),
                        expressionCg:(Array.isArray(cartgriseMontant) &&  cartgriseMontant.length > 0) ? expression(cartgriseMontant[0]).expression:'Non Fournie',
                        vignetteMontant:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.montant:0),
                        expressionVg:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.nomType:'Non Fournie'),
                        typeAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.nomAutorisation:"Non Fournie"),
                        montantAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.montant:"0"),
                        numChassis:paiement.chassis,
                        commission:commission1,
                        status:status,
                        numVignette:paiement.vignette_code? paiement.vignette_code:"Non Fournie",
                        region:paiement.regionName,
                        codev:codeVignette?codeVignette:'Non Fournie',
                        banque:paiement.agence,
                        type_plaque:paiement.type_plaque,
                    montantPlaque:montantPlaque(paiement),
                    immatriculation:statutUtilisation(paiement)
                      }
                    }));
                  }else if(status == 3){
                    setPaiementData(resp.paiements.filter(p => p.typeClient === "Société" && p.status === 1).map((paiement) => {
                      commission1 = fraisService(paiement)
                      let montautorisation = 0;let modeImm = "Immatriculation";
                      let montantplaque = montantPlaque(paiement);
                      if(paiement.montantautorisation != null)
                          montautorisation = paiement.montantautorisation;
                          let sumMontant = parseFloat(paiement.montantcartegrise !== null ?paiement.montantcartegrise:0) + parseFloat(montantplaque)+parseFloat(paiement.montantvignette !== null?paiement.montantvignette :0) + parseFloat(montautorisation) + parseFloat(commission1) + montantOperation(paiement);
                      if(paiement.modeImma != 1)
                        modeImm = "RéImmatriculation";
                      globalsom = sumMontant + parseFloat(globalsom);
                      nbrePaiement = nbrePaiement + 1;
                      let cartgriseMontant = [];
                      let categorieName = elementsData.categories.filter((c) => c.categorie_id === parseInt(paiement.categorie_id));
                      let codeVignette = '';
                     
                      if(paiement.typecg_id){
                     
                        cartgriseMontant = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(paiement.typecg_id));
                      
                        // if(typeof cartgriseMontant !== 'undefined')
                        //   codeVignette = vignetteMontant[0]?.code;
                      } 
                      let vignetteMontant = 0;
                      if(paiement.typevg_id){
                        vignetteMontant = elementsData.typeVignette.filter((c) => c.typevg_id === parseInt(paiement.typevg_id))
                      }  
                      let typeAutorisation = 0;
                      if(paiement.autorisation_id){
                        typeAutorisation = elementsData.autorisations.filter((c) => c.autorisation_id === parseInt(paiement.autorisation_id))
                      }
                      let document = paiement.type_document 

                      let status = "En attente";
                      if(paiement.status === 1)
                        status = "Validé";
                      else if(paiement.status === 2)  
                         status = "Réjété";
                      else if(paiement.status === 3)  
                         status = "Resoumission";    
                      else if(paiement.status === 4)  
                         status = "Resoumis";      

                      return {
                        id:paiement.paiement_id,
                        typeClient:paiement.typeClient,
                        modeExp:paiement.modeExp,
                        fullName:paiement.fullName,
                        reference:paiement.reference,
                        modeImm:libelleOperation(paiement, modeImm),
                        document:document,
                        created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
                        categorieName:(Array.isArray(categorieName) && categorieName.length > 0 ? categorieName[0]?.nomCategorie:''),
                        cartgriseMontant:(Array.isArray(cartgriseMontant) && cartgriseMontant.length > 0 ? cartgriseMontant[0]?.montant:0),
                        expressionCg:(Array.isArray(cartgriseMontant) &&  cartgriseMontant.length > 0) ? expression(cartgriseMontant[0]).expression:'Non Fournie',
                        sumMontant:sumMontant,
                        vignetteMontant:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.montant:0),
                        expressionVg:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.nomType:'Non Fournie'),
                        typeAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.nomAutorisation:"Non Fournie"),
                        montantAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.montant:"0"),
                        numChassis:paiement.chassis,
                        commission:commission1,
                        status:status,
                        numVignette:paiement.vignette_code? paiement.vignette_code:"Non Fournie",
                        region:paiement.regionName,
                        codev:codeVignette?codeVignette:'Non Fournie',
                        banque:paiement.agence,
                        type_plaque:paiement.type_plaque,
                    montantPlaque:montantPlaque(paiement),
                    immatriculation:statutUtilisation(paiement)
                      }
                    }));
                  }
              }
              setGlobalMontant(globalsom);

            } else {
         setIsLoading(false);  

            }
            
            
          });
        // setIsLoading(false);  

      }

  },[location.state,privileges]);
  
  const handleInput = (e) => {
    setSearchData({...searchData,[e.target.name]:e.target.value.toUpperCase()});
  }
  const rechercher = async (e) => {
     e.preventDefault();setErreurs([]);
     var formData = objecttoFormData(searchData);
     setIsLoading(true);
       const {status,messages,paiements} = await api.apiData('post','paiement/search',formData);
    // console.log(paiements);
 
        if(status === 200){
          let commission1 = 0;let globalsom = 0;nbrePaiement = 0;
          if(typeof paiements !== 'undefined'){
           setPaiementData(paiements.map((paiement) => {
            commission1 = fraisService(paiement)
            let montautorisation = 0;let modeImm = "Immatriculation";
    
            if(paiement.montantautorisation != null)
                montautorisation = paiement.montantautorisation;
                let sumMontant = parseFloat(paiement.montantcartegrise !== null ?paiement.montantcartegrise:0) + parseFloat(paiement.montantvignette !== null?paiement.montantvignette :0) + parseFloat(montautorisation) + parseFloat(montantPlaque(paiement)) + parseFloat(commission1) + montantOperation(paiement);
            let categorieName = elementsData.categories.filter((c) => c.categorie_id === parseInt(paiement.categorie_id));
            let cartgriseMontant = 0 ;
            if(paiement.typecg_id){
              cartgriseMontant = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(paiement.typecg_id))
            }
            let vignetteMontant = 0;
            if(paiement.typevg_id){
              vignetteMontant = elementsData.typeVignette.filter((c) => c.typevg_id === parseInt(paiement.typevg_id));
              //console.log(vignetteMontant)
            }   
            if(paiement.modeImma != 1)
              modeImm = "RéImmatriculation";
            globalsom = sumMontant + parseFloat(globalsom);
            let typeAutorisation = [];
            if(paiement.autorisation_id){
              typeAutorisation = elementsData.autorisations.filter((c) => c.autorisation_id === parseInt(paiement.autorisation_id))
            }
            nbrePaiement = nbrePaiement + 1;
            let document = paiement.type_document
    
            
            let codeVignette = paiement?.code;
            let status = "En attente";
            if(paiement.status === 1)
              status = "Validé";
            else if(paiement.status === 2)  
               status = "Réjété";
            else if(paiement.status === 3)  
               status = "Resoumission";    
            else if(paiement.status === 4)  
               status = "Resoumis";  
            return {
              id:paiement.paiement_id,
              typeClient:paiement.typeClient,
              modeExp:paiement.modeExp,
              fullName:paiement.fullName,
              reference:paiement.reference,
              modeImm:libelleOperation(paiement, modeImm),
              document:document,
              created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
              categorieName:(Array.isArray(categorieName) && categorieName.length > 0 ? categorieName[0]?.nomCategorie:''),
              cartgriseMontant:(Array.isArray(cartgriseMontant) && cartgriseMontant.length > 0 ? cartgriseMontant[0]?.montant:0),
              expressionCg:(Array.isArray(cartgriseMontant) &&  cartgriseMontant.length > 0) ? expression(cartgriseMontant[0]).expression:'Non Fournie',
              sumMontant:sumMontant,
              vignetteMontant:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.montant:0),
              expressionVg:(Array.isArray(vignetteMontant) && vignetteMontant.length > 0 ? vignetteMontant[0]?.nomType:'Non Fournie'),
              typeAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.nomAutorisation:"Non Fournie"),
              montantAutorisation:(Array.isArray(typeAutorisation) && typeAutorisation.length > 0 ? typeAutorisation[0]?.montant:"0"),
              numChassis:paiement.chassis,
              commission:commission1,
              status:status,
              numVignette:paiement.vignette_code? paiement.vignette_code:"Non Fournie",
              region:paiement.regionName,
              codev:codeVignette?codeVignette:'Non Fournie',
              banque:paiement.agence,
              type_plaque:paiement.type_plaque,
              montantPlaque:montantPlaque(paiement),
                    immatriculation:statutUtilisation(paiement)
            }
            }));
            setGlobalMontant(globalsom);
          }else{
            setErreurs(messages)
          }
        }
    setIsLoading(false);
  }

  
  return (
    <div className="payment-list page">
      <DocumentTitle title="Liste des paiements" />
      <div className="header">
        <h3>Liste des paiements</h3>
        <p>
          {nbrePaiement} paiements validés |{" "}
          <span>
            <strong>Montant Global : </strong>{" "}
            {toWords.convert(globalMontant) + " Francs Guinéens"} (
            <strong>{formatStringNumber(globalMontant) + " fg"}</strong>)
          </span>
        </p>
      </div>
      <div className="filters">
        <form onSubmit={rechercher}>

          <h4>Filtres</h4>
          <div className="input-group">
            <label>
              Numero de référence
              <input type="text"
                   name="numRef" id="numRef" 
                   placeholder="Numéro de référence"
                   value={searchData.numRef}
                   onChange={handleInput}
                   />
            </label>
            <label>
              Numero de chassis
              <input type="text" 
                  name="numChassis" id="numChassis" 
                  placeholder="Numéro de chassis"
                  value={searchData.numChassis}
                  onChange={handleInput}
                  />
            </label>
            <label>
              Date début
              <input type="date" name="startDate" 
                 id="startDate" 
                 placeholder="Date de début"
                 value={searchData.startDate}
                 onChange={handleInput}
                 />
            </label>
            <label>
              Date fin
              <input type="date" name="endDate"
                 id="endDate" 
                 placeholder="Date de fin"
                 value={searchData.endDate}
                 onChange={handleInput}
                 />
            </label>
          </div>
          <Erreurs validation = {erreurs} />
          <button type="submit">Rechercher</button>
        </form>
      </div>
      {paiementData.length > 0 ? (
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
        </div>) : <p>Aucun paiement dans le tableau.</p>}
    </div>
  );
};

export default PaymentList;