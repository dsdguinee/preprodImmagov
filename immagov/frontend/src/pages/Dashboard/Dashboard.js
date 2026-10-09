import React, { useState, useContext, useMemo,useEffect } from "react";
import BarChart from "../../components/BarChart.js/BarChart";
import moment from "moment";
import "moment/locale/fr";
import Pusher from 'pusher-js';
import { AiOutlineCloseCircle, AiOutlineCheckCircle } from "react-icons/ai";
import { GiSandsOfTime } from "react-icons/gi";
import { UserContext } from "../../services/Context/Contexts";
import { isEmpty } from "../../utils/helper/functions";
import Spinner from "../../components/Spinner/Spinner";

import {
  dashboardStat,
  dashboardStatGraph1,
  dashboardStatGraph2,
  dashboardAgent,
} from "../../services/immatriculation.service";
import AgentDashboard from "./AgentDashboard";
import DirecteurDashboard from "./DirecteurDashboard";
import AdminDashboard from "./AdminDashboard";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LineChart from "../../components/LineChart/LineChart";
import ChangerMdpModal from "../../components/ChangerMdpModal/ChangerMdpModal";
import { getAllRoles } from "../../services/auth.service";
// import PieChart from "../../components/PieChart/PieChart";
const Dashboard = () => {
  const [grapheData1, setGrapheData1] = useState({});
  const [grapheData2, setGrapheData2] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user,currentUserPrivilege } = useContext(UserContext);
  const [mois, setMois] = useState(moment().format("MM"));
  const [isOpen, setIsOpen] = useState(false);
  const [roles,setRoles] = useState([]);
  // Tableau de bord du rôle Agent : undefined tant que la réponse n'est pas arrivée
  const [agentData, setAgentData] = useState(undefined);
  useEffect(() => {
    dashboardAgent().then((resp) => setAgentData(resp?.success ? resp : null));
  }, []);
  const [stats, setStats] = useState({
    attente: 0,
    mutation: 0,
    reforme: 0,
    rejete: 0,
    totaux: 0,
    valider: 0,});

  const handleInput = async (e) => {
    setMois(e.target.value);
    setGrapheData1([]);
    setIsLoading(true);

    const stats = await dashboardStatGraph1(e.target.value);
    if (stats !== undefined) {
      const useData = {
        labels: stats.map((data) => data.nom),
        datasets: [
          {
            label: "Genre de Vehicule",
            data: stats.map((data) => data.total),
            backgroundColor: [
              "rgba(75,192,192,1)",
              "#ecf0f1",
              "#50AF95",
              "#f3ba2f",
              "#2a71d0",
            ],
            borderColor: "black",
            borderWidth: 2,
          },
        ],
      };
      setGrapheData1(useData);
    }
    setIsLoading(false);
  };
 
  useEffect(() => {
    //Pusher.logToConsole = true
    getAllRoles().then((resp) => {
      setRoles(resp?.roles);
      //console.log(resp?.roles)
    });
   
    //console.log(currentUserPrivilege)
    if(currentUserPrivilege.length > 0){
       const currentRoleID = currentUserPrivilege[0]?.role_id;
       const role = roles.filter((r => r.role_id == currentRoleID));
    if(Array.isArray(role) && role.length > 0){
      if(role[0].nom_role.trim() == 'Directeur'){
        //  Pusher.logToConsole = true;
          var pusher = new Pusher('49a931bccbded85fa724', {
            cluster: 'mt1'
          });
          var channel = pusher.subscribe('dashboard');

          channel.bind('statistique', function(data) {
          //console.log(data.dashboardData.original.stats);
          dashboardStat().then((resp) => {
            setStats(resp.stats);
          });
          if(data.dashboardData.original.stats == 'attente'){
            const tot = parseInt(stats.totaux) + 1;
            const att = parseInt(stats.attente) + 1; 
            setStats({...stats,totaux:tot,attente:att});
          }else if(data.dashboardData.original.stats == 'valider' ){
              const att = parseInt(stats.attente) - 1;
              const valid = parseInt(stats.valider) + 1; 
              setStats({...stats,valider:valid,attente:att});
          }else if(data.dashboardData.original.stats == 'rejete'){
            const att = parseInt(stats.attente) - 1;
            const rejet = parseInt(stats.rejete) + 1; 
            setStats({...stats,rejete:rejet,attente:att});
          }else if(data.dashboardData.original.stats == 'reforme' && stats.totaux != '0'){
            const tot = parseInt(stats.totaux) - 1;
            const valid = parseInt(stats.valider) - 1; 
            setStats({...stats,totaux:tot,valider:valid});
          }


          });
      }
   }
  }
  }, [])
  //console.log(stats)
  useMemo(() => {
  
    dashboardStat().then((resp) => {
      setStats(resp.stats);
    });
    if (!isEmpty(user) && user.nbreCnx === 0) {
      setIsOpen(true);
    }
    dashboardStatGraph1(mois).then((resp) => {
     
      if (resp) {
       // console.log(resp);
        const useData = {
          labels: resp.map((data) => data.nom),
          datasets: [
            {
              label: "Genre de vehicule",
              data: resp.map((data) => data.total),
              backgroundColor: [
                "rgba(75,192,192,1)",
                "#e76f51",
                "#50AF95",
                "#f3ba2f",
                "#2a71d0",
                "#5d85c2",
              ],
            },
          ],
        };
        setGrapheData1(useData);
      } else {
        setGrapheData1({});
      }
    });
   
    dashboardStatGraph2().then((resp) => {
      if (resp != undefined) {
        const useData = {
          labels: resp.map((data) => data.modeImmatriculation),
          datasets: [
            {
              label: "Mode d'immatriculation",
              data: resp.map((data) => data.total),
              backgroundColor: [
                "rgba(75,192,192,1)",
                "#e76f51",
                "#50AF95",
                "#f3ba2f",
                "#2a71d0",
                "#5d85c2",
              ],
              borderColor: "black",
              borderWidth: 1,
            },
          ],
        };
        setGrapheData2(useData);
      } else {
        setGrapheData2([]);
      }
    });
  }, [user]);

  if (agentData === undefined) return <Spinner />;
  if (agentData?.isAgent) {
    return (
      <>
        <Helmet>
          <title>Tableau de bord</title>
        </Helmet>
        <ChangerMdpModal isOpen={isOpen} setIsOpen={setIsOpen} user_id={user.id} />
        <AgentDashboard data={agentData} user={user} />
      </>
    );
  }
  // Rôle avec le droit « Validation » (Directeur)
  if (agentData?.isDirecteur) {
    return (
      <>
        <Helmet>
          <title>Tableau de bord</title>
        </Helmet>
        <ChangerMdpModal isOpen={isOpen} setIsOpen={setIsOpen} user_id={user.id} />
        <DirecteurDashboard user={user} />
      </>
    );
  }
  // Rôle avec le droit « Gestion des Utilisateurs » sans « Validation » (Admin)
  if (agentData?.isAdministrateur) {
    return (
      <>
        <Helmet>
          <title>Tableau de bord</title>
        </Helmet>
        <ChangerMdpModal isOpen={isOpen} setIsOpen={setIsOpen} user_id={user.id} />
        <AdminDashboard user={user} />
      </>
    );
  }

  return (
    <div className="dashboard page">
      <Helmet>
        <title>Tableau de bord</title>
      </Helmet>
      {isLoading && <Spinner />}
      <main>
        <div>
          <ChangerMdpModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            user_id={user.id}
          />
        </div>
        <div className="greetings">
          <h3>
            Bienvenue,{" "}
            {!isEmpty(user) && user.prenom}
          </h3>
          <span>Voici un resumé des dernières activités.</span>
        </div>
        <div className="stats">
          <Link
            to={`/liste-immatriculation`}
            state={{ title: "Tout", filter_id: -1 }}
          >
            <div className="stat-box">
              <div className="box-left">
                <span className="value">{stats?stats.totaux:0}</span>
                <p className="text">Total</p>
              </div>
            </div>
          </Link>
          <Link
            to={`/liste-immatriculation`}
            state={{ title: "Attente", filter_id: 0 }}
          >
            <div className="stat-box">
              <div className="box-left">
                <span className="value">{stats ? stats.attente:0}</span>
                <p className="text">En attente</p>
              </div>
              <div className="box-right">
                <GiSandsOfTime />
              </div>
            </div>
          </Link>
          <Link
            to={`/liste-immatriculation`}
            state={{ title: "Validé", filter_id: 1 }}
          >
            <div className="stat-box">
              <div className="box-left">
                <span className="value">{stats ?stats.valider:0}</span>
                <p className="text">Validées</p>
              </div>
              <div className="box-right">
                <AiOutlineCheckCircle />
              </div>
            </div>
          </Link>
          <Link
            to={`/liste-immatriculation`}
            state={{ title: "Rejeté", filter_id: 2 }}
          >
            <div className="stat-box">
              <div className="box-left">
                <span className="value">{stats ? stats.rejete:0}</span>
                <p className="text">Rejetées</p>
              </div>
              <div className="box-right">
                <AiOutlineCloseCircle />
              </div>
            </div>
          </Link>
        </div>

        <div className="charts">
          <h2>Statistiques</h2>
          <div className="graphes">
            <div className="bar-chart">
              <div className="head">
                <h4>Immatriculations des vehicules par genre</h4>
                <div className="month">
                  <select value={mois} name="mois" onChange={handleInput}>
                    <option value="01">Janvier</option>
                    <option value="02">Février</option>
                    <option value="03">Mars</option>
                    <option value="04">Avril</option>
                    <option value="05">Mai</option>
                    <option value="06">Juin</option>
                    <option value="07">Juillet</option>
                    <option value="08">Août</option>
                    <option value="09">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
              </div>
              {!isEmpty(grapheData1) && <BarChart chartData={grapheData1} />}
            </div>
            <div className="line-chart">
              <h4>Immatriculation des Vehicules par Mode</h4>
              {!isEmpty(grapheData2)  && <LineChart chartData={grapheData2} />}
              {/* {!isEmpty(grapheData2) && <BarChart chartData={grapheData2} />} */}
              {/* <LineChart chartData={grapheData2} />  */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
