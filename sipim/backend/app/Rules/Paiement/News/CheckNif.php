<?php

namespace App\Rules\Paiement\News;

use Illuminate\Contracts\Validation\ImplicitRule;

class CheckNif implements ImplicitRule
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
        // Memes regles que le formulaire : NIF obligatoire pour une entreprise, 3 a 16 caracteres.
        if($this->typeClient !== 'Entreprise Publique')
            return true;

        $longueur = mb_strlen(trim((string) $value));
        if($longueur === 0){
            $this->msg = "Veuillez fournir le code NIF de l'entreprise.";
            return false;
        }
        if($longueur < 3){
            $this->msg = "Le code NIF doit compter au moins 3 caractères.";
            return false;
        }
        if($longueur > 16){
            $this->msg = "Le code NIF ne peut pas dépasser 16 caractères.";
            return false;
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
