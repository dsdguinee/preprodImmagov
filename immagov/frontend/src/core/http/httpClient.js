import axios from "axios";
import { suivreRequetes } from "./chargement";
import { tokenStore } from "../auth/tokenStore";

/**
 * Fabrique du client HTTP : l'URL et la source du jeton sont injectées (testable, aucun accès global en dur).
 * - instance(options) : instance axios configurée (jeton Bearer, suivi du spinner de page)
 * - get / post : renvoient directement le corps de la réponse ; une erreur réseau est propagée (promesse rejetée)
 */
export const createHttpClient = ({ baseURL, getToken }) => {
  const instance = ({ multipart = false } = {}) => {
    const token = getToken();
    const headers = {
      "Cache-Control": "no-Cache",
      "Content-Type": multipart && token ? "multipart/form-data" : "application/json",
      ...(token ? { "Access-Control-Allow-Origin": "*", Authorization: `Bearer ${token}` } : {}),
    };
    return suivreRequetes(axios.create({ baseURL, headers }));
  };
  return {
    instance,
    get: (url, config) => instance().get(url, config).then((r) => r.data),
    post: (url, data) => instance().post(url, data).then((r) => r.data),
  };
};

export const http = createHttpClient({ baseURL: `${process.env.REACT_APP_URL}/api/`, getToken: tokenStore.get });
