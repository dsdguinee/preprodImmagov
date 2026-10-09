<?php

namespace App\Rules\Organisations;

use App\Models\Immatriculation;
use App\Models\Mutation;
use App\Models\Reforme;
use Illuminate\Contracts\Validation\Rule;

class DeleteMinistereExist implements Rule
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
        $mutation = Mutation::where('ministere',$value)->get()->first();
        $reforme = Reforme::where('ministere_id',$value)->get()->first();
        $immatriculation =  Immatriculation::where('minister_id',$value)->get()->first();
        if(!$mutation && !$reforme && !$immatriculation)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Ce ministère est utilisé dans une ou plusieurs operations.";
    }
}
