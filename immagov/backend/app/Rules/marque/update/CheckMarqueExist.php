<?php

namespace App\Rules\marque\update;

use App\Models\Marque;
use Illuminate\Contracts\Validation\Rule;

class CheckMarqueExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $marque_id;
    public function __construct($marque_id)
    {
        $this->marque_id = $marque_id;
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
        $marque = Marque::where('id','<>',$this->marque_id)->where('title','=',$value)->get()->first();
        if(!$marque)
            return true;

    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Cette marque existe déjà.';
    }
}
