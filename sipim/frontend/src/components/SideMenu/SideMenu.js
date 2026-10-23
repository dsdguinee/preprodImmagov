import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { sideMenuState, useAtomState } from "../../store/atoms";
import { UserContext } from "../../services/Context/Context";
import { ADMINISTRATION } from "../Navbar/Navbar";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";

const SideMenu = () => {
  const [open, setOpen] = useAtomState(sideMenuState);
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
          {ADMINISTRATION.some((m) => privilegeExiste(m.privilege, privileges)) && (
            <>
              <li className="side-menu-title">Administration</li>
              {ADMINISTRATION.filter((m) => privilegeExiste(m.privilege, privileges)).map((m) => (
                <li key={m.to} className="side-menu-sub">
                  <NavLink
                    to={m.to}
                    className={(navData) => (navData.isActive ? "link-active" : "")}
                    onClick={() => setOpen(false)}
                  >
                    {m.label}
                  </NavLink>
                </li>
              ))}
            </>
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
