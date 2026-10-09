import { useEffect,useState } from 'react';
import { NavLink } from 'react-router-dom'
import { logout,getUserRole, getUserRolePrivilege } from "../../services/auth.service";
import { isEmpty } from "../../utils/helper/functions";
const MobileNav = ({ isOpen,isLogging, setMenuOpen,menusRole,user }) => {
  
  useEffect(() => {
    if(!isLogging){ 
      logout();window.localStorage.removeItem('token');window.location.href="/";
    }
  }, [])
  return (
      (!isEmpty(user) && user) &&
        <div className={isOpen ? 'mobile-nav open' : 'mobile-nav'}>
          <ul>
           {menusRole?.Tableau_de_bord &&
              <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/dashboard">
                <li onClick={() => setMenuOpen(false)}>Tableau de bord</li>
              </NavLink>
            }
            {menusRole?.Nouvelle_immatriculation && 
              <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/nouvelleimmatriculation">
                <li onClick={() => setMenuOpen(false)}>Commencer une immatriculation</li>
              </NavLink>
             }
             {menusRole?.Immatriculations &&
              <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-immatriculation">
                <li onClick={() => setMenuOpen(false)}>Immatriculations</li>
              </NavLink>
             }
            {(menusRole.mutations?.Nouvelle_Mutation || menusRole.mutations?.Liste_Mutation) &&
             <>
              {menusRole.mutations?.Nouvelle_Mutation && 
                <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/mutation">
                  <li onClick={() => setMenuOpen(false)}>Nouvelle mutation</li>
                </NavLink>
              }
              {menusRole.mutations?.Liste_Mutation && 
              <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-mutation">
                <li onClick={() => setMenuOpen(false)}>Liste des mutations</li>
              </NavLink>
              }
              </>
            }
           {(menusRole.reformes?.Nouvelle_Reforme || menusRole.reformes?.Liste_Reforme) &&
             <>
              {menusRole.reformes?.Nouvelle_Reforme && 
                <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/reforme">
                  <li onClick={() => setMenuOpen(false)}>Nouvelle reforme</li>
                </NavLink>
              }
               {menusRole.reformes?.Liste_Reforme && 
                <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-reforme">
                  <li onClick={() => setMenuOpen(false)}>Liste des reformes</li>
                </NavLink>
                }
              </>
            }
            {menusRole?.ministeres && 
                <NavLink  key={menusRole.ministeres} className={(navData) => navData.isActive ? "link-active" : "" } to="/liste-ministere">
                  <li onClick={() => setMenuOpen(false)}>Ministères</li>
                </NavLink>
             }
            {(menusRole.utilisateurs?.gestion_des_Utilisateurs || menusRole.utilisateurs?.gestion_des_Rôles) &&
               
                  <div className="dropdown-menu dropdown-utilisateur">
                    {menusRole.utilisateurs?.gestion_des_Utilisateurs && 
                        <NavLink  key={menusRole.utilisateurs.gestion_des_Utilisateurs} className={(navData) => navData.isActive ? "link-active link-utilisateur" : "link-utilisateur" } to="/liste-utilisateurs">
                          <li onClick={() => setMenuOpen(false)}>Utilisateurs</li> 
                        </NavLink> 
                    }
                    {menusRole.utilisateurs?.gestion_des_Rôles &&
                      <NavLink key={menusRole.utilisateurs.gestion_des_Rôles} className={(navData) => navData.isActive ? "link-active link-utilisateur" : "link-utilisateur" } to="/liste-roles">
                        <li onClick={() => setMenuOpen(false)}>Rôles</li> 
                      </NavLink> 
                    }
                      
                </div>
              }
             {menusRole?.carte_Grise &&
              <NavLink className={(navData) => navData.isActive ? "link-active" : "" } to="/cartes-grises">
                <li onClick={() => setMenuOpen(false)}>Cartes grises</li>
              </NavLink>
            }
          </ul>
        </div>
      )
    
  
};

export default MobileNav;
