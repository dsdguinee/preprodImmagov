<?php

namespace App\Rules\Immatriculation;

use App\Models\Immatriculation;
use Illuminate\Contracts\Validation\Rule;
use App\Services\SipimService;

class CheckPaiement implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $typeOrganisme;public $msg ;

    public function __construct($typeOrganisme)
    {
        $this->typeOrganisme = $typeOrganisme;
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
        if($this->typeOrganisme === "Privé"){
            if(!$value){
                $this->msg = "Le numéro de référence de paiement.";return false;
            }
            else {
                 $respjson = json_decode(json_encode(SipimService::getPaiement($value)));
                 if(($respjson->status ?? null) !== 200){
                     if(!isset($respjson->messages) || is_object($respjson->messages))
                         $this->msg = 'Paiement non Trouvé.';

                     else
                       $this->msg = $respjson->messages;
                     return false;
                 }else if($respjson->status === 200){
                     if($respjson->paiement->status === "Non Validé"){
                         $this->msg = 'Paiement Non Validé.';
                         return false;
                     }
                     else if(!empty($respjson->paiement->utilise)){
                         $this->msg = 'Cette référence de paiement a déjà été utilisée.';
                         return false;
                     }

                     else{
                         $paiementExist = Immatriculation::where('paiementReference','=',trim($value))->get()->first();
                         if($paiementExist){
                             $this->msg = 'Ce numéro de réference a déjà été utilisé.';
                             return false;
                         }

                     }
                 }
            }
        }
        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->msg;
    }
}
