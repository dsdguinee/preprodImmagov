import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import DetailsReforme from "./DetailsReforme";
import { UserContext } from "../../services/Context/Contexts";

// Réponse réelle de GET /reforme/reforme/11 (champs utiles)
jest.mock("../../services/immatriculation.service", () => ({
  getReformeByID: async () => ({ success: true, reformes: [{
    reforme_id: 11, immatriculation_id: 434, immatriculation_number: "VA-1003-A", modeImmatriculation: "VA", qrcode: null,
    statusReforme: 0, ancienMinistere: "MINISTERE DE L'ENERGIE", ancienDirection: "INVESTIGATION",
    PrenomProprietaire: "Aboubacar Sidiki", nomProprietaire: "DIALLO", telephone: "624373114", email: "boubasid2000@yahoo.fr",
    adresse: "Dixinn,Belle-Vue", paiementReference: "OMYFAD1OKLT938083", demandeur: "Djenabou BAH", demandeur_id: 12,
    dateDemande: "2026-10-08 15:50:39", numChassie: "QYTE6377DHH377HDH", marque: "Toyota", model: "Camry",
    pieceJointe: "documents/lettreImage/VA-1003-A.pdf", piece: "documents/reforme/piece/VA-1003-A_3127.png", paiement: null,
  }] }),
  ValiderReforme: jest.fn(),
  historiqueVehicule: async () => ({ success: true, periodes: [], demandes: [] }),
}));

const afficher = (privileges) => render(
  <HelmetProvider>
    <UserContext.Provider value={{ currentUserPrivilege: privileges }}>
      <MemoryRouter initialEntries={["/details-reforme/11"]}>
        <Routes><Route path="/details-reforme/:id" element={<DetailsReforme />} /></Routes>
      </MemoryRouter>
    </UserContext.Provider>
  </HelmetProvider>
);

test("réforme SIPIM en attente : cession organisme → nouveau propriétaire, coordonnées, pièce et actions du validateur", async () => {
  afficher([{ privilege: "Validation", user_id: 1 }]);
  expect(await screen.findByText("Réforme · VA-1003-A")).toBeInTheDocument();
  expect(screen.getByText("En attente")).toBeInTheDocument();
  expect(screen.getByText("MINISTERE DE L'ENERGIE")).toBeInTheDocument();
  expect(screen.getByText("Aboubacar Sidiki DIALLO")).toBeInTheDocument();
  expect(screen.getByText("boubasid2000@yahoo.fr")).toBeInTheDocument();
  expect(screen.getByText("Dixinn,Belle-Vue")).toBeInTheDocument();
  expect(screen.getByText("OMYFAD1OKLT938083")).toBeInTheDocument();
  expect(screen.getByAltText("Pièce d'identité du nouveau propriétaire")).toBeInTheDocument();
  expect(screen.getByText("Pièce d'identité du nouveau propriétaire")).toBeInTheDocument();
  expect(screen.queryByText("Reçu de paiement")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Valider la réforme" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Rejeter" })).toBeInTheDocument();
});

test("sans le privilège de validation : pas d'actions", async () => {
  afficher([{ privilege: "Nouvelle immatriculation", user_id: 7 }]);
  expect(await screen.findByText("Réforme · VA-1003-A")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Valider la réforme" })).not.toBeInTheDocument();
  expect(screen.queryByText("Corriger et resoumettre")).not.toBeInTheDocument();
});

test("réforme SIPIM rejetée : l'agent qui l'a demandée peut la reprendre, même sans le privilège « Nouvelle Reforme »", async () => {
  const service = require("../../services/immatriculation.service");
  const original = service.getReformeByID;
  service.getReformeByID = async () => {
    const r = await original();
    return { ...r, reformes: [{ ...r.reformes[0], statusReforme: 2, motifRejet: "La pièce est floue" }] };
  };
  afficher([{ privilege: "Nouvelle immatriculation", user_id: 12 }]);
  expect(await screen.findByText("La pièce est floue")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Corriger et resoumettre" })).toHaveAttribute("href", "/resoumission-reforme/11");
  service.getReformeByID = original;
});
