<?php

namespace App\Rules\Reservation;

use App\Models\Reservation;
use App\Services\SipimService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Une réservation de numéros EP ne s'utilise qu'avec une référence de paiement EP, et une réservation VA
 * qu'avec une référence VA. Le type de référence est celui payé dans SIPIM (type_plaque) : le mode envoyé
 * par le formulaire ne sert que si SIPIM ne répond pas (la référence est alors refusée par ailleurs).
 */
class ReservationModeImmatriculation implements ValidationRule
{
    public function __construct(private $modeImmatriculation, private $paiementReference = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strlen((string) $value) === 0) return;
        $reservation = Reservation::find($value);
        if (!$reservation) return;

        $modeReservation = strtoupper(trim((string) $reservation->modeImmatriculation));
        $modeReference = $this->typePlaquePaye() ?: strtoupper(trim((string) $this->modeImmatriculation));
        if ($modeReference !== '' && $modeReservation !== $modeReference)
            $fail("La réservation « {$reservation->nomReservation} » est de type {$modeReservation} : elle ne peut pas être utilisée avec une référence de paiement {$modeReference}.");
    }

    // Type de plaque payé pour la référence (EP, VA…), lu dans SIPIM
    private function typePlaquePaye(): string
    {
        if (!$this->paiementReference) return '';
        $reponse = SipimService::getPaiement($this->paiementReference);
        return strtoupper(trim((string) ($reponse['paiement']['type_plaque'] ?? '')));
    }
}
