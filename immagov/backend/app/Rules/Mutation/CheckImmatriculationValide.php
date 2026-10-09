<?php

namespace App\Rules\Mutation;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CheckImmatriculationValide implements Rule
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
        $immatriculation = DB::select('select * from immatriculations where immatriculation_id =:id and (status = 1 or status = 4)',['id' => $value]);

        if(count($immatriculation) > 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Vous ne pouvez muter qu'une voiture immatriculée.";
    }
}
