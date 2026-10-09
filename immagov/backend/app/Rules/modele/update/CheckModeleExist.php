<?php

namespace App\Rules\modele\update;

use App\Models\Modele;
use Illuminate\Contracts\Validation\Rule;

class CheckModeleExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $marque_id;private  $modele_id;
    public function __construct($marque_id,$modele_id)
    {
        $this->marque_id = $marque_id;$this->modele_id = $modele_id;
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
        $marque = Modele::where('id','<>',$this->modele_id)->where('marque_id','=',$this->marque_id)
            ->where('title','=',$value)->get()->first();
        if(!$marque)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce nom de Modele existe pour ce modele de vehicule.';
    }
}
