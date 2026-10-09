<?php

namespace App\Rules\Organisations;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class MinistereExistUpdate implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $ministere_id = 0;
    public function __construct($ministere_id)
    {
        $this->ministere_id = $ministere_id;
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
        $ministere = DB::select('select * from ministeres where ministere_id !=:ministere_id and UPPER(TRIM(nom))=:nom',
            ['ministere_id' => $this->ministere_id,'nom' => strtoupper(trim($value)) ]);
        if(count($ministere) === 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce Ministere existe déjà';
    }
}
