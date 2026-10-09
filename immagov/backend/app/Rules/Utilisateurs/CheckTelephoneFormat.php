<?php

namespace App\Rules\Utilisateurs;

use Illuminate\Contracts\Validation\Rule;

class CheckTelephoneFormat implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {

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
        $phone = strcmp($value[0],6) === 0 && strlen($value) === 9 && !str_contains($value,' ') ;
        if($phone)
            return true;
       //return preg_match("/6[0-9]{8}$/g", $value);
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Mauvais format de numéro de téléphone.Ex:620 00 00 00.";
    }
}
