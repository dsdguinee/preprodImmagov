import { render, screen } from "@testing-library/react";
import StepOne from "./StepOne";

const reservations = [
  { reservation_id: 1, nomReservation: "PRÉSIDENCE", modeImmatriculation: "EP" },
  { reservation_id: 2, nomReservation: "AMBASSADES", modeImmatriculation: "VA " },
];
const afficher = (paiement) => render(
  <StepOne handleNextStep={jest.fn()} immatriculation={{ paiementReference: "", reservation_id: "", isReferenceValid: !!paiement }}
    setImmatriculation={jest.fn()} erreurs="" setErreurs={jest.fn()} reservationListe={reservations} paiement={paiement} />
);

test("réservations affichées avec leur type, toutes choisissables tant que la référence n'est pas vérifiée", () => {
  afficher(undefined);
  expect(screen.getByRole("option", { name: "PRÉSIDENCE (EP)" })).toBeEnabled();
  expect(screen.getByRole("option", { name: "AMBASSADES (VA)" })).toBeEnabled();
});

test("référence EP : une réservation VA ne peut pas être choisie (et inversement)", () => {
  const { unmount } = afficher({ type_plaque: "EP", chassis: "X" });
  expect(screen.getByRole("option", { name: "PRÉSIDENCE (EP)" })).toBeEnabled();
  expect(screen.getByRole("option", { name: "AMBASSADES (VA)" })).toBeDisabled();
  unmount();
  afficher({ type_plaque: "VA", chassis: "X" });
  expect(screen.getByRole("option", { name: "PRÉSIDENCE (EP)" })).toBeDisabled();
});
