import { http } from "../core/http/httpClient";
import { tokenStore } from "../core/auth/tokenStore";

/**
 * Ancienne façade d'accès à l'API, conservée pour les modules non encore migrés.
 * Elle délègue au client HTTP de core/ ; les nouveaux modules utilisent directement leur fichier api.js.
 */
export default class Api {
  setToken(token) {
    tokenStore.set(token);
  }
  removeToken() {
    tokenStore.clear();
  }
  auth = async (data) => {
    const result = await http.post("/auth", data);
    if (result?.status === 200) this.setToken(result.token);
    return result;
  };
  logout = () => {
    this.removeToken();
  };
  apiData = (method = "get", url, data = "") => (method === "post" ? http.post(url, data) : http.get(url, data || undefined));
}
