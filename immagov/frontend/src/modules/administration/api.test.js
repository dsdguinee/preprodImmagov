import { utilisateursApi, rolesApi, organismesApi, marquesApi } from "./api";
import { http } from "../../core/http/httpClient";

jest.mock("../../core/http/httpClient", () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  http.get.mockResolvedValue({});
  http.post.mockResolvedValue({});
});

test("chaque fonction appelle l'adresse de l'API attendue", () => {
  const form = new FormData();
  utilisateursApi.lister(); expect(http.get).toHaveBeenLastCalledWith("/reservation/getAllUser");
  utilisateursApi.supprimer(form); expect(http.post).toHaveBeenLastCalledWith("/utilisateur/delete", form);
  rolesApi.privilegesDuRole(2); expect(http.get).toHaveBeenLastCalledWith("/role-privilege/roles-privileges/2");
  rolesApi.basculerStatut(form); expect(http.post).toHaveBeenLastCalledWith("/role-privilege/ActiveDesactive", form);
  organismesApi.directions(5); expect(http.get).toHaveBeenLastCalledWith("/organisation/getdirectionsByMinistere/5");
  organismesApi.supprimerDirection(form); expect(http.post).toHaveBeenLastCalledWith("/organisation/direction/delete", form);
  marquesApi.modeles(7); expect(http.get).toHaveBeenLastCalledWith("vehicule/models/7");
  marquesApi.supprimerModele(form); expect(http.post).toHaveBeenLastCalledWith("vehicule/modele/delete", form);
});

test("organismes : la liste et le détail sont extraits de la réponse", async () => {
  http.get.mockResolvedValueOnce({ ministeres: [{ nom: "CBG" }] });
  await expect(organismesApi.lister()).resolves.toEqual([{ nom: "CBG" }]);
  http.get.mockResolvedValueOnce({ status: 404 });
  await expect(organismesApi.detail(99)).resolves.toBeNull();
});

test("éditeur : une erreur réseau est renvoyée comme réponse (ancien comportement)", async () => {
  const erreur = new Error("réseau");
  http.get.mockRejectedValueOnce(erreur);
  await expect(marquesApi.lister()).resolves.toBe(erreur);
});
