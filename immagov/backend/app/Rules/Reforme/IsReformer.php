<?php

namespace App\Rules\Reforme;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class IsReformer implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $typeReforme;
    public function __construct($typeReforme)
    {
        $this->typeReforme = $typeReforme;
    }

    public function passes($attribute, $value)
    {
        $reforme = DB::select('select * from reformes where reforme_id =:reforme_id and (status = 1 or status=2)',[
            'reforme_id' => $value]);
        if(count($reforme) === 0)
            return true;
    }

    public function message()
    {
        if($this->typeReforme == 'valider')
           return 'Ce vehicule est deja reformé.';
        else return 'Ce vehicule est déjà rejeté.';
    }
}
