import { http } from "../../core/http/httpClient";
import { tokenStore } from "../../core/auth/tokenStore";

/**
 * Accès à l'API du module Administration : une fonction par appel, regroupées par entité.
 * Les écrans du module n'appellent que ces fonctions (jamais axios ni l'URL directement).
 * Chaque fonction renvoie le corps de la réponse ; le comportement en cas d'erreur est celui des anciens services.
 */

// Ancien comportement des services véhicule : l'erreur est renvoyée comme une réponse
const erreurCommeReponse = (promesse) => promesse.catch((ex) => ex);

export const utilisateursApi = {
  lister: () => http.get("/reservation/getAllUser"),
  ajouter: (formData) => http.post("/utilisateur/new", formData).catch(() => { tokenStore.clear(); }),
  modifier: (formData) => http.post("/utilisateur/update", formData),
  supprimer: (formData) => http.post("/utilisateur/delete", formData),
};

export const rolesApi = {
  lister: () => http.get("/role-privilege/roles"),
  listerAvecPrivileges: () => http.get("/role-privilege/roles-privileges"),
  privileges: () => http.get("/role-privilege/privileges"),
  privilegesDuRole: (roleId) => http.get(`/role-privilege/roles-privileges/${roleId}`),
  ajouter: (formData) => http.post("/role-privilege/new-role", formData),
  modifier: (formData) => http.post("/role-privilege/update", formData),
  basculerStatut: (formData) => http.post("/role-privilege/ActiveDesactive", formData),
};

// Ministères / institutions et entreprises publiques, avec leurs directions
export const organismesApi = {
  lister: () => http.get("/organisation/ministeres").then((d) => d.ministeres),
  detail: (organismeId) => http.get(`/organisation/ministere/${organismeId}`).then((d) => d?.ministere || null),
  ajouter: (formData) => http.post("/organisation/ministere/New", formData),
  modifier: (formData) => http.post("/organisation/ministere/update", formData),
  supprimer: (formData) => http.post("organisation/ministere/delete", formData),
  directions: (organismeId) => http.get(`/organisation/getdirectionsByMinistere/${organismeId}`),
  ajouterDirection: (formData) => http.post("/organisation/direction/New", formData),
  modifierDirection: (formData) => http.post("/organisation/direction/update", formData),
  supprimerDirection: (formData) => http.post("/organisation/direction/delete", formData),
};

// Éditeur : marques et modèles de véhicules
export const marquesApi = {
  lister: () => erreurCommeReponse(http.get("vehicule/marques")),
  detail: (marqueId) => erreurCommeReponse(http.get(`vehicule/marque/${marqueId}`)),
  ajouter: (formData) => erreurCommeReponse(http.post("vehicule/marque/add", formData)),
  modifier: (formData) => erreurCommeReponse(http.post("vehicule/marque/update", formData)),
  supprimer: (formData) => erreurCommeReponse(http.post("vehicule/marque/delete", formData)),
  modeles: (marqueId) => erreurCommeReponse(http.get(`vehicule/models/${marqueId}`)),
  ajouterModele: (formData) => erreurCommeReponse(http.post("vehicule/modele/add", formData)),
  modifierModele: (formData) => erreurCommeReponse(http.post("vehicule/modele/update", formData)),
  supprimerModele: (formData) => erreurCommeReponse(http.post("vehicule/modele/delete", formData)),
};
