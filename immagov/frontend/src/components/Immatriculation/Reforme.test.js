import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReformeProprietaire, ReformePiece, ReformeSoumission, proprietaireVide, erreurPiece } from "./Reforme";
import { reformeDepuisPaiement } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ reformeDepuisPaiement: jest.fn() }));

// Dossier repris (réponse de GET /mutation/dossierParChassis?operation=reforme)
const dossier = { immatriculation_id: 427, immatriculation_number: "EP-0426-A", numChassie: "JTMZFREV8GJ060739",
  marque: "Toyota", modele: "RAV4", ministere: "MINISTERE DE L'EDUCATION" };
const base = { reforme: { dossier, proprietaire: proprietaireVide() }, paiementReference: "OUMRRDLFXAC340083", image4: "" };

const Avec = ({ Composant, initial = base, onNext = () => {} }) => {
  const [imm, setImm] = useState(initial);
  const [chk, setChk] = useState({});
  return <Composant immatriculation={imm} setImmatriculation={setImm} handleNextStep={onNext} handlePrevStep={() => {}} stepChk={chk} setStepChk={setChk} />;
};
const saisir = (label, valeur) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value: valeur } });

test("nouveau propriétaire : prénom, nom, téléphone et adresse obligatoires, e-mail facultatif", () => {
  const suivant = jest.fn();
  render(<Avec Composant={ReformeProprietaire} onNext={suivant} />);
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(suivant).not.toHaveBeenCalled();
  expect(screen.getByText("L'adresse est obligatoire.")).toBeInTheDocument();

  saisir("Prénom", "Mamadou");
  saisir("Nom", "Diallo");
  saisir("Téléphone", "abc");
  saisir("Adresse", "Kaloum, Conakry");
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(screen.getByText(/Numéro invalide/)).toBeInTheDocument();
  expect(suivant).not.toHaveBeenCalled();

  saisir("Téléphone", "620 00 00 00");
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(suivant).toHaveBeenCalled();
});

test("pièce d'identité : seules les photos JPEG ou PNG sont acceptées", () => {
  expect(erreurPiece(new File(["%PDF"], "cni.pdf", { type: "application/pdf" }))).toMatch(/JPEG ou PNG/);
  expect(erreurPiece(new File(["x"], "cni.png", { type: "image/png" }))).toBe("");

  global.URL.createObjectURL = jest.fn(() => "blob:cni");
  global.URL.revokeObjectURL = jest.fn();
  render(<Avec Composant={ReformePiece} />);
  expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
  const input = document.querySelector('input[name="piece"]');
  fireEvent.change(input, { target: { files: [new File(["x"], "cni.jpg", { type: "image/jpeg" })] } });
  expect(screen.getByAltText("Pièce d'identité du nouveau propriétaire")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continuer" })).toBeEnabled();
});

test("envoi de la réforme : service appelé avec le nouveau propriétaire, puis fin du parcours", async () => {
  reformeDepuisPaiement.mockResolvedValue({ success: true, numero: "EP-0426-A" });
  const termine = jest.fn();
  const proprietaire = { prenom: "Mamadou", nom: "Diallo", telephone: "620 00 00 00", email: "", adresse: "Kaloum, Conakry" };
  const photo = new File(["x"], "cni.jpg", { type: "image/jpeg" });
  render(<ReformeSoumission immatriculation={{ ...base, reforme: { dossier, proprietaire }, image4: photo }} handlePrevStep={() => {}} setStep={() => {}} onTermine={termine} />);
  expect(screen.getByText("Mamadou DIALLO")).toBeInTheDocument();
  expect(screen.getByText("Non renseigné")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Envoyer la réforme" }));
  await waitFor(() => expect(termine).toHaveBeenCalled());
  const envoye = reformeDepuisPaiement.mock.calls[0][0];
  expect([envoye.reforme.dossier.immatriculation_id, envoye.paiementReference, envoye.image4.name]).toEqual([427, "OUMRRDLFXAC340083", "cni.jpg"]);
});
