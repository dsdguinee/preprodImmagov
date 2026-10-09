<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Commune;
use App\Models\Prefecture;
use App\Models\Quartier;
use App\Models\Region;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class DecoupageController extends Controller
{
    public function getAllDecoupage(){
        try{
            $regions = Region::all();
            $prefectures = Prefecture::all();
            $communes = Commune::all();
            $quartiers = Quartier::all();
            return response()->json(['success' => true,'status' => Response::HTTP_OK,
                'regions' => $regions,
                'prefectures' => $prefectures,
                'communes' => $communes,
                'quartiers' => $quartiers
                ]);
        }catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_FORBIDDEN,'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

    // Liste des communes avec leur prefecture et leur region
    public function getCommunes(){
        try {
            $communes = DB::select('SELECT r.region_id,r.nom region,p.prefecture_id,p.nom prefecture,c.commune_id,c.nom commune,c.communeCD
                                    FROM communes c
                                    JOIN prefectures p ON p.prefecture_id = c.prefecture_id
                                    LEFT JOIN regions r ON r.region_id = p.region_id
                                    ORDER BY p.nom, c.nom');
            return response()->json(['success' => true,'status' => Response::HTTP_OK,'communes' => $communes]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_FORBIDDEN,'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

    public function newCommune(Request $request){
        $input = $request->all();
        $input['commune'] = mb_strtoupper(trim($input['commune'] ?? ''));
        $messages = [
            'prefecture_id.required' => "La préfecture est obligatoire.",
            'prefecture_id.exists' => "Cette préfecture n'existe pas.",
            'commune.required' => "Le nom de la commune est obligatoire.",
            'commune.min' => "Le minimum de caractères pour la commune est trois (3).",
            'commune.max' => "Le maximum de caractères pour la commune est cent (100).",
            'commune.unique' => "Cette commune existe déjà dans cette préfecture.",
        ];
        $validator = Validator::make($input,[
            'prefecture_id' => 'required|exists:prefectures,prefecture_id',
            'commune' => ['required','min:3','max:100',
                Rule::unique('communes','nom')->where('prefecture_id',$input['prefecture_id'] ?? 0)],
        ],$messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
        try{
            $commune = new Commune();
            $commune->nom = $input['commune'];
            $commune->prefecture_id = $input['prefecture_id'];
            $commune->communeCD = $this->nextCommuneCode($input['prefecture_id']);
            $commune->save();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'commune' => $commune]);
        } catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }

    public function updateCommune(Request $request){
        $input = $request->all();
        $input['commune'] = mb_strtoupper(trim($input['commune'] ?? ''));
        $commune = Commune::find($input['id'] ?? 0);
        $messages = [
            'id.required' => "La commune est obligatoire.",
            'id.exists' => "Cette commune n'existe pas.",
            'commune.required' => "Le nom de la commune est obligatoire.",
            'commune.min' => "Le minimum de caractères pour la commune est trois (3).",
            'commune.max' => "Le maximum de caractères pour la commune est cent (100).",
            'commune.unique' => "Cette commune existe déjà dans cette préfecture.",
        ];
        $validator = Validator::make($input,[
            'id' => 'required|exists:communes,commune_id',
            'commune' => ['required','min:3','max:100',
                Rule::unique('communes','nom')->where('prefecture_id',$commune->prefecture_id ?? 0)->ignore($input['id'] ?? 0,'commune_id')],
        ],$messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
        try{
            $commune->nom = $input['commune'];
            $commune->save();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }

    public function deleteCommune(Request $request,$commune_id){
        try {
            $commune = Commune::find($commune_id);
            if (!$commune)
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND, 'messages' => ["erreur" => "Cette commune n'existe pas."]]);
            // Une commune deja utilisee ne peut pas etre supprimee
            $utilisations = [
                'users' => 'des utilisateurs',
                'agence_communes' => 'des agences',
                'paiements' => 'des paiements',
                'hpaiements' => 'des paiements',
                'quartiers' => 'des quartiers',
            ];
            foreach ($utilisations as $table => $libelle) {
                if (DB::table($table)->where('commune_id', $commune_id)->exists())
                    return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ["erreur" => "Cette commune est rattachée à $libelle, elle ne peut pas être supprimée."]]);
            }
            $commune->delete();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK]);
        }catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }

    // Code commune = code prefecture + numero d'ordre sur 2 chiffres (ex: 0101 -> 010107)
    private function nextCommuneCode($prefecture_id){
        $prefectureCd = Prefecture::where('prefecture_id', $prefecture_id)->value('prefectureCd');
        $max = 0;
        foreach (Commune::where('prefecture_id', $prefecture_id)->pluck('communeCD') as $code) {
            if ($code && strpos($code, $prefectureCd) === 0)
                $max = max($max, (int) substr($code, strlen($prefectureCd)));
        }
        return $prefectureCd . str_pad($max + 1, 2, '0', STR_PAD_LEFT);
    }
}
