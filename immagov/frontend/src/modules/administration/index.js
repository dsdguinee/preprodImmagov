import ListeUtilisateurs from "./utilisateurs/ListeUtilisateurs";
import ListeRoles from "./roles/ListeRoles";
import ListeMinistere from "./organismes/ListeMinistere";
import ModifierMinistere from "./organismes/ModifierMinistere";
import ListeMarques from "./editeur/ListeMarques";
import ModifierMarque from "./editeur/ModifierMarque";

/**
 * Module Administration : utilisateurs, rôles, ministères / entreprises publiques, éditeur (marques et modèles).
 * - routes : pages du module (toutes réservées aux utilisateurs connectés)
 * - menu : liens de la barre de navigation ; « autorise » lit les menus renvoyés par le backend pour le rôle connecté
 */
const administration = {
  nom: "administration",
  routes: [
    { path: "liste-ministere", element: <ListeMinistere /> },
    { path: "modifier-ministere/:id", element: <ModifierMinistere /> },
    { path: "liste-utilisateurs", element: <ListeUtilisateurs /> },
    { path: "liste-roles", element: <ListeRoles /> },
    { path: "liste-marques", element: <ListeMarques /> },
    { path: "modifier-marque/:id", element: <ModifierMarque /> },
  ],
  menu: [
    { to: "/liste-ministere", label: "Ministères", autorise: (m) => m?.ministeres },
    {
      groupe: { label: "Utilisateurs", classe: "utilisateur" },
      liens: [
        { to: "/liste-utilisateurs", label: "Gestion des utilisateurs", autorise: (m) => m?.utilisateurs?.gestion_des_Utilisateurs },
        { to: "/liste-roles", label: "Gestion des roles", autorise: (m) => m?.utilisateurs?.gestion_des_Rôles },
      ],
    },
    { to: "/liste-marques", label: "Editeur", autorise: (m) => m?.editeur },
  ],
};

export default administration;
