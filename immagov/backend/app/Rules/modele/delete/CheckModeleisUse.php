<?php

namespace App\Rules\modele\delete;

use App\Models\Vehicule;
use Illuminate\Contracts\Validation\Rule;

class CheckModeleisUse implements Rule
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
        $vehicule = Vehicule::where('model_id',$value)->get()->first();
        if(!$vehicule)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Suppression Impossible car ce modèle est déjà utilisé dans une ou plusieurs opérations.';
    }
}
