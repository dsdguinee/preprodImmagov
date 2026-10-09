<?php

namespace App\Http\Controllers\API;

use App\Events\DashboardEvent;
use App\Http\Controllers\Controller;
use App\Models\Immatriculation;
use App\Models\Reforme;
use App\Models\Rejet;
use App\Rules\CheckeImmatriculationStatusReforme;
use App\Rules\CheckImmatriculationReformeExist;
use App\Rules\CheckValeurResiduelle;
use App\Rules\Reforme\CanValided;
use App\Rules\Reforme\IsReformeExiste;
use App\Rules\Reforme\IsReformer;
use App\Rules\Reforme\ReformeExist;
use App\Rules\RuleCheckImmatriculation_id;
use App\Rules\RuleMotif;
use App\Rules\RuleMotifNouveau;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\HistoriqueService;
use App\Services\SipimService;
use \App\Models\Vehicule;

class ReformeController extends BaseController
{
  public function NewReforme(Request $request){
      if($request->isMethod('post')){
          $input = $request->all();
          $messages = [
              'immatriculation_id.required' => "On ne retourve pas le vehicule a reformer.",
              'immatriculation_id.numeric' => "Erreur 1 dans l'operation",
              'nom.required' => "Le nom du propriétaire est obligatoire.",
              'nom.min' => "Le minimum de caractere pour le nom du  propriétaire est deux (2).",
              'nom.max' => "Le maximum de caractère pour le nom du  propriétaire est cent cinquante (150).",
              'prenom.required' => "Le prenom est obligatoire",
              'prenom.min' => "Le minimum de caractère pour le prenom du  propriétaire est  deux (2).",
              'prenom.max' => "Le maximum de caractère pour le prenom du  propriétaire est cent cinquante (150).",
              'fonction.required' => "La fonction est obligatoire.",
              'fonction.min' => "Le minimum de caractère pour la fonction st  deux (2).",
              'fonction.max' => "Le maximum de caractère pour la fonction est soixante quinze (75).",
              "ministere_id.required" => "Le ministère est obligatoire",
              "ministere_id.not_in" => "Le ministère est obligatoire",
              "date_naissance.required" => "La date de naissance est obligatoire.",
              "date_naissance.date_format" => "Format de la date de naissance est incorrect.Jour/Mois/Année",
              "valeurResiduelle.required" => "La valeur residuelle est obligatoire.",
              "date_naissance.before" => "L'age minimal est de 18 ans.",
          ];
          $validator = Validator::make($input,[
              'immatriculation_id' => ['required',"numeric",new RuleCheckImmatriculation_id()
                  ,new CheckeImmatriculationStatusReforme(),new CheckImmatriculationReformeExist(),new CanValided()],
              'nom' => "required|min:2|max:150",
              'prenom' => "required|min:2|max:150",
              "fonction" => "required|min:2|max:75",
              "date_naissance" => "required|date_format:Y-m-d|before:".Carbon::now()->subYears(17). "|after:".Carbon::now()->subYears(90),
              "ministere_id" => "required|not_in:0",
              "direction_id" => "nullable|not_in:0",
              "valeurResiduelle" => ['required',new CheckValeurResiduelle()],
              "piece" => "required|mimes:jpg,jpeg,png,pdf|max:2040",
              "paiement" => "required|mimes:jpg,jpeg,png,pdf|max:2040",
          ],$messages);
          if ($validator->fails()) {
              return response()->json(['status' => false, 'messages' => $validator->messages()]);
          }else{
              try {


                  $reforme = new Reforme();
                  $reforme->immatriculation_id = $input['immatriculation_id'];
                  $reforme->nom = $input['nom'];
                  $reforme->prenom = $input['prenom'];
                  $reforme->date_naissance = $input['date_naissance'];
                  $reforme->fonction = $input['fonction'];
                  $reforme->ministere_id = $input['ministere_id'];
                  $reforme->direction_id = $input['direction_id'];
                  $reforme->valeurResiduelle = intval($input['valeurResiduelle']);
                  $reforme->user_id = Auth::user()->id;
                  $reforme->save();
                  $immatriculation = Immatriculation::find($input['immatriculation_id']);
                  if($immatriculation)
                  {
                      $immatriculation->status = 3;
                      $immatriculation->mutationStatus = 3;
                      $immatriculation->save();
                      if( $request->file('piece') )
                          $reforme->piece = $this->storingFile($request,"piece",$immatriculation->immatriculation_number,"documents/reforme/piece");

                      if( $request->file('paiement') )
                          $reforme->paiement = $this->storingFile($request,"paiement",$immatriculation->immatriculation_number,"documents/reforme/paiement");
                    $reforme->save();
                  }
                  return response()->json(['status' => true, 'messages' => $validator->messages()]);
              }
              catch (QueryException $ex){

                  return response()->json(['status' => false, 'messages' => $ex->messages()]);
              }
          }
      }
  }

  /**
   * Réforme payée dans SIPIM, déclarée depuis la nouvelle immatriculation :
   * le véhicule du châssis est cédé à un particulier (nom, prénom, téléphone, e-mail facultatif, adresse, photo de sa pièce d'identité).
   * La référence SIPIM doit être une réforme validée, non utilisée, pour ce châssis ; elle est consommée.
   */
  public function reformeDepuisPaiement(Request $request){
      $input = $request->all();
      $validator = Validator::make($input, [
          'immatriculation_id' => ['required', 'integer', 'exists:immatriculations,immatriculation_id', new CanValided()],
          'paiementReference' => ['required', 'string', 'max:50'],
          'prenom' => ['required', 'string', 'min:2', 'max:150'],
          'nom' => ['required', 'string', 'min:2', 'max:150'],
          'telephone' => ['required', 'string', 'regex:/^\+?[0-9 ]{8,20}$/'],
          'email' => ['nullable', 'email', 'max:150'],
          'adresse' => ['required', 'string', 'min:3', 'max:255'],
          'piece' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
      ], [
          'immatriculation_id.required' => "Le véhicule à réformer n'a pas été identifié.",
          'immatriculation_id.exists' => "Le véhicule à réformer n'existe pas.",
          'paiementReference.required' => 'La référence de paiement est obligatoire.',
          'prenom.required' => 'Le prénom du nouveau propriétaire est obligatoire.',
          'prenom.min' => 'Le prénom doit contenir au moins 2 caractères.',
          'nom.required' => 'Le nom du nouveau propriétaire est obligatoire.',
          'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
          'telephone.required' => 'Le téléphone du nouveau propriétaire est obligatoire.',
          'telephone.regex' => 'Le numéro de téléphone est invalide (chiffres uniquement, 8 à 20).',
          'email.email' => "L'adresse e-mail est invalide.",
          'adresse.required' => "L'adresse du nouveau propriétaire est obligatoire.",
          'adresse.min' => "L'adresse doit contenir au moins 3 caractères.",
          'piece.required' => "La photo de la pièce d'identité est obligatoire.",
          'piece.mimes' => "La photo de la pièce d'identité doit être au format JPEG ou PNG.",
          'piece.max' => "La photo de la pièce d'identité ne doit pas dépasser 10 Mo.",
          'piece.uploaded' => "La photo n'a pas pu être envoyée : taille maximale autorisée ".\App\Exceptions\Handler::maxUploadMo()." Mo.",
      ]);
      if ($validator->fails())
          return response()->json(['success' => false, 'messages' => $validator->messages()]);

      $immatriculation = Immatriculation::find($input['immatriculation_id']);
      if (!in_array((int) $immatriculation->status, [1, 4]) || Reforme::where('immatriculation_id', $immatriculation->immatriculation_id)->where('status', 0)->exists())
          return response()->json(['success' => false, 'messages' => ['immatriculation_id' => ["Le véhicule {$immatriculation->immatriculation_number} ne peut pas être réformé (dossier non validé, déjà réformé ou réforme en attente)."]]]);
      $chassis = trim((string) DB::table('vehicules')->where('vehicule_id', $immatriculation->vehicule_id)->value('numChassie'));

      // Le paiement SIPIM doit être une réforme validée, non utilisée, pour ce châssis
      $sipim = SipimService::getPaiement($input['paiementReference']);
      $paiement = $sipim['paiement'] ?? null;
      $refus = ($sipim['status'] ?? null) !== 200 || !$paiement ? (is_string($sipim['messages'] ?? null) ? $sipim['messages'] : 'Paiement introuvable.')
          : (!self::estPaiementReforme($paiement) ? "Cette référence n'est pas un paiement de réforme."
          : (($paiement['status'] ?? '') !== 'Validé' ? 'Paiement non validé.'
          : (!empty($paiement['utilise']) ? 'Cette référence de paiement a déjà été utilisée.'
          : (strcasecmp(trim($paiement['chassis'] ?? ''), $chassis) !== 0 ? "Cette référence concerne un autre châssis." : null))));
      if ($refus)
          return response()->json(['success' => false, 'messages' => ['paiementReference' => [$refus]]]);

      try {
          DB::beginTransaction();
          $reforme = new Reforme();
          $reforme->immatriculation_id = $immatriculation->immatriculation_id;
          $reforme->prenom = ucwords(mb_strtolower(trim($input['prenom'])));
          $reforme->nom = mb_strtoupper(trim($input['nom']));
          $reforme->telephone = preg_replace('/\s+/', ' ', trim($input['telephone']));
          $reforme->email = ($input['email'] ?? null) ? mb_strtolower(trim($input['email'])) : null;
          $reforme->adresse = trim($input['adresse']);
          $reforme->paiementReference = trim($input['paiementReference']);
          $reforme->ancienStatus = $immatriculation->status;
          $reforme->status = 0;
          $reforme->user_id = Auth::user()->id;
          $reforme->piece = $this->storingFile($request, 'piece', $immatriculation->immatriculation_number.'_'.random_int(1, 5000), 'documents/reforme/piece');
          $reforme->save();

          $immatriculation->status = 3;
          $immatriculation->mutationStatus = 3;
          $immatriculation->save();

          // Référence consommée dans SIPIM ; en cas de refus, rien n'est enregistré
          $utilisation = SipimService::utiliserPaiement($input['paiementReference'], $immatriculation->immatriculation_number);
          if (empty($utilisation['success'])) {
              DB::rollBack();
              return response()->json(['success' => false, 'messages' => ['paiementReference' => [is_string($utilisation['messages'] ?? null) ? $utilisation['messages'] : 'Référence de paiement non utilisable.']]]);
          }
          DB::commit();
          // Tableau de bord du Directeur en direct ; un échec de diffusion n'annule pas la réforme
          try { broadcast(new DashboardEvent($this->DashBoardOption('reforme')))->toOthers(); } catch (\Throwable $e) { report($e); }
          return response()->json(['success' => true, 'numero' => $immatriculation->immatriculation_number, 'reforme_id' => $reforme->reforme_id]);
      }
      catch (\Throwable $ex){
          if (DB::transactionLevel() > 0) DB::rollBack();
          return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
      }
  }

  /**
   * Reprise d'une réforme SIPIM rejetée : l'agent qui l'a demandée corrige le nouveau propriétaire et/ou la photo de sa pièce.
   * La référence SIPIM, déjà consommée par cette réforme, reste la même : aucun nouveau paiement.
   */
  public function resoumettreDepuisPaiement(Request $request){
      $input = $request->all();
      $validator = Validator::make($input, [
          'reforme_id' => ['required', 'integer', 'exists:reformes,reforme_id'],
          'prenom' => ['required', 'string', 'min:2', 'max:150'],
          'nom' => ['required', 'string', 'min:2', 'max:150'],
          'telephone' => ['required', 'string', 'regex:/^\+?[0-9 ]{8,20}$/'],
          'email' => ['nullable', 'email', 'max:150'],
          'adresse' => ['required', 'string', 'min:3', 'max:255'],
          'piece' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
      ], [
          'reforme_id.required' => "La réforme à reprendre n'a pas été identifiée.",
          'reforme_id.exists' => "Cette réforme n'existe pas.",
          'prenom.required' => 'Le prénom du nouveau propriétaire est obligatoire.',
          'prenom.min' => 'Le prénom doit contenir au moins 2 caractères.',
          'nom.required' => 'Le nom du nouveau propriétaire est obligatoire.',
          'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
          'telephone.required' => 'Le téléphone du nouveau propriétaire est obligatoire.',
          'telephone.regex' => 'Le numéro de téléphone est invalide (chiffres uniquement, 8 à 20).',
          'email.email' => "L'adresse e-mail est invalide.",
          'adresse.required' => "L'adresse du nouveau propriétaire est obligatoire.",
          'adresse.min' => "L'adresse doit contenir au moins 3 caractères.",
          'piece.mimes' => "La photo de la pièce d'identité doit être au format JPEG ou PNG.",
          'piece.max' => "La photo de la pièce d'identité ne doit pas dépasser 10 Mo.",
          'piece.uploaded' => "La photo n'a pas pu être envoyée : taille maximale autorisée ".\App\Exceptions\Handler::maxUploadMo()." Mo.",
      ]);
      if ($validator->fails())
          return response()->json(['success' => false, 'messages' => $validator->messages()]);

      $reforme = Reforme::find($input['reforme_id']);
      $immatriculation = Immatriculation::find($reforme->immatriculation_id);
      // Seule une réforme SIPIM rejetée, reprise par son demandeur, sur un véhicule resté disponible
      $plusRecente = DB::table('mutations')->where('immatriculation_id', $reforme->immatriculation_id)->where('created_at', '>', $reforme->created_at)->exists()
          || Reforme::where('immatriculation_id', $reforme->immatriculation_id)->where('reforme_id', '!=', $reforme->reforme_id)->where('created_at', '>', $reforme->created_at)->exists();
      $refus = (int) $reforme->status !== 2 ? "Seule une réforme rejetée peut être reprise."
          : (!$reforme->paiementReference ? "Cette réforme a été saisie sans paiement SIPIM : utilisez l'ancienne resoumission."
          : ((int) $reforme->user_id !== (int) Auth::id() ? "Seul l'agent qui a demandé la réforme peut la reprendre."
          : ($plusRecente ? "Une autre demande a été déposée depuis sur ce véhicule : la réforme ne peut plus être reprise."
          : (!$immatriculation || !in_array((int) $immatriculation->status, [1, 4]) ? "Le véhicule n'est plus disponible pour une réforme."
          : (DB::table('mutations')->where('immatriculation_id', $reforme->immatriculation_id)->where('status', 0)->exists() ? "Une mutation de ce véhicule est en attente de validation." : null)))));
      if ($refus)
          return response()->json(['success' => false, 'messages' => ['reforme_id' => [$refus]]]);

      try {
          DB::beginTransaction();
          $reforme->prenom = ucwords(mb_strtolower(trim($input['prenom'])));
          $reforme->nom = mb_strtoupper(trim($input['nom']));
          $reforme->telephone = preg_replace('/\s+/', ' ', trim($input['telephone']));
          $reforme->email = ($input['email'] ?? null) ? mb_strtolower(trim($input['email'])) : null;
          $reforme->adresse = trim($input['adresse']);
          if ($request->file('piece'))
              $reforme->piece = $this->storingFile($request, 'piece', $immatriculation->immatriculation_number.'_'.random_int(1, 5000), 'documents/reforme/piece');
          $reforme->ancienStatus = $immatriculation->status;
          $reforme->status = 0;
          $reforme->valided_by = null;
          $reforme->save();

          $immatriculation->status = 3;
          $immatriculation->mutationStatus = 3;
          $immatriculation->save();
          DB::commit();
          try { broadcast(new DashboardEvent($this->DashBoardOption('reforme')))->toOthers(); } catch (\Throwable $e) { report($e); }
          return response()->json(['success' => true, 'numero' => $immatriculation->immatriculation_number, 'reforme_id' => $reforme->reforme_id]);
      }
      catch (\Throwable $ex){
          if (DB::transactionLevel() > 0) DB::rollBack();
          return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
      }
  }

  // modeImmat SIPIM d'une réforme : « Réforme » (avec ou sans accent)
  public static function estPaiementReforme($paiement){
      $mode = strtolower(str_replace(['é', 'É'], 'e', trim($paiement['modeImmat'] ?? '')));
      return $mode === 'reforme';
  }

  public function resoumission(Request $request){
      if($request->isMethod('post')){
          $input = $request->all();
          $messages = [
              'immatriculation_id.required' => "On ne retourve pas le vehicule a reformer.",
              'immatriculation_id.numeric' => "Erreur 1 dans l'operation",
              'nom.required' => "Le nom du propriétaire est obligatoire.",
              'nom.min' => "Le minimum de caractere pour le nom du  propriétaire est deux (2).",
              'nom.max' => "Le maximum de caractère pour le nom du  propriétaire est cent cinquante (150).",
              'prenom.required' => "Le prenom est obligatoire",
              'prenom.min' => "Le minimum de caractère pour le prenom du  propriétaire est  deux (2).",
              'prenom.max' => "Le maximum de caractère pour le prenom du  propriétaire est cent cinquante (150).",
              'fonction.required' => "La fonction est obligatoire.",
              'fonction.min' => "Le minimum de caractère pour la fonction st  deux (2).",
              'fonction.max' => "Le maximum de caractère pour la fonction est soixante quinze (75).",
              "ministere_id.required" => "Le ministère est obligatoire",
              "ministere_id.not_in" => "Le ministère est obligatoire",
              "date_naissance.required" => "La date de naissance est obligatoire.",
              "date_naissance.date_format" => "Format de la date de naissance est incorrect.Jour/Mois/Année",
              "valeurResiduelle.required" => "La valeur residuelle est obligatoire.",
              "date_naissance.before" => "L'age minimal est de 18 ans.",
              "reforme_id.required" => "La reforme n'existe pas.",
              "direction_id.not_in" => "Direction Invalid."
          ];
          $validator = Validator::make($input,[
              'reforme_id' => ['required',new ReformeExist()],
              'nom' => "required|min:2|max:150",
              'prenom' => "required|min:2|max:150",
              "fonction" => "required|min:2|max:75",
              "date_naissance" => "required|date_format:Y-m-d|before:".Carbon::now()->subYears(17). "|after:".Carbon::now()->subYears(90),
              "ministere_id" => "required|not_in:0",
              "direction_id" => "nullable|not_in:''",
              "valeurResiduelle" => ['required',new CheckValeurResiduelle()],
              "piece" => "nullable|mimes:jpg,jpeg,png,pdf|max:2040",
              "paiement" => "nullable|mimes:jpg,jpeg,png,pdf|max:2040",
          ],$messages);
          if ($validator->fails()) {
              return response()->json(['status' => 400, 'success' => false,'messages' => $validator->messages()]);
          }else{
              try {

                  $reforme = Reforme::find($input['reforme_id']);
                  $reforme->nom = $input['nom'];
                  $reforme->prenom = $input['prenom'];
                  $reforme->date_naissance = $input['date_naissance'];
                  $reforme->fonction = $input['fonction'];
                  $reforme->ministere_id = $input['ministere_id'];
                  $reforme->direction_id = $input['direction_id'];
                  $reforme->valeurResiduelle = intval($input['valeurResiduelle']);
                  $reforme->user_id = Auth::user()->id;
                  $reforme->status = 0;
                  $reforme->updated_at = Carbon::now();
                  $reforme->save();
                  $immatriculation = Immatriculation::find($reforme->immatriculation_id);
                  if($immatriculation)
                  {
                      $immatriculation->status = 3;
                      $immatriculation->mutationStatus = 3;
                      $immatriculation->save();
                      if( $request->file('piece') )
                          $reforme->piece = $this->storingFile($request,"piece",$immatriculation->immatriculation_number,"documents/reforme/piece");
                      if( $request->file('paiement') )
                          $reforme->paiement = $this->storingFile($request,"paiement",$immatriculation->immatriculation_number,"documents/reforme/paiement");
                      $reforme->save();
                  }
                  return response()->json(['status' => 200, 'success' => true, 'messages' => $validator->messages()]);
              }
              catch (QueryException $ex){
                  return response()->json(['status' => 400, 'success' => true, 'messages' =>['erreur' => $ex->messages()]]);
              }
          }
      }
  }
  /**
   * Liste des réformes (en attente, validées, rejetées), la plus récente d'abord :
   * véhicule, organisme cédant et nouveau propriétaire (particulier pour une réforme SIPIM, organisme sinon).
   */
  public function getAllReformes(){
      try{
          $sql = "select r.reforme_id, r.immatriculation_id, r.status, r.created_at, r.updated_at, r.paiementReference,
                         i.immatriculation_number, i.modeImmatriculation, v.numChassie, ma.title marque, m.title model,
                         coalesce(mi.nom, i.autreministere) organismeCedant,
                         nullif(trim(concat(coalesce(r.prenom,''),' ',coalesce(r.nom,''))),'') proprietaire, r.telephone, nm.nom nouvelOrganisme,
                         concat(u.prenom,' ',u.nom) demandeur
                  from reformes r
                  join immatriculations i on i.immatriculation_id = r.immatriculation_id
                  join vehicules v on v.vehicule_id = i.vehicule_id
                  left join marques ma on ma.id = v.marque_id left join modeles m on m.id = v.model_id
                  left join ministeres mi on mi.ministere_id = i.minister_id
                  left join ministeres nm on nm.ministere_id = r.ministere_id
                  left join users u on u.id = r.user_id";
          // Accès complet : toutes les réformes ; sinon celles que l'utilisateur a demandées
          $reformes = ($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1)
              ? DB::select($sql." order by r.created_at desc")
              : DB::select($sql." where r.user_id = ? order by r.created_at desc", [Auth::user()->id]);
          return response()->json(['status' => true, 'reformes' => $reformes]);
      }
      catch (QueryException $ex){
          return response()->json(['success' => false, 'messages' => $ex->getMessage()]);
      }
  }

  public function getReformeByID($reforme_id)
  {
      try {
          // Réforme et véhicule ; l'organisme d'avant est celui du dossier (la réforme ne le change pas)
          $reforme = DB::select("select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,v.genre genre_id,gre.nom genre,v.typevehicule type_id,t.nom typeVehicule,
                        numChassie,carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                        energy,transmission,provenance,colorVehicule,acquisition,v.user_id,i.immatriculation_id,modeImmatriculation,
                        ancienImmatriculation,immatriculation_number,i.minister_id,mi.nom ancienMinistere,i.direction_id ancienDirection_id,
                        (select nom from directions where direction_id = i.direction_id) ancienDirection,
                        i.status,i.updated_at ancienDteAttribution,i.qrcode,v.nbreEssuie,v.pv,v.cu,v.pieceJointe,v.pa,
                        r.reforme_id,r.ministere_id NouveauMinistere_id,nm.nom NouveauMinistere,r.direction_id nouvelleDirection_id,
                        (select nom from directions where direction_id = r.direction_id) nouvelleDirection,
                        r.nom nomProprietaire,r.prenom PrenomProprietaire,r.fonction,r.date_naissance,r.valeurResiduelle,
                        r.telephone,r.email,r.adresse,r.paiementReference,r.created_at dateDemande,r.user_id demandeur_id,
                        r.piece,r.paiement,r.status statusReforme,r.updated_at nouvelleDateReforme,
                        case when r.status in (1, 2) then r.updated_at end dateDecision,
                        concat(u.prenom,' ',u.nom) demandeur, u.nom nomAgent, u.prenom prenomAgent,
                        (select concat(prenom, ' ', nom) from users where id = r.valided_by) validePar,
                        (select concat_ws(' — ', nullif(rj.raison,''), nullif(rj.autreraison,'')) from rejets rj
                          where rj.immatriculation_id = r.immatriculation_id and rj.typeRejet = 'reforme' order by rj.rejet_id desc limit 1) motifRejet
                        from reformes r
                        join immatriculations i on i.immatriculation_id = r.immatriculation_id
                        join vehicules v on v.vehicule_id = i.vehicule_id
                        left join marques ma on ma.id = v.marque_id left join modeles m on m.id = v.model_id
                        left join ministeres mi on mi.ministere_id = i.minister_id
                        left join ministeres nm on nm.ministere_id = r.ministere_id
                        left join genres gre on v.genre = gre.genre_id left join typevehicules t on t.type_id = v.typeVehicule
                        left join users u on u.id = r.user_id
                        where r.reforme_id = ?", [$reforme_id]);
          if($reforme)
              return response()->json(['success'=> true,'reformes' => $reforme]);
          else return response()->json(['success'=> false,'reformes' => $reforme]);
      }
      catch (QueryException $ex){
          return response()->json(['success'=> false,'messages' => $ex->getMessage()]);
      }
  }

  public function getImmatriculationByReformeID($reformeID){
      $immatriculation = DB::select('select * from immatriculations i,reformes r where r.immatriculation_id = i.immatriculation_id and r.reforme_id =?',[$reformeID]);
      if(count($immatriculation) > 0){
          $vehicule = Vehicule::find($immatriculation[0]->vehicule_id);
          return response()->json(['success' => false,'vehicule' => $vehicule,'immatriculation' => $immatriculation]);
      }else return response()->json(['success' => false,]);
  }
  public function getReformeByImmatriculationID($immatriculationID){
        try {
            $reforme = Reforme::where('immatriculation_id',$immatriculationID)->get()->first();
            if($reforme)
                return response()->json(['success'=> true,'reformes' => $reforme]);
            else return response()->json(['success'=> false,'reformes' => $reforme]);
        }
        catch (QueryException $ex){
            return response()->json(['success'=> false,'messages' => $ex->getMessage()]);
        }
    }

  public function validerReforme(Request $request){
      if($request->isMethod('post')) {
         $input = $request->all();
         $messages = ['reforme_id.required' => "La Reforme n'existe pas"];
         $validator = Validator::make($input,
             ['reforme_id' => ['required',new IsReformer('valider'),new IsReformeExiste()]
             ]
         ,[$messages]);
          if ($validator->fails()) {
              return response()->json(['success' => false,'messages' => $validator->messages()]);
          }else{
              try{
                  $reforme = Reforme::find($input['reforme_id']);
                  $reforme->status = 1;
                  $reforme->valided_by = Auth::user()->id;
                  $reforme->save();
                  // Historique : le bénéficiaire de la réforme devient l'utilisateur du véhicule
                  $immatriculation = Immatriculation::find($reforme->immatriculation_id);
                  if ($immatriculation)
                      HistoriqueService::ouvrir($immatriculation, $reforme->ministere_id, $reforme->direction_id, now(), 'reforme', Auth::user()->id, [
                          'reforme_id' => $reforme->reforme_id,
                          'detenteur' => trim(($reforme->prenom ?? '').' '.($reforme->nom ?? '')) ?: null,
                          'fonction' => $reforme->fonction,
                          'reference' => $reforme->paiementReference,
                          'telephone' => $reforme->telephone,
                          'email' => $reforme->email,
                          'adresse' => $reforme->adresse,
                      ]);
                  broadcast(new DashboardEvent($this->DashBoardOption('reforme')))->toOthers();
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
                    'id' => ['required',new IsReformer('rejet'),new IsReformeExiste()],
                    "motif" => [new RuleMotif($input['autremotif'])],
                    "autremotif" => [new RuleMotifNouveau($input['motif'])],
                ],$messages);
                if (!$validator->fails()) {
                    $reforme = Reforme::where('reforme_id', $request->input('id'))->get()->first();
                    if ($reforme) {
                        $reforme->status = 2;
                        $reforme->valided_by = Auth::user()->id;
                        $reforme->save();
                        $rejet = new Rejet();
                        $rejet->raison = $input['motif'];
                        $rejet->autreraison = $input['autremotif'];
                        $rejet->typeRejet = 'reforme';
                        $rejet->immatriculation_id = $reforme->immatriculation_id;
                        $rejet->save();
                        // Réforme rejetée : le véhicule reprend son état d'avant (toujours chez son organisme)
                        if ($reforme->ancienStatus !== null)
                            Immatriculation::where('immatriculation_id', $reforme->immatriculation_id)->where('status', 3)
                                ->update(['status' => $reforme->ancienStatus, 'mutationStatus' => $reforme->ancienStatus == 4 ? 1 : 0, 'updated_at' => now()]);
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
 //liste des immatriculation a reforme
 public function immatriculationtoreforme(){
     try {
         $immatriculations = [];
         if($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1)
             $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and (i.status = 1 or i.status = 4) order by i.updated_at desc');
         else{
             $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and (i.status = 1 or i.status = 4 ) and i.created_by=:user_id order by i.updated_at desc'
                                                ,['user_id' => Auth::user()->id]);

         }

         return response()->json(['status' => true,'immatriculations' => $immatriculations]);
     }
         //catch(\Illuminate\Database\QueryException $ex){
     catch (QueryException $ex){
         return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
     }
 }
  public function getStatus($immatriculation_id){
      try{

          $reforme = Reforme::where('immatriculation_id',$immatriculation_id)->get()->first();
          if($reforme)
              return response()->json(['success' => true,'reforme' => $reforme]);
          else  return response()->json(['success' => false,'reforme' => $reforme]);
      }
      catch (QueryException $ex){
          return response()->json(['success' => false,'erreur' => $ex->getMessage()]);
      }
  }
}
