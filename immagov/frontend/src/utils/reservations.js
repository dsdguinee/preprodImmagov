// Type de numéros d'une réservation (EP, VA) : une réservation ne s'utilise qu'avec une référence de paiement du même type
export const modeReservation = (reservation) => String(reservation?.modeImmatriculation || "").trim().toUpperCase();
