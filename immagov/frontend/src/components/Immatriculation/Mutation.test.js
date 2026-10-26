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
      // Tout organisme est « Publique » (ministère / institution ou entreprise publique)
      { ministere_id: 2, nom: "CBG", typeorganisme: "Publique", categorie: "Entreprise Publique" },
      { ministere_id: 24, nom: "MINISTERE des Mines", typeorganisme: "Publique", categorie: "Ministère" },
      { ministere_id: 9, nom: "Ministère de la Santé", typeorganisme: "Publique", categorie: "Ministère" },
    ],
    allDirections: { directions: [{ direction_id: 5, ministere_id: 2, nom: "Direction générale" }] },
  },
};

const Affectation = ({ onNext, initial = base }) => {
  const [imm, setImm] = useState(initial);
  const [chk, setChk] = useState({});
  return <MutationAffectation immatriculation={imm} setImmatriculation={setImm} handleNextStep={onNext} handlePrevStep={() => {}} stepChk={chk} setStepChk={setChk} />;
};

// Ancien dossier encore marqué « Privé » : les organismes (tous « Publique ») doivent quand même être proposés
test("nouvelle affectation : tous les organismes sauf l'actuel, avec leur catégorie, choix obligatoire", () => {
  const suivant = jest.fn();
  render(<Affectation onNext={suivant} />);
  expect(screen.getByText("MINISTERE des Mines")).toBeInTheDocument(); // organisme actuel rappelé
  expect(screen.getByText("Ministère / institution")).toBeInTheDocument(); // sa catégorie
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(screen.getByText("Choisissez le nouvel organisme d'affectation.")).toBeInTheDocument();
  expect(suivant).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Sélectionner le nouvel organisme" }));
  // Ministères d'abord, puis entreprises publiques
  expect(screen.getAllByRole("option").map((o) => o.textContent.trim())).toEqual(["Ministère de la Santé · Ministère / institution", "CBG · Entreprise publique"]);
  fireEvent.click(screen.getByRole("option", { name: "CBG · Entreprise publique" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(suivant).toHaveBeenCalled();
});

test("nouvel organisme choisi au paiement SIPIM : sélectionné d'office (accents et casse ignorés)", () => {
  render(<Affectation onNext={jest.fn()} initial={{ ...base, ministereSipim: "MINISTERE DE LA SANTE" }} />);
  expect(screen.getByText(/présélectionné d'après le paiement SIPIM/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Ministère de la Santé · Ministère \/ institution/ })).toBeInTheDocument();
});

test("organisme SIPIM déjà actuel ou introuvable : rien n'est sélectionné", () => {
  const { unmount } = render(<Affectation onNext={jest.fn()} initial={{ ...base, ministereSipim: "Ministere des mines" }} />);
  expect(screen.getByText(/déjà l'organisme actuel du véhicule/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sélectionner le nouvel organisme" })).toBeInTheDocument();
  unmount();
  render(<Affectation onNext={jest.fn()} initial={{ ...base, ministereSipim: "MINISTÈRE DE LA SANTÉ PUBLIQUE" }} />);
  expect(screen.getByText(/introuvable tel quel dans immagov/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Ministère de la Santé.*Choisir cet organisme/ }));
  expect(screen.queryByText(/introuvable tel quel/)).not.toBeInTheDocument();
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
