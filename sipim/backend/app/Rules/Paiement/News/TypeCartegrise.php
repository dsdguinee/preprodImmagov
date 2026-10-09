<?php

namespace App\Rules\Paiement\News;

use App\Models\TypeCg;
use Illuminate\Contracts\Validation\Rule;

class TypeCartegrise implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    private $msg ;
    private $expressionCg;
    private $categorie_id;
    private $typeCg;
    private $pv;
    private $cu;
    private $pf;
    public $nbrePlace;

    public function __construct($expressionCg,$categorie_id,$typeCg,$pv,$cu,$pf,$nbrePlace)
    {
        $this->msg = '';$this->expressionCg = $expressionCg;
        $this->categorie_id = $categorie_id;
        $this->cu = $cu;$this->pv = $pv;
        $this->typeCg = $typeCg;
        $this->pf = $pf;
        if($categorie_id == 3)
            $this->pf = $nbrePlace;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public $signe;
    public function CtrInputPuissance($cartegrise,$categorie_id){
         $signearray = explode(",",$cartegrise->signe);
         $capacitearray  =  explode(',',$cartegrise->capacite);
         $this->signe = $capacitearray;
         $isExpressionCorrect =  false;
         if($categorie_id == 4 || $categorie_id == 5 ||  $categorie_id == 6) return  true;

        if(count($signearray) === 1 ){
            switch ($signearray[0]){
                case '<' :
                    if(count($capacitearray) == 1)
                        $isExpressionCorrect = intval($this->pf) < intval($capacitearray[0]);
                    break;
                case '>':
                    if(count($capacitearray) == 1)
                        $isExpressionCorrect = intval($this->pf) > intval($capacitearray[0]);
                    break;
                case '<=' :
                    if(count($capacitearray) == 1)
                        $isExpressionCorrect = intval($this->pf) <= intval($capacitearray[0]);
                    break;
                case '>=' :
                    if(count($capacitearray) == 1)
                        $isExpressionCorrect = intval($this->pf) >= intval($capacitearray[0]);
                    break;
                case '!':
                    if(count($capacitearray) > 1)
                        $isExpressionCorrect = intval($this->pf) > intval($capacitearray[0]) && intval($this->pf) < intval($capacitearray[1]);
                    break;
            }
        }
        else if(count($signearray) > 1){
            switch ($cartegrise->signe){
                case '>,<=' :
                    if(count($capacitearray) > 1)
                        $isExpressionCorrect = intval($this->pf) > intval($capacitearray[0]) && intval($this->pf) <= intval($capacitearray[1]);
                    break;
                case '>=,<':
                    if(count($capacitearray) > 1)
                        $isExpressionCorrect = intval($this->pf) >= intval($capacitearray[0]) && intval($this->pf) < intval($capacitearray[1]);
                    break;
                case '!':
                    if(count($capacitearray) > 1)
                        $isExpressionCorrect = intval($this->pf) > intval($capacitearray[0]) && intval($this->pf) < intval($capacitearray[1]);
                    break;

            }
        }

        return $isExpressionCorrect;
    }
    public function passes($attribute, $value)
    {
        // Pas de carte grise demandée (vignette / autorisation seule) : rien à contrôler
        if($this->typeCg == 0) return true;

        $cartegrise = TypeCg::where('typecg_id','=',$this->typeCg)->get()->first();

        if(!$cartegrise) {
            $this->msg = "Cette Carte grise n'existe pas.";
            return false;
        }else {
            $capacite1 = 0;//puissance saisie
            $capacite2 = 0;//puissance dans la base de donnee

//            if( $this->categorie_id == 4 || $this->categorie_id == 5 || $this->categorie_id == 6){
            if(  $this->categorie_id == 5 || $this->categorie_id == 6){
                $c = (intval($this->pv) + intval($this->cu))*0.001;
                $capacite1 = round($c,0);

                $capacite2 = explode(',',$cartegrise->capacite);
                if(count($capacite2) === 1){
                    if($capacite1 == round($capacite2[0],0)){
                       $this->msg = "La capacité saisie n'est pas égale à la capacité réelle.";
                       return false;
                    }
                }else{
                    if(round($capacite1,0) < round($capacite2[0],0) && round($capacite1,0) < round($capacite2[1],0) ){
                        $this->msg = "La capacité saisie n'est pas égale à la capacité réelle.";
                        return false;
                    }
                }

            }
            else {
                if(!$this->CtrInputPuissance($cartegrise,$this->categorie_id)){
                    $this->msg = "La puissance fiscale saisie n'est pas correcte.";
//                    $this->msg = $this->signe[1];
                    return false;
                }
            }
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
        return $this->msg;
    }
}
