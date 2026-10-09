<?php

namespace App\Rules\Organisations;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class DirectionExist implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $ministere_id;
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
        $direction = DB::select('select * from directions where ministere_id=:ministere_id and UPPER(TRIM(nom))=:nom',[
            'ministere_id' => $this->ministere_id,
            'nom' => strtoupper(trim($value))
        ]);
        if(count($direction) === 0)
            return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Cette direction existe dans ce ministère.';
    }
}
