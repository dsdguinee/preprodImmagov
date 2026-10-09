<?php

namespace App\Rules\Immatriculation;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CheckMinistereDiff implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $ministereName = '';
    private $chosenMinister = '';
    public function __construct($ministereName,$chosenMinister)
    {
        $this->ministereName = $ministereName;
        $this->chosenMinister = $chosenMinister;
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
       if( $value != 0){
        $ministere = DB::select('select * from ministeres where ministere_id=:ministere_id and trim(lower(nom))=:nom',
            ['ministere_id' => $value,'nom' => strtolower(trim($this->chosenMinister))]);
        if(count($ministere) > 0)
            return true;
       }else return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Le ministère que vous aviez choisi n'est pas celui choisi lors de l'immatriculation.Celui choisi est le ".$this->chosenMinister;
    }
}
