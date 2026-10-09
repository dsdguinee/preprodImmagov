<?php

namespace App\Rules\Resoumission;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;

class CheckAncienNumeroExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $immatriculation_id;
    public function __construct($immatriculation_id)
    {
        $this->immatriculation_id = $immatriculation_id;
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
        $immatriculation = Immatriculation::where('ancienImmatriculation','=',trim($value))->where('immatriculation_id','<>',$this->immatriculation_id)->first();
        if($immatriculation)
            return false;
        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Cet ancien numéro d'immatriculation existe déjà.";
    }
}
