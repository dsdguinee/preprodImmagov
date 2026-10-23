import UsersList from "./utilisateurs/UsersList";
import RolesList from "./roles/RolesList";
import Agencies from "./agences/Agencies";
import Communes from "./communes/Communes";
import Ministeres from "./organismes/Ministeres";

/**
 * Module Administration : utilisateurs, rôles, agences, communes, ministères et entreprises publiques.
 * Le module déclare ses routes et ses entrées de menu ; l'application les lit dans le registre (app/modules.js),
 * sans avoir à connaître ses pages.
 */
const administration = {
  nom: "administration",
  routes: [
    { path: "users/list", element: <UsersList /> },
    { path: "users/roles/list", element: <RolesList /> },
    { path: "agencies/list", element: <Agencies /> },
    { path: "communes/list", element: <Communes /> },
    { path: "ministeres/list", element: <Ministeres /> },
  ],
  // Menu « Administration » : chaque entrée n'est visible qu'avec son privilège
  menu: [
    { section: "administration", to: "users/list", label: "Utilisateurs", privilege: "Utilisateur" },
    { section: "administration", to: "users/roles/list", label: "Rôles et Privilèges", privilege: "Role&Privilege" },
    { section: "administration", to: "agencies/list", label: "Agences", privilege: "Agence" },
    { section: "administration", to: "communes/list", label: "Communes", privilege: "Commune" },
    { section: "administration", to: "ministeres/list", label: "Ministères & entreprises publiques", privilege: "Ministère" },
  ],
};

export default administration;
