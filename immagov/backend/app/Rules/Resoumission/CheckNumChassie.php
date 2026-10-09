<?php

namespace App\Rules\Resoumission;

use App\Models\Immatriculation;
use App\Models\Vehicule;
use Illuminate\Contracts\Validation\Rule;

class CheckNumChassie implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $vehicule_id;
    public function __construct($vehicule_id)
    {
        $this->vehicule_id = $vehicule_id;
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
        $vehicule = Vehicule::where('numChassie','=',trim($value))->where('vehicule_id','<>',$this->vehicule_id)->first();
        if($vehicule)
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
        return 'Ce Numéro de Chassie existe déjà.';
    }
}
