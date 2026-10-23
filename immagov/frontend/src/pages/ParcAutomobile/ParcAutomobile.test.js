import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ParcAutomobile from "./ParcAutomobile";
import { getVehiculesParc, rendreIndisponible } from "../../services/disponibilite.service";

jest.mock("../../services/disponibilite.service", () => ({
  getVehiculesParc: jest.fn(),
  rendreIndisponible: jest.fn(),
  rendreDisponible: jest.fn(),
  getHistoriqueDisponibilite: jest.fn(),
  urlFichier: (chemin) => `/storage/${chemin}`,
}));
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));

// Même forme que GET /disponibilite/vehicules
const vehicule = (id, numero, indispo) => ({
  immatriculation_id: id, immatriculation_number: numero, marque: "Toyota", modele: "Hilux", type: "Pickup",
  affectation: "MINISTÈRE DES TRANSPORTS", indisponibilite_id: null, ...indispo,
});
const reponse = (gestion) => ({
  success: true, gestion, motifs: ["Panne", "Accident", "Autre"],
  vehicules: [
    vehicule(1, "VA-0001-A", { indisponibilite_id: 7, motif: "Panne", description: "Moteur", date_debut: "2026-10-01",
      fiche_technique: "documents/disponibilite/fiche.pdf", preuve: null, declare_par_nom: "MAMADOU DIAN BARRY" }),
    vehicule(2, "VA-0002-A"),
  ],
});
const afficher = () => render(<HelmetProvider><MemoryRouter><ParcAutomobile /></MemoryRouter></HelmetProvider>);

test("tableau des véhicules indisponibles et fiche technique obligatoire (Direction Générale GG)", async () => {
  getVehiculesParc.mockResolvedValue(reponse(true));
  afficher();
  expect(await screen.findByText("Véhicules indisponibles")).toBeInTheDocument();

  // Tableau des indisponibles : motif, déclarant, pièce jointe
  const tableaux = screen.getAllByRole("table");
  const indispo = within(tableaux[0]);
  expect(indispo.getByText("VA-0001-A")).toBeInTheDocument();
  expect(indispo.queryByText("VA-0002-A")).not.toBeInTheDocument();
  expect(indispo.getByText("MAMADOU DIAN BARRY")).toBeInTheDocument();
  expect(indispo.getByRole("link", { name: "Fiche" })).toHaveAttribute("href", "/storage/documents/disponibilite/fiche.pdf");

  // Rendre indisponible sans fiche : refusé avant tout envoi
  fireEvent.click(within(tableaux[1]).getByRole("button", { name: "Rendre indisponible" }));
  const fenetre = within(screen.getByRole("dialog"));
  fireEvent.change(fenetre.getByLabelText(/Motif/), { target: { value: "Accident" } });
  fireEvent.click(fenetre.getByRole("button", { name: "Rendre indisponible" }));
  expect(await screen.findByText("La fiche technique scannée est obligatoire.")).toBeInTheDocument();
  expect(rendreIndisponible).not.toHaveBeenCalled();

  // Avec la fiche : envoyée
  rendreIndisponible.mockResolvedValue({ success: true });
  const fiche = new File(["%PDF"], "fiche.pdf", { type: "application/pdf" });
  fireEvent.change(fenetre.getByLabelText(/Fiche technique du véhicule/), { target: { files: [fiche] } });
  fireEvent.click(fenetre.getByRole("button", { name: "Rendre indisponible" }));
  expect(await screen.findAllByText("VA-0001-A")).not.toHaveLength(0);
  expect(rendreIndisponible).toHaveBeenCalledWith(expect.objectContaining({ immatriculation_id: 2, motif: "Accident", fiche_technique: fiche, preuve: null }));
});

test("consultation seule : aucune action de gestion (administrateur)", async () => {
  getVehiculesParc.mockResolvedValue(reponse(false));
  afficher();
  expect(await screen.findByText(/Consultation seule/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Rendre indisponible" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Rendre disponible" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Historique" }).length).toBeGreaterThan(0);
});
