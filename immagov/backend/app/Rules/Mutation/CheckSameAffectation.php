<?php

namespace App\Rules\Mutation;

use Illuminate\Contracts\Validation\Rule;

class CheckSameAffectation implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $affectation_id = 0;private $direction_affectation_id = 0;
    private $direction = 0;
    public function __construct($affectation_id,$direction_affectation_id,$direction)
    {
         $this->affectation_id = $affectation_id;$this->direction_affectation_id = $direction_affectation_id;
         $this->direction = $direction;
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

       if(!empty($this->direction) ) {
           if ((intval($this->affectation_id) !== intval($value)) && intval($this->direction_affectation_id) !== intval($this->direction))
               return true;
          }else{
           if((intval($this->affectation_id) !== intval($value)))
               return true;
       }

       }


    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Les deux destinations sont identiques.';
    }
}
