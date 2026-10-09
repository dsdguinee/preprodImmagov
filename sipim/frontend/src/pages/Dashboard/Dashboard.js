import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarChartComponent from "../../components/BarChartComponent/BarChartComponent";
import StatsBox from "../../components/StatsBox/StatsBox";
import Box from "@mui/material/Box";
import { DataGrid, frFR } from "../../components/DataGrid";
import Api from "../../services/Api";
import { UserContext } from "../../services/Context/Context";
import { formatStringNumber, isEmpty, fraisService, montantOperation, libelleOperation } from "../../services/Helpers/fonctions";
import moment from "moment";
import 'moment/locale/fr';
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";

// import { useRecoilState } from 'recoil'
// import { loadingState } from "../../recoil/atoms/loadingAtom";

const Dashboard = () => {
  const [paiementData,setPaiementData] = useState([]);
  const {user,userRole,privileges} = useContext(UserContext);
  const[globalMontant,setGlobalMontant] = useState(0);
  const [totalparticulier,setTotalparticulier] = useState(0);
  const [totalsociete,setTotalsociete] = useState(0);
  const[totalpaiement,setTotalpaiement] = useState(0)
  const [stats,setStat] = useState();
  const [graph,setGraph] = useState();
  const [nouveauPaiement,setNouveauPaiement] = useState();
  const api = new Api();
  const navigate = useNavigate();
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
      field: "modeExp",
      headerName: "Mode d'exploitation",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "typeClient",
      headerName: "Type de client",
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
      field: "sumMontant",
      headerName: "Montant(FG)",
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
    },
  ];

  useEffect(() => {
    
   setTotalpaiement(0);setTotalsociete(0);
    setTotalparticulier(0);
    api.apiData('get','/paiement/getPaiementByDateDay').then((resp) => {
      //console.log(resp)
      if(resp.status === 200){
        let commission1 = 0;let globalsom = 0;
        setPaiementData(resp.paiements.map((paiement) => {
          commission1 = fraisService(paiement)
          let montautorisation = 0;let modeImm = "Immatriculation";

          if(paiement.montantautorisation != null)
              montautorisation = paiement.montantautorisation;
          let sumMontant = parseFloat(paiement.montantcartegrise !== null?paiement.montantcartegrise:0) + parseFloat(paiement.montantvignette !== null?paiement.montantvignette:0) + parseFloat(montautorisation !== null ?montautorisation:0) + parseFloat(commission1) + montantOperation(paiement);
          if(paiement.modeImma != 1)
            modeImm = "RéImmatriculation";
       
          if(paiement.status === 1 )  
            globalsom = sumMontant + parseFloat(globalsom);

          return {
            id:paiement.paiement_id,
            typeClient:paiement.typeClient,
            modeExp:paiement.modeExp,
            fullName:paiement.fullName,
            reference:paiement.reference,
            modeImm:libelleOperation(paiement, modeImm),
            created_at:moment(paiement.created_at).format('Do MMMM  YYYY H:m'),
            sumMontant:sumMontant,
            numChassis:paiement.chassis
          }
        }));
        setGlobalMontant(globalsom);
      }
    });
    api.apiData('get','/paiement/dashboardStat').then((resp) => {
      setTotalpaiement(resp.stats?.totalpaiement);
      if(Array.isArray(resp.grap1) && resp.grap1.length > 0){
        setGraph(resp.grap1.map((graph) => {
          let mois = '';      
          if(graph.mois != null )
            mois = graph.mois;
          else
            mois = graph.mois1;
          return {
            Particulier:graph.Particulier,
            Société:graph.Société,
            mois:mois
          }
        }));
      }
    
      if(typeof resp?.stats.clientByType !== 'undefined' && resp?.stats.clientByType !== ""){
        resp?.stats.clientByType.map(clientType => {
          if(clientType.typeClient == "Particulier")
            setTotalparticulier(clientType.NbretypeClient);
          else if(clientType.typeClient === "societe" || clientType.typeClient === "Société") 
             setTotalsociete(clientType.NbretypeClient);
        });
      }
    });
    if(privileges){
       const privilege = privileges.filter((p) => p.privilege === 'Nouveau Paiement');
       if(privilege.length > 0)
         setNouveauPaiement(privilege[0].privilege);
    }
   //console.log(user)
  },[user,privileges]);
  //console.log(graph)
  const initpaiement = () => {
     navigate('/payment/new')
  }

  return (
    <div className="dashboard page">
      <DocumentTitle title="Tableau de bord" />
      <div className="top">
        <div className="left nomComplet">
         
           <h3>{parseInt(moment().format('HH')) > 12 ? ' Bonsoir ' :'Bonjour '}
            {!isEmpty(user) &&
              user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1)},
           </h3>
          <p>Voici un resumé de vos dernières activités.</p>
        </div>
        {(typeof nouveauPaiement !== 'undefined' && nouveauPaiement !== '') &&
          <div className="right">
            <button className="primary" onClick={initpaiement}>Initier un paiement</button>
          </div>}
      </div>
      <div className="payments-stats">
        <h3>Paiements</h3>
        <div className="boxes">
          <StatsBox
            title={"Paiements effectués"}
            amount={totalpaiement}
            link={"/payment/list"}
            position={1}
            stat={{ title: "Tout", filter_id: 1 }}
          />
          <StatsBox
            title={"Paiements particuliers"}
            amount={totalparticulier}
            link={"/payment/list"}
            position={2}
            stat={{ title: "Particulier", filter_id: 2 }}
          />
          <StatsBox
            title={"Paiements Entreprises"}
            amount={totalsociete}
            link={"/payment/list"}
            position={3}
            stat={{ title: "Societe", filter_id: 3 }}
          />
          <StatsBox
            title={"Montant total encaissé (Jour)"}
            amount={formatStringNumber(globalMontant)+" fg"}
            link={"#"}
            position={4}
           
          />
        </div>
      </div>
      <div className="stats">
        <h3>Statistiques</h3>
        <div className="chart-and-array">
          {/* <h4>Paiements de la semaine</h4> */}
      
            {graph && 
            <div className="chart">
              <BarChartComponent graph={graph}/>
            </div>
            }

         

          
          {/* <div className="array">
            <Box sx={{ height: 290, width: "100%" }}>
              <DataGrid
                rows={paiementData}
                columns={columns}
                autoPageSize
                sx={{ borderRadius: 0 }}
                disableSelectionOnClick
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
            </Box>
          </div> */}

          {/* {paiementData.length > 0 ? ( */}
            <div className="array">
              <Box sx={{ height: 290, width: "100%" }}>
                <DataGrid
                  rows={paiementData}
                  columns={columns}
                  density="compact"
                  autoPageSize
                  pagination
                  sx={{ borderRadius: 0 }}
                  disableSelectionOnClick
                  localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                  />
              </Box>
            </div>
            {/* ) : <p>Aucun paiement effectué.</p> } */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
