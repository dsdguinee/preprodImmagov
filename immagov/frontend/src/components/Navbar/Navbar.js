import React,{ useState ,useContext,useEffect} from "react";
import { useLocation } from "react-router-dom";
import { BiUserCircle, BiLogOutCircle, BiMenu } from "react-icons/bi";
import { NavLink, Link } from "react-router-dom";
import MobileNav from "../MobileNav/MobileNav";
import { logout,getUserRole, getUserRolePrivilege } from "../../services/auth.service";
import {UserContext} from "../../services/Context/Contexts";
import { isEmpty } from "../../utils/helper/functions";
import armoiries from "../../assets/armoiries.png";
import Spinner from "../Spinner/Spinner";
//const user = useContext(useContext);

const Navbar = (isLogging) => {
  const location = useLocation();
  const pathName = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [role,setRole] = useState('');
 
  const [rolePriviles,setRolePriviles]=useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [mutation,setMutation] = useState([]);
  const [simple_menu,setSimple_menu] = useState();
  const [sous_menu,setSous_menu] = useState();
  const [menusRole,setMenusRole] = useState({
     Tableau_de_bord:'',
     Nouvelle_immatriculation:'',
     Immatriculations :'',
     reformes:{
      Nouvelle_Reforme:'',
      Liste_Reforme:''
    },
    mutations:{
      Nouvelle_Mutation:'',
      Liste_Mutation:''
    },
    ministeres:'',
    carte_Grise:'',
    utilisateurs:{
      gestion_des_Utilisateurs:'',
      gestion_des_Rôles:'',
    },
    editeur:'',
    statistique:'',
    reservation:''
  });
  const {user} = useContext(UserContext);

  const handlerLogout = () => {
     const reponse = logout();
     localStorage.removeItem('token');window.location.href = '/'; 
  }
  async function  getRolePrivileges(){
   // if(!isEmpty(user) && user){


      const { menus } = await getUserRolePrivilege();
      if(typeof menus !== 'undefined'){
        setMenusRole({...menusRole,
          Tableau_de_bord:menus.Tableau_de_bord,
          Nouvelle_immatriculation:menus.Nouvelle_immatriculation,
          Immatriculations:menus.Immatriculations,
          reformes:{
            Nouvelle_Reforme:menus.reformes.Nouvelle_Reforme,
            Liste_Reforme:menus.reformes.Liste_Reforme
          },
          mutations:{
            Nouvelle_Mutation:menus.mutations.Nouvelle_Mutation,
            Liste_Mutation:menus.mutations.Liste_Mutation,
          },
          ministeres:menus.ministères,
          utilisateurs:{
            gestion_des_Utilisateurs:menus.utilisateurs.gestion_des_Utilisateurs,
            gestion_des_Rôles:menus.utilisateurs.gestion_des_Rôles,
          },
          carte_Grise:menus.carte_Grise,
          editeur:menus.editeur,
          statistique:menus.statistique,
          reservation:menus.reservation,
        });
      }
      setIsLoading(false);

     /*  if(status === 200 || success ){
        setSimple_menu(simple_menu);setSous_menu(sous_menu);
        setIsLoading(false);
      }else{
        setIsLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: messages,
        }).then((value) => {
          if(value)
             localStorage.removeItem('token');window.location.href="/";
        })
      }
    } */
 
 // }
} 
 
  useEffect(() => {
      setIsLoading(true);
          setRolePriviles([]);
          getUserRole().then(resp=> setRole(resp));
          getRolePrivileges();

   },[]);


 
   return (
    <>
      {pathName !== "/" ? (
        <div className="Navbar">
           {isLoading && <Spinner />}
          <MobileNav setMenuOpen={setIsMenuOpen} 
            isLogging ={isLogging}
            isOpen={isMenuOpen} 
            menusRole={menusRole}
            user={user}
          />
          {!isEmpty(user) && user &&
            <main>
              <div className="left">
                <div className="hamburger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <BiMenu />
                </div>
                <div className="logo">
                  <Link to="/dashboard" className="logo-wrapper">
                    <div className="logo-img">
                      <img src={armoiries} alt="" />
                    </div>
                    <div className="logo-text">
                      <p>Imma<span>Gov</span></p>
                      <p>Les garages du gouvernement</p>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="center">
                  <ul>
                  {menusRole?.Tableau_de_bord &&
                    <NavLink key={menusRole.Tableau_de_bord} className={(navData) => navData.isActive ? "link-active" : "" } to="/dashboard">
                        <li>Tableau de bord</li>
                    </NavLink>   
                  }

                  {menusRole?.Nouvelle_immatriculation && 
                    <NavLink key={menusRole.Nouvelle_immatriculation} className={(navData) => navData.isActive ? "link-active" : "" } to="/nouvelleimmatriculation">
                        <li>Nouvelle immatriculation</li>
                    </NavLink>
                  }

                  {menusRole?.Immatriculations &&
                    <NavLink key={menusRole.Immatriculations} className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-immatriculation">
                          <li>Immatriculations</li>
                    </NavLink>
                  }

                  {(menusRole.reformes?.Nouvelle_Reforme || menusRole?.reformes?.Liste_Reforme) &&
                      <div className="link-reforme" >
                          <li>Reformes</li>
                          <div className="dropdown-menu dropdown-reforme">
                              {menusRole.reformes?.Nouvelle_Reforme && 
                                <NavLink key={menusRole?.reformes.Nouvelle_Reforme} className={(navData) => navData.isActive ? "link-active link-reforme" : "link-reforme" } to="/reforme">
                                    <li>Nouvelle reforme</li>
                                </NavLink>
                              }
                              {menusRole?.reformes?.Liste_Reforme && 
                              <NavLink key={menusRole?.reformes.Liste_Reforme} className={(navData) => navData.isActive ? "link-active link-reforme" : "link-reforme" } to="/liste-reforme">  
                                  <li>Liste des reformes</li>
                              </NavLink>
                              }
                          </div>     
                      </div>   
                  }
                  {(menusRole?.mutations?.Nouvelle_Mutation || menusRole?.mutations?.Liste_Mutation) &&
                    <div className="link-mutation">
                        <li>Mutations</li>
                        <div className="dropdown-menu dropdown-mutation">
                            {menusRole.mutations?.Nouvelle_Mutation && 
                              <NavLink  key={menusRole.mutations.Nouvelle_Mutation} className={(navData) => navData.isActive ? "link-active link-mutation" : "link-mutation" } to="/mutation">
                                <li>Nouvelle mutation</li>
                              </NavLink>
                            }
                            {menusRole.mutations?.Liste_Mutation && 
                                <NavLink  key={menusRole.mutations.Liste_Mutation} className={(navData) => navData.isActive ? "link-active link-mutation" : "link-mutation" } to="/liste-mutation">
                                  <li>Liste de mutations</li>
                                </NavLink>
                            }
                        </div>  
                    </div>
                  }

                  {menusRole?.ministeres && 
                    <NavLink  key={menusRole.ministeres} className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-ministere">
                      <li>Ministères</li>
                    </NavLink>
                  }
                
                  {(menusRole?.utilisateurs?.gestion_des_Utilisateurs || menusRole?.utilisateurs?.gestion_des_Rôles) &&
                    <div className="link-utilisateur">
                          <li>Utilisateurs</li>
                          <div className="dropdown-menu dropdown-utilisateur">
                            {menusRole.utilisateurs?.gestion_des_Utilisateurs && 
                                <NavLink  key={menusRole.utilisateurs.gestion_des_Utilisateurs} className={(navData) => navData.isActive ? "link-active link-utilisateur" : "link-utilisateur" } to="/liste-utilisateurs">
                                  <li>Gestion des utilisateurs</li> 
                                </NavLink> 
                            }
                            {menusRole.utilisateurs?.gestion_des_Rôles &&
                              <NavLink key={menusRole.utilisateurs.gestion_des_Rôles} className={(navData) => navData.isActive ? "link-active link-utilisateur" : "link-utilisateur" } to="/liste-roles">
                                <li>Gestion des roles</li> 
                              </NavLink> 
                            }
                          </div>
                    </div>
                  }
                  {menusRole?.carte_Grise &&
                    <NavLink  key={menusRole.carte_Grise } className={(navData) => navData.isActive ? "link-active" : "" } to="/cartes-grises">
                      <li>Cartes grises</li>
                    </NavLink>

                  }
                  {menusRole?.editeur &&
                   <NavLink  key={menusRole.editeur } className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-marques">
                      <li>Editeur</li>
                   </NavLink> 
                   }
                   {menusRole?.statistique &&
                    <NavLink  key={menusRole.statistique } className={(navData) => navData.isActive ? "link-active" : "" } to="/statistiques">
                        <li>Statistiques</li>
                    </NavLink> 
                   }
                  {menusRole?.reservation &&
                    <NavLink  key={menusRole.reservation } className={(navData) => navData.isActive ? "link-active" : "" } to="/reservation">
                      <li>Reservation</li>
                    </NavLink> 
                   }
                   
                  </ul>
                </div>
              <div className="right">
                <div className="avatar">
                  <div className="user-info">
                    <span className="name">{!isEmpty(user) && user.prenom}</span>
                    <span className="role">{(!isEmpty(user) && role )&& role.charAt(0).toUpperCase()+ role.slice(1)}</span>
                  </div>
                  <div className="user-icon">
                    <BiUserCircle />
                  </div>
                </div>
                <div className="separator"></div>
                <NavLink to={"#"} onClick={handlerLogout}>
                  <div className="logout">
                    <BiLogOutCircle />
                  </div>
                </NavLink>
              </div>
            </main>
            }
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
