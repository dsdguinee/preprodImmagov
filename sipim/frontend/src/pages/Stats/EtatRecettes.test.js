import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import EtatRecettes from "./EtatRecettes";
import { UserContext } from "../../services/Context/Context";

// Lignes de /paiement/etat-recettes (valeurs SQL en chaînes)
const LIGNES = [
  { region: "BOKE", prefecture: "BOKE", commune: "KAMSAR", agence: "SACOF", paiements: 9, immatriculations: "3", reimmatriculations: "1",
    mutations: "2", reformes: "2", services: "1", vignette: "500000.0", cartegrise: "3400000.00", autorisation: "0.0",
    plaque: "1400000", reforme: "3500000", frais: "180000", total: "8980000.00" },
  { region: "CONAKRY", prefecture: "CONAKRY", commune: "KALOUM", agence: "DSD", paiements: 1, immatriculations: "1", reimmatriculations: "0",
    mutations: "0", reformes: "0", services: "0", vignette: "0", cartegrise: "800000", autorisation: "0",
    plaque: "0", reforme: "0", frais: "20000", total: "820000" },
];
const decoupage = { regions: [{ region_id: 1, nom: "BOKE" }], prefectures: [{ prefecture_id: 3, region_id: 1, nom: "BOKE" }] };

const mockApiData = jest.fn();
jest.mock("../../services/Api", () => function Api() { return { apiData: (...args) => mockApiData(...args) }; });

let blobs;
beforeEach(() => {
  blobs = [];
  global.URL.createObjectURL = jest.fn((blob) => { blobs.push(blob); return "blob:x"; });
  global.URL.revokeObjectURL = jest.fn();
  mockApiData.mockImplementation((methode, url) =>
    Promise.resolve(url.startsWith("/agence") ? { status: 200, AgencesPref: [{ agence_id: 1, nom_agence: "SACOF", commune: "KAMSAR" }] }
      : { status: 200, lignes: LIGNES }));
});

const afficher = () => render(
  <RecoilRoot>
    <UserContext.Provider value={{ decoupage }}>
      <EtatRecettes />
    </UserContext.Provider>
  </RecoilRoot>
);

const lireBlob = (blob) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsText(blob); });

describe("État des recettes", () => {
  it("affiche les lignes par agence et la ligne de totaux", async () => {
    afficher();
    expect(await screen.findByText("SACOF")).toBeInTheDocument();
    const totaux = screen.getAllByRole("row").pop();
    expect(within(totaux).getByText("Total")).toBeInTheDocument();
    expect(within(totaux).getByText("9 800 000")).toBeInTheDocument(); // 8 980 000 + 820 000
    expect(within(totaux).getByText("10")).toBeInTheDocument(); // paiements validés
    expect(mockApiData.mock.calls[0][1]).toMatch(/^\/paiement\/etat-recettes\?date_debut=\d{4}-\d{2}-01&date_fin=.*&groupe=agence&region_id=0/);
  });

  it("exporte en CSV avec l'en-tête du rapport et les totaux", async () => {
    afficher();
    await screen.findByText("SACOF");
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    const csv = await lireBlob(blobs[0]);
    expect(csv).toContain("État des recettes");
    expect(csv).toContain("Toutes les agences · Regroupement par agence");
    expect(csv).toContain("Région;Préfecture;Commune;Agence;Paiements validés");
    expect(csv).toContain("BOKE;BOKE;KAMSAR;SACOF;9;3;1;2;2;1;500000;3400000;0;1400000;3500000;180000;8980000");
    expect(csv).toContain("Total;;;;10;4;1;2;2;1;500000;4200000;0;1400000;3500000;200000;9800000");
  });

  it("exporte en Excel avec des cellules numériques", async () => {
    afficher();
    await screen.findByText("SACOF");
    fireEvent.click(screen.getByRole("button", { name: "Excel" }));
    const xls = await lireBlob(blobs[0]);
    expect(xls).toContain("<h2>État des recettes</h2>");
    expect(xls).toContain(">8980000</td>");
    expect(blobs[0].type).toContain("application/vnd.ms-excel");
  });

  it("recharge avec le regroupement et la région choisis", async () => {
    afficher();
    await screen.findByText("SACOF");
    fireEvent.change(screen.getByLabelText("Regrouper par"), { target: { value: "region" } });
    fireEvent.change(screen.getByLabelText("Région"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Afficher" }));
    await waitFor(() => expect(mockApiData).toHaveBeenLastCalledWith("get", expect.stringContaining("groupe=region&region_id=1")));
    expect(await screen.findByText(/Région : BOKE · Regroupement par région/)).toBeInTheDocument();
  });

  it("refuse une date de fin antérieure à la date de début", async () => {
    afficher();
    await screen.findByText("SACOF");
    fireEvent.change(screen.getByLabelText("Date début"), { target: { value: "2026-10-09" } });
    fireEvent.change(screen.getByLabelText("Date fin"), { target: { value: "2026-10-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Afficher" }));
    expect(await screen.findByText(/La date de fin doit être postérieure/)).toBeInTheDocument();
  });
});
