import { NavLink } from "react-router-dom";
import { menuAutorise } from "../../app/modules";

const classeLien = (classe) => ({ isActive }) => [isActive && "link-active", classe].filter(Boolean).join(" ");

/** Liens de la barre de navigation fournis par les modules (desktop : groupes en menu déroulant). */
export const MenuModules = ({ menusRole }) =>
  menuAutorise(menusRole).map((entree) =>
    entree.groupe ? (
      <div key={entree.groupe.label} className={`link-${entree.groupe.classe}`}>
        <li>{entree.groupe.label}</li>
        <div className={`dropdown-menu dropdown-${entree.groupe.classe}`}>
          {entree.liens.map((l) => (
            <NavLink key={l.to} className={classeLien(`link-${entree.groupe.classe}`)} to={l.to}>
              <li>{l.label}</li>
            </NavLink>
          ))}
        </div>
      </div>
    ) : (
      <NavLink key={entree.to} className={classeLien()} to={entree.to}>
        <li>{entree.label}</li>
      </NavLink>
    )
  );

/** Même liens pour le menu mobile, à plat ; un clic referme le menu. */
export const MenuModulesMobile = ({ menusRole, fermer }) =>
  menuAutorise(menusRole)
    .flatMap((entree) => (entree.groupe ? entree.liens : [entree]))
    .map((l) => (
      <NavLink key={l.to} className={classeLien()} to={l.to}>
        <li onClick={fermer}>{l.label}</li>
      </NavLink>
    ));
