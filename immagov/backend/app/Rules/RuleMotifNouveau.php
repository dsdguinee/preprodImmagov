<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class RuleMotifNouveau implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $motif = "";
    public function __construct($motif)
    {
        $this->motif = $motif;
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
        if(!empty($value) && empty($this->motif))
            return true;
        if(!empty($value) && empty($this->motif))
            return true;
        if($value == 0 &&  empty($this->nouveauMotif))
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Veuillez Saisir le motif.';
    }
}
