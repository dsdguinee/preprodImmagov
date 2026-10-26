<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Un véhicule est fabriqué avant (ou la même année que) sa première mise en circulation :
 * l'année de fabrication ne peut pas dépasser l'année de la date de 1re mise en circulation.
 */
class AnneeFabricationAvantCirculation implements ValidationRule
{
    public function __construct(private ?string $dateMiseEnCirculation) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$this->dateMiseEnCirculation || !is_numeric($value)) return;
        $date = \DateTime::createFromFormat('Y-m-d', $this->dateMiseEnCirculation);
        if (!$date) return; // format contrôlé par la règle date_format de dateP
        $anneeCirculation = (int) $date->format('Y');
        if ((int) $value > $anneeCirculation)
            $fail("L'année de fabrication ({$value}) ne peut pas être postérieure à la 1re mise en circulation ({$anneeCirculation}).");
    }
}
