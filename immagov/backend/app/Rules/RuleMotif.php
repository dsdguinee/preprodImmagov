<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class RuleMotif implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $nouveauMotif = '';
    public function __construct($nouveauMotif)
    {
        $this->nouveauMotif = $nouveauMotif;
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
        //return $value;
        if( $value != 0 && empty($this->nouveauMotif))
            return true;
        if($value == 0 &&  !empty($this->nouveauMotif))
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Selectionner le motif.';
    }
}
