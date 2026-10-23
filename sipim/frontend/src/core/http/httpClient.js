import axios from "axios";
import { suivreRequetes } from "./chargement";
import { tokenStore } from "../auth/tokenStore";

/**
 * Client HTTP construit à partir de ses dépendances (adresse, jeton, gestion d'erreur) :
 * les modules dépendent de cette abstraction, pas d'axios ni du stockage du jeton.
 * get / post renvoient le corps de la réponse ; en cas d'erreur, onError décide de la valeur renvoyée.
 */
export const createHttpClient = ({ baseURL, getToken, onError }) => {
  const instance = () => {
    const token = getToken();
    const headers = { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    // Requêtes suivies : la page s'affiche après la réponse du backend (ChargementPage)
    return suivreRequetes(axios.create({ baseURL, headers }));
  };
  const executer = (requete) => requete.then((reponse) => reponse.data).catch(onError);
  return {
    get: (url, config) => executer(instance().get(url, config)),
    post: (url, data) => executer(instance().post(url, data)),
  };
};

// Client de l'application. Comportement historique conservé : toute erreur efface le jeton et renvoie undefined.
export const http = createHttpClient({
  baseURL: process.env.REACT_APP_URL,
  getToken: tokenStore.get,
  onError: () => {
    tokenStore.clear();
    return undefined;
  },
});
