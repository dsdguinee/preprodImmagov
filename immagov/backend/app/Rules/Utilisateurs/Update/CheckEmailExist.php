<?php

namespace App\Rules\Utilisateurs\Update;

use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class CheckEmailExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $user_id;
    public function __construct($user_id)
    {
        $this->user_id = $user_id;
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
        $user = User::where('id','<>',$this->user_id)->where('email','=',$value)->get();
        if(count($user) === 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Cet Email existe déjà.';
    }
}
