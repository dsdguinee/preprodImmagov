<?php

namespace App\Rules\Paiement\News;

use App\Models\Paiement;
use Illuminate\Contracts\Validation\Rule;

class CheckChassis implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $paiement_id;
    public function __construct($paiement_id)
    {
        $this->paiement_id = $paiement_id;
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
       if($this->paiement_id !== "new")
          $paiement = Paiement::where('chassis','=',$value)->where('paiement_id','=',$this->paiement_id)->where('isautoriser','=',0)->get()->first();
       else
          $paiement = Paiement::where('chassis','=',$value)->where('isautoriser','=',0)->get()->first();

       if($paiement)
          return false;
        else return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Vous ne pouvez pas faire de paiement pour ce vehicule car il n\'est pas encore autorisé.';
    }
}
