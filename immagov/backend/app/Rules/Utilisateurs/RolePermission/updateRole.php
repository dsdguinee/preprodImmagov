<?php

namespace App\Rules\Utilisateurs\RolePermission;

use App\Models\Role;
use Illuminate\Contracts\Validation\Rule;

class updateRole implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $role_id ;
    public function __construct($role_id)
    {
        $this->role_id = $role_id;
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
         $role = Role::where('role_id','<>',$this->role_id)->where('nom_role',$value)->get();
         if(count($role) === 0)
           return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce Role existe deja.Veuillez choisir un autre.';
    }
}
