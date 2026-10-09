<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Immatriculation;
use App\Models\Impression;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ImpressionController extends BaseController
{
    public function getAllImmatriculationValidee(){
        try {
            $immatriculations = [];
            if($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1)
                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom,i.imprimer,i.nbreImpr
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and (i.status = 1 or (immatriculation_id in (select immatriculation_id from mutations where status = 1) 
                                                or immatriculation_id in(select immatriculation_id from reformes where status = 1)))  order by i.updated_at desc');
            else{
                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom,i.imprimer,i.nbreImpr
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id 
                                                and (i.status = 1 or (immatriculation_id in (select immatriculation_id from mutations where status = 1) 
                                                or immatriculation_id in (select immatriculation_id from reformes where status = 1))) and i.created_by=:user_id 
                                                order by i.updated_at desc
                                                ',['user_id' => Auth::user()->id]);

            }

            return response()->json(['status' => true,'immatriculations' => $immatriculations]);
        }
            //catch(\Illuminate\Database\QueryException $ex){
        catch (QueryException $ex){
            return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }
    public function printed(Request $request,$immatriculation_id){

        if($request->isMethod('post')){
            try{
               $imma = Immatriculation::find($immatriculation_id);
               if($imma){
                   $imma->imprimer = 1;
                   $imma->nbreImpr = intval($imma->nbreImpr) + 1;
                   $imma->updated_at = Carbon::now();
                   $imma->save();
                   $impression = new Impression();
                   $impression->immatriculation_id = $immatriculation_id;
                   $impression->user_id = Auth::user()->id;
                   $ayear = Carbon::now()->addYear(5);
                   $impression->expiration_date = $ayear;
                   $impression->save();
                   return response()->json(['status' => true,]);
               }else{
                   return response()->json(['status' => false,'messages' => ['erreur' =>  'Information Non trouvee']]);
               }
            }
            catch (QueryException $ex){
                return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }
}
