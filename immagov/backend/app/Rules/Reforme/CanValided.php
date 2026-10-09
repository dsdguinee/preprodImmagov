<?php

namespace App\Rules\Reforme;

use App\Models\Mutation;
use Illuminate\Contracts\Validation\Rule;

class CanValided implements Rule
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
        $mutation = Mutation::where('immatriculation_id','=',$value)->where('status','=',0)->get()->last();
        if(!$mutation)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce vehicule est est muté et est en attente de validation.Vous pouvez pas le reformé.';
    }
}
