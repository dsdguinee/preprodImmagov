<?php

namespace App\Rules\Mutation;

use App\Models\Mutation;
use Illuminate\Contracts\Validation\Rule;

class CheckMutationDone implements Rule
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
        $mutation = Mutation::where('immatriculation_id',$value)->get();
        if(count($mutation) === 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce vehicule à déjà été Muté!';
    }
}
