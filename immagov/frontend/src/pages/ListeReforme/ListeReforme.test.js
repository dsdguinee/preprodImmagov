import { ligneReforme } from "./ListeReforme";

jest.mock("../../services/immatriculation.service", () => ({ getAllReformes: jest.fn() }));

test("ligne de réforme SIPIM : organisme cédant, particulier sans ministère, statut", () => {
  const ligne = ligneReforme({
    reforme_id: 11, status: 1, created_at: "2026-10-08 15:50:39", immatriculation_number: "VA-1003-A", numChassie: "QYTE6377DHH377HDH",
    marque: "Toyota", model: "Camry", organismeCedant: "MINISTERE DE L'ENERGIE", proprietaire: "Aboubacar Sidiki DIALLO",
    telephone: "624373114", nouvelOrganisme: null,
  }, 0);
  expect(ligne).toEqual({
    id: 11, Ord: 1, date: "08/10/2026", numImmatriculation: "VA-1003-A", numChassis: "QYTE6377DHH377HDH", vehicule: "Toyota Camry",
    cedant: "MINISTERE DE L'ENERGIE", proprietaire: "Aboubacar Sidiki DIALLO", telephone: "624373114", status: "Validée",
  });
});
