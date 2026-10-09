<?php

namespace App\Rules;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CheckImmatriculationReformeExist implements Rule
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
        $immatriculation = Immatriculation::where('status','=',3)->where('immatriculation_id','=',$value)->get()->first();
        if(!$immatriculation)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Vehicule déjà Réformé.';
    }
}
