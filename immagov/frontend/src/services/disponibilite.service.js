// Disponibilité des véhicules du parc automobile (gestion : Direction Générale GG)
import { getConnexion, getConnexionFormData } from "./auth.service";
import { erreurServeur } from "./immatriculation.service";

// Adresse d'un fichier enregistré (fiche technique, preuve)
export const urlFichier = (chemin) => (chemin ? `${process.env.REACT_APP_URL}/storage/${chemin}` : null);

export const getVehiculesParc = (etat) =>
  getConnexion().get("/disponibilite/vehicules", { params: etat ? { etat } : {} }).then((resp) => resp.data).catch(erreurServeur);

export const getStatsParc = () =>
  getConnexion().get("/disponibilite/stats").then((resp) => resp.data).catch(erreurServeur);

export const getHistoriqueDisponibilite = (immatriculationId) =>
  getConnexion().get(`/disponibilite/historique/${immatriculationId}`).then((resp) => resp.data).catch(erreurServeur);

export const rendreIndisponible = ({ immatriculation_id, motif, description, date_debut, fiche_technique, preuve }) => {
  const formData = new FormData();
  formData.append("immatriculation_id", immatriculation_id);
  formData.append("motif", motif);
  formData.append("description", description || "");
  formData.append("date_debut", date_debut);
  if (fiche_technique) formData.append("fiche_technique", fiche_technique);
  if (preuve) formData.append("preuve", preuve);
  return getConnexionFormData().post("/disponibilite/indisponible", formData).then((resp) => resp.data).catch(erreurServeur);
};

export const rendreDisponible = ({ indisponibilite_id, date_fin, commentaire }) => {
  const formData = new FormData();
  formData.append("indisponibilite_id", indisponibilite_id);
  formData.append("date_fin", date_fin);
  formData.append("commentaire", commentaire || "");
  return getConnexion().post("/disponibilite/disponible", formData).then((resp) => resp.data).catch(erreurServeur);
};
