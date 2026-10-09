import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { useRecoilState } from "recoil";
import { sideMenuState } from "../../recoil/atoms/sideMenuAtom";
import { UserContext } from "../../services/Context/Context";
import OutsideClickHandler from "react-outside-click-handler";

const SideMenu = () => {
  const [open, setOpen] = useRecoilState(sideMenuState);
  const { userRole, privileges } = useContext(UserContext);
  const privilegeExiste = (privileName, privilegestable) => {
    const privilege = privilegestable.filter(
      (p) => p.privilege === privileName
    );
    if (Array.isArray(privilege) && privilege.length > 0) return true;
    return false;
  };
  return (
    <OutsideClickHandler
      onOutsideClick={() => {
        setOpen(false);
      }}
    >
      <div className={`side-menu ${open && "open"}`}>
        <ul>
          <li>
            <NavLink
              to={"dashboard"}
              className={(navData) => (navData.isActive ? "link-active" : "")}
              onClick={() => setOpen(false)}
            >
              Tableau de bord
            </NavLink>
          </li>
          {privilegeExiste("Nouveau Paiement", privileges) && (
            <li>
              <NavLink
                to={"payment/new"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Nouveau paiement
              </NavLink>
            </li>
          )}
          {privilegeExiste("Liste Autre Paiement", privileges) && (
            <li>
              <NavLink
                to={"payment/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                {" "}
                Tous les paiements{" "}
              </NavLink>
            </li>
          )}
          {privilegeExiste("Liste Paiements  Annulés", privileges) && (
            <li>
              <NavLink
                to={"payment/rejected/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Paiements rejetés
              </NavLink>
            </li>
          )}
          {privilegeExiste("Liste Paiements à Autoriser", privileges) && (
            <li>
              <NavLink
                to={"payment/autoriser/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Paiements autorisés
              </NavLink>
            </li>
          )}
          {privilegeExiste("Historique", privileges) && (
            <li>
              <NavLink
                to={"payment/historique/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Historique
              </NavLink>
            </li>
          )}
          {privilegeExiste("Utilisateur", privileges) && (
            <li>
              <NavLink
                to={"users/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Utilisateurs
              </NavLink>
            </li>
          )}
          {privilegeExiste("Role&Privilege", privileges) && (
            <li>
              <NavLink
                to={"users/roles/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Rôles et Privilèges
              </NavLink>
            </li>
          )}
          {privilegeExiste("Agence", privileges) && (
            <li>
              <NavLink
                to={"agencies/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Agences
              </NavLink>
            </li>
          )}
          {privilegeExiste("Commune", privileges) && (
            <li>
              <NavLink
                to={"communes/list"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Communes
              </NavLink>
            </li>
          )}
          {privilegeExiste("Statistique", privileges) && (
            <li>
              <NavLink
                to={"stats"}
                className={(navData) => (navData.isActive ? "link-active" : "")}
                onClick={() => setOpen(false)}
              >
                Statistiques
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </OutsideClickHandler>
  );
};

export default SideMenu;
