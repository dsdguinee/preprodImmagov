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
            // Dossier rejeté (correction) ou en attente (modification par l'agent avant la décision du Directeur)
            if (in_array((int) $immatriculation->status, [0, 2], true))
                return true;
            return false;
        }
        else return true;
    }
    public function message()
    {
        return "Ce dossier ne peut plus être modifié : il a déjà été validé.";
    }
}
