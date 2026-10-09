<?php

namespace App\Rules\Paiement\News;

use Illuminate\Contracts\Validation\Rule;

class CheckNif implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $msg;private $typeClient;
    public function __construct($typeClient)
    {
        $this->typeClient = $typeClient;
        $this->msg = '';
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
        if(strlen($value) <= 10){
           if($this->typeClient === 'societe'){
               if(strlen($value) === 0)
                  $this->msg = "Veuillez fournir le code NIF de la société.";
               else{
                   $this->msg = "Le caractère minimum pour le code NIF est Dix(10).";
               }
               return false;
           }else{
               return true;
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
        return $this->msg;
    }
}
