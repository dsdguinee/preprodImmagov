import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ParcDisponibiliteCard from "./ParcDisponibiliteCard";
import { getStatsParc, getVehiculesParc } from "../../services/disponibilite.service";
import { exportCsv, exportExcel } from "../DataGrid/utils";

jest.mock("../../services/disponibilite.service", () => ({ getStatsParc: jest.fn(), getVehiculesParc: jest.fn() }));
jest.mock("../DataGrid/utils", () => ({ exportCsv: jest.fn(), exportExcel: jest.fn() }));

const afficher = () => render(<MemoryRouter><ParcDisponibiliteCard /></MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
  getStatsParc.mockResolvedValue({ success: true, total: 2, disponibles: 1, indisponibles: 1, parMotif: [{ motif: "Panne", total: 1 }], recents: [], gestion: false });
  getVehiculesParc.mockResolvedValue({ success: true, vehicules: [
    { immatriculation_id: 1, immatriculation_number: "VA-0001-A", indisponibilite_id: 7, motif: "Panne", date_debut: "2026-10-01", declare_par_nom: "MAMADOU DIAN BARRY" },
    { immatriculation_id: 2, immatriculation_number: "VA-0002-A", indisponibilite_id: null },
  ] });
});

test("export Excel de tout le parc, avec l'état de chaque véhicule", async () => {
  afficher();
  fireEvent.click(await screen.findByRole("button", { name: "Exporter en Excel" }));
  await waitFor(() => expect(exportExcel).toHaveBeenCalled());
  const [colonnes, lignes, getRowId, nom] = exportExcel.mock.calls[0];
  expect(nom).toMatch(/^Parc automobile \d{4}-\d{2}-\d{2}$/);
  expect(colonnes.map((c) => c.headerName)).toEqual(expect.arrayContaining(["Immatriculation", "État", "Motif", "Indisponible depuis le", "Déclaré par"]));
  expect(lignes).toHaveLength(2);
  expect(lignes[0]).toMatchObject({ etat: "Indisponible", depuis: "01/10/2026", motif: "Panne" });
  expect(lignes[1]).toMatchObject({ etat: "Disponible", depuis: "", duree: "" });
  expect(getRowId(lignes[1])).toBe(2);
  expect(exportCsv).not.toHaveBeenCalled();
});

test("export CSV et message si la liste ne peut pas être chargée", async () => {
  afficher();
  fireEvent.click(await screen.findByRole("button", { name: "CSV" }));
  await waitFor(() => expect(exportCsv).toHaveBeenCalled());

  getVehiculesParc.mockResolvedValue({ success: false, messages: {} });
  fireEvent.click(screen.getByRole("button", { name: "CSV" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Export impossible");
});

test("bloc masqué pour un rôle sans accès", async () => {
  getStatsParc.mockResolvedValue({ success: false, status: 403 });
  const { container } = afficher();
  await waitFor(() => expect(getStatsParc).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});
