<?php

namespace App\Rules\Utilisateurs\Update;

use App\Models\Immatriculation;
use App\Models\Mutation;
use App\Models\Reforme;
use Illuminate\Contracts\Validation\Rule;

class CheckUserMadeOperation implements Rule
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
      $immatriculations = Immatriculation::where('created_by','=',$this->user_id)->orWhere('valided_by','=',$this->user_id)->get();
      $mutations = Mutation::where('user_id','=',$this->user_id)->get();
      $reformes = Reforme::where('user_id','=',$this->user_id)->get();
      if(count($immatriculations) === 0 && count($mutations) === 0 && count($reformes) === 0)
          return true;

    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Cet Utilisateur a effectué un ou plusieurs opération(s).Vous ne pouvez pas le supprimé.";
    }
}
