<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class CheckValeurResiduelle implements Rule
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
       if(intval($value) >= 50000 )
           return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "La valeur Minimale est de cinquante mille francs guinéen(50000 GNF) pour la valeur residuelle.";
    }
}
