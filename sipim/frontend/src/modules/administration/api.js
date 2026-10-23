import { http } from "../../core/http/httpClient";

/**
 * Accès à l'API du module Administration : une fonction par appel, regroupées par entité.
 * Les écrans du module n'appellent que ces fonctions (jamais axios ni l'URL directement).
 * Chaque fonction renvoie le corps de la réponse ({ status, ... }), ou undefined en cas d'erreur réseau.
 */

export const utilisateursApi = {
  lister: () => http.get("/user/getAll"),
  basculerStatut: (userId) => http.get(`/user/status/${userId}`),
  ajouter: (formData) => http.post("/user/add", formData),
  modifier: (formData) => http.post("/user/update", formData),
};

export const rolesApi = {
  lister: () => http.get("/roles/all"),
  detail: (roleId) => http.get(`roles/${roleId}`),
  privileges: () => http.get("/roles/privilege/all"),
  privilegesDuRole: (roleId) => http.get(`roles/privilege/role/${roleId}`),
  basculerStatut: (roleId) => http.get(`/roles/role-status/${roleId}`),
  ajouter: (formData) => http.post("roles/add", formData),
  modifier: (formData) => http.post("/roles/update", formData),
};

export const agencesApi = {
  lister: () => http.get("/agence/getAll"),
  detail: (agenceId) => http.get(`/agence/agencebyid/${agenceId}`),
  ajouter: (formData) => http.post("/agence/new", formData),
  modifier: (formData) => http.post("/agence/update", formData),
};

export const decoupageApi = {
  tout: () => http.get("/decoupage/getAll"),
  communes: () => http.get("decoupage/communes"),
  ajouterCommune: (formData) => http.post("decoupage/commune/new", formData),
  modifierCommune: (formData) => http.post("decoupage/commune/update", formData),
  supprimerCommune: (communeId) => http.get(`/decoupage/commune/delete/${communeId}`),
};

// Ministères (client Gouvernement) et entreprises publiques (client Entreprise Publique)
export const organismesApi = {
  lister: () => http.get("ministere/all"),
  ajouter: (formData) => http.post("ministere/new", formData),
  modifier: (formData) => http.post("ministere/update", formData),
  supprimer: (organismeId) => http.get(`/ministere/delete/${organismeId}`),
};
