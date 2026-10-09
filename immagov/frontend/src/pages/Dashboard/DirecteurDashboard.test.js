import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import moment from "moment";
import DirecteurDashboard from "./DirecteurDashboard";
import { dashboardDirecteur } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ dashboardDirecteur: jest.fn() }));

// Même forme que la réponse de GET /immatriculation/dashboardDirecteur
const reponse = (du, au) => ({
  success: true,
  periode: { du, au, jours: 7, pas: "jour" },
  decisions: { valides: 12, rejets: 3, delai: 2.4 },
  precedente: { valides: 8, rejets: 1, delai: 3 },
  serie: [{ cle: "2026-10-06", debut: "2026-10-06", valides: 5, rejets: 1 }, { cle: "2026-10-07", debut: "2026-10-07", valides: 7, rejets: 2 }],
  attente: { total: 67, retard: 64 },
  file: {
    immatriculations: [
      { id: 366, numero: "EP-0366-A", created_at: moment().subtract(20, "days").format("YYYY-MM-DD HH:mm:ss"), nouvel: 0, chassis: "JTEEB71J00F005708", marque: "Toyota", modele: "Land Cruiser", affectation: "ACGP", agent: "RAMATOULAYE SOW" },
      { id: 428, numero: "EP-0428-A", created_at: moment().format("YYYY-MM-DD HH:mm:ss"), nouvel: 1, chassis: "JTEBH9FJ60K202119", marque: "Toyota", modele: "Corolla", affectation: "MINISTERE des Mines", agent: "BAKARY TRAORE" },
    ],
    resoumis: [
      { id: 437, numero: "VA-1004-A", created_at: "2026-10-07 20:38:31", resoumis_le: moment().format("YYYY-MM-DD HH:mm:ss"), nouvel: 0, chassis: "MR0DB9CD4N4992272",
        marque: "Toyota", modele: "Hilux", affectation: "MINISTERE des Mines", agent: "BAKARY TRAORE", nb_rejets: 1, dernier_motif: "Organisme inexistant ou non habilité" },
    ],
    reformes: [],
    mutations: [],
  },
  compteurs: { immatriculations: 67, resoumis: 1, reformes: 0, mutations: 0 },
  aApprouver: [{ id: 428, numero: "EP-0428-A", nom: "MINISTERE des Mines", agent: "BAKARY TRAORE" }],
  aImprimer: 365,
  parc: { total: 365, ep: 365, va: 0 },
  organismes: [{ nom: "CBG", n: 311 }],
  agents: [{ nom: "BAKARY TRAORE", soumis: 3, attente: "3", rejets: "0" }],
});

beforeEach(() => {
  dashboardDirecteur.mockReset();
  dashboardDirecteur.mockImplementation((du, au) => Promise.resolve(reponse(du, au)));
});

const afficher = () => render(<MemoryRouter><DirecteurDashboard user={{ prenom: "Demba" }} /></MemoryRouter>);

test("affiche les indicateurs, la file et le lien d'approbation d'un nouvel organisme", async () => {
  afficher();
  expect(await screen.findByText("Bonjour, Demba")).toBeInTheDocument();
  expect(dashboardDirecteur).toHaveBeenCalledWith(moment().startOf("month").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD"));
  expect(screen.getByText("Dont 64 depuis plus de 7 jours · toutes périodes")).toBeInTheDocument();
  expect(screen.getByText("+4 par rapport à la période précédente")).toBeInTheDocument();
  expect(screen.getByText("20 %")).toBeInTheDocument(); // 3 rejets sur 15 traités

  const tableau = screen.getAllByRole("table")[0]; // la file de validation (le 2e tableau : activité des agents)
  expect(within(tableau).getByRole("link", { name: "Examiner" })).toHaveAttribute("href", "/details-immatriculation/366");
  expect(within(tableau).getByRole("link", { name: "Approuver l'organisme" })).toHaveAttribute("href", "/organisation/ministere/create/428");

  fireEvent.click(screen.getByRole("checkbox"));
  expect(within(screen.getAllByRole("table")[0]).queryByText("EP-0428-A")).not.toBeInTheDocument();

  // Onglet « Resoumis » : dossier corrigé par l'agent, avec le motif du rejet précédent
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("tab", { name: /Resoumis/ }));
  const file = screen.getAllByRole("table")[0];
  expect(within(file).getByText("VA-1004-A")).toBeInTheDocument();
  expect(within(file).getByText("Rejet précédent : Organisme inexistant ou non habilité")).toBeInTheDocument();
  expect(within(file).getByRole("link", { name: "Examiner" })).toHaveAttribute("href", "/details-immatriculation/437");
  fireEvent.click(screen.getByRole("checkbox"));

  fireEvent.click(screen.getByRole("tab", { name: /Réformes/ }));
  expect(screen.getByText("Aucun dossier en attente depuis plus de 7 jours.")).toBeInTheDocument();
});

test("change de période : dates rapides puis période personnalisée", async () => {
  afficher();
  await screen.findByText("Bonjour, Demba");

  fireEvent.click(screen.getByRole("button", { name: "7 derniers jours" }));
  await waitFor(() => expect(dashboardDirecteur).toHaveBeenLastCalledWith(
    moment().subtract(6, "days").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")));

  fireEvent.click(screen.getByRole("button", { name: "Personnalisée" }));
  fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2022-11-01" } });
  fireEvent.change(screen.getByLabelText("Au"), { target: { value: "2022-11-10" } });
  await waitFor(() => expect(dashboardDirecteur).toHaveBeenLastCalledWith("2022-11-01", "2022-11-10"));
  expect(await screen.findAllByText("Du 01/11/2022 au 10/11/2022")).not.toHaveLength(0);
});
