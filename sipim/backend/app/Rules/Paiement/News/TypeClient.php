<?php

namespace App\Rules\Paiement\News;

use Illuminate\Contracts\Validation\Rule;

class TypeClient implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $typeClient;
    private $msg ;
    public function __construct($typeClient)
    {
        $this->typeClient = $typeClient;
        $this->msg = "";
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

//        if($this->typeClient === "Particulier"){
//           if(strlen($value) === 0)
//             $this->msg = "Veuillez fournir le prenom et nom du client.";
//        }else if($this->typeClient === "Societe") {
//            if (strlen($value) != 0){
//                $this->msg = "Veuillez fournir le nom de la société.";
//            }
//         }
        if (strlen($value) === 0){
            if($this->typeClient === "Particulier"){
                $this->msg = "Veuillez fournir le prenom et nom du client.";
                return false;
            }else{
                $this->msg = "Veuillez fournir le nom de la société.";return false;
            }
          }else{
            return true;
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return  $this->msg;
    }
}
