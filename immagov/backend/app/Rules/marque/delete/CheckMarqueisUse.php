<?php

namespace App\Rules\marque\delete;

use App\Models\Vehicule;
use Illuminate\Contracts\Validation\Rule;

class CheckMarqueisUse implements Rule
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
        $vehicule = Vehicule::where('marque_id',$value)->get()->first();
        if(!$vehicule)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Suppression Impossible car cette marque est déjà utilisé dans une ou plusieurs opérations.';
    }
}
