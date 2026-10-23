import { utilisateursApi, rolesApi, agencesApi, decoupageApi, organismesApi } from "./api";
import { http } from "../../core/http/httpClient";

jest.mock("../../core/http/httpClient", () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test("chaque fonction appelle l'adresse de l'API attendue", () => {
  const form = new FormData();
  utilisateursApi.lister(); expect(http.get).toHaveBeenLastCalledWith("/user/getAll");
  utilisateursApi.basculerStatut(4); expect(http.get).toHaveBeenLastCalledWith("/user/status/4");
  utilisateursApi.ajouter(form); expect(http.post).toHaveBeenLastCalledWith("/user/add", form);
  rolesApi.privilegesDuRole(2); expect(http.get).toHaveBeenLastCalledWith("roles/privilege/role/2");
  rolesApi.modifier(form); expect(http.post).toHaveBeenLastCalledWith("/roles/update", form);
  agencesApi.detail(7); expect(http.get).toHaveBeenLastCalledWith("/agence/agencebyid/7");
  decoupageApi.supprimerCommune(9); expect(http.get).toHaveBeenLastCalledWith("/decoupage/commune/delete/9");
  organismesApi.lister(); expect(http.get).toHaveBeenLastCalledWith("ministere/all");
  organismesApi.supprimer(3); expect(http.get).toHaveBeenLastCalledWith("/ministere/delete/3");
});
