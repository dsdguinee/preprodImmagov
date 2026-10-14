import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import moment from "moment";
import AdministrateurGeneralDashboard from "./AdministrateurGeneralDashboard";
import { dashboardAdministrateurGeneral } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ dashboardAdministrateurGeneral: jest.fn() }));

const ligne = (o) => ({ deposees: 0, validees: 0, rejetees: 0, delai: null, attente: 0, retard: 0, plusAncien: 0, tauxRejet12Mois: null, ...o });
// Même forme que la réponse de GET /immatriculation/dashboardAdministrateurGeneral
const reponse = (du, au) => ({
  success: true,
  periode: { du, au, jours: 14 },
  retardJours: 7,
  operations: {
    immatriculations: ligne({ deposees: 62, validees: 47, rejetees: 6, delai: 3.4, attente: 61, retard: 23, plusAncien: 19, tauxRejet12Mois: 8 }),
    mutations: ligne({ deposees: 22, validees: 14, rejetees: 6, delai: 2.1, attente: 5, tauxRejet12Mois: 9 }),
    reformes: ligne({ deposees: 7, validees: 4, attente: 3, delai: 4.8, tauxRejet12Mois: 0 }),
    cartesGrises: { imprimees: 51, delai: 1.2, attente: 12, retard: 0 },
  },
  precedente: { validees: 55, reformes: 4 },
  serie: [{ mois: "2026-09", entrees: 55, sorties: 7 }, { mois: "2026-10", entrees: 47, sorties: 4 }],
  parc: { total: 4812, ep: 3905, va: 907 },
  organismes: [{ nom: "Présidence de la République", n: 527, ep: 431, va: 96 }],
  nbOrganismes: 34,
  genres: [{ nom: "VEHICULES LEGERS", n: 1874 }],
  aApprouver: 4,
});

beforeEach(() => {
  dashboardAdministrateurGeneral.mockReset();
  dashboardAdministrateurGeneral.mockImplementation((du, au) => Promise.resolve(reponse(du, au)));
});

const afficher = () => render(<AdministrateurGeneralDashboard user={{ prenom: "Mamadou" }} />);

test("affiche les indicateurs, le tableau des opérations et les points d'attention, sans action", async () => {
  afficher();
  expect(await screen.findByText("Bonjour, Mamadou")).toBeInTheDocument();
  expect(dashboardAdministrateurGeneral).toHaveBeenCalledWith(moment().startOf("month").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD"));
  expect(screen.getByText("Consultation seule")).toBeInTheDocument();
  expect(screen.getByText("4 812")).toBeInTheDocument();
  expect(screen.getByText("-8 par rapport au mois précédent")).toBeInTheDocument();
  expect(screen.getByText("Dont 23 depuis plus de 7 jours")).toBeInTheDocument();

  const tableau = screen.getByRole("table");
  const mutations = within(tableau).getByText("Mutations").closest("tr");
  expect(within(mutations).getByText("30 %")).toBeInTheDocument(); // 6 rejets sur 20 traités
  expect(within(mutations).getByText("À surveiller")).toBeInTheDocument(); // plus du double de 9 %
  const immat = within(tableau).getByText("Immatriculations").closest("tr");
  expect(within(immat).getByText("23 > 7 j")).toBeInTheDocument();
  expect(within(immat).queryByText("À surveiller")).not.toBeInTheDocument(); // 11 % : sous le double de 8 %

  expect(screen.getByText("23 dossiers en attente depuis plus de 7 jours")).toBeInTheDocument();
  expect(screen.getByText("Le plus ancien attend depuis 19 jours.")).toBeInTheDocument();
  expect(screen.getByText("Taux de rejet des mutations à 30 %")).toBeInTheDocument();
  expect(screen.getByText("4 nouveaux organismes en attente d'approbation")).toBeInTheDocument();
  expect(screen.getByText("Cartes grises : 12 à imprimer")).toBeInTheDocument();

  // Consultation seule : aucun lien vers une action
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("change de période", async () => {
  afficher();
  await screen.findByText("Bonjour, Mamadou");
  fireEvent.click(screen.getByRole("button", { name: "12 derniers mois" }));
  await waitFor(() => expect(dashboardAdministrateurGeneral).toHaveBeenLastCalledWith(
    moment().subtract(12, "months").add(1, "day").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")));
  expect(await screen.findByText("-8 par rapport aux 12 mois précédents")).toBeInTheDocument();

  // Période personnalisée : intervalle de dates choisi
  fireEvent.click(screen.getByRole("button", { name: "Personnalisée" }));
  fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2026-03-01" } });
  fireEvent.change(screen.getByLabelText("Au"), { target: { value: "2026-06-30" } });
  await waitFor(() => expect(dashboardAdministrateurGeneral).toHaveBeenLastCalledWith("2026-03-01", "2026-06-30"));
  expect(await screen.findByText("Du 01/03/2026 au 30/06/2026")).toBeInTheDocument();
  expect(screen.getByText("-8 par rapport à la période précédente")).toBeInTheDocument();

  // Intervalle inversé : pas d'appel
  const appels = dashboardAdministrateurGeneral.mock.calls.length;
  fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2026-07-15" } });
  expect(dashboardAdministrateurGeneral).toHaveBeenCalledTimes(appels);
});

test("affiche le message d'erreur du serveur", async () => {
  dashboardAdministrateurGeneral.mockResolvedValue({ success: false, messages: { erreur: ["Accès réservé à l'Administrateur Général."] } });
  afficher();
  expect(await screen.findByText("Accès réservé à l'Administrateur Général.")).toBeInTheDocument();
});
