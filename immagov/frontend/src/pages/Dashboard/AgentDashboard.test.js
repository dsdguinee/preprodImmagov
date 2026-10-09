import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AgentDashboard from "./AgentDashboard";

// Même forme que la réponse de GET /immatriculation/dashboardAgent
const dossier = (id, numero, status, marque, modele, affectation, created_at) => ({
  immatriculation_id: id, immatriculation_number: numero, status, marque, modele, affectation,
  numChassie: "JTEBH9FJ60K2021" + id, created_at, updated_at: created_at,
});
const data = {
  success: true,
  isAgent: true,
  stats: { totaux: 9, attente: 4, valider: 3, rejete: 2 },
  moisCourant: 3,
  moisPrecedent: 1,
  parMois: ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"].map((mois, i) => ({ mois, total: i, valides: 0 })),
  derniers: [
    dossier(433, "EP-0430-A", 0, "Toyota", "Corolla", "CBG", "2026-10-07 18:48:11"),
    dossier(432, "EP-0429-A", 1, "Toyota", "Hilux", "EDG", "2026-10-06 10:00:00"),
    dossier(431, "EP-0428-A", 2, "Nissan", "Patrol", null, "2026-10-05 10:00:00"),
  ],
  rejets: [{ ...dossier(431, "EP-0428-A", 2, "Nissan", "Patrol", null, "2026-10-05 10:00:00"), motif: "Lettre illisible" }],
  rejetsOperations: [
    { type: "mutation", id: 9, immatriculation_id: 431, immatriculation_number: "EP-0428-A", marque: "Toyota", modele: "Celica",
      affectation: "MINISTERE DES TRANSPORTS", motif: "Pièce jointe illisible", created_at: "2026-10-08 14:50:08", updated_at: "2026-10-08 16:00:00" },
    { type: "reforme", id: 11, immatriculation_id: 434, immatriculation_number: "VA-1003-A", marque: "Toyota", modele: "Camry",
      affectation: "Aboubacar Sidiki DIALLO", motif: "La pièce est floue", created_at: "2026-10-08 15:50:39", updated_at: "2026-10-08 16:00:06" },
  ],
  attenteOperations: [
    { type: "reforme", id: 12, immatriculation_id: 436, immatriculation_number: "VA-1005-A", marque: "Toyota", modele: "Prado",
      affectation: "Fatoumata CAMARA", created_at: "2020-01-01 09:00:00", updated_at: "2020-01-01 09:00:00" },
  ],
  attente: [dossier(375, "VA-1001-A", 0, "Toyota", "HILUX", "MINISTERE DES TRANSPORTS", "2023-02-09 12:38:20")],
};

const NouvelleImmat = () => <p>Nouvelle immatriculation : {useLocation().state?.reference}</p>;
const afficher = () => render(
  <MemoryRouter initialEntries={["/dashboard"]}>
    <Routes>
      <Route path="/dashboard" element={<AgentDashboard data={data} user={{ prenom: "Bakary" }} />} />
      <Route path="/nouvelleimmatriculation" element={<NouvelleImmat />} />
    </Routes>
  </MemoryRouter>
);

test("indicateurs, filtre du tableau et dossier rejeté avec son motif", () => {
  afficher();
  expect(screen.getByText("Bonjour, Bakary")).toBeInTheDocument();
  expect(screen.getByText("+2 par rapport au mois dernier")).toBeInTheDocument();

  const tableau = screen.getByRole("table");
  expect(within(tableau).getAllByRole("row")).toHaveLength(4); // en-tête + 3 dossiers
  fireEvent.click(screen.getByRole("button", { name: /Validés$/ }));
  expect(within(tableau).getAllByRole("row")).toHaveLength(2); // les validés parmi les derniers dossiers
  expect(within(tableau).getByText("EP-0429-A")).toBeInTheDocument();

  expect(screen.getByText("Lettre illisible")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Corriger le dossier EP-0428-A" })).toHaveAttribute("href", "/resoumission/431");

  // Filtre « Rejetés » : tous les dossiers rejetés, chacun avec son lien de correction
  fireEvent.click(screen.getByRole("button", { name: /Rejetés$/ }));
  expect(within(tableau).getAllByRole("row")).toHaveLength(4); // 1 immatriculation + 1 mutation + 1 réforme
  expect(within(tableau).getByRole("link", { name: "Corriger" })).toHaveAttribute("href", "/resoumission/431");
});

test("« Vérifier et commencer » contrôle la référence puis ouvre la nouvelle immatriculation", () => {
  afficher();
  const champ = screen.getByPlaceholderText("Ex. IB8HBCT9V9L533073");
  fireEvent.change(champ, { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Vérifier et commencer" }));
  expect(screen.getByRole("alert")).toHaveTextContent("entre 10 et 22 caractères");

  fireEvent.change(champ, { target: { value: "ib8hbct9v9l533073" } });
  fireEvent.click(screen.getByRole("button", { name: "Vérifier et commencer" }));
  expect(screen.getByText("Nouvelle immatriculation : IB8HBCT9V9L533073")).toBeInTheDocument();
});

test("mutations et réformes rejetées : listées avec leur motif et un lien vers leur fiche", () => {
  afficher();
  expect(screen.getByText("Pièce jointe illisible")).toBeInTheDocument();
  expect(screen.getByText("La pièce est floue")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Mutation rejetée du véhicule EP-0428-A" })).toHaveAttribute("href", "/details-mutation/9");
  expect(screen.getByRole("link", { name: "Réforme rejetée du véhicule VA-1003-A" })).toHaveAttribute("href", "/details-reforme/11");
  expect(document.querySelector(".agent-count")).toHaveTextContent("3"); // 1 immatriculation + 1 mutation + 1 réforme

  // Carte « Rejetés à corriger » : 2 immatriculations (stats) + 1 mutation + 1 réforme
  const carte = screen.getByRole("button", { name: /Rejetés à corriger/ });
  expect(within(carte).getByText("4")).toBeInTheDocument();
  expect(within(carte).getByText("2 immatriculations · 1 mutation · 1 réforme")).toBeInTheDocument();
  fireEvent.click(carte);
  const tableau = screen.getByRole("table");
  expect(within(tableau).getAllByRole("row")).toHaveLength(4); // en-tête + 1 immatriculation + 1 mutation + 1 réforme
  expect(within(tableau).getByRole("link", { name: "VA-1003-A" })).toHaveAttribute("href", "/details-reforme/11");
});

test("mutations et réformes en attente : comptées dans « En attente de validation » et listées par le filtre", () => {
  afficher();
  // 4 immatriculations (stats) + 1 réforme
  const carte = screen.getByRole("button", { name: /En attente de validation/ });
  expect(within(carte).getByText("5")).toBeInTheDocument();
  expect(within(carte).getByText(/^4 immatriculations · 1 réforme · le plus ancien : /)).toBeInTheDocument();
  fireEvent.click(carte);
  const tableau = screen.getByRole("table");
  expect(within(tableau).getAllByRole("row")).toHaveLength(3); // en-tête + 1 immatriculation + 1 réforme
  expect(within(tableau).getByRole("link", { name: "VA-1005-A" })).toHaveAttribute("href", "/details-reforme/12");
});
