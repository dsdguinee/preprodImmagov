<?php

namespace App\Rules\modele\add;

use App\Models\Modele;
use Illuminate\Contracts\Validation\Rule;

class CheckNomExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $marque_id ;
    public function __construct($marque_id)
    {
        $this->marque_id = $marque_id;
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
        $modele = Modele::where('marque_id','=',$this->marque_id)->where('title','=',$value)->get()->first();
        if(!$modele)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce Nom existe déjà pour ce modèle.';
    }
}
