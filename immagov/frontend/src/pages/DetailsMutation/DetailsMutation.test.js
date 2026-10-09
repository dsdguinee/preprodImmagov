import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import DetailsMutation from "./DetailsMutation";
import { UserContext } from "../../services/Context/Contexts";

// Réponse réelle de GET /mutation/getmutationBy/9 (champs utiles)
jest.mock("../../services/immatriculation.service", () => ({
  getMutationById: async () => ({ success: true, mutation: [{
    mutation_id: 9, immatriculation_id: 431, immatriculation_number: "EP-0428-A", modeImmatriculation: "EP", qrcode: null,
    NouveauStatus: 0, ancienMinistere: "MINISTERE des Mines", ancienDirection: null, NouveMinistere: "MINISTERE DES TRANSPORTS",
    nouvelleDirection: "SECRETARIAT GENERAL", demandeur: "Djenabou BAH", demandeur_id: 12, dateDemande: "2026-10-08 14:50:08",
    paiementReference: "MLOBI0UVCC9803083", motif: "Mutation payée dans SIPIM (référence MLOBI0UVCC9803083)", fonction: "Non renseignée",
    numChassie: "JTEBD9FJ70K016116", marque: "Toyota", model: "Celica", pieceJointe: "documents/lettreImage/EP-0428-A.png",
    document2: "documents/mutation/document2/EP-0428-A_1115.png",
  }] }),
  mutationValided: jest.fn(),
  historiqueVehicule: async () => ({ success: true, periodes: [], demandes: [] }),
}));

const afficher = (privileges) => render(
  <HelmetProvider>
    <UserContext.Provider value={{ currentUserPrivilege: privileges }}>
      <MemoryRouter initialEntries={["/details-mutation/9"]}>
        <Routes><Route path="/details-mutation/:id" element={<DetailsMutation />} /></Routes>
      </MemoryRouter>
    </UserContext.Provider>
  </HelmetProvider>
);

test("mutation en attente : affectation avant → après, référence, pièces jointes et actions du validateur", async () => {
  afficher([{ privilege: "Validation", user_id: 1 }]);
  expect(await screen.findByText("Mutation · EP-0428-A")).toBeInTheDocument();
  expect(screen.getByText("En attente")).toBeInTheDocument();
  expect(screen.getByText("MINISTERE des Mines")).toBeInTheDocument();
  expect(screen.getByText("MINISTERE DES TRANSPORTS")).toBeInTheDocument();
  expect(screen.getByText("SECRETARIAT GENERAL")).toBeInTheDocument();
  expect(screen.getByText(/Demandée par Djenabou BAH le 08\/10\/2026/)).toBeInTheDocument();
  expect(screen.getAllByText("MLOBI0UVCC9803083").length).toBeGreaterThan(0);
  expect(screen.getByText("Pièce jointe de la mutation")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Valider la mutation" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Rejeter" })).toBeInTheDocument();
});

test("agent sans droit de validation : pas de bouton Valider", async () => {
  afficher([{ privilege: "Nouvelle Mutation", user_id: 12 }]);
  await screen.findByText("Mutation · EP-0428-A");
  expect(screen.queryByRole("button", { name: "Valider la mutation" })).not.toBeInTheDocument();
});
