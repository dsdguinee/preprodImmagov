import React,{useState,useEffect,useMemo} from "react";
import "./styles/App.scss";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Immatriculation from "./pages/Immatriculation/Immatriculation";
import ListeImmatriculation from "./pages/ListeImmatriculation/ListeImmatriculation";
import DetailsImmatriculation from "./pages/DetailsImmatriculation/DetailsImmatriculation";
import Footer from "./components/Footer/Footer";
import { Toaster } from "react-hot-toast";
import {UserContext,ComboContext} from "./services/Context/Contexts";
import LoginProtected from "./components/ProtectedRoutes/LoginProtected";
import Connected from "./components/ProtectedRoutes/Connected";
import {getCurrentUser, getUserRolePrivilegeByUserID} from './services/auth.service';
import {getAllGenre, getAlltype,getAllmodel,getAllMarques} from "./utils/vehicule.util";
import { getAllDirections, getministeres } from "./services/organisation.service";
import NouvelleReforme from "./pages/NouvelleReforme/NouvelleReforme";
import Reforme from "./pages/Reforme/Reforme";
import ValidationMinistere from "./pages/ValidationMinistere/ValidationMinistere";

import ListeReforme from "./pages/ListeReforme/ListeReforme";
import ListeMinistere from "./pages/ListeMinistere/ListeMinistere";
import ListeUtilisateurs from "./pages/ListeUtilisateurs/ListeUtilisateurs";
import Mutation from "./pages/Mutation/Mutation";
import ListeMutation from "./pages/ListeMutation/ListeMutation";
import DetailsCarteGrise from "./pages/DetailsCarteGrise/DetailsCarteGrise";
import CartesGrises from "./pages/CartesGrises/CartesGrises";
import NouvelleMutation from "./pages/NouvelleMutation/NouvelleMutation";
import DetailsMutation from "./pages/DetailsMutation/DetailsMutation";
import DetailsReforme from "./pages/DetailsReforme/DetailsReforme";
import ModifierMinistere from "./pages/ModifierMinistere/ModiferMinistere";
import ResoumissionImmatriculation from "./pages/ResoumissionImmatriculation/ResoumissionImmatriculation";
import ResoumissionMutation from "./pages/ResoumissionMutation/ResoumissionMutation";
import ResoumissionReforme from "./pages/ResoumissionReforme/ResoumissionReforme";
import ListeRoles from "./pages/ListeRoles/ListeRoles";
import { isEmpty } from "./utils/helper/functions";
import ListeMarques from "./pages/ListeMarques/ListeMarques";
import ModifierMarque from "./pages/ModifierMarque/ModifierMarque";
import Statistiques from "./pages/Statistiques/Statistiques";
import ListeReservation from "./pages/Reservation/ListeReservation";

function App() { 
  const [user,setUser] = useState({});
  const [ministeres,setMinisteres] = useState([]);
  const [directions,setdirections] = useState([]);
  const [genres,setGenres] = useState([]);
  const [typeVehicules,setTypeVehicules] = useState([]);
  const [modeles,setModeles] = useState([]);
  const [marques,setMarques] =useState([]);
  const[currentUserPrivilege,setCurrentUserPrivilege] = useState([]);
  const [isLogging,setIsLogging] = useState(false);

  //localStorage.removeItem('token')
  useMemo(() => {
    try{
      
    if(!isEmpty(user) && user)
      getUserRolePrivilegeByUserID(user.id).then((resp) => {
  
      if(resp.status === 200 || resp.success ){
        setIsLogging(true);setCurrentUserPrivilege(resp.userPrivilege);
      }
      else setCurrentUserPrivilege([]);
    });
  } catch(ex){
    localStorage.removeItem('token');
  }},[user])

  useEffect(() => {
    if(localStorage.getItem('token')) { 
          try{
            getCurrentUser().then((resp) => {
            if(resp){
              setUser(resp);
              setIsLogging(true);
            }
        });
      
        getministeres().then((resp) => {
              setMinisteres(resp);
        });
        } catch(ex){
          localStorage.removeItem('token');
        }
        getAllGenre().then((resp) => {
          setGenres(resp);
        })
        getAlltype().then((resp) => {
          setTypeVehicules(resp);
        });
        getAllmodel().then((resp) => {
          setModeles(resp);
        });
        getAllMarques().then((resp) => {
          setMarques(resp);
        })
        getAllDirections().then((resp) => {
          setdirections(resp.directions);
        });
      }
  },[]);

  return (
    <div className="App">
    <UserContext.Provider value={{user,setUser,currentUserPrivilege}}> 
        <Navbar isLogging={isLogging}/>
          <Toaster position="top-right" reverseOrder={false} toastOptions={{ className: "toast", duration: 4000 }} />
          <ComboContext.Provider value={{ministeres,typeVehicules,modeles,marques,genres,directions}}>
          <Routes>
              <Route path='/' element={<Connected><Login/></Connected>}/>
              <Route path="dashboard" element={<LoginProtected isLogging={isLogging}> <Dashboard /> </LoginProtected>} />
              <Route path="nouvellereforme/:id" element={<NouvelleReforme />} />
              <Route path="nouvelleimmatriculation" element={<LoginProtected> <Immatriculation /> </LoginProtected>} />
              <Route path="reforme" element={<Reforme />} />
              <Route path="liste-immatriculation" element={<LoginProtected> <ListeImmatriculation/> </LoginProtected>} />
              <Route path="details-immatriculation/:id" element={<LoginProtected> <DetailsImmatriculation /> </LoginProtected>} />
              <Route path="/organisation/ministere/create/:id" element={<LoginProtected> <ValidationMinistere /> </LoginProtected>} />
              <Route path="liste-reforme" element={<LoginProtected> <ListeReforme /></LoginProtected> } />
              <Route path="mutation" element={<LoginProtected><Mutation/></LoginProtected> } />
              <Route path="nouvelle-mutation/:id" element={<LoginProtected><NouvelleMutation /></LoginProtected>} />
              <Route path="liste-mutation" element={<LoginProtected><ListeMutation /></LoginProtected>} />
              <Route path="liste-ministere" element={<LoginProtected><ListeMinistere /></LoginProtected>} />
              <Route path="modifier-ministere/:id" element={<LoginProtected><ModifierMinistere /></LoginProtected>} />
              <Route path="carte-grise/:id" element={<LoginProtected><DetailsCarteGrise /></LoginProtected>} />
              <Route path="cartes-grises" element={<LoginProtected><CartesGrises /></LoginProtected>} />
              <Route path="details-mutation/:id" element={<LoginProtected><DetailsMutation /></LoginProtected>} />
              <Route path="details-reforme/:id" element={<LoginProtected><DetailsReforme /></LoginProtected>} />
              <Route path="liste-utilisateurs" element={<LoginProtected><ListeUtilisateurs /></LoginProtected>} />
              <Route path="liste-roles" element={<LoginProtected><ListeRoles /></LoginProtected>} />
              <Route path="organisation/ministere/create/:id" element={<LoginProtected><ValidationMinistere /></LoginProtected>} />
              <Route path="liste-marques" element={<LoginProtected><ListeMarques /></LoginProtected>} />
              <Route path="modifier-marque/:id" element={<LoginProtected><ModifierMarque /></LoginProtected>} />
              {/* la resoumission */}
              <Route path="resoumission/:id" element={<LoginProtected><ResoumissionImmatriculation /></LoginProtected>} />
              <Route path="resoumission-mutation/:id" element={<LoginProtected><ResoumissionMutation /></LoginProtected>} />
              <Route path="resoumission-reforme/:id" element={<LoginProtected><ResoumissionReforme /></LoginProtected>} />
              <Route path="statistiques" element={<LoginProtected><Statistiques /></LoginProtected>} />
              <Route path="reservation" element={<LoginProtected><ListeReservation /></LoginProtected>} />
          </Routes>
          </ComboContext.Provider>
        <Footer />
      </UserContext.Provider>
    </div>
  );
}

export default App;