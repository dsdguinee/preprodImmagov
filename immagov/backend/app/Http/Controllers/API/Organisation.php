<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use App\Models\Immatriculation;
use App\Models\Ministere;
use App\Rules\Immatriculation\CheckImmatriculationExist;
use App\Rules\Organisations\CheckMinistereExiste;
use App\Services\OrganismeService;
use App\Rules\Organisations\DeleteDirectionExist;
use App\Rules\Organisations\DeleteMinistereExist;
use App\Rules\Organisations\DirectionExist;
use App\Rules\Organisations\MinistereExistUpdate;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class Organisation extends Controller
{
    public function getallministere(){
        $ministeres = Ministere::orderBy('ministere_id')->get();
        return response()->json(['ministeres' => $ministeres]);
    }
    public function getalldirection(){
        try {
            $directions = Direction::orderBy('direction_id')->get();
            return response()->json(['directions' => $directions]);
        }
        catch(QueryException $ex){
            return response()->json(['success' => false,'messages' => $ex->getMessage()]);
        }
    }
    public function getdirectionsByMinistere($ministere_id){

        $directions = Direction::where('ministere_id',$ministere_id)->get();
        return response()->json(['directions' => $directions]);
    }
    public function getMinistereById($ministere_id){
        $ministere = Ministere::find($ministere_id);
        if( $ministere )
          return response()->json(['ministere' => $ministere]);
        else return response()->json(['status' => 404,'message'=>'Non Fournie.']);
    }
    public function getdirectionbyID($directionID){
        $direction = Direction::find($directionID);
        if($direction)
            return response()->json(['direction' => $direction]);
        else return response()->json(['status' => 404,'message'=>'Non Fournie.']);
    }
    public function getministereByName($ministerename){
        $ministere = DB::select('select * from ministeres where upper(nom)=?',[strtolower($ministerename)]);
        if($ministere)
        {
            return response()->json(['success' => true,'ministere' => $ministere]);
        }else{
            return response()->json(['success' => false,'ministere' => $ministere]);
        }
    }
    /**
     * Validation de l'organisme (et de la direction) proposé par un agent pour une immatriculation.
     * - ministere_id fourni : le dossier est rattaché à cet organisme existant.
     * - sinon : un organisme du même nom et du même type est réutilisé s'il existe, créé sinon (pas de doublon).
     * La direction suit la même règle au sein de l'organisme retenu.
     */
    public function createMinistereDirectionsValidation(Request $request){
        if($request->isMethod('post')){
          try{
            $messages = [
               'immatriculation_id.required' => "Immatriculation non faite",
               'ministere.required_without' => "Le nom du ministère est obligatoire.",
               'ministere.min' => "Le nom du ministère compte au moins deux (2) caractères.",
               'ministere_id.exists' => "Cet organisme n'existe pas.",
               'direction.string' => "Le nom de direction est de type chaine de caractere",
               'direction.min' => "Le minimum de caractere est deux (2).",
               "typeorganisme.required" => "Type d'organisme non specifié.",
               "typeorganisme.in" => "Le type d'organisme doit être Publique ou Privé.",
               "typeplaque.in" => "Le type de plaque doit être VA ou EP.",
            ];
            $input = $request->all();
            $validator = Validator::make($input,[
                'immatriculation_id' => ['required',new CheckImmatriculationExist()],
                'ministere_id' => ['nullable','exists:ministeres,ministere_id'],
                'ministere' => ['required_without:ministere_id','nullable','string','min:2'],
                'direction' => ['nullable','string','min:2'],
                'typeorganisme' => 'required|in:Publique,Privé',
                'typeplaque' => 'nullable|in:VA,EP',
                // Catégorie du client du paiement : Ministère (Gouvernement) ou Entreprise Publique
                'categorie' => 'nullable|in:Ministère,Entreprise Publique',
            ],$messages);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            }

            $resultat = DB::transaction(function () use ($input) {
                $nom = OrganismeService::normaliser($input['ministere'] ?? '');
                $ministereCree = false;
                if (!empty($input['ministere_id'])) {
                    $ministere = Ministere::find($input['ministere_id']);
                } else {
                    // Un nom ne peut exister qu'une fois : l'organisme existant est réutilisé, quel que soit son type
                    $ministere = OrganismeService::trouverParNom($nom);
                    if (!$ministere) {
                        $ministere = new Ministere();
                        $ministere->nom = ucfirst($nom);
                        $ministere->typeorganisme = $input['typeorganisme'];
                        $ministere->typeplaque = $input['typeplaque'] ?? null;
                        // Tout organisme est public : ministère / institution, ou entreprise publique selon le client du paiement
                        $ministere->typeorganisme = 'Publique';
                        $ministere->categorie = $input['categorie'] ?? ($input['typeorganisme'] === 'Publique' ? 'Ministère' : 'Entreprise Publique');
                        $ministere->save();
                        $ministereCree = true;
                    }
                }
                // Type de plaque du dossier à l'origine de la proposition, s'il n'est pas encore connu pour cet organisme
                if (!empty($input['typeplaque']) && empty($ministere->typeplaque)) {
                    $ministere->typeplaque = $input['typeplaque'];
                    $ministere->save();
                }

                $immatriculation = Immatriculation::find($input['immatriculation_id']);
                $immatriculation->autredirection = '';
                $immatriculation->autreministere = '';
                $immatriculation->minister_id = $ministere->ministere_id;

                $directionCree = false;
                $nomDirection = OrganismeService::normaliser($input['direction'] ?? '');
                if ($nomDirection !== '') {
                    $avant = Direction::where('ministere_id', $ministere->ministere_id)->count();
                    $direction = OrganismeService::directionPourNom($ministere->ministere_id, $nomDirection);
                    $directionCree = Direction::where('ministere_id', $ministere->ministere_id)->count() > $avant;
                    $immatriculation->direction_id = $direction->direction_id;
                } else if ((int) $immatriculation->direction_id === OrganismeService::AUTRE_DIRECTION) {
                    // Direction proposée retirée par le Directeur : le dossier reste sans direction
                    $immatriculation->direction_id = 0;
                }
                $immatriculation->save();
                return ['ministere' => $ministere->nom, 'ministereCree' => $ministereCree, 'directionCree' => $directionCree];
            });
            return response()->json(['success' => true] + $resultat);
        }catch (QueryException $ex){
              return response()->json(['success' => false,'messages' => ['erreur' => [$ex->getMessage()]]]);
          }
        }
    }
    // Catégorie de tout organisme : Ministère (ministères et institutions, client Gouvernement)
    // ou Entreprise Publique (client Entreprise Publique). Il n'y a plus d'organisme privé.
    const CATEGORIES = ['Ministère', 'Entreprise Publique'];

    /**
     * Données d'un organisme saisies par l'administrateur : nom normalisé et catégorie (Ministère ou Entreprise Publique).
     * Tout organisme est « Publique ».
     */
    private function donneesOrganisme(Request $request)
    {
        return [
            'nom' => OrganismeService::normaliser(mb_strtoupper((string) $request->input('nom'))),
            'categorie' => $request->input('categorie'),
            'typeOrganisme' => 'Publique',
        ];
    }

    private $messagesOrganisme = [
        'nom.required' => "Le nom de l'organisme est obligatoire.",
        'nom.min' => "Le nom de l'organisme compte au moins deux (2) caractères.",
        'typeOrganisme.required' => "Le type d'organisme est obligatoire.",
        'typeOrganisme.in' => "Le type d'organisme doit être Publique ou Privé.",
        'categorie.required' => "Choisissez la catégorie : ministère / institution ou entreprise publique.",
        'categorie.in' => "Catégorie inconnue : ministère / institution ou entreprise publique.",
    ];

    public function addNewMinistere(Request $request){
        try {
            $input = $this->donneesOrganisme($request);
            $validator = Validator::make($input, [
                'nom' => ['required', 'min:2', new CheckMinistereExiste($input['typeOrganisme'])],
                'categorie' => 'required|in:'.implode(',', self::CATEGORIES),
            ], $this->messagesOrganisme);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            $ministere = new Ministere();
            $ministere->nom = $input['nom'];
            $ministere->typeorganisme = $input['typeOrganisme'];
            $ministere->categorie = $input['categorie'];
            $ministere->save();
            return response()->json(['success' => true, 'ministere' => $ministere]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
    }

    public function UpdateMinistere(Request $request){
        try {
            $ministere_id = $request->input('ministere_id');
            $ministere = Ministere::find($ministere_id);
            if (!$ministere)
                return response()->json(['success' => false, 'messages' => ['erreur' => ["Cet organisme n'existe pas."]]]);
            $input = $this->donneesOrganisme($request);
            // Anciens appels sans catégorie : seul le nom change
            if (!$request->filled('categorie')) $input['categorie'] = $ministere->categorie ?: 'Entreprise Publique';
            $validator = Validator::make($input, [
                'nom' => ['required', 'min:2', new MinistereExistUpdate($ministere_id)],
                'categorie' => 'required|in:'.implode(',', self::CATEGORIES),
            ], $this->messagesOrganisme);
            if ($validator->fails())
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            $ministere->nom = $input['nom'];
            $ministere->typeorganisme = $input['typeOrganisme'];
            $ministere->categorie = $input['categorie'];
            $ministere->save();
            return response()->json(['success' => true, 'ministere' => $ministere]);
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
    }
    public function addNewDirection(Request $request){
        if($request->isMethod('post')){
            try {
               $input  = $request->all();
               $messages = [
                   'ministere_id.required' => "Le ministère est obligatoire.",
                   'ministere_id.exists' => "Ce ministère n'existe pas.",
                   'nom.required' => "Le nom de la direction est obligatoire.",
                   'nom.min' => "Au moin deux (2) caractères pour le nom de la direction."
               ];
               $validator = Validator::make($input, [
                 'ministere_id' => "required|exists:ministeres,ministere_id",
                  'nom' => ['required','min:2',new DirectionExist($input['ministere_id'])]
               ], $messages);
                if ($validator->fails()) {
                    return response()->json(['success' => false, 'messages' => $validator->messages()]);
                }else{
                      $direction = new Direction();
                      $direction->ministere_id = $input['ministere_id'];
                      $direction->nom = ucfirst(trim($input['nom']));
                      $direction->save();
                      return response()->json(['success' => true,]);
                }
            }catch (QueryException $ex){
                return response()->json(['success' => false,'messages' => $ex->getMessage()]);
            }
        }
    }
    public function updateDirection(Request $request){
        if($request->isMethod('post')){
            try {
                $input = $request->all();
                $messages = [
                    'ministere_id.required' => "Nous ne retrouvons le ministere de la direction.",
                    "ministere_id.exists" => "Nous ne retrouvons le ministere de la direction.",
                    "direction_id.required" => "La direction est obligatoire.",
                    "direction_id.exists" => "Nous ne retrouvons cette direction dans ce ministères.",
                    'nom.required' => "Le nom de la direction est obligatoire.",
                    'nom.min' => "Au moin deux (2) caractères pour le nom de la direction."
                ];
                $validator = Validator::make($input, [
                    'ministere_id' => 'required|exists:ministeres,ministere_id',
                    "direction_id" => 'required|exists:directions,direction_id',
                    "nom" => ['required', 'min:2', new DirectionExist($input['ministere_id'])]
                ], $messages);
                if ($validator->fails()) {
                    return response()->json(['success' => false, 'messages' => $validator->messages()]);
                } else {
                    $direction = Direction::where('direction_id', $input['direction_id'])->where('ministere_id', $input['ministere_id'])->get()->first();
                    $direction->nom = ucfirst(trim($input['nom']));
                    $direction->save();
                    return response()->json(['success' => true,]);
                }
            }catch (QueryException $ex){
                return response()->json(['success' => false,'messages' => $ex->getMessage()]);
            }
        }
    }
    public  function DeleteDirection(Request $request){
        if($request->isMethod('post')){
            try{
                $input = $request->all();
                $messages = [
                    'direction_id.required' => "La direction est obligatoire."
                ];
                $validator = Validator::make($input,[
                    'direction_id' => ['required',new DeleteDirectionExist()]
                ],$messages);
                if ($validator->fails()){
                    return response()->json(['success' => false, 'messages' => $validator->messages()]);
                }else{
                      $direction = Direction::find(trim($input['direction_id']));
                      $direction->delete();
                    return response()->json(['success' => true,]);
                }
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'messages' => $ex->getMessage()]);
            }
        }
    }
    public function DeleteMinistere(Request $request){
        if($request->isMethod('post')){
            try{
                $input = $request->all();
                $messages = [
                    'ministere_id.required' => "Le ministere est obligatoire."
                ];
                $validator = Validator::make($input,[
                    'ministere_id' => ['required',new DeleteMinistereExist()]
                ],$messages);
                if ($validator->fails()){
                    return response()->json(['success' => false, 'messages' => $validator->messages()]);
                }else{
                    $direction = Ministere::find(trim($input['ministere_id']));
                    $direction->delete();
                    return response()->json(['success' => true,]);
                }
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'messages' => $ex->getMessage()]);
            }
        }
    }
}
