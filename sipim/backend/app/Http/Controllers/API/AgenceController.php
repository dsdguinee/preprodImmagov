<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\AgenceCommune;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class AgenceController extends Controller
{
    public function getAgences(){
        try{
            $agences = DB::select("SELECT ac.agenceCommune_id, a.agence_id,nom_agence,a.created_at,
                                            c.commune_id,c.nom nom_commune,p.prefecture_id,p.nom nom_prefecture,a.logo
                                            FROM agences a,communes c,prefectures p,agence_communes ac
                                            where ac.commune_id = c.commune_id
                                            and a.agence_id = ac.agence_id
                                            and c.prefecture_id = p.prefecture_id order by a.updated_at desc");
            return response()->json(['success' => true,'status' => Response::HTTP_OK,'agences' => $agences]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function getagencebyid(Request $request,$agence_id){
       if($request->isMethod('get') && $agence_id != 0){
           try{
               $agence = DB::select("SELECT agenceCommune_id,a.agence_id,nom_agence,a.created_at,
                                                c.commune_id,c.nom nom_commune,a.logo,p.prefecture_id,p.nom nom_prefecture
                                                FROM
                                                agences a,communes c,prefectures p,agence_communes ac
                                                where ac.commune_id = c.commune_id
                                                and a.agence_id= ac.agence_id
                                                and agenceCommune_id=?
                                                and c.prefecture_id = p.prefecture_id order by a.updated_at desc",[$agence_id]);
               if(count($agence) > 0)
                  $agence = $agence[0];
               return response()->json(['success' => true,'status' => Response::HTTP_OK,'agence' => $agence]);
           }  catch (QueryException $ex){
               return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                   'messages' => ['errors' => $ex->getMessage()]]);
           }
       }
    }

    public function getagencebyid2(Request $request,$agence_id,$commune_id){
        if($request->isMethod('get') && $agence_id != 0){
            try{
                $agence = DB::select("SELECT agenceCommune_id,a.agence_id,nom_agence,a.created_at,
                                                c.commune_id,c.nom nom_commune,a.logo,p.prefecture_id,p.nom nom_prefecture
                                                FROM
                                                agences a,communes c,prefectures p,agence_communes ac
                                                where ac.commune_id = c.commune_id
                                                and a.agence_id= ac.agence_id
                                                and ac.agence_id=:agence_id and ac.commune_id =:commune_id
                                                and c.prefecture_id = p.prefecture_id order by a.updated_at desc"
                    ,['agence_id' => $agence_id,'commune_id' => $commune_id]);
                if(count($agence) > 0)
                    $agence = $agence[0];
                return response()->json(['success' => true,'status' => Response::HTTP_OK,'agence' => $agence]);
            }  catch (QueryException $ex){
                return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                    'messages' => ['errors' => $ex->getMessage()]]);
            }
        }
    }
    public function newAgence(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
              "commune_id.required" => "Veuillez choisir la commune.",
              "commune_id.not_in" => "Veuillez choisir la commune.",
              "commune_id.exists" => "Cette commune n'existe pas.",
              "agence.max" => "Le caractère maximum pour le nom de l'agence est quarante cinq (5).",
              "agence.required" => "Le nom de l'agence est obligatoire.",
              "agence.min" => "Le caractère minimum pour le nom de l'agence est deux (2).",
              "logo.required" => "Le logo de la banque est obligatoire." ,
              "logo.mimes" => "Les format accepter sont jpeg,jpg ou png.",
            ];
            $validator = Validator::make($input,[
                'commune_id' => 'required|not_in:0|exists:communes,commune_id',
                'agence' => ['required','max:45','min:2'],
                'logo' => 'required|mimes:jpeg,jpg,png|max:1024'
            ],$messages);
            if ($validator->fails())
               return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,'messages' => $validator->messages()]);
            else{
                try{
                    $agence = Agence::where('nom_agence','=',$input['agence'])->get()->first();
                    if(!$agence) {
                        $agence = new Agence();
                        $agence->nom_agence = $input['agence'];
                        if( $request->file('logo') ){
                            $logo = $input['agence'].'.'.$input['logo']->getClientOriginalExtension();
                            $request->file('logo')->storeAs('public/images/agences', $logo);
                            $agence->logo = 'images/agences/'.$logo;
                            $agence->save();
                        }
                        $agence->save();
                    }

                    if(AgenceCommune::where('agence_id',$agence->agence_id)->where('commune_id',$input['commune_id'])->exists())
                        return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,'messages' => ['commune_id' => ["Cette agence existe déjà dans cette commune."]]]);
                    $agenceCommune = new AgenceCommune();
                    $agenceCommune->agence_id = $agence->agence_id;
                    $agenceCommune->commune_id = $input['commune_id'];
                    $agenceCommune->save();

                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
                }
            }
        }
  }
  public function updateAgence(Request $request){
      if($request->isMethod('post')){
          $input = $request->all();
          $agence_id = 0;
          if(isset($input['agence_id']))
              $agence_id = $input['agence_id'];
          $messages = [
              "commune_id.required" => "Veuillez choisir la commune.",
              "commune_id.not_in" => "Veuillez choisir la commune.",
              "commune_id.exists" => "Cette commune n'existe pas.",
              "agence.max" => "Le caractère maximum pour le nom de l'agence est quarante cinq (5).",
              "agence.required" => "Le nom de l'agence est obligatoire.",
              "agence.min" => "Le caractère minimum pour le nom de l'agence est trois (3).",
              "agence_id.required" => "Veuillez selectionner une agence.",
              "agence_id.exists" => "Nous ne retrouvons pas cette agence!",
              'agenceCommune_id.required' => 'Veuillez choisir l\'agence',
              "agenceCommune_id.exists" => "Cette Agence n'existe pas",
              "logo.mimes" => "Les format accepter sont jpeg,jpg ou png.",
          ];
          $validator = Validator::make($input,[
              'commune_id' => 'required|not_in:0|exists:communes,commune_id',
              'agence_id' => 'required|exists:agences,agence_id',
              'agenceCommune_id' => 'required|exists:agence_communes,agenceCommune_id',
              'agence' => ['required','max:45','min:3',],
              'logo' => 'nullable|mimes:jpeg,jpg,png|max:1024'
          ],$messages);
          if ($validator->fails())
              return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,'messages' => $validator->messages()]);
          else{
              try{
                  $agencename = Agence::where('nom_agence','=',$input['agence'])->get()->first();
                  $agence = Agence::find($agence_id);
                  if(!$agencename) {
                      $agence->nom_agence = $input['agence'];
                      $agence->save();
                  }
                  if(AgenceCommune::where('agence_id',$agence_id)->where('commune_id',$input['commune_id'])
                      ->where('agenceCommune_id','!=',$input['agenceCommune_id'])->exists())
                      return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,'messages' => ['commune_id' => ["Cette agence existe déjà dans cette commune."]]]);
                  $agencecommune = AgenceCommune::find($input['agenceCommune_id']);
                  $agencecommune->commune_id = $input['commune_id'];
                  if( $request->file('logo') ){
                      $logo = $input['agence'].'.'.$input['logo']->getClientOriginalExtension();
                      $request->file('logo')->storeAs('public/images/agences', $logo);
                      $agence->logo = 'images/agences/'.$logo;
                      $agence->save();
                  }
                  $agencecommune->save();
                  return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
              }
              catch (QueryException $ex){
                  return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
              }
          }
      }
  }
    public function agenceprefecture(Request $request,$prefecture_id){
        if($request->isMethod('get')){
            try{
                $agence = DB::select("SELECT p.prefecture_id,c.commune_id,c.nom commune,a.agence_id,nom_agence
                                        FROM communes c,prefectures p,regions r,agences a,agence_communes ac
                                        where c.commune_id = ac.commune_id
                                        and p.prefecture_id = c.prefecture_id
                                        and a.agence_id = ac.agence_id
                                        and r.region_id = p.region_id and p.prefecture_id=?",[$prefecture_id]);
                return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'AgencesPref' => $agence]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                    'messages' => ['errors' => $ex->getMessage()]]);
            }
        }
    }
}
