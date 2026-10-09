import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { IoIosArrowDown, IoIosMenu } from "react-icons/io";
import { NavLink } from 'react-router-dom';
import { useRecoilState } from "recoil";
import { sideMenuState } from "../../recoil/atoms/sideMenuAtom";
import MenuDropdown from "../MenuDropdown/MenuDropdown";
import { UserContext } from "../../services/Context/Context";
import { isEmpty } from "../../services/Helpers/fonctions";
import dsdlogo from '../../assets/images/logo-2.png'

let nomCommune = '';
const privilegeExiste = (privileName,privilegestable) => {
   const privilege = privilegestable.filter((p) => p.privilege === privileName);
    if(Array.isArray(privilege) && privilege.length > 0)
      return true;
   return false   
}
const Navbar = () => {
  const location = useLocation();
  const pathName = location.pathname;
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSideMenu, setOpenSideMenu] = useRecoilState(sideMenuState);
  const {user,userRole,agence,decoupage,privileges} = useContext(UserContext);
  let profilePhoto ;
  useEffect(() => {
    // L'agence est rattachee a une commune
    if(decoupage?.communes && agence?.commune_id){
       const commune = decoupage.communes.filter((c => c.commune_id == agence.commune_id));
       if(commune.length > 0)
         nomCommune = commune[0].nom;
    }
  },[decoupage, agence]);
  if(user)
     profilePhoto = process.env.REACT_APP_URL.replace('api','storage') + user.photo;
  
  return (
    <>
      {pathName !== "/" && (
        <div className="navbar">
          <div className="navbar-wrapper">
            <div className="left">
              <div className="logo-and-menu">
                <div className="menu-icon" onClick={() => setOpenSideMenu(!openSideMenu)}>
                  <IoIosMenu />
                </div>
                <div className="logo"><img src={dsdlogo}/></div>
              </div>
              <ul>
                <li><NavLink to={"dashboard"} className={(navData) => navData.isActive ? "link-active" : "" }>Tableau de bord</NavLink></li>
                {(Array.isArray(privileges) && privileges.length > 0) && (
                  <>
                  
                  {(privilegeExiste('Nouveau Paiement',privileges) && userRole.type !== 3) &&(
                    <li><NavLink to={"payment/new"} className={(navData) => navData.isActive ? "link-active" : ""}>Nouveau paiement</NavLink></li>
                    )
                  }
                  {(privilegeExiste('Liste Autre Paiement',privileges) || privilegeExiste('Liste Paiements  Annulés',privileges) || privilegeExiste('Liste Paiements à Autoriser',privileges) || privilegeExiste('Historique',privileges)) &&(
                    <div className="link-with-dropdown">
                       <li>Liste des paiements</li>
                        <div className="dropdown-menu">
                        {privilegeExiste('Liste Autre Paiement',privileges) && <li><NavLink to={"payment/list"} className={(navData) => navData.isActive ? "link-active" : ""}> Tous les paiements </NavLink></li>}
                        {privilegeExiste('Liste Paiements  Annulés',privileges) && <li><NavLink to={"payment/rejected/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Paiements rejetés</NavLink></li>}
                        {privilegeExiste('Liste Paiements à Autoriser',privileges) && <li><NavLink to={"payment/autoriser/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Paiements autorisés</NavLink></li>}
                        {privilegeExiste('Historique',privileges) && <li><NavLink to={"payment/historique/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Historique</NavLink></li>}
                      </div>
                    </div> )
                  }
                {(privilegeExiste('Utilisateur',privileges) || privilegeExiste('Role&Privilege',privileges)) &&(
                 <> 
                    <div className="link-with-dropdown">
                     <li>Utilisateurs &amp; Rôles</li>
                      <div className="dropdown-menu">
                        {privilegeExiste('Utilisateur',privileges) && (<li><NavLink to={"users/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Utilisateurs</NavLink></li>)}
                        {privilegeExiste('Role&Privilege',privileges) && (<li><NavLink to={"users/roles/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Rôles et Privilèges</NavLink></li>)}
                      </div>  
                    </div>
                  </>  
                  )
                 }
                {(privilegeExiste('Commune',privileges) || privilegeExiste('Agence',privileges)) &&(
                  <div className="link-with-dropdown">
                  <li>Agences &amp; Communes</li>
                    <div className="dropdown-menu">
                      {privilegeExiste('Agence',privileges) && (<li><NavLink to={"agencies/list"} className={(navData) => navData.isActive ? "link-active" : "" }>Agences</NavLink></li>)}
                      {privilegeExiste('Commune',privileges) && (<li><NavLink to={"communes/list"} className={(navData) => navData.isActive ? "link-active" : ""}>Communes</NavLink></li>)}
                    </div>  
                  </div>
                  )}
                  {(privilegeExiste('Statistique',privileges)) &&(
                    <li><NavLink to={"stats"} className={(navData) => navData.isActive ? "link-active" : "" }>Statistiques</NavLink></li>
                    )
                   }
                
                  </>
                  )
                }
              </ul>
            </div>
            <div className="right">
              <div className="user" onClick={() => setOpenDropdown(!openDropdown)}>
                <div className="profile-image">
                  <img src={profilePhoto} alt="" />
                </div>
                <div className="username">
                   {!isEmpty(user) &&
                      user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1)
                   }
                </div>
                <div className={`arrow-icon ${openDropdown && "rotate"}`}>
                  <IoIosArrowDown />
                </div>
              </div>
                {openDropdown && 
                  <div className="dropdown">
                    <MenuDropdown setOpenDropdown={setOpenDropdown} user = {user} userRole={userRole} agence={agence} nomCommune={nomCommune}/>
                  </div>
                }
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;