<?php

namespace App\Rules\Resoumission;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;

class CheckImmatriculationExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {

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
        $immatriculation = Immatriculation::find(trim($value));
        if($immatriculation)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Ce Vehicule n'a pas été Immatriculé.";
    }
}
