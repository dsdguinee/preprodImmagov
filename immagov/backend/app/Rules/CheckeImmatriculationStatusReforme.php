<?php

namespace App\Rules;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;

class CheckeImmatriculationStatusReforme implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $messages;
    public function __construct()
    {
        $this->messages = '';
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
        $immatriculation = Immatriculation::where('immatriculation_id',$value)->get()->first();
        if( $immatriculation ) {
            if ( $immatriculation->status == 1 or $immatriculation->status == 4 ) {
                $this->messages = "Ce vehicule n'a pas un status validé.Vous ne pouvez donc pas le reformé.";
            } else if ($immatriculation->status == 0) {
                $this->messages = "Vehicule est en attente de Validation.Vous ne pouvez pas le reformé.";
            }
            return true;
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->messages;
    }
}
