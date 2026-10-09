<?php

namespace App\Rules;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;

class RuleCheckImmatriculation_id implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
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
        $immatriculation = Immatriculation::where('immatriculation_id',$value)->get();
        if(count($immatriculation) > 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Ce vehicule n'est pas immatriculé.";
    }
}
