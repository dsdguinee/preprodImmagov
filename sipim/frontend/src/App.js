import { useEffect,useState} from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./styles/App.scss";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard/AgentDashboard";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Payment from "./pages/Payment/Payment";
import PaymentList from "./pages/PaymentList/PaymentList";
import PaymentDetails from "./pages/PaymentDetails/PaymentDetails";
import UsersList from "./pages/UsersList/UsersList";
import PaymentResubmission from "./pages/PaymentResubmission/PaymentResubmission";
import RejectedPaymentList from "./pages/RejectedPaymentList/RejectedPaymentList";
import UserSettings from "./pages/UserSettings/UserSettings";
import SideMenu from "./components/SideMenu/SideMenu";
import LoginProtected from "./services/Auth/LoginProtected";
import Connected from "./services/Auth/Connected";
import Spinner from "./components/Spinner/Spinner";
import Api from "./services/Api";
import { UserContext,ElementContext } from "./services/Context/Context";
import { Toaster } from 'react-hot-toast';
import RolesList from "./pages/RolesList/RolesList";
import Agencies from "./pages/Agencies/Agencies";
import Communes from "./pages/Communes/Communes";
import Stats from "./pages/Stats/Stats";
import AutorisedPaymentList from "./pages/AutorisedPaymentList/AutorisedPaymentList";
import HistoriqueList from "./pages/HistoriqueList/HistoriqueList";
// import { useIdleTimer } from 'react-idle-timer';

function App() {
  //Idle timer
  // const timeout = 3000
  // const onIdle = () => {
  //   console.log('idle detected')
  // }

  // const idleTimer = useIdleTimer({ onIdle })

  const navigate = useNavigate();
  const [user,setUser] = useState('');
  const [userRole,setUserRole] = useState('');
  const [agence,setAgence] = useState('');
  const [elementsData,setElementsData] = useState();
  const [decoupage,setDecoupage] = useState();
  const[privileges,setPrivileges] = useState([]);
  const [changePrivilege,setChangePrivilege] = useState(false);

  const api = new Api();

  // Recharge le decoupage partage (ex: apres l'ajout d'une commune)
  const refreshDecoupage = () => {
    api.apiData('get','/decoupage/getAll').then((resp) => {
       if(resp?.status == 200){
         setDecoupage({regions:resp.regions,prefectures:resp.prefectures,communes:resp.communes,quartiers:resp.quartiers})
       }
    });
  };
  //localStorage.removeItem('token');

  useEffect(() => {
    setPrivileges([]);
    api.apiData('get','/user').then((resp) => {
 
      if(resp?.status !== 200){
        localStorage.removeItem('token');navigate('/');
      }else {
        setUser(resp?.user);
        setUserRole(resp?.role);setAgence(resp?.agence);
        api.apiData('get','/paiement/getelements').then((resp) => {
       
          if(resp.status == 200)
        
            setElementsData(resp.Elements);
          
        });
        refreshDecoupage();
        api.apiData('get','/roles/getUserPrivileges').then((resp) => {
          if(resp?.status == 200){
            setPrivileges(resp.privileges.map((privilege) => {
                return {
                  privilege_id:privilege.privilege_id,
                  privilege:privilege.privilege
                }
              })); 
          }
       })
      }
    
     if(resp?.user?.nbre_cnx === 1){
       navigate('myaccount/settings');
     } 
   });
   
  },[changePrivilege]);
 
  return (
    <div className="App">
      <Toaster position="top-right" reverseOrder={false} />
      <UserContext.Provider value={{user,setUser,userRole,agence,decoupage,refreshDecoupage,privileges,changePrivilege,setChangePrivilege}} >
        <Navbar />
          <SideMenu />
          <Spinner />
          <ElementContext.Provider value={{elementsData}} >
              <Routes>
                <Route path="*" element={<h2>Pas de Page Correspondate: 404!</h2>} />
                <Route path="/" element={<Connected><Login /></Connected>} />
                <Route path="dashboard" element={<LoginProtected>{userRole?.type === 3 ? <AdminDashboard /> : userRole?.type === 1 ? <AgentDashboard /> : <Dashboard />}</LoginProtected>} />
                <Route path="stats" element={<LoginProtected><Stats /></LoginProtected>} />
                <Route path="payment">
                  <Route path="new" element={<LoginProtected><Payment /></LoginProtected>} />
                  <Route path="list" element={<LoginProtected><PaymentList /></LoginProtected>} />
                  <Route path="rejected/list" element={<LoginProtected><RejectedPaymentList /></LoginProtected>} />
                  <Route path="autoriser/list" element={<LoginProtected><AutorisedPaymentList /></LoginProtected>} />
                  <Route path="invoice/:id" element={<LoginProtected><PaymentDetails /></LoginProtected>} />
                  <Route path="historique/list" element={<LoginProtected><HistoriqueList /></LoginProtected>} />
                </Route> 
                <Route path="resubmission">
                  <Route path="new/:id" element={<LoginProtected><PaymentResubmission /></LoginProtected>} />
                  {/* <Route path="list" element={<LoginProtected><PaymentList /></LoginProtected>} /> */}
                </Route> 
                <Route path="users">
                  <Route path="list" element={<LoginProtected><UsersList /></LoginProtected>} />
                  <Route path="roles/list" element={<LoginProtected><RolesList /></LoginProtected>} />
                </Route>
                <Route path="agencies">
                  <Route path="list" element={<LoginProtected><Agencies /></LoginProtected>} />
                </Route>
                <Route path="communes">
                  <Route path="list" element={<LoginProtected><Communes /></LoginProtected>} />
                </Route>
                <Route path="myaccount">
                  <Route path="settings" element={<UserSettings />} />
                </Route>
              </Routes>
           </ElementContext.Provider>    
        <Footer />
      </UserContext.Provider>
    </div>
  );
}

export default App;