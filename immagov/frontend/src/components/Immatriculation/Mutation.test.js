import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MutationAffectation, MutationSoumission } from "./Mutation";
import { mutationDepuisPaiement } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ mutationDepuisPaiement: jest.fn() }));

// Dossier repris (réponse de GET /mutation/dossierParChassis)
const dossier = { immatriculation_id: 431, immatriculation_number: "EP-0428-A", numChassie: "JTEBD9FJ70K016116",
  marque: "Toyota", modele: "Celica", minister_id: 24, direction_id: 0, ministere: "MINISTERE des Mines", direction: null };
const base = {
  mutation: { dossier }, paiementReference: "MLOBI0UVCC9803083", typeOrganisme: "Privé", ministere: 0, direction: 0,
  image4: new File(["%PDF"], "lettre.pdf", { type: "application/pdf" }),
  organisations: {
    allMinisteres: [
      { ministere_id: 2, nom: "CBG", typeorganisme: "Privé" },
      { ministere_id: 24, nom: "MINISTERE des Mines", typeorganisme: "Privé" },
      { ministere_id: 9, nom: "Ministère de la Santé", typeorganisme: "Publique" },
    ],
    allDirections: { directions: [{ direction_id: 5, ministere_id: 2, nom: "Direction générale" }] },
  },
};

const Affectation = ({ onNext }) => {
  const [imm, setImm] = useState(base);
  const [chk, setChk] = useState({});
  return <MutationAffectation immatriculation={imm} setImmatriculation={setImm} handleNextStep={onNext} handlePrevStep={() => {}} stepChk={chk} setStepChk={setChk} />;
};

test("nouvelle affectation : organismes du type du dossier, sans l'organisme actuel, choix obligatoire", () => {
  const suivant = jest.fn();
  render(<Affectation onNext={suivant} />);
  expect(screen.getByText("MINISTERE des Mines")).toBeInTheDocument(); // organisme actuel rappelé
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(screen.getByText("Choisissez le nouvel organisme d'affectation.")).toBeInTheDocument();
  expect(suivant).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Sélectionner le nouvel organisme" }));
  expect(screen.getAllByRole("option").map((o) => o.textContent.trim())).toEqual(["CBG"]);
  fireEvent.click(screen.getByRole("option", { name: "CBG" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(suivant).toHaveBeenCalled();
});

test("envoi de la mutation : service appelé avec le dossier repris, puis fin du parcours", async () => {
  mutationDepuisPaiement.mockResolvedValue({ success: true, numero: "EP-0428-A" });
  const termine = jest.fn();
  render(<MutationSoumission immatriculation={{ ...base, ministere: "2", direction: "5" }} handlePrevStep={() => {}} setStep={() => {}} onTermine={termine} />);
  expect(screen.getByText("CBG")).toBeInTheDocument();
  expect(screen.getByText("Direction générale")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Envoyer la mutation" }));
  await waitFor(() => expect(termine).toHaveBeenCalled());
  const envoye = mutationDepuisPaiement.mock.calls[0][0];
  expect([envoye.mutation.dossier.immatriculation_id, envoye.paiementReference, envoye.ministere]).toEqual([431, "MLOBI0UVCC9803083", "2"]);
});
