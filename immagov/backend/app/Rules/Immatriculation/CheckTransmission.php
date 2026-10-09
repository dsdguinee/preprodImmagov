<?php

namespace App\Rules\immatriculation;

use Illuminate\Contracts\Validation\Rule;

class CheckTransmission implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $transmission = ['Manuelle','Automatic'];
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
        if(in_array($value,$this->transmission))
            return true;
        else return false;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce mode de transmission n\'existe pas';
    }
}
