<?php

namespace App\Rules\Immatriculation;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CheckMinistereExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $mesg = '';
    public function __construct()
    {
        $this->mesg = '';
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
        if($value != 1000000) {
            $ministere = DB::select('select * from ministeres where ministere_id =?',
                [$value]);
            if(count($ministere) == 0){
                $this->mesg = 'Ce Ministere n\'existe pas';return false;
            }
        }
        else {

        }

            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The validation error message.';
    }
}
