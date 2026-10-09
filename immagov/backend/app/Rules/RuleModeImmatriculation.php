<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class RuleModeImmatriculation implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $modeImmatricule = [];
    public function __construct()
    {
        $this->modeImmatricule = ['VA','EP'];
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
        if(in_array(trim($value), $this->modeImmatricule))
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Numéro de référence inapproprié. Choisir VA ou EP uniquement.";
    }
}
