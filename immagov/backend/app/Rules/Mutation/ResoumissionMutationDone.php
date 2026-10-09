<?php

namespace App\Rules\Mutation;

use App\Models\Mutation;
use Illuminate\Contracts\Validation\Rule;

class ResoumissionMutationDone implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $status = 0;
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
        $mutation = Mutation::find($value);
        if($mutation)
            if($mutation->status == 2)
                return true;
        else $this->status =  1;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        if( $this->status == 1)
           return 'Cette Mutation n\'existe pas';
        else  return 'Cette Mutation n\'a pas de status Rejété.Donc vous ne pouvez pas méné une action.';
    }
}
