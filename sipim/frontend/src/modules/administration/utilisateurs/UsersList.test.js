import { screen, render, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UsersList from "./UsersList";
import { utilisateursApi } from "../api";
import { ElementContext, UserContext } from "../../../core/context/contexts";

// L'écran ne dépend que de l'API du module : elle est simulée, sans réseau
jest.mock("../api", () => ({
  utilisateursApi: { lister: jest.fn(), basculerStatut: jest.fn(), ajouter: jest.fn(), modifier: jest.fn() },
  rolesApi: { lister: jest.fn(() => Promise.resolve({ status: 200, roles: [] })), detail: jest.fn() },
}));

const afficher = () => render(
  <BrowserRouter>
    <UserContext.Provider value={{ decoupage: { regions: [], prefectures: [], communes: [] }, privileges: [] }}>
      <ElementContext.Provider value={{ elementsData: {} }}>
        <UsersList />
      </ElementContext.Provider>
    </UserContext.Provider>
  </BrowserRouter>
);

beforeEach(() => {
  jest.clearAllMocks();
  utilisateursApi.lister.mockResolvedValue({ status: 200, users: [
    { id: 3, nom: "KABA", prenom: "Ibrahima", email: "i.kaba@dsd.gn", telephone: "620000000", nom_role: "Agent", role_id: 2, nom_agence: "AGENCE CENTRE", status: 1, photo: "" },
  ] });
});

test("affiche l'en-tête et le bouton d'ajout", () => {
  afficher();
  expect(screen.getByRole("heading", { name: "Utilisateurs" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Nouvel utilisateur/ })).toBeInTheDocument();
});

test("charge les utilisateurs depuis l'API du module", async () => {
  afficher();
  const table = await screen.findByRole("table");
  expect(await within(table).findByText("KABA")).toBeInTheDocument();
  expect(utilisateursApi.lister).toHaveBeenCalledTimes(1);
});
