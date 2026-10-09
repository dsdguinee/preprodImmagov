<?php

namespace App\Rules\Organisations;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CheckMinistereExiste implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public $typeOrganisme;
    public function __construct($typeOrganisme = '')
    {
       $this->typeOrganisme = $typeOrganisme;
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
       // Un nom ne peut exister qu'une fois, quel que soit le type d'organisme
       // (collation de ministeres.nom : majuscules et accents ignorés)
       return \App\Services\OrganismeService::trouverParNom($value) === null;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Ce ministère ou organisme existe déjà.';
    }
}
