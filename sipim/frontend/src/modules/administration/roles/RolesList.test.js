import { screen, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RolesList from "./RolesList";
import { rolesApi } from "../api";
import { UserContext } from "../../../core/context/contexts";

// L'écran ne dépend que de l'API du module : elle est simulée, sans réseau
jest.mock("../api", () => ({
  rolesApi: { lister: jest.fn(), privileges: jest.fn(), basculerStatut: jest.fn(), privilegesDuRole: jest.fn(), ajouter: jest.fn(), modifier: jest.fn(), detail: jest.fn() },
}));

const afficher = () => render(
  <BrowserRouter>
    <UserContext.Provider value={{ changePrivilege: false, setChangePrivilege: jest.fn() }}>
      <RolesList />
    </UserContext.Provider>
  </BrowserRouter>
);

beforeEach(() => {
  jest.clearAllMocks();
  rolesApi.lister.mockResolvedValue({ status: 200, roles: [{ role_id: 1, role_name: "Administrateur", type: 3, status: 1, privileges: "Ministère" }] });
  rolesApi.privileges.mockResolvedValue({ status: 200, privileges: [{ privilege_id: 26, nom_privilege: "Ministère" }] });
});

describe("layout", () => {
  it("should render the header", () => {
    afficher();
    expect(screen.getByRole("heading", { name: /Roles/i })).toBeInTheDocument();
  });

  it("should load roles and privileges from the module API", async () => {
    afficher();
    expect(await within(await screen.findByRole("table")).findByText("Administrateur")).toBeInTheDocument();
    expect(rolesApi.lister).toHaveBeenCalled();
    expect(rolesApi.privileges).toHaveBeenCalled();
  });

  describe("actions", () => {
    it("should show the add new modal on click", async () => {
      afficher();
      await userEvent.click(screen.getByRole("button", { name: /Nouveau role/i }));
      expect(await screen.findByRole("heading", { name: /Ajouter un nouveau role/i })).toBeInTheDocument();
    });
  });
});
