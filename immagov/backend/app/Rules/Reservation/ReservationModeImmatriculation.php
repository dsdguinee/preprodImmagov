<?php

namespace App\Rules\Reservation;

use App\Models\Reservation;
use Illuminate\Contracts\Validation\Rule;

class ReservationModeImmatriculation implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $modeImmatriculation;
    public $msg;
    public function __construct($modeImmatriculation)
    {
        $this->modeImmatriculation = $modeImmatriculation;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if(strlen($value) != 0){
            $reservation = Reservation::find($value);
            if($reservation){
               if(trim($reservation->modeImmatriculation) != trim($this->modeImmatriculation)){
                  $this->msg = "Le mode d'immatriculation que vous aviez choisi ne correspondant pas à celui de la reservation.";
                  return false;
               }
            }
        }
        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->msg;
    }
}
