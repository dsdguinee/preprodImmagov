<?php

namespace App\Rules\Resoumission;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;

class CheckImmatriculationStatus implements Rule
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
    public function passes($attribute, $value){
        $immatriculation = Immatriculation::where('immatriculation_id',trim($value))->get()->first();
        if($immatriculation) {
            if ($immatriculation->status == 2)
                return true;
        }
        else return true;
    }
    public function message()
    {
        return 'Ce Vehicule n\'a pas status de rejet.';
    }
}
