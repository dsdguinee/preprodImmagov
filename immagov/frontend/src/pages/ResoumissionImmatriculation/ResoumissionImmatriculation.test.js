import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ResoumissionImmatriculation from "./ResoumissionImmatriculation";

// Données au format des routes du backend (dossier rejeté pour son organisme : minister_id vide)
jest.mock("../../utils/vehicule.util", () => ({
  getAllMarques: async () => [{ id: 1, title: "Toyota" }],
  getAllmodel: async () => [{ id: 10, marque_id: 1, title: "Land Cruiser" }],
  getAllGenre: async () => [{ genre_id: 3, nom: "VEHICULES LEGERS" }],
  getAlltype: async () => [{ type_id: 7, genre_id: 3, nom: "4x4" }],
}));
jest.mock("../../services/organisation.service", () => ({
  getministeres: async () => [
    { ministere_id: 2, nom: "CBG", typeorganisme: "Privé" },
    { ministere_id: 24, nom: "MINISTERE des Mines", typeorganisme: "Publique" },
  ],
  getAllDirections: async () => ({ directions: [{ direction_id: 2, ministere_id: 2, nom: "Direction générale" }] }),
  getdirectionsByMinistere: async () => [],
  getMinistereById: async () => 404,
}));
jest.mock("../../services/immatriculation.service", () => ({
  ...jest.requireActual("../../services/immatriculation.service"),
  ImmatriculationRejeter: async () => ({ raison: "Organisme inexistant ou non habilité", autreraison: "Organisme proposé : Agence X", typeRejet: "organisme" }),
  getImmatriculationById: async () => ({
    status: true,
    ministere: null,
    immatriculation: { immatriculation_id: 366, modeImmatriculation: "EP", minister_id: null, direction_id: 0,
      typeOrganisme: "Privé", ancienImmatriculation: "", created_by: 9, valided_by: 1, status: 2 },
    vehicule: { vehicule_id: 366, marque_id: 1, model_id: 10, genre: 3, typeVehicule: 7, numChassie: "JTEEB71J00F005708",
      provenance: "JP", madeYear: 2020, energy: "Diesel", transmission: "Manuelle", placeNumberAssis: 5, placeNumberDebout: 0,
      nbPorte: 4, cylinderNumber: 6, kilometrage: 0, colorVehicule: "Blanc", releaseYear: "2020-01-01", pieceJointe: "documents/pieceJointe/EP-0366-A.pdf" },
  }),
}));

test("rejet d'organisme : la resoumission s'ouvre à l'étape 3 une fois le dossier chargé, avec le motif et les ministères du type du dossier", async () => {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[{ pathname: "/resoumission/366", state: { etape: 3 } }]}>
        <Routes><Route path="/resoumission/:id" element={<ResoumissionImmatriculation />} /></Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
  // Motif du rejet en haut de la page
  expect(await screen.findByText(/Organisme inexistant ou non habilité — Organisme proposé : Agence X/)).toBeInTheDocument();

  // Aucun organisme choisi : la liste invite à choisir et ne propose que les organismes « Privé », comme le dossier
  const liste = await screen.findByRole("button", { name: "Sélectionner le ministère ou l'organisme" });
  fireEvent.click(liste);
  const options = screen.getAllByRole("option").map((o) => o.textContent.trim());
  expect(options).toContain("CBG");
  expect(options).not.toContain("MINISTERE des Mines");
  expect(options).toContain("Organisme introuvable ? Le proposer");
});
