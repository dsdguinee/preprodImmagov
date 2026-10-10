import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import DirecteurDashboard from "./DirecteurDashboard";
import { UserContext } from "../../services/Context/Context";

// Réponse de /directeur/dashboard telle que renvoyée par le backend (valeurs SQL en chaînes)
const REPONSE = {
  status: 200,
  periode: { debut: "2026-10-01 00:00:00", fin: "2026-10-10 12:00:00" },
  kpis: { initie: 10, valide: "9", rejete: "0", montant: "8980000.00" },
  kpisPrecedents: { initie: 5, valide: "4", rejete: "1", montant: "4000000.00" },
  cumul: { montant: "8980000.00", montantPrec: null },
  sources: { vignette: "500000.0", cartegrise: "3400000.00", autorisation: "0.0", plaque: "1400000", reforme: "3500000", frais: "180000" },
  operations: [
    { libelle: "reforme", nombre: 2, valide: "2", montant: "3540000.00" },
    { libelle: "immatriculation", nombre: 4, valide: "3", montant: "2310000.00" },
    { libelle: "services", nombre: 1, valide: "1", montant: "320000.00" },
  ],
  mensuel: [{ mois: "2026-10", vignette: "500000", cartegrise: "3400000", autorisation: "0", reforme: "3500000", plaque: "1400000", frais: "180000" }],
  regions: [{ libelle: "Conakry", montant: "8980000.00" }],
  agences: [
    { agence_id: 1, nom_agence: "SACOF", nombre: "10", rejete: "0", montant: "8980000.00", montantPrec: "4000000.00" },
    { agence_id: 14, nom_agence: "Agence Tombo", nombre: null, rejete: null, montant: "0.00", montantPrec: "0.00" },
  ],
  immagov: { total: 8, utilises: "7", nonUtilises: "1", montantNonUtilise: "370000.00", nonUtilises7j: "0", delaiHeures: "5.0000" },
  vigilance: { nonValide: "1", nonValide48h: "1", aAutoriser: "0", agentsRejet: 0 },
};

// jsdom n'a pas ResizeObserver (utilisé par les graphiques Recharts)
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const mockApiData = jest.fn();
jest.mock("../../services/Api", () => function Api() { return { apiData: (...args) => mockApiData(...args) }; });

beforeEach(() => {
  mockApiData.mockImplementation((methode, url) =>
    Promise.resolve(url.startsWith("/agence") ? { status: 200, agences: [{ agence_id: 1, nom_agence: "SACOF" }] } : REPONSE));
  render(
    <MemoryRouter>
      <RecoilRoot>
        <UserContext.Provider value={{ user: { prenom: "fatou" } }}>
          <DirecteurDashboard />
        </UserContext.Provider>
      </RecoilRoot>
    </MemoryRouter>
  );
});

describe("Tableau de bord directeur", () => {
  it("affiche les indicateurs de la période", async () => {
    expect(await screen.findByText("Recettes encaissées")).toBeInTheDocument();
    expect(screen.getByText(/Bonjour Fatou|Bonsoir Fatou/)).toBeInTheDocument();
    // 8 980 000 / 9 validés ; 7 opérations sur 8 traitées par immagov
    expect(screen.getByText("Paiement moyen")).toBeInTheDocument();
    expect(screen.getByText("87,5")).toBeInTheDocument();
    expect(screen.getByText("1 opération(s) en attente")).toBeInTheDocument();
  });

  it("libelle les opérations et signale les agences sans activité", async () => {
    expect(await screen.findByText("Vignette / autorisation seules")).toBeInTheDocument();
    expect(screen.getAllByText("Réforme").length).toBeGreaterThan(0);
    expect(screen.getByText("Aucune activité")).toBeInTheDocument();
    expect(screen.getByText(/1 agence\(s\) sans activité/)).toBeInTheDocument();
    expect(screen.getByText("5 h")).toBeInTheDocument();
  });

  it("affiche les points de vigilance", async () => {
    expect(await screen.findByText(/attendent une validation depuis plus de 48 h/)).toBeInTheDocument();
    expect(screen.queryByText(/autorisation de resoumission/)).not.toBeInTheDocument();
  });

  it("recharge les données pour l'agence choisie", async () => {
    fireEvent.change(await screen.findByLabelText("Agence"), { target: { value: "1" } });
    await waitFor(() => expect(mockApiData).toHaveBeenCalledWith("get", "/directeur/dashboard?periode=mois&agence_id=1"));
  });
});
