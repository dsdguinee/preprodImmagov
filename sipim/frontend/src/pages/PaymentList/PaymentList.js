import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { expression, formatStringNumber, isEmpty, montantPlaque, objecttoFormData, fraisService, montantOperation, libelleOperation } from "../../services/Helpers/fonctions";
import moment from "moment";
import "moment/locale/fr";
import { loadingState, useAtomState } from "../../store/atoms";
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

const montant = (v) => `${formatStringNumber(parseFloat(v) || 0)} FG`;
const fourni = (v) => (v && v !== "Non Fournie" ? v : "—");
const STATUTS = { "Validé": "ok", "Réjété": "ko", "En attente": "wait", "Resoumission": "wait", "Resoumis": "info" };

const Info = ({ label, children, mono }) => (
  <div className="pd-info">
    <dt>{label}</dt>
    <dd className={mono ? "pd-mono" : undefined}>{children || "—"}</dd>
  </div>
);

// Détail complet d'un paiement de la liste
const PaymentDetails = ({ paiement, facture, onClose }) => {
  useEffect(() => {
    if (!paiement) return undefined;
    const fermer = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fermer);
    return () => document.removeEventListener("keydown", fermer);
  }, [paiement, onClose]);
  if (!paiement) return null;
  // Lignes du reçu : seuls les éléments réellement payés
  const lignes = [
    ["Carte grise", fourni(paiement.expressionCg), paiement.cartgriseMontant],
    ["Vignette", [fourni(paiement.expressionVg), paiement.numVignette !== "Non Fournie" && `N° ${paiement.numVignette}`].filter(Boolean).join(" · "), paiement.vignetteMontant],
    ["Autorisation de transport", fourni(paiement.typeAutorisation), paiement.montantAutorisation],
    ["Plaque", fourni(paiement.type_plaque), paiement.montantPlaque],
    ["Frais de service", "", paiement.commission],
  ].filter(([, , m]) => parseFloat(m) > 0);
  return (
    <div className="fk-dialog payment-details" role="dialog" aria-modal="true" aria-labelledby="pd-title" onClick={onClose}>
      <div className="fk-dialog-box" onClick={(e) => e.stopPropagation()}>
        <header className="pd-head">
          <div>
            <span className="pd-kicker">{paiement.modeImm} · {paiement.created_at}</span>
            <h3 id="pd-title" className="pd-mono">{paiement.reference}</h3>
            <span className={`pd-badge pd-badge--${STATUTS[paiement.status] || "info"}`}>{paiement.status}</span>
          </div>
          <div className="pd-total">
            <span>Total payé</span>
            <strong>{montant(paiement.sumMontant)}</strong>
          </div>
          <button type="button" className="pd-close" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <div className="pd-body">
          <div className="pd-cards">
            <section className="pd-card">
              <h4>Client</h4>
              <dl>
                <Info label="Nom">{paiement.fullName}</Info>
                <Info label="Type">{paiement.typeClient}</Info>
                <Info label="Usage">{paiement.modeExp}</Info>
              </dl>
            </section>
            <section className="pd-card">
              <h4>Véhicule</h4>
              <dl>
                <Info label="Châssis" mono>{paiement.numChassis}</Info>
                <Info label="Catégorie">{fourni(paiement.categorieName)}</Info>
                <Info label="Plaque">{fourni(paiement.type_plaque)}</Info>
              </dl>
            </section>
            <section className="pd-card">
              <h4>Paiement</h4>
              <dl>
                <Info label="Document">{fourni(paiement.document)}</Info>
                <Info label="Référence">{paiement.immatriculation}</Info>
                <Info label="Code vignette">{fourni(paiement.codev)}</Info>
              </dl>
            </section>
            <section className="pd-card">
              <h4>Agence</h4>
              <dl>
                <Info label="Région">{fourni(paiement.region)}</Info>
                <Info label="Banque">{fourni(paiement.banque)}</Info>
              </dl>
            </section>
          </div>

          <section className="pd-receipt">
            <h4>Détail des montants</h4>
            {lignes.length ? (
              <table>
                <tbody>
                  {lignes.map(([label, detail, m]) => (
                    <tr key={label}>
                      <th scope="row">{label}{detail && <small>{detail}</small>}</th>
                      <td>{montant(m)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><th scope="row">Total</th><td>{montant(paiement.sumMontant)}</td></tr>
                </tfoot>
              </table>
            ) : <p className="pd-empty">Aucun montant détaillé.</p>}
          </section>
        </div>

        <div className="fk-dialog-actions pd-actions">
          <button type="button" className="fk-btn ghost" onClick={onClose}>Fermer</button>
          {facture && <Link to={`/payment/invoice/${paiement.id}`} className="fk-btn primary">Voir facture</Link>}
        </div>
      </div>
    </div>
  );
};

const PaymentList = () => {
  const api = new Api();
  const [paiementData,setPaiementData] = useState([]);
  const[globalMontant,setGlobalMontant] = useState(0);
  const [isLoading,setIsLoading] = useAtomState(loadingState);
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
  const [detail,setDetail] = useState(null);


  // Colonnes utiles affichées ; les autres restent disponibles (menu Colonnes, export) et dans « Détails »
  const columns = [
    { field: "created_at", headerName: "Date", flex: 1, minWidth: 150 },
    { field: "reference", headerName: "Référence", flex: 1, minWidth: 180 },
    { field: "fullName", headerName: "Client", flex: 1, minWidth: 160 },
    { field: "numChassis", headerName: "Châssis", flex: 1, minWidth: 160 },
    { field: "modeImm", headerName: "Opération", flex: 1, minWidth: 140 },
    { field: "type_plaque", headerName: "Plaque", flex: 1, minWidth: 80 },
    { field: "sumMontant", headerName: "Total (FG)", flex: 1, minWidth: 120, valueFormatter: ({ value }) => formatStringNumber(value) },
    { field: "status", headerName: "Statut", flex: 1, minWidth: 110 },
    {
      field: "options",
      headerName: "",
      sortable: false,
      filterable: false,
      disableExport: true,
      hideable: false,
      minWidth: 110,
      renderCell: (params) => (
        <div className="options">
          <button type="button" onClick={() => setDetail(params.row)}>Détails</button>
        </div>
      ),
    },
    { field: "typeClient", headerName: "Type Client", flex: 1, minWidth: 150, hide: true },
    { field: "modeExp", headerName: "Mode d'exploitation", flex: 1, minWidth: 150, hide: true },
    { field: "document", headerName: "Document", flex: 1, minWidth: 150, hide: true },
    { field: "categorieName", headerName: "Categorie Engin", flex: 1, minWidth: 150, hide: true },
    { field: "expressionCg", headerName: "Nom Carte Grise", flex: 1, minWidth: 250, hide: true },
    { field: "cartgriseMontant", headerName: "Montant C.Grise(FG)", flex: 1, minWidth: 150, hide: true },
    { field: "expressionVg", headerName: "Nom Vignette", flex: 1, minWidth: 250, hide: true },
    { field: "numVignette", headerName: "Num. Vignette", flex: 1, minWidth: 200, hide: true },
    { field: "codev", headerName: "C.Vignette", flex: 1, minWidth: 80, hide: true },
    { field: "vignetteMontant", headerName: "Montant Vignette(FG)", flex: 1, minWidth: 150, hide: true },
    { field: "typeAutorisation", headerName: "Nom Auto. Transport", flex: 1, minWidth: 250, hide: true },
    { field: "montantAutorisation", headerName: "Montant Auto. Transport(FG)", flex: 1, minWidth: 150, hide: true },
    { field: "immatriculation", headerName: "Immatriculation", flex: 1, minWidth: 170, hide: true },
    { field: "montantPlaque", headerName: "Montant Plaque(FG)", flex: 1, minWidth: 150, hide: true },
    { field: "commission", headerName: "Commission(FG)", flex: 1, minWidth: 150, hide: true },
    { field: "region", headerName: "Region", flex: 1, minWidth: 150, hide: true },
    { field: "banque", headerName: "Banque", flex: 1, minWidth: 150, hide: true },
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
                    setPaiementData(resp.paiements.filter(p => p.typeClient === "Entreprise Publique" && p.status === 1).map((paiement) => {
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
      <PaymentDetails paiement={detail} facture={!cache} onClose={() => setDetail(null)} />
    </div>
  );
};

export default PaymentList;