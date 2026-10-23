import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ListeMinistere from "./ListeMinistere";
import { organismesApi } from "../api";
import { ComboContext } from "../../../core/context/contexts";

jest.mock("../api", () => ({ organismesApi: { lister: jest.fn(), ajouter: jest.fn(), supprimer: jest.fn() } }));
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));

// Même forme que GET /organisation/ministeres
const organismes = [
  { ministere_id: 1, nom: "MINISTÈRE DES TRANSPORTS", typeorganisme: "Publique", categorie: "Ministère" },
  { ministere_id: 2, nom: "PRÉSIDENCE DE LA RÉPUBLIQUE", typeorganisme: "Publique", categorie: "Ministère" },
  { ministere_id: 3, nom: "ÉLECTRICITÉ DE GUINÉE (EDG)", typeorganisme: "Publique", categorie: "Entreprise Publique" },
  { ministere_id: 4, nom: "CBG", typeorganisme: "Publique", categorie: "Entreprise Publique" },
];
const recharger = jest.fn();
const afficher = () => render(
  <HelmetProvider><MemoryRouter><ComboContext.Provider value={{ rechargerOrganisations: recharger }}><ListeMinistere /></ComboContext.Provider></MemoryRouter></HelmetProvider>
);

beforeEach(() => { jest.clearAllMocks(); organismesApi.lister.mockResolvedValue(organismes); });

test("onglets : ministères et entreprises publiques ne sont pas mélangés", async () => {
  afficher();
  const table = await screen.findByRole("table");
  expect(await within(table).findByText("MINISTÈRE DES TRANSPORTS")).toBeInTheDocument();
  expect(within(table).queryByText("ÉLECTRICITÉ DE GUINÉE (EDG)")).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Ministères et institutions 2/ })).toHaveAttribute("aria-selected", "true");

  fireEvent.click(screen.getByRole("tab", { name: /Entreprises publiques 2/ }));
  const entreprises = within(screen.getByRole("table"));
  expect(entreprises.getByText("ÉLECTRICITÉ DE GUINÉE (EDG)")).toBeInTheDocument();
  expect(entreprises.queryByText("MINISTÈRE DES TRANSPORTS")).not.toBeInTheDocument();

  expect(entreprises.getByText("CBG")).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /privés/ })).not.toBeInTheDocument();
});

test("ajout d'une entreprise publique depuis son onglet, doublon bloqué", async () => {
  organismesApi.ajouter.mockResolvedValue({ success: true });
  afficher();
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("tab", { name: /Entreprises publiques/ }));
  fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle entreprise publique" }));
  expect(screen.getByLabelText("Catégorie")).toHaveValue("Entreprise Publique");

  // Doublon (accents ignorés) : enregistrement impossible
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "electricite de guinee (edg)" } });
  expect(screen.getByText(/existe déjà : inutile de le créer/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "société des eaux de guinée (seg)" } });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() => expect(organismesApi.ajouter).toHaveBeenCalled());
  const envoi = Object.fromEntries(organismesApi.ajouter.mock.calls[0][0].entries());
  expect(envoi).toEqual({ nom: "SOCIÉTÉ DES EAUX DE GUINÉE (SEG)", categorie: "Entreprise Publique", typeOrganisme: "Publique" });
  await waitFor(() => expect(recharger).toHaveBeenCalled());
});
