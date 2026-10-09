import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { dashboardAdmin } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ dashboardAdmin: jest.fn() }));

// Même forme que la réponse de GET /immatriculation/dashboardAdmin (valeurs SQL agrégées renvoyées en texte)
const reponse = {
  success: true,
  comptes: { total: 11, actifs: 6, desactives: 5, premiere_connexion: 2 },
  roles: [
    { role_id: 3, nom_role: "Agent", actif: 1, utilisateurs: 6, actifs: "3", desactives: "3", premiere_connexion: "2" },
    { role_id: 2, nom_role: "Directeur", actif: 1, utilisateurs: 1, actifs: "1", desactives: "0", premiere_connexion: "0" },
    { role_id: 13, nom_role: "Testeur1", actif: 0, utilisateurs: 0, actifs: "0", desactives: "0", premiere_connexion: "0" },
  ],
  aSurveiller: [
    { id: 4, nom: "IBRAHIMA KABA", role: "Agent", actif: 0, nbreCnx: 0 },
    { id: 12, nom: "Djenabou BAH", role: "Agent", actif: 1, nbreCnx: 0 },
  ],
  activite: Array.from({ length: 12 }, (_, i) => ({ mois: `2026-${String(i + 1).padStart(2, "0")}`, crees: i, valides: 0 })),
  reservations: [{ reservation_id: 1, nom: "PRESIDENCE DE LA REPUBLIQUE", initial: 1, final: 1000, mode: "VA", status: 0, utilises: 250 }],
  dossiers: { total: 434, attente: 65, valides: 369, rejetes: 0, parc: 369, ep: 366, va: 3, a_imprimer: 369, imprimees: 0, propositions: 1 },
  organismes: { total: 12, publique: 4, prive: 8, directions: 9 },
};

beforeEach(() => dashboardAdmin.mockResolvedValue(reponse));

test("comptes, rôles, comptes à surveiller et réservations", async () => {
  render(<MemoryRouter><AdminDashboard user={{ prenom: "Administrateur" }} /></MemoryRouter>);
  expect(await screen.findByText("Bonjour, Administrateur")).toBeInTheDocument();
  expect(screen.getByText("6 / 11")).toBeInTheDocument();
  expect(screen.getByText("5 comptes désactivés")).toBeInTheDocument();
  expect(screen.getByText("Dont 1 proposition d'organisme")).toBeInTheDocument();

  // Rôle inactif sans utilisateur masqué, puis affiché à la demande
  const roles = screen.getAllByRole("table")[0];
  expect(within(roles).queryByText("Testeur1")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /rôles inactifs sans utilisateur/ }));
  expect(within(roles).getByText("Testeur1")).toBeInTheDocument();

  expect(screen.getByText("Désactivé")).toBeInTheDocument();
  expect(screen.getByText("1re connexion")).toBeInTheDocument();
  expect(screen.getByText("250 utilisés sur 1000 (25 %)")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Gérer les utilisateurs" })).toHaveAttribute("href", "/liste-utilisateurs");
});
