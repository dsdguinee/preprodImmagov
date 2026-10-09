<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use App\Models\Marque;
use App\Models\Modele;
use App\Models\Typevehicule;
use App\Rules\marque\delete\CheckMarqueisUse;
use App\Rules\marque\update\CheckMarqueExist;
use App\Rules\modele\add\CheckNomExist;
use App\Rules\modele\delete\CheckModeleisUse;
use App\Rules\modele\update\CheckModeleBelong;
use App\Rules\modele\update\CheckModeleExist;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehiculeController extends BaseController
{
    public function getallmarques(){
        try {
            $marques = Marque::orderBy('id', 'DESC')->get();;
            return response()->json(['success' => true, 'status' => 200,'marques' => $marques]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()] ]);
        }
    }
    public function updateMarque(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                'marque_id.required' => "Vous n'aviez pas fourni de Marque.",
                'marque_id.integer' => "Mauvais format de type de Marque fourni.",
                'marque_id.exists' => "Nous ne trouvons pas cette marque.",
                "nom.required" => "Le nom de la marque est obligatoire."
            ];
           $validator = Validator::make($input,[
               'marque_id' => "required|integer|exists:marques,id",
               'nom' => ['required',new CheckMarqueExist($input['marque_id'])]
           ],$messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $marque = Marque::find($input['marque_id']);
                    $marque->title = $this->Majuscule($input['nom']);
                    if(count(explode(' ',$input['nom'])) === 1)
                       $marque->code = substr($input['nom'],0,strlen($input['nom']) - 2);
                    else{
                        $code = (explode(' ',$input['nom']));
                        $marque->code = strtoupper($code[0]);
                    }
                    $marque->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }

    }

    public function updateModele(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                'marque_id.required' => "Vous n'aviez pas fourni de Marque.",
                'marque_id.integer' => "Mauvais format de Marque fourni.",
                'marque_id.exists' => "Nous ne trouvons pas cette marque.",
                'modele_id.required' => "Vous n'aviez pas fourni de Modele.",
                'modele_id.integer' => "Mauvais format de modele fourni.",
                'modele_id.exists' => "Ce modele n'existe pas.",
                "nom.required" => "Le nom de la marque est obligatoire.",
            ];
            $validator = Validator::make($input,[
                'marque_id' => "required|integer|exists:marques,id",
                'modele_id' => "required|integer|exists:modeles,id",
                'nom' => ['required',new CheckModeleExist($input['marque_id'],$input['modele_id']),new CheckModeleBelong($input['marque_id'],$input['modele_id'])]
            ],$messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $modele = Modele::find($input['modele_id']);
                    $modele->title = $this->Majuscule($input['nom']);
                    if(count(explode(' ',$input['nom'])) === 1)
                        $modele->code = substr($input['nom'],0,strlen($input['nom']) - 2);
                    else{
                        $code = (explode(' ',$input['nom']));
                        $modele->code = strtoupper($code[0]);
                    }
                    $modele->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }

    }
    public function getModelByMarque($marque_id)
    {
        try {
            $models = Modele::where('marque_id', $marque_id)->orderBy('id', 'DESC')->get();
            return response()->json(['success' => true, 'status' => 200,'models' => $models]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()] ]);
        }
    }
    public function addModele(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();

            $messages = [
                'marque_id.required' => "Vous n'aviez pas fourni de Marque.",
                'marque_id.integer' => "Mauvais format de Marque fourni.",
                'marque_id.exists' => "Nous ne trouvons pas cette marque.",
                "nom.required" => "Le nom du modele est obligatoire.",
            ];
            $validator = Validator::make($input,[
                'marque_id' => 'required|integer|exists:marques,id',
                'nom' => ['required',new CheckNomExist($input['marque_id'])]
            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $modele = new Modele();
                    $modele->marque_id = $input['marque_id'];
                    $modele->title = $this->Majuscule($input['nom']);
                    if(count(explode(' ',$input['nom'])) === 1)
                        $modele->code = substr($input['nom'],0,strlen($input['nom']) - 2);
                    else{
                        $code = (explode(' ',$input['nom']));
                        $modele->code = strtoupper($code[0]);
                    }
                    $modele->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }
    }
    public function deleteModele(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                'modele_id.required' => "Vous n'aviez pas fourni de Marque.",
                'modele_id.integer' => "Mauvais format de Marque fourni.",
                'modele_id.exists' => "Nous ne trouvons pas cette marque.",
            ];
            $validator = Validator::make($input,[
                'modele_id' => ['required','integer',new CheckModeleisUse()],

            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $modele = Modele::find($input['modele_id']);
                    if($modele)
                       $modele->delete();
                    //$modele->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }
    }
    public function deleteMarque(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                'marque_id.required' => "Vous n'aviez pas fourni de Marque.",
                'marque_id.integer' => "Mauvais format de Marque fourni.",

            ];
            $validator = Validator::make($input,[
                'marque_id' => ['required','integer',new CheckMarqueisUse()],

            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $marque = Marque::find($input['marque_id']);
                    if($marque)
                        $marque->delete();
                    //$modele->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }
    }
    public function addMarque(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                'nom.required' => "Le nom de la marque est obligatoire.",
                'nom.unique' => "Mauvais format de Marque fourni.",
            ];
            $validator = Validator::make($input,[
                'nom' => 'required|unique:marques,title',
            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            else{
                try{
                    $marque = new Marque();
                    $marque->title = $this->Majuscule($input['nom']);
                    if(count(explode(' ',$input['nom'])) === 1)
                        $marque->code = substr($input['nom'],0,strlen($input['nom']) - 2);
                    else{
                        $code = (explode(' ',$input['nom']));
                        $marque->code = strtoupper($code[0]);
                    }
                    $marque->save();
                    return response()->json(['success' => true,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
                }
            }
        }
    }
    public function getallgenres(){
        $genres = Genre::all();
        return response()->json(['genres' => $genres]);
    }
    public function typeByGenreID($genre_id){
        $types = Typevehicule::where('genre_id',$genre_id)->get();
        return response()->json(['types' => $types]);
    }
    public function getGenreByID($genre_id){
        $genre = Genre::find($genre_id);
        if($genre)
            return response()->json(['genre' => $genre]);
        else return response()->json(['status' => 404,'message'=>'Genre Non Rétrouvé.']);
    }
    public function getTypeByID($type_id){
        $type = Typevehicule::find($type_id);
        if($type)
            return response()->json(['type' => $type]);
        else return response()->json(['status' => 404,'message'=>'Genre Non Rétrouvé.']);
    }
    public function getallmodels()
    {
        $models = Modele::all();

        return response()->json(['models' => $models]);
    }
    public function getalltype(){
        $types = Typevehicule::all();
        return response()->json(['types' => $types]);
    }
    public function getMarqueByID($marqueID){
        try {
            $marque = Marque::find($marqueID);
            return response()->json(['success' => true, 'status' => 200,'marque' => $marque]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()] ]);
        }

    }
}
