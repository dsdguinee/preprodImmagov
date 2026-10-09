<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;

use App\Models\Immatriculation;
use App\Models\Mutation;
use App\Models\Rejet;
use App\Rules\Mutation\CanValided;
use App\Rules\Mutation\CheckImmatriculationValide;
use App\Rules\Mutation\CheckMutationDone;
use App\Rules\Mutation\CheckSameAffectation;
use App\Rules\Mutation\MutationValided;
use App\Rules\Mutation\ResoumissionMutationDone;
use App\Rules\RuleMotif;
use App\Rules\RuleMotifNouveau;
use App\Services\SipimService;
use App\Services\HistoriqueService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MutationController extends BaseController
{
    /**
     * Dossier d'immatriculation d'un châssis, pour une mutation payée dans SIPIM (nouvelle immatriculation).
     * GET /mutation/dossierParChassis?chassis=... : véhicule, numéro et affectation actuelle ;
     * mutable = dossier validé sans mutation déjà en attente.
     */
    public function dossierParChassis(Request $request){
        $chassis = trim((string) $request->chassis);
        if ($chassis === '')
            return response()->json(['success' => false, 'messages' => ['chassis' => ['Le numéro de châssis est obligatoire.']]]);
        $dossier = DB::selectOne("select i.immatriculation_id, i.immatriculation_number, i.modeImmatriculation, i.status, i.typeOrganisme,
                                         i.minister_id, i.direction_id, mi.nom ministere, d.nom direction,
                                         v.*, ma.title marque, mo.title modele, g.nom genre_nom, t.nom type_nom
                                  from vehicules v
                                  join immatriculations i on i.vehicule_id = v.vehicule_id
                                  left join ministeres mi on mi.ministere_id = i.minister_id
                                  left join directions d on d.direction_id = i.direction_id
                                  left join marques ma on ma.id = v.marque_id
                                  left join modeles mo on mo.id = v.model_id
                                  left join genres g on g.genre_id = v.genre
                                  left join typevehicules t on t.type_id = v.typeVehicule
                                  where trim(v.numChassie) = ? order by i.immatriculation_id desc limit 1", [$chassis]);
        // Même recherche pour une mutation ou une réforme payée dans SIPIM
        $operation = $request->operation === 'reforme' ? 'la réforme' : 'la mutation';
        if (!$dossier)
            return response()->json(['success' => false, 'messages' => ['chassis' => ["Ce châssis n'est pas immatriculé dans IMMAGOV : $operation est impossible."]]]);
        $enAttente = Mutation::where('immatriculation_id', $dossier->immatriculation_id)->where('status', 0)->exists();
        $reformeEnAttente = DB::table('reformes')->where('immatriculation_id', $dossier->immatriculation_id)->where('status', 0)->exists();
        $raison = (int) $dossier->status === 3 ? ($reformeEnAttente ? "Une réforme du dossier {$dossier->immatriculation_number} est déjà en attente de validation." : "Le véhicule {$dossier->immatriculation_number} est déjà réformé : $operation est impossible.")
            : (!in_array((int) $dossier->status, [1, 4]) ? "Le dossier {$dossier->immatriculation_number} n'est pas encore validé : $operation est impossible."
            : ($enAttente ? "Une mutation du dossier {$dossier->immatriculation_number} est déjà en attente de validation : $operation est impossible." : null));
        return response()->json(['success' => true, 'mutable' => $raison === null, 'raison' => $raison, 'dossier' => $dossier]);
    }

    /**
     * Mutation payée dans SIPIM, déclarée depuis la nouvelle immatriculation :
     * le dossier du châssis garde son numéro, change d'organisme et part en validation chez le Directeur.
     * La référence SIPIM doit être une mutation validée, non utilisée, pour ce châssis ; elle est consommée.
     */
    public function mutationDepuisPaiement(Request $request){
        $input = $request->all();
        $validator = Validator::make($input, [
            'immatriculation_id' => ['required', new CheckImmatriculationValide(), new CanValided()],
            'paiementReference' => ['required', 'string'],
            'ministere' => ['required', 'integer', 'not_in:0,1000000', 'exists:ministeres,ministere_id',
                new CheckSameAffectation($input['affectation_id'] ?? null, $input['affectation_direction_id'] ?? null, $input['direction'] ?? null)],
            'direction' => ['nullable'],
            'pieceJointe' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ], [
            'immatriculation_id.required' => "Le dossier à muter n'a pas été identifié.",
            'paiementReference.required' => 'La référence de paiement est obligatoire.',
            'ministere.required' => "Le nouvel organisme d'affectation est obligatoire.",
            'ministere.not_in' => "Choisissez un organisme existant pour la mutation.",
            'ministere.exists' => "Cet organisme n'existe pas.",
            'pieceJointe.required' => 'La pièce jointe est obligatoire.',
            'pieceJointe.mimes' => 'La pièce jointe doit être au format PDF, JPEG ou PNG.',
            'pieceJointe.max' => 'La pièce jointe ne doit pas dépasser 10 Mo.',
            'pieceJointe.uploaded' => "La pièce jointe n'a pas pu être envoyée : taille maximale autorisée ".\App\Exceptions\Handler::maxUploadMo()." Mo.",
        ]);
        if ($validator->fails())
            return response()->json(['success' => false, 'messages' => $validator->messages()]);

        $immatriculation = Immatriculation::find($input['immatriculation_id']);
        $chassis = trim((string) DB::table('vehicules')->where('vehicule_id', $immatriculation->vehicule_id)->value('numChassie'));

        // Le paiement SIPIM doit être une mutation validée, non utilisée, pour ce châssis
        $sipim = SipimService::getPaiement($input['paiementReference']);
        $paiement = $sipim['paiement'] ?? null;
        $refus = ($sipim['status'] ?? null) !== 200 || !$paiement ? (is_string($sipim['messages'] ?? null) ? $sipim['messages'] : 'Paiement introuvable.')
            : (($paiement['modeImmat'] ?? '') !== 'Mutation' ? "Cette référence n'est pas un paiement de mutation."
            : (($paiement['status'] ?? '') !== 'Validé' ? 'Paiement non validé.'
            : (!empty($paiement['utilise']) ? 'Cette référence de paiement a déjà été utilisée.'
            : (strcasecmp(trim($paiement['chassis'] ?? ''), $chassis) !== 0 ? "Cette référence concerne un autre châssis." : null))));
        if ($refus)
            return response()->json(['success' => false, 'messages' => ['paiementReference' => [$refus]]]);

        try {
            DB::beginTransaction();
            $mutation = new Mutation();
            $mutation->immatriculation_id = $immatriculation->immatriculation_id;
            $mutation->ministere = $input['ministere'];
            $mutation->direction = ($input['direction'] ?? null) ?: null;
            $mutation->motif = 'Mutation payée dans SIPIM (référence '.trim($input['paiementReference']).')';
            $mutation->paiementReference = trim($input['paiementReference']);
            $mutation->fonction = 'Non renseignée';
            $mutation->ancienMinistere_id = $immatriculation->minister_id;
            $mutation->ancienDirection_id = $immatriculation->direction_id;
            $mutation->user_id = Auth::user()->id;
            $mutation->status = 0;
            $mutation->created_at = Carbon::now();
            $mutation->updated_at = Carbon::now();
            // La pièce jointe est rangée comme second document de la mutation (PDF accepté)
            $mutation->document2 = $this->storingFile($request, 'pieceJointe', $immatriculation->immatriculation_number.'_'.random_int(1, 5000), 'documents/mutation/document2');
            $mutation->save();

            $immatriculation->status = 4;
            $immatriculation->mutationStatus = 0;
            $immatriculation->minister_id = $input['ministere'];
            $immatriculation->direction_id = ($input['direction'] ?? null) ?: 0;
            $immatriculation->updated_at = Carbon::now();
            $immatriculation->save();

            // Référence consommée dans SIPIM ; en cas de refus, rien n'est enregistré
            $utilisation = SipimService::utiliserPaiement($input['paiementReference'], $immatriculation->immatriculation_number);
            if (empty($utilisation['success'])) {
                DB::rollBack();
                return response()->json(['success' => false, 'messages' => ['paiementReference' => [is_string($utilisation['messages'] ?? null) ? $utilisation['messages'] : 'Référence de paiement non utilisable.']]]);
            }
            DB::commit();
            return response()->json(['success' => true, 'numero' => $immatriculation->immatriculation_number]);
        }
        catch (\Throwable $ex){
            if (DB::transactionLevel() > 0) DB::rollBack();
            return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
    }

    public function newMutation(Request $request){
        $input = $request->all();

        $messages = [
            'immatriculation_id.required' => "Vous n'aviez pas fournie de vehicule a muté.",
           // 'valeurResiduelle.required' => "La valeur residuelle est obligatoire.",
           // 'valeurResiduelle.gt' => "La valeur residuelle minimum est cinquante mille francs guinéens (50000).",
            'ministere.required' => "Le Ministère d'affectation est obligatoire.",
            'ministere.not_in' => "Le Ministère d'affectation est obligatoire.",
            'ministere.integer' => "Vous devez fournir l'identifiant du ministere.",
            'motif.required' => 'Le motif est obligatoire.',
            'motif.min' => 'Le caractère minimum pour le Motif est quatre (4).',
            "document1.mimes" => "Veuillez charger une image de type jpe|jpeg|png pour le document 1.",
            "document2.mimes" => "Veuillez charger une image de type jpe|jpeg|png pour le document 1.",
            'affectation_id.required' => "Le ministere d'orgine est obligatoire.",
            'fonction.required' => "La fonction du nouveau proprietaire est obligatoire.",
        ];
        $validator = Validator::make($input,[
            'immatriculation_id' => ['required',new CheckImmatriculationValide(),new CanValided()],
            //'valeurResiduelle' => 'required|gt:49999',
            'ministere' => ['required','not_in:0','integer',new CheckSameAffectation($input['affectation_id'],$input['affecation_direction_id'],$input['direction'])],
            'direction' => ['nullable'],
            'motif' => ['required','min:4'],
            "document1" => "nullable|mimes:jpg,jpeg,png|max:2040",
            "document2" => "nullable|mimes:jpg,jpeg,png,pdf|max:2040",
            'affectation_id' => ['required'],
            'affecation_direction_id' => ['nullable'],
            'fonction' => ['required'],

        ],$messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'messages' => $validator->messages()]);
        else{
            try{
                $immatriculation =Immatriculation::find($input['immatriculation_id']);

                $mutation = new Mutation();
                $mutation->immatriculation_id = $input['immatriculation_id'];
                $mutation->ministere = $input['ministere'];
                $mutation->direction = $input['direction'];

                $mutation->motif = ucfirst(trim($input['motif']));
                $mutation->user_id = Auth::user()->id;
                $mutation->created_at = Carbon::now();
                $mutation->fonction = ucfirst(trim($input['fonction']));
                $mutation->ministere = $input['ministere'];
                $mutation->direction = $input['direction'];
                $mutation->ancienMinistere_id = $immatriculation->minister_id;
                $mutation->ancienDirection_id = $immatriculation->direction_id;
                $mutation->status = 0;
                $fileID = random_int(1,5000);
                if( $request->file('document1'))
                    $mutation->document1 = $this->storingFile($request,"document1",$immatriculation->immatriculation_number."_".$fileID,"documents/mutation/document1");
                if( $request->file('document2'))
                    $mutation->document2 = $this->storingFile($request,"document2",$immatriculation->immatriculation_number."_".$fileID,"documents/mutation/document2");
                $mutation->updated_at = Carbon::now();
                $mutation->save();

                $immatriculation->status = 4;
                $immatriculation->mutationStatus = 0;
                $immatriculation->updated_at = Carbon::now();
                $immatriculation->minister_id = $input['ministere'];
                $immatriculation->direction_id = $input['direction'];

                $immatriculation->save();
                return response()->json(['success' => true]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }

    public function getallmutation(){

        try{

            if($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1) {
                $mutations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,mi.immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,i.minister_id ministere,i.direction_id direction,autreministere,mi.status,i.updated_at,
                                                u.nom,u.prenom,mini.nom nomMinistere,mutation_id,mi.fonction,mi.ancienMinistere_id ancienMinistereID
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma,mutations mi,ministeres mini
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id and mi.immatriculation_id = i.immatriculation_id
                                                and v.user_id = u.id and m.id = v.model_id and mi.ministere = mini.ministere_id and i.status = 4  order by mi.updated_at desc');
                return response()->json(['success' => true,'mutations' => $mutations]);
            }else{
                $mutations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,mi.immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number ,i.direction_id direction,autreministere,mi.status,i.updated_at,
                                                u.nom,u.prenom,mini.nom nomMinistere,mutation_id,i.minister_id ministere,mi.fonction,mi.ancienMinistere_id ancienMinistereID
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma,mutations mi,ministeres mini
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id and mi.immatriculation_id = i.immatriculation_id
                                                and v.user_id = u.id and m.id = v.model_id  and mi.ministere = mini.ministere_id and (i.status = 4 and i.created_by =:user_id) order by mi.updated_at desc',
                    ['user_id' => Auth::user()->id]);

                return response()->json(['success' => true,'mutations' => $mutations]);
            }

        }
        catch (QueryException $ex){
            return response()->json(['success'=>false,'messages' => $ex->getMessage()]);
        }
    }
//    public function fullAccess($user_id){
//        $userAccess = DB::select('select privilege_id  from user_privileges where user_id = ?',$user_id);
//        $fullAccess = DB::select("SELECT privilege_id FROM immagov_db.privileges where nom NOT IN ('Nouvelle immatriculation','Nouvelle Mutation','Nouvelle Reforme')");
//        $result = array_diff($userAccess,$fullAccess);
//        return $result;
//        if(count($result) === 0)
//            return true;
//        else false;
//    }
    public function getmutationBy($mutation_id){
        try{
            $mutation = DB::select('
                            select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre genre_id,gre.nom genre,v.typevehicule type_id ,t.nom typeVehicule,
                            numChassie,carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                            energy,transmission,provenance,colorVehicule,acquisition,v.user_id,i.immatriculation_id,modeImmatriculation,
                            ancienImmatriculation,immatriculation_number,minister_id, mi.nom NouveMinistere ,mu.direction NouveauDirection_id ,i.status,i.updated_at ancienDteAttribution,
                            u.nom,u.prenom,v.nbreEssuie,v.pv,v.cu,v.pieceJointe,
                            mu.mutation_id,mu.immatriculation_id,mu.motif,ministere NouveauMinistere_id,mu.ancienMinistere_id,
                            mu.ancienDirection_id ancienDirection_id,mu.status NouveauStatus,mu.fonction,document1,document2,mu.valided_by,
                            mu.created_at dateDemande, mu.valided_at dateDecision, mu.user_id demandeur_id, mu.paiementReference, i.qrcode,
                            (select nom from ministeres where ministere_id = mu.ancienMinistere_id) ancienMinistere,
                            (select nom from directions where direction_id = mu.ancienDirection_id) ancienDirection,
                            (select nom from directions where direction_id = mu.direction) nouvelleDirection,
                            (select concat(prenom, " ", nom) from users where id = mu.user_id) demandeur,
                            (select concat(prenom, " ", nom) from users where id = mu.valided_by) validePar,
                            (select concat_ws(" — ", nullif(r.raison,""), nullif(r.autreraison,"")) from rejets r
                              where r.immatriculation_id = mu.immatriculation_id and r.typeRejet = "mutation" order by r.rejet_id desc limit 1) motifRejet
                            from vehicules v,immatriculations i,users u,modeles m,marques ma,ministeres mi,genres gre,typevehicules t,
                                 mutations mu
                            where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                            and i.created_by = u.id and m.id = v.model_id and mi.ministere_id = mu.ministere
                            and v.genre = gre.genre_id and t.type_id = v.typeVehicule 
                             and mu.immatriculation_id = i.immatriculation_id and mutation_id=?',[$mutation_id]);
            return response()->json(['success' => true,'mutation' => $mutation]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'messages' => $ex->getMessage()]);
        }
    }

    public function validerMutation(Request $request){
        if($request->isMethod('post')) {
            $input = $request->all();
            $messages = ['mutation_id.required' => "La Mutation n'existe pas"];
            $validator = Validator::make($input,
                ['mutation_id' => ['required',new MutationValided()]
                ]
                ,[$messages]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'messages' => $validator->messages()]);
            }else{
                try{
                    $mutation = Mutation::find($input['mutation_id']);
                    $mutation->status = 1;
                    $mutation->valided_by = Auth::user()->id;
                    $mutation->valided_at = Carbon::now();
                    $mutation->updated_at = Carbon::now();
                    $mutation->save();
                    $immatriculation = Immatriculation::find($mutation->immatriculation_id);
                    if($immatriculation){
                        $immatriculation->mutationStatus = 1;
                        $immatriculation->save();
                        // Historique : le nouvel organisme devient l'utilisateur du véhicule
                        HistoriqueService::ouvrir($immatriculation, $mutation->ministere, $mutation->direction, $mutation->valided_at,
                            'mutation', Auth::user()->id, ['mutation_id' => $mutation->mutation_id, 'reference' => $mutation->paiementReference, 'fonction' => $mutation->fonction]);
                    }
                    return response()->json(['success' => true]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'messages' => $ex->getMessage()]);
                }
            }
        }
    }

    public function rejet(Request $request){
        if($request->isMethod('post')){
            try{

                $input = $request->all();
                $messages = ['id.required' => "Reforme n'existe pas"];
                $validator = Validator::make($input,[
                    'id' => ['required',new MutationValided()],
                    "motif" => [new RuleMotif($input['autremotif'])],
                    "autremotif" => [new RuleMotifNouveau($input['motif'])],
                ],$messages);
                if (!$validator->fails()) {
                    $mutation = Mutation::where('mutation_id', $request->input('id'))->get()->first();
                    if ($mutation) {
                        $mutation->status = 2;
                        $mutation->valided_by = Auth::user()->id;
                        $mutation->valided_at = Carbon::now();
                        $mutation->updated_at = Carbon::now();
                        $mutation->save();
                        $rejet = new Rejet();
                        $rejet->raison = $input['motif'];

                        $rejet->autreraison = $input['autremotif'];
                        $rejet->typeRejet = 'mutation';
                        $rejet->immatriculation_id = $mutation->immatriculation_id;
                        $rejet->save();
                        $immatriculation = Immatriculation::find($mutation->immatriculation_id);
                        if($immatriculation){
                            $immatriculation->minister_id = $mutation->ancienMinistere_id;
                            $immatriculation->direction_id = $mutation->ancienDirection_id;
                            $immatriculation->mutationStatus = 1;
                            $immatriculation->save();
                        }
                        return response()->json(['status' => true]);
                    } else return response()->json(['status' => false,"messages" => ["erreur" => "Cette immatriculation n'existe pas!"]]);
                }
                else {
                    return response()->json(['status' => false,'messages' => $validator->messages()]);
                }
            }
            catch (\Exception $ex){
                return response()->json(['status' => false,'messages' => ["erreur" => $ex->getMessage()]]);
            }
        }
    }

    public function getStatus($immatriculation_id){
        try{

            $mutation = Mutation::where('immatriculation_id',$immatriculation_id)->get()->first();
            if($mutation)
                return response()->json(['success' => true,'mutation' => $mutation]);
            else  return response()->json(['success' => false,'mutation' => $mutation]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'erreur' => $ex->getMessage()]);
        }
    }
    public function isStatusAttente($immatriculation_id){
        try {
            $mutation = Mutation::where('immatriculation_id', '=', $immatriculation_id)->where('status', '<>', 0)->get()->first();
            if($mutation)
               return response()->json(['success' => true,'status' => 1]);
            else  return response()->json(['success' => true,'status' => 0]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'erreur' => $ex->getMessage()]);
        }
    }

    public function resoumission(Request $request){
        $input = $request->all();

        $messages = [
            'immatriculation_id.required' => "Vous n'aviez pas fournie de vehicule a muté.",
             'mutation_id.required' => "L'identifiant est obligatoire.",
            // 'valeurResiduelle.required' => "La valeur residuelle est obligatoire.",
            // 'valeurResiduelle.gt' => "La valeur residuelle minimum est cinquante mille francs guinéens (50000).",
            'ministere_id.required' => "Le Ministère d'affectation est obligatoire.",
            'ministere_id.not_in' => "Le Ministère d'affectation est obligatoire.",
            'ministere_id.integer' => "Vous devez fournir l'identifiant du ministere.",
            'motif.required' => 'Le motif est obligatoire.',
            'motif.min' => 'Le caractère minimum pour le Motif est quatre (4).',
            "document1.mimes" => "Veuillez charger une image de type jpe|jpeg|png pour le document 1.",
            "document2.mimes" => "Veuillez charger une image de type jpe|jpeg|png pour le document 1.",
            'ancienMinistere_id.required' => "Le ministere d'orgine est obligatoire.",
            'fonction.required' => "La fonction du nouveau proprietaire est obligatoire."

        ];
        $validator = Validator::make($input,[
            'immatriculation_id' => ['required'],
            'mutation_id' => ['required',new ResoumissionMutationDone()],
            'ministere_id' => ['required','not_in:0','integer',new CheckSameAffectation($input['ancienMinistere_id'],$input['ancienDirection_id'],$input['direction_id'])],
            'direction_id' => ['nullable'],
            'fonction' => ['required'],
            'motif' => ['required','min:4'],
            "document1" => "nullable|mimes:jpg,jpeg,png|max:2040",
            "document2" => "nullable|mimes:jpg,jpeg,png|max:2040",
            'ancienMinistere_id' => ['required'],
            'ancienDirection_id' => ['nullable']

        ],$messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => 400,'messages' => $validator->messages()]);
        else{
            try{
                $immatriculation =Immatriculation::find($input['immatriculation_id']);

                $mutation = Mutation::find($input['mutation_id']);
                $mutation->immatriculation_id = $input['immatriculation_id'];
                $mutation->ministere = $input['ministere_id'];
                $mutation->direction = $input['direction_id'];
                $mutation->motif = ucfirst(trim($input['motif']));
                $mutation->user_id = Auth::user()->id;
                $mutation->fonction = ucfirst(trim($input['fonction']));
                $mutation->updated_at = Carbon::now();
                $mutation->status = 0;
                $fileID = random_int(1,5000);
                if( $request->file('document1'))
                    $mutation->document1 = $this->storingFile($request,"document1",$immatriculation->immatriculation_number."_".$fileID,"documents/mutation/document1");
                if( $request->file('document2'))
                    $mutation->document2 = $this->storingFile($request,"document2",$immatriculation->immatriculation_number."_".$fileID,"documents/mutation/document2");

                $immatriculation->status = 4;
                $immatriculation->mutationStatus = 0;
                 $mutation->save();
                $immatriculation->updated_at = Carbon::now();
                $immatriculation->mutationStatus = 0;
                $immatriculation->minister_id = $input['ministere_id'];
                $immatriculation->direction_id = $input['direction_id'];
                $immatriculation->save();

                return response()->json(['success' => true,'status' => 200]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'status' => 400,'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }

    public function immatriculationtionmutations(){
        try {
            $immatriculations = [];

            if($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1)
                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                      carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                       energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                        ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                       u.nom,u.prenom
                                                        from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                        where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id and (i.status = 1 or mutationStatus = 1) 
                                                        and v.user_id = u.id and m.id = v.model_id  order by updated_at desc');
            else{
//                $immatriculations = DB::select('  select vehicule_id,marque_id,marque,model_id,model,model,a.genre,typevehicule,numChassie,
//                                                        carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
//                                                        energy,transmission,provenance,colorVehicule,acquisition,user_id,a.immatriculation_id,modeImmatriculation,
//                                                        ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,a.updated_at,
//                                                        a.nom,a.prenom,oldministere_id,olddirection_id,statusMutation
//                                                        from(
//                                                        select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
//                                                        carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
//                                                        energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
//                                                        ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
//                                                        u.nom,u.prenom
//                                                        from vehicules v,immatriculations i,users u,modeles m,marques ma
//                                                        where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id and (i.status = 1 or i.status = 4)
//                                                        and v.user_id = u.id and m.id = v.model_id
//                                                        order by i.updated_at) a left join
//                                                        (select immatriculation_id,ministere oldministere_id, direction olddirection_id,status statusMutation,updated_at from mutations) b
//                                                        on a.immatriculation_id = b.immatriculation_id where a.user_id = ? and statusMutation!=0  order by a.updated_at desc'
//                                                       ,[Auth::user()->id]);

                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                      carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                       energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                        ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                       u.nom,u.prenom
                                                        from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                        where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id and (i.status = 1 or mutationStatus = 1) 
                                                        and v.user_id = u.id and m.id = v.model_id  and created_by=? order by updated_at desc',[Auth::user()->id]);
            }

            return response()->json(['status' => true,'immatriculations' => $immatriculations]);
        }
            //catch(\Illuminate\Database\QueryException $ex){
        catch (QueryException $ex){
            return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }
}
