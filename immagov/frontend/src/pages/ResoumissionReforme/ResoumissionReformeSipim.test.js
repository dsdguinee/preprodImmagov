import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ResoumissionReformeSipim from "./ResoumissionReformeSipim";
import { resoumettreReforme } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({
  resoumettreReforme: jest.fn(),
  reformeDepuisPaiement: jest.fn(),
  historiqueVehicule: async () => ({ success: true, periodes: [], demandes: [] }),
}));

// Réforme 11 rejetée (réponse de GET /reforme/reforme/11)
const reforme = {
  reforme_id: 11, immatriculation_id: 434, immatriculation_number: "VA-1003-A", modeImmatriculation: "VA", statusReforme: 2,
  paiementReference: "OMYFAD1OKLT938083", motifRejet: "La pièce est floue", validePar: "Mamadou CAMARA", dateDecision: "2026-10-08 16:00:06",
  PrenomProprietaire: "Aboubacar Sidiki", nomProprietaire: "DIALLO", telephone: "624373114", email: "", adresse: "Dixinn,Belle-Vue",
  piece: "documents/reforme/piece/VA-1003-A_3127.png", numChassie: "QYTE6377DHH377HDH", marque: "Toyota", model: "Camry",
  ancienMinistere: "MINISTERE DE L'ENERGIE", ancienDirection: "INVESTIGATION",
};

test("reprise d'une réforme rejetée : motif rappelé, données reprises, resoumission avec la même référence", async () => {
  resoumettreReforme.mockResolvedValue({ success: true, numero: "VA-1003-A" });
  render(<HelmetProvider><MemoryRouter><ResoumissionReformeSipim reforme={reforme} /></MemoryRouter></HelmetProvider>);
  expect(screen.getByRole("status")).toHaveTextContent("Réforme rejetée le 08/10/2026 par Mamadou CAMARA. Motif : La pièce est floue");
  expect(screen.getByText(/aucun nouveau paiement/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // véhicule
  fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // nouveau propriétaire
  expect(screen.getByDisplayValue("Dixinn,Belle-Vue")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Téléphone/), { target: { value: "624 37 31 14" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // pièce d'identité : photo déjà enregistrée
  expect(screen.getByText("Photo déjà enregistrée · remplacez-la si besoin")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

  fireEvent.click(screen.getByRole("button", { name: "Resoumettre la réforme" }));
  await waitFor(() => expect(resoumettreReforme).toHaveBeenCalled());
  const envoye = resoumettreReforme.mock.calls[0][0];
  expect([envoye.reforme.reforme_id, envoye.reforme.proprietaire.telephone, envoye.image4]).toEqual([11, "624 37 31 14", reforme.piece]);
});
