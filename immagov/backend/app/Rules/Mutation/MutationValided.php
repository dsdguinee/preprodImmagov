<?php

namespace App\Rules\Mutation;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class MutationValided implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $status = -1;
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
        $mutation = DB::select('select * from mutations where mutation_id =?',[$value]);
        if(count($mutation) > 0){
            if($mutation[0]->status == 0){
              return true;
            }else {
                $this->status = 1;
            }
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        if($this->status === 1)
           return 'Mutation déjà Traitée';
        else return 'La Mutation n\'existe pas';

    }
}
