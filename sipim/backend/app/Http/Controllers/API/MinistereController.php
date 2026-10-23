<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ministere;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Organismes publics proposés au paiement : ministères (client « Gouvernement ») et entreprises publiques
 * (client « Entreprise Publique »), distingués par la catégorie.
 * Liste : tous les utilisateurs connectés ; ajout / modification / suppression : privilège « Ministère ».
 */
class MinistereController extends Controller
{
    const PRIVILEGE = 'Ministère';
    const CATEGORIES = ['Ministère', 'Entreprise Publique'];

    private $messages = [
        'nom.required' => "Le nom est obligatoire.",
        'nom.min' => "Le minimum de caractères pour le nom est trois (3).",
        'nom.max' => "Le maximum de caractères pour le nom est cent quatre-vingt-onze (191).",
        'nom.unique' => "Cet organisme existe déjà.",
        'categorie.required' => "La catégorie est obligatoire.",
        'categorie.in' => "Catégorie inconnue (Ministère ou Entreprise Publique).",
        'id.required' => "L'organisme est obligatoire.",
        'id.exists' => "Cet organisme n'existe pas.",
    ];

    public function index(Request $request)
    {
        try {
            // ?categorie=Ministère ou Entreprise Publique : liste du type de client choisi au paiement
            $categorie = $request->query('categorie');
            $filtre = in_array($categorie, self::CATEGORIES, true) ? 'WHERE m.categorie = ?' : '';
            $ministeres = DB::select("SELECT m.ministere_id, m.nom, m.categorie,
                                        (SELECT count(*) FROM paiements p WHERE p.ministere_id = m.ministere_id) nbrePaiements
                                      FROM ministeres m $filtre ORDER BY m.categorie, m.nom", $filtre ? [$categorie] : []);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'ministeres' => $ministeres]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function store(Request $request)
    {
        if ($refus = $this->refusSansPrivilege()) return $refus;
        $input = ['nom' => $this->normaliser($request->input('nom')), 'categorie' => $request->input('categorie', 'Ministère')];
        $validator = Validator::make($input, [
            'nom' => ['required', 'min:3', 'max:191', 'unique:ministeres,nom'],
            'categorie' => ['required', Rule::in(self::CATEGORIES)],
        ], $this->messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
        try {
            $ministere = Ministere::create($input);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'ministere' => $ministere]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function update(Request $request)
    {
        if ($refus = $this->refusSansPrivilege()) return $refus;
        $input = ['id' => $request->input('id'), 'nom' => $this->normaliser($request->input('nom')), 'categorie' => $request->input('categorie')];
        $validator = Validator::make($input, [
            'id' => 'required|exists:ministeres,ministere_id',
            'nom' => ['required', 'min:3', 'max:191', Rule::unique('ministeres', 'nom')->ignore($input['id'], 'ministere_id')],
            'categorie' => ['nullable', Rule::in(self::CATEGORIES)],
        ], $this->messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
        try {
            // Les paiements déjà enregistrés gardent le nom saisi à l'époque (fullName)
            Ministere::where('ministere_id', $input['id'])->update(array_filter(['nom' => $input['nom'], 'categorie' => $input['categorie']]));
            return response()->json(['success' => true, 'status' => Response::HTTP_OK]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function destroy($ministere_id)
    {
        if ($refus = $this->refusSansPrivilege()) return $refus;
        try {
            $ministere = Ministere::find($ministere_id);
            if (!$ministere)
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND, 'messages' => ['erreur' => "Cet organisme n'existe pas."]]);
            // Un ministère déjà utilisé par des paiements ne peut pas être supprimé
            if (DB::table('paiements')->where('ministere_id', $ministere_id)->exists())
                return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['erreur' => "Cet organisme est rattaché à des paiements, il ne peut pas être supprimé. Vous pouvez le renommer."]]);
            $ministere->delete();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    private function normaliser($nom)
    {
        return mb_strtoupper(preg_replace('/\s+/', ' ', trim((string) $nom)));
    }

    private function refusSansPrivilege()
    {
        $autorise = DB::table('user_privileges as u')->join('privileges as p', 'p.privilege_id', '=', 'u.privilege_id')
            ->where('u.user_id', auth()->id())->where('p.nom_privilege', self::PRIVILEGE)->exists();
        return $autorise ? null : response()->json(['success' => false, 'status' => Response::HTTP_FORBIDDEN,
            'messages' => ['erreur' => "Vous n'avez pas le droit de gérer les ministères et entreprises publiques."]]);
    }
}
