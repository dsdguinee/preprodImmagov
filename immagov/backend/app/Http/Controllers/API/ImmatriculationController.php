<?php

namespace App\Http\Controllers\API;

use App\Events\DashboardEvent;
use App\Http\Controllers\Controller;
use App\Models\Impression;
use App\Models\Ministere;
use \App\Models\modelVoiture;
use App\Models\Rejet;
use App\Models\Reservation;
use App\Rules\Immatriculation\CheckImmatriculationExist;
use App\Rules\Immatriculation\CheckMinistereExist;
use App\Rules\Immatriculation\CheckPaiement;
use App\Services\SipimService;
use App\Services\OrganismeService;
use App\Services\QrCodeService;
use App\Services\HistoriqueService;
use App\Rules\Reservation\ReservationModeImmatriculation;
use App\Rules\Resoumission\CheckImmatriculationStatus;
use App\Rules\Resoumission\CheckNumChassie;
use App\Rules\Resoumission\UserValidation;
use App\Rules\RuleAncienNumeroImmatriculation;
use App\Rules\RuleModeImmatriculation;
use App\Rules\RuleMotif;
use App\Rules\RuleMotifNouveau;
use Carbon\Carbon;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use  \App\Models\Vehicule;
use \App\Models\Immatriculation;
use App\Rules\Resoumission\CheckAncienNumeroExist;

use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;
use Intervention\Image\Facades\Image;
use SimpleSoftwareIO\QrCode\Facades\QrCode;


class ImmatriculationController extends BaseController
{
    private $key;
    public function __construct(){
        $this->key = '22ptywFN6yacOPsUl';
    }
    public function test(){
        $response = Http::get('http://192.168.0.110:8383/api/paiement?token=22ptywFN6yacOPsUl&reference=HJS7VKNHKKL82806509');
        return $response;
//        return $this->fullAccess(Auth::user()->id);
    }
    public function donumerotation(Request $request){
       if($request->isMethod('post')){
          $input = $request->all();
          return $this->immatriculation3($input['modeImmatriculation'],$input['reservation_id']);

       }
    }

    public function getvalistList(Request $request){
        if($request->isMethod('get')){
            try{
                $ReservationList = Reservation::where('user_id',Auth::user()->id)->where('status',0)->get();
                return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'ReserationList' => $ReservationList]);
            }
            catch (QueryException $ex) {
                return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }
    public function getReservations(Request $request){
        if($request->isMethod('get')){
            try{
                 $Reservations = DB::select("SELECT reservation_id,nomReservation,initial,final,
                                modeImmatriculation,r.status,r.created_at,r.updated_at,id,email,CONCAT(prenom,' ',nom) nomComplet
                                ,telephone,u.role_id,ro.nom_role,telephone
                                FROM reservations r,users u,roles ro
                                where r.user_id = u.id
                                and ro.role_id = u.role_id");
                return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'Reserations' => $Reservations]);
            }
            catch (QueryException $ex) {
                return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
            }

        }
    }
    public function getBorne(Request $request,$modeImm){
        if($request->isMethod('get')){
            try{
              $lastMax = DB::select('select max(final) maxFinal from reservations where modeImmatriculation=?',[$modeImm]);
              $lastRow = Immatriculation::where('modeImmatriculation','=',$modeImm)->get()->last();
              $MaxImmatriculationNumber = '';
              $borne = '';

              if($lastRow) {
                  $immaArray = explode('-',$lastRow->immatriculation_number);
                  if(count($immaArray) > 0)
                      $MaxImmatriculationNumber = intval($immaArray[1]);
                  if(count($lastMax) > 0){
                    if($lastMax[0]->maxFinal > $MaxImmatriculationNumber)
                       $borne = $lastMax[0]->maxFinal + 1;
                    else $borne = $MaxImmatriculationNumber + 1;
                  }
              }
              else $borne = 1;
             return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'borne' => $borne]);
            }
            catch (QueryException $ex) {
                return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }
    public function updateReservation(Request $request){
        if($request->isMethod('post')){
            try{
                $input = $request->all();
                $mesaages = [
                 "nom.required" => "Le nom de la reservation est obligatoire.",
                 "nom.min" => "Le caractère minimale pour le nom est trois (3).",
                 "nom.unique" => "Ce nom de reservation existe deja.",
                 "reservation_id.required" => "La reservation est obligatoire."
                ];
                $validator = Validator::make($input,[
                    'nom' => ['required','min:3','string',Rule::unique('reservations', 'nomReservation')->ignore($input['reservation_id'],'reservation_id')],
                    'reservation_id'=> 'required|numeric|exists:reservations,reservation_id'
                ],$mesaages);
                if ($validator->fails())
                    return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
                else {
                    $reservation = Reservation::find($input['reservation_id']);
                    if($reservation){
                        $reservation->nomReservation = strtoupper($input['nom']);
                        $reservation->save();
                        return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
                    }else  return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => ['erreur' => "Reservation non trouvée"]]);
                }
            }
            catch (QueryException $ex) {
                return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }
    public function Reserver(Request $request){
        if($request->isMethod('post')){
            try{
                $input = $request->all();
                $mesaages = [
                    'nom.required' => "Le nom est obligatoire.",
                    "nom.min" => "Le caractère minimum pour le nom est deux(2).",
                    "nom.unique" => "Ce nom de reservation existe déjà.Veuillez choisir un autre nom",
                    "initial.required" => "La valeur initial de la reservation est obligatoire.",
                    "final.required" => "La valeur final de la reservation est obligatoire.",
                    "modeImmatriculation.required" => "Le mode d'immatriculation est obligatoire.",
                    "modeImmatriculation.in" => "Le mode d'immatriculation est VA,EPs.",
                    "utilisateur.required" => "L'utilisateur est obligatoire",
                    "utilisateur.exists" => "Cet utilisateur n'existe pass."
                ];
                $validator = Validator::make($input,[
                   'nom' => 'required|min:2|unique:reservations,nomReservation',
                   "initial" => "required|numeric",
                   "final" => "required|numeric",
                   "modeImmatriculation" => ["required",Rule::in(['VA','EP'])],
                   "utilisateur" => "required|exists:users,id"
                ],$mesaages);
                if ($validator->fails())
                    return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
                else{
                    $reservation = new Reservation();
                    $reservation->nomReservation = strtoupper($input['nom']);
                    $reservation->initial = $input['initial'];
                    $reservation->final = $input['final'];
                    $reservation->user_id = $input['utilisateur'];
                    $reservation->modeImmatriculation = $input['modeImmatriculation'];
                    $reservation->save();
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
                }
            }
            catch (QueryException $ex) {
                return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
            }
        }
    }
    public function resoumission(Request $request)
    {
        if($request->isMethod('post')){
            if( Auth::user() )
            {
                try {
                    $input = $request->all();
                    $messages = [
                        "modeImmatriculation.required" => "Le mode d'ImmatriculationController est obligatoire.",
                        "vehicule_id.required" => "Vehicule Non Trouvé.",
                        "vehicule_id.exists" => "Vehicule Non Trouvé.",
                        "modeImmatriculation.not_in" => "Le mode d'ImmatriculationController est obligatoire.",
                        "numChassie.required" => "Le numéro de chassie est obligatoire.",
                        "numChassie.min" => "Le minimum de caractère pour le numéro de chassie est dix (10).",
                        "numChassie.max" => "Le maximum de caractère pour le numéro de chassie est dix sept (17).",
                        "numChassie.unique" => "Ce vehicule est déjà immatriculé!",
                        "marque_id.required" => "La marque du vehicule est obligatoire.",
                        "marque_id.not_in" => "La marque du vehicule est obligatoire.",
                        "model_id.required" => "Le modèle du vehicule est obligatoire.",
                        "model_id.not_in" => "Le modèle du vehicule est obligatoire.",
                        "carrosserie.required" => "La carrosserie est obligatoire.",
                        "carrosserie.not_in" => "La carrosserie est obligatoire.",
                        "nbPlaceAssise.required" => "Veuillez fournir le nombre de place assise.",
                        "nbPlaceAssise.numeric" => "Le nombre de place assise est numérique.",
                        "nbPlaceDebout.required" => "Veuillez fournir le nombre de place debout.",
                        "nbPlaceDebout.numeric" => "Le nombre de place debout est numérique.",
                        "nbPorte.required" => "Veuillez fournir le nombre de porte.",
                        "nbPorte.numeric" => "Le nombre de porte est numérique.",
                        "kilometrage.required" => "Veuillez fournir le nombre de Kilometrage.",
                        "kilometrage.numeric" => "Le nombre de Kilometrage est numérique.",
                        "nbreEssuie.required" => "Le nombre d'Essuie est obligatoire.",
                        "nbreEssuie.numeric" => "Le nombre d'Essuie doit être numérique.",
                        "nbreEssuie.max" => "Le maximum pour le nombre d'essuie est quatre (4).",
                        "pv.required" => "Le poids à vide est obligatoire.",
                        "pv.numeric" => "Le poids à vide doit être numérique.",
                        "cu.required" => "La charge utile est obligatoire.",
                        "pv.numeric" => "La charge utile doit être numérique.",
                        "cylindre.required" => "Veuillez fournir le nombre de Cylindre.",
                        "cylindre.numeric" => "Le nombre de Cylindre est numérique.",
                        "cylindre.digits_between" => "Le nombre de Cylindre doit être compris entre 1-25.",
                        "annee.required" => "Veuillez fournir l'année de fabrication du Véhicule.",
                        "annee.numeric" => "L'année de fabrication  est numérique.",
                        "dateP.date_format" => "Le format de la date pour la première mise en Circulation est Jour/Mois/Année !",
                        "energie.required" => "Vous n'avez la source d'energie.",
                        "energie.not_in" => "Vous n'avez la source d'energie.",
                        "idpays.required" => "Le pays de provenance est obligatoire.",
                        "idpays.not_in" => "Le pays de provenance est obligatoire.",
                        "genre.required" => "Le genre du vehicule est obligatoire.",
                        "genre.not_in" => "Le genre du vehicule est obligatoire.",
                        "typeVehicule.required" => "Le Type du vehicule est obligatoire.",
                        "typeVehicule.not_in" => "Le Type du vehicule est obligatoire.",
                        "couleur.required" => "La couleur du vehicule est obligatoire.",
                        "couleur.not_in" => "La couleur du vehicule est obligatoire.",
                        "acquisition.required" => "Le mode d'acquisation est obligatoire.",
                        "acquisition.not_id" => "Le mode d'acquisation est obligatoire.",
                        "ancienImmatriculation.regex" => "Respectez le format d'immatriculation.Ex:RC-1234-A.",
                        "transmission.required" => "Le mode de transmission est obligatoire.",
                        "transmission.not_in" => "Le mode de transmission est obligatoire.",
                        "autredirection.min" => "Le minimum de caractères pour autre direction est deux (2).",
                        "pieceJointe.required" => "La pièce jointe est obligatoire.",
                        "pieceJointe.mimes" => "La pièce jointe doit être au format PDF, JPEG ou PNG.",
                        "pieceJointe.max" => "La pièce jointe ne doit pas dépasser 10 Mo.",
                        "pieceJointe.uploaded" => "La pièce jointe n'a pas pu être envoyée : taille maximale autorisée ".\App\Exceptions\Handler::maxUploadMo()." Mo.",
                        'immatriculation_id.required' => "Nous ne retrouvons pas cette immatriculation.",
                        'immatriculation_id.exists' => "Nous ne retrouvons pas cette immatriculation.",
                        'created_by.required' => "L'utilisateur est requis pour cette action."
                    ];

                    $validator = Validator::make($input, [
                        'modeImmatriculation' => ["required", "not_in:''", new RuleModeImmatriculation()],
                        'numChassie' => ['required', 'min:10', 'max:17', new CheckNumChassie($input['vehicule_id'])],
                        'marque_id' => 'required|not_in:0',
                        'model_id' => 'required|not_in:0',
                        'carrosserie' => 'required|not_in:0',
                        'nbPlaceAssise' => 'required|numeric',
                        'nbPlaceDebout' => 'required|numeric',
                        'nbreEssuie' => "required|numeric|max:4",
                        'pv' => "required|numeric",
                        'cu' => "required|numeric",
                        'nbPorte' => 'required|numeric',
                        'kilometrage' => 'required|numeric',
                        'cylindre' => 'required|numeric|digits_between:1,25',
                        'annee' => 'required|numeric',
                        'dateP' => 'nullable|date_format:Y-m-d',
                        'energie' => 'required|not_in:0',
                        'idpays' => 'required|not_in:0',
                        'genre' => 'required|not_in:0',
                        'typeVehicule' => 'required|not_in:0',
                        'transmission' => "required|not_in:0",
                        'ancienImmatriculation' => ['nullable', new CheckAncienNumeroExist($input['immatriculation_id']), "regex:/[A-Z]{2,3}-[0-9]{4}-[A-Z]{1,2}/"],
                        'ministere' => ['nullable', new CheckMinistereExist()],
                        'direction' => ['nullable'],
                        'autreministere' => ['nullable','string'],
                        'autredirection' => ['nullable', 'min:2'],
                        'couleur' => 'required|not_in:0',
                        'acquisition' => 'nullable|not_in:0',
                        "pieceJointe" => "nullable|mimes:pdf,jpg,jpeg,png|max:10240",
                        "vehicule_id" => "required|exists:vehicules,vehicule_id",
                        "immatriculation_id" => ['required',new \App\Rules\Resoumission\CheckImmatriculationExist(),new CheckImmatriculationStatus()],
                        "created_by" => ['required', new UserValidation()]
                    ], $messages);

                    if ($validator->fails()) {
                        return response()->json(['success' => false, 'messages' => $validator->messages()]);
                    } else {

                        try {

                            $vehicule = Vehicule::find($input['vehicule_id']);
                            $vehicule->marque_id = $input['marque_id'];
                            $vehicule->model_id = $input['model_id'];
                            $vehicule->carosserie = $input['carrosserie'];
                            $vehicule->placeNumberAssis = $input['nbPlaceAssise'];
                            $vehicule->placeNumberDebout = $input['nbPlaceDebout'];
                            $vehicule->nbPorte = $input['nbPorte'];
                            $vehicule->kilometrage = $input['kilometrage'];
                            $vehicule->cylinderNumber = $input['cylindre'];
                            $vehicule->madeYear = $input['annee'];
                            $vehicule->releaseYear = $input['dateP'];
                            $vehicule->energy = $input['energie'];
                            $vehicule->provenance = $input['idpays'];
                            $vehicule->genre = $input['genre'];
                            $vehicule->typeVehicule = $input['typeVehicule'];
                            $vehicule->transmission = $input['transmission'];
                            $vehicule->colorVehicule = $input['couleur'];
                            $vehicule->nbreEssuie = $input['nbreEssuie'];
                            $vehicule->pv = $input['pv'];
                            $vehicule->cu = $input['cu'];
                            $vehicule->pa = $input['pa'];
                            $vehicule->numChassie = $input['numChassie'];
                            $vehicule->acquisition = $input['acquisition'];

                            $immatriculation = Immatriculation::find($input['immatriculation_id']);

                            if (strcmp(trim($immatriculation->modeImmatriculation), trim($input['modeImmatriculation'])) != 0) {
                                $immatriculation->delete();
                                $immatriculation = new Immatriculation();
                                $numeroMatricule = $this->immatriculation(trim($input['modeImmatriculation']));
                                $immatriculation->immatriculation_number = $numeroMatricule;
                                $immatriculation->modeImmatriculation = $input['modeImmatriculation'];
                                $immatriculation->vehicule_id = $input['vehicule_id'];
                                $immatriculation->save();
                            }
                            $immatriculation->ancienImmatriculation = $input['ancienImmatriculation'];
                            $immatriculation->minister_id = $input['ministere'];
                            $immatriculation->direction_id = $input['direction'] ? $input['direction'] : 0;
                            $immatriculation->autreministere = $input['autreministere'];
                            $immatriculation->autredirection = $input['autredirection'];
                            // Organisme proposé déjà existant : son code est affecté au dossier
                            $organismeExistant = OrganismeService::rattacherSiExistant($immatriculation);
                            $immatriculation->vehicule_id = $vehicule->vehicule_id;
                            $immatriculation->updated_at = Carbon::now();
                            $immatriculation->created_by = Auth::user()->id;
                            $immatriculation->status = 0;

                            if ($request->file('pieceJointe')) {
                                if (isset($numeroMatricule))
                                    $vehicule->pieceJointe = $this->storingFile($request, "pieceJointe", $numeroMatricule, "documents/pieceJointe");
                                else
                                    $vehicule->pieceJointe = $this->storingFile($request, "pieceJointe", $immatriculation->immatriculation_number, "documents/pieceJointe");
                            }

                            $vehicule->save();
                            $immatriculation->save();
                            $rejet = Rejet::find($input['immatriculation_id']);
                            if($rejet)
                              $rejet->delete();

                        } catch (QueryException $ex) {
                            return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
                        }
                        return response()->json(['success' => true, 'messages' => "Immatriculation effectuée avec succès"]);
                    }
                }
                catch (\Exception $ex){
                    return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
                }
            }
        }

    }

    public function newimmatriculation(Request $request)
    {

        if($request->isMethod('post')){

            if( Auth::user() )
            {

                $input = $request->all();
                if($input['kilometrage'] == '' || !isset($input['kilometrage'])){
                    $input['kilometrage'] = 0;
                }
                $messages = [
                  "modeImmatriculation.required" => "Le mode d'ImmatriculationController est obligatoire.",
                  "modeImmatriculation.not_in" => "Le mode d'ImmatriculationController est obligatoire.",
                  "numChassie.required" => "Le numéro de chassie est obligatoire.",
                  "numChassie.min" => "Le minimum de caractère pour le numéro de chassie est deux (2).",
                  "numChassie.max" => "Le maximum de caractère pour le numéro de chassie est dix sept (17).",
                  "numChassie.unique" => "Ce vehicule est déjà immatriculé!",
                  "marque_id.required" => "La marque du vehicule est obligatoire.",
                  "marque_id.not_in" => "La marque du vehicule est obligatoire.",
                  "model_id.required" => "Le modèle du vehicule est obligatoire.",
                  "model_id.not_in" => "Le modèle du vehicule est obligatoire.",
                  "carrosserie.required" => "La carrosserie est obligatoire.",
                  "carrosserie.not_in" => "La carrosserie est obligatoire.",
                  "nbPlaceAssise.required" => "Veuillez fournir le nombre de place assise.",
                  "nbPlaceAssise.numeric" => "Le nombre de place assise est numérique.",
                  "nbPlaceDebout.required" => "Veuillez fournir le nombre de place debout.",
                  "nbPlaceDebout.numeric" => "Le nombre de place debout est numérique.",
                  "nbPorte.required" => "Veuillez fournir le nombre de porte.",
                  "nbPorte.numeric" => "Le nombre de porte est numérique.",
                  "kilometrage.required" => "Veuillez fournir le nombre de Kilometrage.",
                  "kilometrage.numeric" => "Le nombre de Kilometrage est numérique.",
                  "nbreEssuie.required" => "Le nombre d'Essuie est obligatoire.",
                  "nbreEssuie.numeric" => "Le nombre d'Essuie doit être numérique.",
                  "nbreEssuie.min" => "Le minimum pour le nombre d'essuie est deux (2).",
                  "nbreEssuie.max" => "Le maximum pour le nombre d'essuie est quatre (4).",
                  "pv.required" => "Le poids à vide est obligatoire.",
                  "pv.numeric" => "Le poids à vide doit être numérique.",
                  "cu.required" => "La charge utile est obligatoire.",
                  "pv.numeric" => "La charge utile doit être numérique.",
                  "cylindre.required" => "Veuillez fournir le nombre de Cylindre.",
                  "cylindre.numeric" => "Le nombre de Cylindre est numérique.",
                  "cylindre.digits_between" => "Le nombre de Cylindre doit être compris entre 1-25.",
                  "annee.required" => "Veuillez fournir l'année de fabrication du Véhicule.",
                  "annee.numeric" => "L'année de fabrication  est numérique.",
                  "dateP.date_format" => "Le format de la date pour la première mise en Circulation est Jour/Mois/Année !",
                  "energie.required" => "Vous n'avez la source d'energie.",
                  "energie.not_in" => "Vous n'avez la source d'energie.",
                  "idpays.required" => "Le pays de provenance est obligatoire.",
                  "idpays.not_in" => "Le pays de provenance est obligatoire.",
                  "genre.required" => "Le genre du vehicule est obligatoire.",
                  "genre.not_in" => "Le genre du vehicule est obligatoire.",
                  "typeVehicule.required" => "Le Type du vehicule est obligatoire.",
                  "typeVehicule.not_in" => "Le Type du vehicule est obligatoire.",
                  "couleur.required" => "La couleur du vehicule est obligatoire.",
                  "couleur.not_in" => "La couleur du vehicule est obligatoire.",
                  "acquisition.required" => "Le mode d'acquisation est obligatoire.",
                  "acquisition.not_id" => "Le mode d'acquisation est obligatoire.",
                  "ancienImmatriculation.regex" => "Respectez le format d'immatriculation.Ex:RC-1234-A.",
                  "transmission.required" => "Le mode de transmission est obligatoire.",
                  "transmission.not_in" => "Le mode de transmission est obligatoire.",
                  "autredirection.min" => "Le minimum de caractères pour autre direction est deux (2).",
                  "pieceJointe.required" => "La pièce jointe est obligatoire.",
                  "pieceJointe.mimes" => "La pièce jointe doit être au format PDF, JPEG ou PNG.",
                  "pieceJointe.max" => "La pièce jointe ne doit pas dépasser 10 Mo.",
                        "pieceJointe.uploaded" => "La pièce jointe n'a pas pu être envoyée : taille maximale autorisée ".\App\Exceptions\Handler::maxUploadMo()." Mo.",
                  "pa.required" => "La puissance administrative est obligatoire.",
                  "pa.min" => "Le minimum pour la puissance administrative est un (1).",
                  "typeOrganisme.required" => "Le type d'organisme est obligatoire",
                  "typeOrganisme.not_in" => "Le type d'organisme est obligatoire",
                  "typeOrganisme.in" => "Le type d'organisme (Publique ou Privé) n'a pas été fourni par le paiement.",
                ];

                $validator = Validator::make($input,[
                  'modeImmatriculation' => ["required","not_in:''",new RuleModeImmatriculation()],
                  'numChassie' => 'required|min:2|max:17|unique:vehicules,numChassie',
                  'marque_id' => 'required|not_in:0',
                  'model_id' => 'required|not_in:0',
                  'carrosserie' => 'required|not_in:0',
                  'nbPlaceAssise' => 'required|numeric',
                  'nbPlaceDebout' => 'required|numeric',
                  'nbreEssuie' => "required|numeric|max:4",
                  'pv' => "required|numeric",
                  'cu' => "required|numeric",
                  "pa" =>"required|min:1",
                  'nbPorte' => 'required|numeric',
                  'kilometrage' => 'required|numeric',
                  'cylindre' => 'required|numeric|digits_between:1,25',
                  'annee' => 'required|numeric',
                  'dateP' => 'nullable|date_format:Y-m-d',
                  'energie' => 'required|not_in:0',
                  'idpays' => 'required|not_in:0',
                  'genre' => 'required|not_in:0',
                  'typeVehicule' => 'required|not_in:0',
                  'transmission' => ['required','not_in:0',],
                  'ancienImmatriculation' => ['nullable',new RuleAncienNumeroImmatriculation(),"regex:/[A-Z]{2,3}-[0-9]{4}-[A-Z]{1,2}/"],
                  //'ancienImmatriculation' => "regex:/[A-Z]{2,3}-[0-9]{4}-[A-Z]{1,2}/",
                  'ministere' => ['nullable',new CheckMinistereExist()],
                  'direction' => ['nullable'],
                  'autreministere' => ['nullable','string'],
                  'typeOrganisme' => ["required",'not_in:0','in:Publique,Privé'],
                  "paiementReference" => [new CheckPaiement($input['typeOrganisme'])],
                  'autredirection' => ['nullable','min:2'],
                  'couleur' => 'required|not_in:0',
                  'acquisition' => 'required|not_in:0',
                  "pieceJointe" => "required|mimes:pdf,jpg,jpeg,png|max:10240",
                  "reservation_id" => [new ReservationModeImmatriculation($input['modeImmatriculation'])]
                ],$messages);

                if ($validator->fails()) {
                    return response()->json(['success' => false, 'messages' => $validator->messages()]);
                }else{

                    $referenceUtilisee = false;
                    try {
                        // return response()->json(['imm' =>  $this->immatriculation3(trim($input['modeImmatriculation']),trim($input['reservation_id']))]);
                         DB::beginTransaction();
                         $vehicule = new Vehicule();
                         $vehicule->marque_id = $input['marque_id'];$vehicule->model_id = $input['model_id'];$vehicule->carosserie = $input['carrosserie'];
                         $vehicule->placeNumberAssis = $input['nbPlaceAssise'];$vehicule->placeNumberDebout = $input['nbPlaceDebout'];
                         $vehicule->nbPorte = $input['nbPorte'];$vehicule->kilometrage = $input['kilometrage'];$vehicule->cylinderNumber = $input['cylindre'];
                         $vehicule->madeYear = $input['annee']; $vehicule->releaseYear = $input['dateP'];$vehicule->energy = $input['energie'];
                         $vehicule->provenance = $input['idpays'];$vehicule->genre = $input['genre'];$vehicule->typeVehicule = $input['typeVehicule'];
                         $vehicule->transmission = $input['transmission'];$vehicule->colorVehicule = $input['couleur'];
                         $vehicule->nbreEssuie = $input['nbreEssuie'];$vehicule->pv = $input['pv'];$vehicule->cu = $input['cu'];
                         $vehicule->numChassie = $input['numChassie'];$vehicule->acquisition = $input['acquisition'];$vehicule->user_id = Auth::user()->id;
                         $vehicule->pa = $input['pa'];

                         $vehicule->save();
                         $numeroMatricule = $this->immatriculation3(trim($input['modeImmatriculation']),trim($input['reservation_id']));

                         $immatriculation = new Immatriculation();
                         if(strlen($input['reservation_id']) != 0)
                             $immatriculation->type_numerotation = 'reservation';

                         $immatriculation->immatriculation_number = $numeroMatricule;
                         $immatriculation->modeImmatriculation = $input['modeImmatriculation'];
                         $immatriculation->ancienImmatriculation = $input['ancienImmatriculation'];
                         $immatriculation->minister_id = $input['ministere']; $immatriculation->direction_id = $input['direction'];
                         $immatriculation->autreministere = $input['autreministere'];
                         $immatriculation->autredirection = $input['autredirection'];
                         // Organisme proposé déjà existant : son code est affecté au dossier, sans validation du Directeur
                         $organismeExistant = OrganismeService::rattacherSiExistant($immatriculation);
                         $immatriculation->vehicule_id = $vehicule->vehicule_id;
                         $immatriculation->created_by = Auth::user()->id;
                         $immatriculation->typeOrganisme = $input['typeOrganisme'];

                         $immatriculation->paiementReference = $input['paiementReference'];

                         $immatriculation->save();

                         // Consomme la reference de paiement dans SIPIM ; en cas de refus, rien n'est enregistre
                         if(!empty($input['paiementReference'])){
                             $sipim = SipimService::utiliserPaiement($input['paiementReference'], $numeroMatricule);
                             if(empty($sipim['success'])){
                                 DB::rollBack();
                                 return response()->json(['success' => false,'messages' => ['paiementReference' => [is_string($sipim['messages'] ?? null) ? $sipim['messages'] : 'Référence de paiement non utilisable.']]]);
                             }
                             $referenceUtilisee = true;
                         }

                        if( $request->file('pieceJointe') )
                            $vehicule->pieceJointe = $this->storingFile($request,"pieceJointe",$numeroMatricule,"documents/pieceJointe");

                        $vehicule->save();
                        DB::commit();
                      try{
                        broadcast(new DashboardEvent($this->DashBoardOption('attente')))->toOthers();
                      }
                      catch (BroadcastException $ex){
                          return response()->json(['success' => false,'status' => Response::HTTP_EXPECTATION_FAILED ,'messages' => ['erruer' => $ex->getMessage()]]);
                      }

                      }
                     catch (QueryException $ex){
                         DB::rollBack();
                         // L'immatriculation est annulee : la reference redevient utilisable dans SIPIM
                         if($referenceUtilisee)
                             SipimService::libererPaiement($input['paiementReference']);
                         return response()->json(['success' => false,'messages' => ['erruer' => $ex->getMessage()]]);
                     }
                     catch (\Throwable $ex){
                         if(DB::transactionLevel() > 0)
                             DB::rollBack();
                         if($referenceUtilisee)
                             SipimService::libererPaiement($input['paiementReference']);
                         throw $ex;
                     }
                    return response()->json(['success' => true,'messages' => "Immatriculation effectuée avec succès",
                        'organismeRattache' => $organismeExistant ? $organismeExistant->nom : null]);
                }
            }
        }

    }

    public function getAllImmatriculation(){
        if($this->fullAccess(Auth::user()->id) || $this->roleStatus() === 1){
           $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status !=? order by i.updated_at  desc',[3]);
           return response()->json(['immatriculations' => $immatriculations]);
        }else {
            $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status !=:status and i.created_by=:user_id order by i.updated_at desc'
                ,['status' => 3,'user_id' => Auth::user()->id]);
            return response()->json(['immatriculations' => $immatriculations]);
        }
    }

    public function getImmatriculationByID($immatriculation_id){
        $immatriculation = Immatriculation::where('immatriculation_id',$immatriculation_id)->get()->first();
        if($immatriculation ) {
            $vehicule = Vehicule::where('vehicule_id', $immatriculation->vehicule_id)->get()->first();
            $ministere = Ministere::find($immatriculation->minister_id);
            if($vehicule)
               return response()->json(['status' => true,
                   'immatriculation' => $immatriculation,
                   'vehicule' => $vehicule,
                   'ministere' => $ministere,
               ]);
            else  return response()->json(['status' => false]);

        }
        else return response()->json(['status' => false]);
    }
    public function getImmatriculationByNumber(Request $request){
        if($request->isMethod('get')){
            try {
                if(trim($request->token) !== trim($this->key))
                    return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => 'Clé non trouvée.'],Response::HTTP_BAD_REQUEST);
                if(!isset($request->imNumber))
                   return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => 'Numero de Chassis non fournie.'],Response::HTTP_BAD_REQUEST);
                else {

                 $imNumber = $request->imNumber;

                 $immatriculation = DB::select('SELECT immatriculation_id, i.vehicule_id,modeImmatriculation,immatriculation_number,mi.ministere_id,
                                                    mi.nom ministere,i.typeOrganisme,v.marque_id,m.title marque,v.model_id,mo.title modele,
                                                    g.genre_id,g.nom genre,t.type_id,t.nom typeVehicule,carosserie,cylinderNumber,colorVehicule
                                                    FROM immatriculations i,vehicules v,
                                                    marques m,ministeres mi,modeles mo,genres g,typevehicules t
                                                    where i.vehicule_id = v.vehicule_id
                                                    and v.marque_id = m.id
                                                    and i.minister_id = mi.ministere_id
                                                    and v.model_id = mo.id
                                                    and g.genre_id = v.genre
                                                    and v.typeVehicule = t.type_id and immatriculation_number=?', [$imNumber]);
                  if(count($immatriculation) > 0)
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'immatriculation' => $immatriculation[0]],Response::HTTP_OK);
                   else  return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND,'messages' =>['erreur' => "Immatriculation non trouvée"]],Response::HTTP_FORBIDDEN);
                }
            }
            catch (QueryException $ex){
                return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]],Response::HTTP_PRECONDITION_FAILED);
            }

        }
    }

    public function validerImmatriculation(Request $request){
        if($request->isMethod('post')){
             try{
                 $immatriculation = Immatriculation::where('immatriculation_id',$request->input('id'))->get()->first();
                 if($immatriculation){
                     $immatriculation->status = 1;
                     $immatriculation->valided_by = Auth::user()->id;
                     $immatriculation->date_decision = Carbon::now();
                     // QR code de la plaque : numéro de châssis du véhicule
                     $immatriculation->qrcode = QrCodeService::generer($immatriculation);
                     $immatriculation->save();
                     // Historique : première période d'utilisation du véhicule
                     HistoriqueService::ouvrir($immatriculation, $immatriculation->minister_id, $immatriculation->direction_id,
                         $immatriculation->date_decision, 'immatriculation', Auth::user()->id, ['reference' => $immatriculation->paiementReference]);
                     broadcast(new DashboardEvent($this->DashBoardOption('valider')))->toOthers();
                     return response()->json(['success' => true]);
                 }else return response()->json(['success' => false]);
             }
             catch (\Exception $ex){
                 return response()->json(['status' => false]);
             }
        }
    }

    public function rejet(Request $request){
        if($request->isMethod('post')){
           try{

                 $input = $request->all();

                $validator = Validator::make($input,[
                   "motif" => [new RuleMotif($input['autremotif'])],
                   "autremotif" => [new RuleMotifNouveau($input['motif'])],
                ]);
                if (!$validator->fails()) {
                    $immatriculation = Immatriculation::where('immatriculation_id', $request->input('id'))->get()->first();
                    if ($immatriculation) {
                        $immatriculation->status = 2;
                        $immatriculation->date_decision = Carbon::now();
                        $immatriculation->valided_by = Auth::user()->id;
                        $immatriculation->save();
                        $rejet = new Rejet();
                        $rejet->raison = $input['motif'];
                        $rejet->autreraison = $input['autremotif'];
                        $rejet->immatriculation_id = $immatriculation->immatriculation_id;
                        $rejet->typeRejet = 'immatriculation';
                        $rejet->save();
                        broadcast(new DashboardEvent($this->DashBoardOption('rejete')))->toOthers();
                        return response()->json(['status' => true]);
                    } else return response()->json(['status' => false,"messages" => ["erreur" => "Cette immatriculation n'existe pas!"]]);
                }
                else {
                    return response()->json(['status' => false,'messages' => $validator->messages()]);
                }
            }
            catch (\Exception $ex){
              return response()->json(['status' => false,'messages' => ["erreur" => "Erreur dans le rejet."]]);
            }
        }
    }
    //chercher les immatriculation par option
    public function searchImmatriculationOption($option ="",$option_id){
        if($this->fullAccess(Auth::user()->id)){
            if( $option_id != -1 ){
               $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status=? order by i.updated_at desc',[$option_id]);
                return response()->json(['status' => true,'immatriculations' => $immatriculations]);
            }
            else {

                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id order by i.updated_at desc');

                return response()->json(['status' => true,'immatriculations' => $immatriculations]);
            }
        }else {
            if( $option_id != -1 ){
                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status=:status and i.created_by=:user_id order by i.updated_at desc',
                                                ['status' => $option_id,'user_id' => Auth::user()->id]);
                return response()->json(['status' => true,'immatriculations' => $immatriculations]);
            }
            else {

                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.created_by=? order by i.updated_at desc',[Auth::user()->id]);

                return response()->json(['status' => true,'immatriculations' => $immatriculations]);
            }
        }
    }

    public function dashboardStat(){
       return $this->DashBoardStatistic();
    }

    // Le rôle de l'utilisateur connecté a-t-il ce droit ?
    private function aDroit($privilege){
        return DB::table('role_privileges as rp')
            ->join('privileges as p', 'p.privilege_id', '=', 'rp.privilege_id')
            ->where('rp.role_id', Auth::user()->role_id)
            ->where('p.nom', $privilege)
            ->exists();
    }
    // Droit « Validation » : rôle Directeur (et Direction Générale GG)
    private function aDroitValidation(){
        return $this->aDroit('Validation');
    }
    // Administrateur : gestion des utilisateurs sans le droit de validation
    private function estAdministrateur(){
        return $this->aDroit('Gestion des Utilisateurs') && !$this->aDroitValidation();
    }

    /**
     * Tableau de bord de l'administrateur : comptes et rôles, organismes, réservations de numéros,
     * impressions et activité globale de la plateforme (12 derniers mois).
     */
    public function dashboardAdmin(){
        if(!$this->estAdministrateur())
            return response()->json(['success' => false, 'status' => 403, 'messages' => ['erreur' => ['Accès réservé à l\'administrateur.']]], 403);
        try {
            // Comptes par rôle (rôles sans utilisateur compris)
            $roles = DB::select("select r.role_id, r.nom_role, r.status actif, count(u.id) utilisateurs,
                                        coalesce(sum(u.statusCnx = 1), 0) actifs, coalesce(sum(u.statusCnx = 0), 0) desactives,
                                        coalesce(sum(u.nbreCnx = 0), 0) premiere_connexion
                                 from roles r left join users u on u.role_id = r.role_id
                                 group by r.role_id, r.nom_role, r.status order by utilisateurs desc, r.nom_role");
            $comptes = DB::selectOne("select count(*) total, sum(statusCnx = 1) actifs, sum(statusCnx = 0) desactives, sum(nbreCnx = 0) premiere_connexion from users");

            // Comptes à surveiller : désactivés ou jamais connectés (mot de passe initial à changer)
            $aSurveiller = DB::select("select u.id, concat(u.prenom, ' ', u.nom) nom, r.nom_role role, u.statusCnx actif, u.nbreCnx, u.updated_at
                                       from users u left join roles r on r.role_id = u.role_id
                                       where u.statusCnx = 0 or u.nbreCnx = 0 order by u.statusCnx asc, u.updated_at desc");

            // Activité : dossiers créés et validés par mois (12 derniers mois, mois vides à 0)
            $debut = Carbon::now()->startOfMonth()->subMonths(11);
            $crees = collect(DB::select("select date_format(created_at,'%Y-%m') mois, count(*) n from immatriculations where created_at >= ? group by mois", [$debut]))->keyBy('mois');
            $valides = collect(DB::select("select date_format(date_decision,'%Y-%m') mois, count(*) n from immatriculations where status = 1 and date_decision >= ? group by mois", [$debut]))->keyBy('mois');
            $activite = [];
            for ($i = 0; $i < 12; $i++) {
                $mois = $debut->copy()->addMonths($i)->format('Y-m');
                $activite[] = ['mois' => $mois, 'crees' => (int) ($crees[$mois]->n ?? 0), 'valides' => (int) ($valides[$mois]->n ?? 0)];
            }

            // Réservations de numéros : numéros attribués dans la plage réservée
            $reservations = DB::select("select r.reservation_id, r.nomReservation nom, r.initial, r.final, r.modeImmatriculation mode, r.status, r.created_at,
                                               (select count(*) from immatriculations i
                                                 where i.modeImmatriculation = r.modeImmatriculation and i.type_numerotation = 'reservation'
                                                   and cast(substring_index(substring_index(i.immatriculation_number, '-', 2), '-', -1) as unsigned) between r.initial and r.final) utilises
                                        from reservations r order by r.created_at desc");

            $dossiers = DB::selectOne("select count(*) total, sum(status = 0) attente, sum(status = 1) valides, sum(status = 2) rejetes,
                                              sum(status in (1,4)) parc, sum(status in (1,4) and modeImmatriculation = 'EP') ep, sum(status in (1,4) and modeImmatriculation = 'VA') va,
                                              sum(status = 1 and imprimer = 0) a_imprimer, sum(imprimer = 1) imprimees,
                                              sum(status = 0 and minister_id = ?) propositions
                                       from immatriculations", [OrganismeService::AUTRE_MINISTERE]);

            return response()->json([
                'success' => true,
                'comptes' => array_map('intval', (array) $comptes),
                'roles' => $roles,
                'aSurveiller' => $aSurveiller,
                'activite' => $activite,
                'reservations' => $reservations,
                'dossiers' => array_map('intval', (array) $dossiers),
                'organismes' => [
                    'total' => DB::table('ministeres')->count(),
                    'publique' => DB::table('ministeres')->where('typeorganisme', 'Publique')->count(),
                    'prive' => DB::table('ministeres')->where('typeorganisme', 'Privé')->count(),
                    'directions' => DB::table('directions')->count(),
                ],
            ]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
    }

    // Motifs de rejet d'un organisme proposé (libellés courts : rejets.raison fait 45 caractères)
    const MOTIFS_REJET_ORGANISME = [
        'inexistant' => 'Organisme inexistant ou non habilité',
        'doublon' => 'Doublon ou mauvaise orthographe',
        'type' => "Mauvais type d'organisme",
        'direction' => 'Direction incorrecte',
        'autre' => 'Autre motif',
    ];

    /**
     * Rejet de l'organisme (et de la direction) proposé par un agent : le dossier passe en « Rejeté ».
     * L'agent le corrige par la resoumission en choisissant un autre organisme ; le numéro est conservé.
     * Le rejet est tracé dans rejets (typeRejet « organisme »), avec la proposition archivée et le motif.
     */
    public function rejeterPropositionOrganisme(Request $request){
        if(!$this->aDroitValidation())
            return response()->json(['success' => false, 'status' => 403, 'messages' => ['erreur' => ['Accès réservé au Directeur.']]], 403);
        $input = $request->all();
        $validator = Validator::make($input, [
            'immatriculation_id' => 'required|exists:immatriculations,immatriculation_id',
            'motif' => 'required|in:'.implode(',', array_keys(self::MOTIFS_REJET_ORGANISME)),
            'commentaire' => 'required_if:motif,autre|nullable|string|max:150',
        ], [
            'immatriculation_id.exists' => "Cette immatriculation n'existe pas.",
            'motif.required' => 'Choisissez le motif du rejet.',
            'motif.in' => 'Motif de rejet inconnu.',
            'commentaire.required_if' => 'Précisez le motif du rejet.',
            'commentaire.max' => 'Le commentaire ne doit pas dépasser 150 caractères.',
        ]);
        if($validator->fails())
            return response()->json(['success' => false, 'messages' => $validator->messages()]);

        $immatriculation = Immatriculation::find($input['immatriculation_id']);
        if((int) $immatriculation->status !== 0 || (int) $immatriculation->minister_id !== OrganismeService::AUTRE_MINISTERE)
            return response()->json(['success' => false, 'messages' => ['erreur' => ["Ce dossier n'a pas de proposition d'organisme en attente."]]]);

        try {
            DB::transaction(function () use ($immatriculation, $input) {
                // Proposition archivée dans le rejet, puis retirée du dossier : l'agent devra choisir un autre organisme
                $proposition = 'Organisme proposé : '.$immatriculation->autreministere
                    .($immatriculation->autredirection ? ' / Direction : '.$immatriculation->autredirection : '')
                    .(!empty($input['commentaire']) ? '. '.trim($input['commentaire']) : '');
                $rejet = new Rejet();
                $rejet->immatriculation_id = $immatriculation->immatriculation_id;
                $rejet->raison = self::MOTIFS_REJET_ORGANISME[$input['motif']];
                $rejet->autreraison = mb_substr($proposition, 0, 255);
                $rejet->typeRejet = 'organisme';
                $rejet->save();

                $immatriculation->status = 2;
                $immatriculation->date_decision = Carbon::now();
                $immatriculation->valided_by = Auth::user()->id;
                $immatriculation->minister_id = null;
                $immatriculation->direction_id = 0;
                $immatriculation->autreministere = '';
                $immatriculation->autredirection = '';
                $immatriculation->save();
            });
        } catch (QueryException $ex) {
            return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
        try { broadcast(new DashboardEvent($this->DashBoardOption('rejete')))->toOthers(); } catch (\Throwable $ex) {}
        return response()->json(['success' => true, 'motif' => self::MOTIFS_REJET_ORGANISME[$input['motif']]]);
    }

    /**
     * Tableau de bord du Directeur, pour la période [du, au] (dates Y-m-d ; par défaut le mois en cours).
     * - Dépendent de la période : décisions (validations / rejets, d'après date_decision), délai moyen, graphique, activité des agents.
     * - Indépendants de la période : file de validation, organismes à approuver, cartes à imprimer, parc.
     */
    public function dashboardDirecteur(Request $request){
        if(!$this->aDroitValidation())
            return response()->json(['success' => false, 'status' => 403, 'messages' => ['erreur' => 'Accès réservé au Directeur.']], 403);
        try {
            $validator = Validator::make($request->all(), [
                'du' => 'nullable|date_format:Y-m-d',
                'au' => 'nullable|date_format:Y-m-d|after_or_equal:du',
            ], [
                'du.date_format' => 'La date de début est invalide.',
                'au.date_format' => 'La date de fin est invalide.',
                'au.after_or_equal' => 'La date de fin doit suivre la date de début.',
            ]);
            if($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);

            $du = $request->du ? Carbon::parse($request->du)->startOfDay() : Carbon::now()->startOfMonth();
            $au = $request->au ? Carbon::parse($request->au)->endOfDay() : Carbon::now()->endOfDay();
            $jours = $du->diffInDays($au) + 1;
            // Période précédente de même durée, pour la comparaison
            $duPrec = $du->copy()->subDays($jours);
            $auPrec = $du->copy()->subSecond();

            $decisions = function ($debut, $fin) {
                $r = DB::selectOne("select sum(status=1) valides, sum(status=2) rejets,
                                           avg(timestampdiff(hour, created_at, date_decision)) / 24 delai
                                    from immatriculations where date_decision between ? and ?", [$debut, $fin]);
                return ['valides' => (int) $r->valides, 'rejets' => (int) $r->rejets, 'delai' => $r->delai !== null ? round((float) $r->delai, 1) : null];
            };
            $periode = $decisions($du, $au);
            $precedente = $decisions($duPrec, $auPrec);

            // Graphique : découpage selon la durée de la période (2 h, jour, semaine ou mois), cases vides à 0
            if ($jours <= 1) { $pas = 'heure'; $format = "concat(lpad(floor(hour(date_decision)/2)*2,2,'0'),'h')"; }
            else if ($jours <= 14) { $pas = 'jour'; $format = "date_format(date_decision,'%Y-%m-%d')"; }
            else if ($jours <= 92) { $pas = 'semaine'; $format = "date_format(date_decision,'%x-S%v')"; }
            else { $pas = 'mois'; $format = "date_format(date_decision,'%Y-%m')"; }
            $brut = collect(DB::select("select $format cle, sum(status=1) valides, sum(status=2) rejets
                                        from immatriculations where date_decision between ? and ? group by cle", [$du, $au]))->keyBy('cle');
            $serie = [];
            $curseur = $du->copy();
            if ($pas === 'heure') {
                for ($h = 0; $h < 24; $h += 2) { $cle = str_pad($h, 2, '0', STR_PAD_LEFT).'h'; $serie[] = ['cle' => $cle, 'debut' => $du->copy()->setTime($h, 0)->toDateTimeString()]; }
            } else {
                while ($curseur <= $au) {
                    $cle = $pas === 'jour' ? $curseur->format('Y-m-d') : ($pas === 'semaine' ? $curseur->format('o-\SW') : $curseur->format('Y-m'));
                    if (!collect($serie)->contains('cle', $cle)) $serie[] = ['cle' => $cle, 'debut' => $curseur->toDateString()];
                    $curseur = $pas === 'jour' ? $curseur->addDay() : ($pas === 'semaine' ? $curseur->addWeek()->startOfWeek() : $curseur->addMonth()->startOfMonth());
                }
            }
            $serie = array_map(fn ($p) => $p + ['valides' => (int) ($brut[$p['cle']]->valides ?? 0), 'rejets' => (int) ($brut[$p['cle']]->rejets ?? 0)], $serie);

            // File de validation : immatriculations, réformes et mutations en attente (les plus anciennes d'abord)
            // Dossier en attente déjà rejeté = dossier resoumis (nombre de rejets et dernier motif)
            $selectEnAttente = "select i.immatriculation_id id, i.immatriculation_number numero, i.created_at, i.updated_at resoumis_le,
                                       (i.minister_id = 1000000) nouvel, v.numChassie chassis, ma.title marque, mo.title modele,
                                       coalesce(mi.nom, i.autreministere) affectation, concat(u.prenom,' ',u.nom) agent,
                                       (select count(*) from rejets r where r.immatriculation_id = i.immatriculation_id) nb_rejets,
                                       (select concat_ws(' — ', nullif(r.raison,''), nullif(r.autreraison,'')) from rejets r
                                         where r.immatriculation_id = i.immatriculation_id order by r.rejet_id desc limit 1) dernier_motif
                                from immatriculations i
                                join vehicules v on v.vehicule_id = i.vehicule_id
                                left join marques ma on ma.id = v.marque_id
                                left join modeles mo on mo.id = v.model_id
                                left join ministeres mi on mi.ministere_id = i.minister_id
                                left join users u on u.id = i.created_by
                                where i.status = 0";
            // File de validation : du plus récent au plus ancien
            $fileImmat = DB::select($selectEnAttente." order by i.created_at desc limit 10");
            // Resoumis : les plus récemment resoumis d'abord
            $fileResoumis = DB::select($selectEnAttente." and exists (select 1 from rejets r where r.immatriculation_id = i.immatriculation_id)
                                        order by i.updated_at desc limit 10");
            $fileReformes = DB::select("select r.reforme_id id, i.immatriculation_number numero, r.created_at, 0 nouvel,
                                               v.numChassie chassis, ma.title marque, mo.title modele,
                                               coalesce(mi.nom, nullif(trim(concat(coalesce(r.prenom,''),' ',coalesce(r.nom,''))),'')) affectation, concat(u.prenom,' ',u.nom) agent
                                        from reformes r join immatriculations i on i.immatriculation_id = r.immatriculation_id
                                        join vehicules v on v.vehicule_id = i.vehicule_id
                                        left join marques ma on ma.id = v.marque_id left join modeles mo on mo.id = v.model_id
                                        left join ministeres mi on mi.ministere_id = r.ministere_id left join users u on u.id = r.user_id
                                        where r.status = 0 order by r.created_at desc limit 10");
            $fileMutations = DB::select("select m.mutation_id id, i.immatriculation_number numero, m.created_at, 0 nouvel,
                                                v.numChassie chassis, ma.title marque, mo.title modele, mi.nom affectation, concat(u.prenom,' ',u.nom) agent
                                         from mutations m join immatriculations i on i.immatriculation_id = m.immatriculation_id
                                         join vehicules v on v.vehicule_id = i.vehicule_id
                                         left join marques ma on ma.id = v.marque_id left join modeles mo on mo.id = v.model_id
                                         left join ministeres mi on mi.ministere_id = m.ministere left join users u on u.id = m.user_id
                                         where m.status = 0 order by m.created_at desc limit 10");
            $attente = DB::selectOne("select count(*) total, sum(created_at < ?) retard from immatriculations where status = 0", [Carbon::now()->subDays(7)]);

            // Organismes proposés par les agents, à approuver avant validation du dossier
            $aApprouver = DB::select("select i.immatriculation_id id, i.immatriculation_number numero, i.autreministere nom, concat(u.prenom,' ',u.nom) agent
                                      from immatriculations i left join users u on u.id = i.created_by
                                      where i.status = 0 and i.minister_id = 1000000 order by i.created_at asc");

            // Parc : immatriculations validées (mutées comprises), hors réformes
            $parc = DB::selectOne("select count(*) total, sum(modeImmatriculation='EP') ep, sum(modeImmatriculation='VA') va from immatriculations where status in (1,4)");
            $organismes = DB::select("select coalesce(mi.nom, i.autreministere) nom, count(*) n
                                      from immatriculations i left join ministeres mi on mi.ministere_id = i.minister_id
                                      where i.status in (1,4) group by coalesce(mi.nom, i.autreministere) order by n desc limit 5");

            // Activité des agents sur la période (dossiers créés pendant la période)
            $agents = DB::select("select concat(u.prenom,' ',u.nom) nom, count(*) soumis, sum(i.status=0) attente, sum(i.status=2) rejets
                                  from immatriculations i join users u on u.id = i.created_by
                                  where i.created_at between ? and ? group by u.id, u.prenom, u.nom order by soumis desc", [$du, $au]);

            return response()->json([
                'success' => true,
                'periode' => ['du' => $du->toDateString(), 'au' => $au->toDateString(), 'jours' => $jours, 'pas' => $pas],
                'decisions' => $periode,
                'precedente' => $precedente,
                'serie' => $serie,
                'attente' => ['total' => (int) $attente->total, 'retard' => (int) $attente->retard],
                'file' => ['immatriculations' => $fileImmat, 'resoumis' => $fileResoumis, 'reformes' => $fileReformes, 'mutations' => $fileMutations],
                'compteurs' => [
                    'immatriculations' => (int) $attente->total,
                    'resoumis' => DB::table('immatriculations as i')->where('i.status', 0)
                        ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('rejets as r')->whereColumn('r.immatriculation_id', 'i.immatriculation_id'))->count(),
                    'reformes' => DB::table('reformes')->where('status', 0)->count(),
                    'mutations' => DB::table('mutations')->where('status', 0)->count(),
                ],
                'aApprouver' => $aApprouver,
                'aImprimer' => DB::table('immatriculations')->where('status', 1)->where('imprimer', 0)->count(),
                'parc' => ['total' => (int) $parc->total, 'ep' => (int) $parc->ep, 'va' => (int) $parc->va],
                'organismes' => $organismes,
                'agents' => $agents,
            ]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    /**
     * Tableau de bord du rôle Agent : uniquement les dossiers créés par l'utilisateur connecté.
     * isAgent indique au frontend s'il doit afficher ce tableau de bord (rôle dont le nom contient « agent »).
     */
    public function dashboardAgent(){
        try {
            $user = Auth::user();
            $role = DB::table('roles')->where('role_id', $user->role_id)->value('nom_role');
            $isAgent = $role && stripos($role, 'agent') !== false;

            $stats = ['totaux' => 0, 'attente' => 0, 'valider' => 0, 'rejete' => 0];
            foreach (DB::select("select status, count(*) total from immatriculations where created_by=? and status in (0,1,2) group by status", [$user->id]) as $ligne) {
                $cle = [0 => 'attente', 1 => 'valider', 2 => 'rejete'][$ligne->status];
                $stats[$cle] = (int) $ligne->total;
                $stats['totaux'] += (int) $ligne->total;
            }

            // Dossiers soumis sur les 6 derniers mois (mois sans dossier inclus, à 0)
            $debut = Carbon::now()->startOfMonth()->subMonths(5);
            $parMoisBrut = collect(DB::select("select date_format(created_at,'%Y-%m') mois, count(*) total, sum(status=1) valides
                                                 from immatriculations where created_by=? and created_at >= ?
                                                 group by date_format(created_at,'%Y-%m')", [$user->id, $debut]))->keyBy('mois');
            $parMois = [];
            for ($i = 0; $i < 6; $i++) {
                $mois = $debut->copy()->addMonths($i)->format('Y-m');
                $parMois[] = ['mois' => $mois, 'total' => (int) ($parMoisBrut[$mois]->total ?? 0), 'valides' => (int) ($parMoisBrut[$mois]->valides ?? 0)];
            }

            // Dossier : numéro, véhicule, affectation (ministère ou « autre ministère »)
            $selectDossier = "select i.immatriculation_id, i.immatriculation_number, i.status, i.created_at, i.updated_at,
                                     v.numChassie, ma.title marque, mo.title modele,
                                     coalesce(mi.nom, i.autreministere) affectation
                              from immatriculations i
                              join vehicules v on v.vehicule_id = i.vehicule_id
                              left join marques ma on ma.id = v.marque_id
                              left join modeles mo on mo.id = v.model_id
                              left join ministeres mi on mi.ministere_id = i.minister_id";

            $derniers = DB::select($selectDossier." where i.created_by=? and i.status in (0,1,2) order by i.created_at desc limit 10", [$user->id]);

            // Rejetés : motif du dernier rejet (texte libre en priorité)
            // Motif complet (libellé + précision) et type du dernier rejet (« organisme » : à corriger à l'étape 3)
            $rejets = DB::select("select d.*, (select concat_ws(' — ', nullif(r.raison,''), nullif(r.autreraison,'')) from rejets r
                                                where r.immatriculation_id = d.immatriculation_id and r.typeRejet in ('immatriculation','organisme')
                                                order by r.rejet_id desc limit 1) motif,
                                         (select r.typeRejet from rejets r
                                                where r.immatriculation_id = d.immatriculation_id and r.typeRejet in ('immatriculation','organisme')
                                                order by r.rejet_id desc limit 1) typeRejet
                                  from (".$selectDossier." where i.created_by=? and i.status=2) d
                                  order by d.updated_at desc", [$user->id]);

            // En attente : les plus anciens d'abord
            $attente = DB::select($selectDossier." where i.created_by=? and i.status=0 order by i.created_at asc limit 3", [$user->id]);

            // Mutations et réformes demandées par l'agent, d'un statut donné (0 en attente, 2 rejetée) ;
            // une demande rejetée n'est plus listée si une demande plus récente a suivi sur le véhicule
            $operations = function ($type, $table, $cle, $affectation, $joinAffectation, $status) use ($user) {
                return DB::select("select '$type' type, o.$cle id, o.immatriculation_id, i.immatriculation_number, o.created_at, o.updated_at,
                                          v.numChassie, ma.title marque, mo.title modele, $affectation affectation,
                                          (select concat_ws(' — ', nullif(r.raison,''), nullif(r.autreraison,'')) from rejets r
                                            where r.immatriculation_id = o.immatriculation_id and r.typeRejet = '$type' order by r.rejet_id desc limit 1) motif
                                   from $table o
                                   join immatriculations i on i.immatriculation_id = o.immatriculation_id
                                   join vehicules v on v.vehicule_id = i.vehicule_id
                                   left join marques ma on ma.id = v.marque_id left join modeles mo on mo.id = v.model_id
                                   $joinAffectation
                                   where o.user_id = ? and o.status = ?
                                     and not exists (select 1 from mutations m2 where m2.immatriculation_id = o.immatriculation_id and m2.created_at > o.created_at)
                                     and not exists (select 1 from reformes r2 where r2.immatriculation_id = o.immatriculation_id and r2.created_at > o.created_at)", [$user->id, $status]);
            };
            $operationsParStatut = fn ($status) => collect(array_merge(
                $operations('mutation', 'mutations', 'mutation_id', 'mi.nom', 'left join ministeres mi on mi.ministere_id = o.ministere', $status),
                $operations('reforme', 'reformes', 'reforme_id', "nullif(trim(concat(coalesce(o.prenom,''),' ',coalesce(o.nom,''))),'')", '', $status)
            ));
            $rejetsOperations = $operationsParStatut(2)->sortByDesc('updated_at')->values();
            // En attente : les plus anciennes d'abord (comme les immatriculations)
            $attenteOperations = $operationsParStatut(0)->sortBy('created_at')->values();

            return response()->json([
                'success' => true,
                'isAgent' => $isAgent,
                'isDirecteur' => $this->aDroitValidation(),
                'isAdministrateur' => $this->estAdministrateur(),
                'stats' => $stats,
                'moisCourant' => $parMois[5]['total'],
                'moisPrecedent' => $parMois[4]['total'],
                'parMois' => $parMois,
                'derniers' => $derniers,
                'rejets' => $rejets,
                'rejetsOperations' => $rejetsOperations,
                'attenteOperations' => $attenteOperations,
                'attente' => $attente,
            ]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function graph1($mois = ''){
        if($this->fullAccess(Auth::user()->id) ) {
            $graph1 = [];
            if(empty($mois))
                $graph1 = DB::select("select * from(select * from genres) a,
                                            (select genre,count(*) total
                                            from vehicules
                                            where month(curdate()) = month(updated_at)
                                            group by genre) b
                                            where a.genre_id = b.genre");
                else
                    $graph1 = DB::select("select * from(select * from genres) a,
                                            (select genre,count(*) total
                                            from vehicules
                                            where month(updated_at) =:cmonth
                                            group by genre) b
                                            where a.genre_id = b.genre",['cmonth' => $mois]);

            if (count($graph1) > 0)
                return response()->json(['success' => true, 'stats' => $graph1]);
            else return response()->json(['success' => true,]);
        }else{
            $graph1 = [];
            if(empty($mois))
            $graph1 = DB::select("select * from(select * from genres) a,
                                        (select genre,user_id,count(*) total
                                        from vehicules
                                        where month(curdate()) = month(updated_at)
                                        group by genre,user_id) b
                                        where a.genre_id = b.genre and b.user_id=?",[Auth::user()->id]);
            else
                $graph1 = DB::select("select * from(select * from genres) a,
                                        (select genre,user_id,count(*) total
                                        from vehicules
                                        where  month(updated_at) =:cmonth
                                        group by genre,user_id) b
                                        where a.genre_id = b.genre and b.user_id=:user_id",['user_id' => Auth::user()->id,'cmonth' => $mois]);

            if (count($graph1) > 0)
                return response()->json(['success' => true, 'stats' => $graph1]);
            else return response()->json(['success' => false,'stats' => $graph1]);
        }

    }

    public function graph2(){
        $graph2 = [];
        if($this->fullAccess(Auth::user()->id)){
            $graph2 = DB::select('select modeImmatriculation,count(*) total
                                        from immatriculations
                                        group by modeImmatriculation
                                        order by modeImmatriculation');

        }else{
            $graph2 = DB::select('select modeImmatriculation,count(*) total
                                        from immatriculations
                                        where created_by=?
                                        group by modeImmatriculation
                                        order by modeImmatriculation',[Auth::user()->id]);
        }
        if (count($graph2) > 0)
            return response()->json(['success' => true, 'stats' => $graph2]);
        else return response()->json(['success' => false,'stats' => $graph2]);
    }

    public function getAllImmatriculationValidee(){
        try {
            $immatriculations = [];
            if($this->fullAccess(Auth::user()->id))
                 $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status=1');
            else{
                $immatriculations = DB::select('select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                                carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                                energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                                ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                                u.nom,u.prenom
                                                from vehicules v,immatriculations i,users u,modeles m,marques ma
                                                where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                                and v.user_id = u.id and m.id = v.model_id and i.status = 1  and i.created_by=:user_id
                                                ',['user_id' => Auth::user()->id]);

            }

            return response()->json(['status' => true,'immatriculations' => $immatriculations]);
        }
        //catch(\Illuminate\Database\QueryException $ex){
        catch (QueryException $ex){
            return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function laurent(Request $request){
        try{
            $immatriculation = DB::select("select v.vehicule_id,v.marque_id,ma.title marque,v.model_id,m.title model,genre,typevehicule,numChassie,
                                    carosserie,placeNumberAssis,placeNumberDebout,nbPorte,kilometrage,cylinderNumber,madeYear,releaseYear,
                                    energy,transmission,provenance,colorVehicule,acquisition,v.user_id,immatriculation_id,modeImmatriculation,
                                    ancienImmatriculation,immatriculation_number,minister_id,direction_id,autreministere,status,i.updated_at,
                                    u.nom,u.prenom,mi.nom ministere,mi.typeorganisme,v.pa,v.pv,v.cu
                                    from vehicules v,immatriculations i,users u,modeles m,marques ma,ministeres mi
                                    where v.vehicule_id = i.vehicule_id and ma.id = v.marque_id
                                    and v.user_id = u.id and m.id = v.model_id
                                    and i.status=1 and mi.ministere_id = i.minister_id");
            return response()->json(['status' => Response::HTTP_OK,'immatriculation' => $immatriculation]);
        }
        catch (QueryException $ex){
            return response()->json(['status' => false,'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }

    public function generateqrcode(Request $request){

      $immatriculation = Immatriculation::find($request->input('immatriculation_id'));
      try{
           if($immatriculation){
               // QR code de la plaque : numéro de châssis du véhicule
               $immatriculation->qrcode = QrCodeService::generer($immatriculation);
               $immatriculation->save();
               return response()->json(['success'=>true,]);
            }

         }
     catch (\Exception $ex){
          return response()->json(['success'=>false,'message' =>$ex->getMessage()]);
     }
    }
    public function ImmatriculationforNewMinistere(Request $request){
        $message=[
          'immatriculation_id.required' => "Désolé,Nous ne retrouvons pas ce vehicule dans notre Park!",
          "ministere_id.not_in" => "Le ministere est obliatoire."
        ];
        $input = $request->all();

        $validator = Validator::make($input,[
            'immatriculation_id' => ['required',new CheckImmatriculationExist()],
            'ministere_id' => ['not_in:0',new CheckMinistereDiff($input['ministereName'],$input['chosenMinistere'])],
            'direction_id' => ['nullable']
        ],$message);
        if ($validator->fails())
            return response()->json(['success' => false, 'messages' => $validator->messages()]);
        else{
            try{
                $immatriculation = Immatriculation::where('immatriculation_id',$input['immatriculation_id'])->get()->first();
                $immatriculation->minister_id = $input['ministere_id'];
                $immatriculation->direction_id = $input['direction_id'] == null ? 0:$input['direction_id'];
                $immatriculation->status = 1;
                $immatriculation->autreministere = "";
                $immatriculation->save();
               return response()->json(['success' => true,]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false, 'messages' => ['messages' => $ex->getMessage()]]);
            }
        }
    }

    /**
     * Historique d'utilisation d'un véhicule : périodes d'affectation (immatriculation, mutations validées,
     * réforme) et demandes de mutation / réforme en attente ou rejetées.
     */
    public function historique($immatriculation_id){
        try {
            $periodes = DB::select("select h.*, concat(u.prenom, ' ', u.nom) valide_par_nom
                                    from historique_affectations h left join users u on u.id = h.valide_par
                                    where h.immatriculation_id = ? order by h.debut desc, h.id desc", [$immatriculation_id]);
            // Demandes non validées : elles n'ont pas changé l'utilisateur du véhicule
            $demandes = array_merge(
                DB::select("select 'mutation' type, m.mutation_id id, m.status, m.created_at, m.valided_at decision_le, m.motif, m.fonction, m.paiementReference reference,
                                   a.nom ancien, mi.nom nouveau, d.nom direction, concat(u.prenom, ' ', u.nom) demandeur, null detenteur,
                                   (select concat_ws(' — ', nullif(r.raison,''), nullif(r.autreraison,'')) from rejets r
                                     where r.immatriculation_id = m.immatriculation_id and r.typeRejet = 'mutation' order by r.rejet_id desc limit 1) motif_rejet
                            from mutations m
                            left join ministeres a on a.ministere_id = m.ancienMinistere_id
                            left join ministeres mi on mi.ministere_id = m.ministere
                            left join directions d on d.direction_id = m.direction
                            left join users u on u.id = m.user_id
                            where m.immatriculation_id = ? and m.status in (0, 2)", [$immatriculation_id]),
                DB::select("select 'reforme' type, r.reforme_id id, r.status, r.created_at, null decision_le, null motif, r.fonction, r.paiementReference reference,
                                   null ancien, mi.nom nouveau, d.nom direction, concat(u.prenom, ' ', u.nom) demandeur,
                                   trim(concat(coalesce(r.prenom,''), ' ', coalesce(r.nom,''))) detenteur, r.telephone, r.adresse,
                                   (select concat_ws(' — ', nullif(rj.raison,''), nullif(rj.autreraison,'')) from rejets rj
                                     where rj.immatriculation_id = r.immatriculation_id and rj.typeRejet = 'reforme' order by rj.rejet_id desc limit 1) motif_rejet
                            from reformes r
                            left join ministeres mi on mi.ministere_id = r.ministere_id
                            left join directions d on d.direction_id = r.direction_id
                            left join users u on u.id = r.user_id
                            where r.immatriculation_id = ? and r.status in (0, 2)", [$immatriculation_id])
            );
            usort($demandes, fn ($x, $y) => strcmp((string) $y->created_at, (string) $x->created_at));
            return response()->json(['success' => true, 'periodes' => $periodes, 'demandes' => $demandes]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'messages' => ['erreur' => [$ex->getMessage()]]]);
        }
    }

    public function getrejetbyimmatriculation($immatriculation_id){
        $rejet = Rejet::where('immatriculation_id',$immatriculation_id)->orderByDesc('rejet_id')->first();
        if($rejet)
            return response()->json(['success' => true,'rejet' => $rejet]);
        else  return response()->json(['success' => false,]);
    }

    public function globalstatistique(){
        try{
        $statistique = ['valide' => 0,'rejete'=> 0,'reforme' => 0,'mutation'=> 0,'VA'=>0,'EP'=>0,'IT' => 0];
        $data1 = DB::select('SELECT status,count(*) nbre FROM immatriculations group by status order by status');
        //return $data1;

        if(count($data1) > 0) {
            foreach ($data1 as $imm){
                if($imm->status == '1'){
                    $statistique['valide'] = $imm->nbre;
                }
                else if($imm->status == '2'){
                    $statistique['rejete'] = $imm->nbre;
                }
                else if($imm->status == '3'){
                    $statistique['reforme'] = $imm->nbre;
                }
                else if($imm->status == '4'){
                    $statistique['mutation'] = $imm->nbre;
                }
            }
        }
        $data2 = DB::select('SELECT modeImmatriculation,count(*) nbre FROM immatriculations group by modeImmatriculation');
        if(count($data2) > 0) {
            foreach ($data2 as $imm){
                if($imm->modeImmatriculation == 'VA'){
                    $statistique['VA'] = $imm->nbre;
                }
                else if($imm->modeImmatriculation == 'EP'){
                    $statistique['EP'] = $imm->nbre;
                }
                else if($imm->modeImmatriculation == 'IT'){
                    $statistique['IT'] = $imm->nbre;
                }
            }

        }
      return  response()->json(['success' => true,'statistiques' => $statistique]);
    }catch (QueryException $ex){
            return response()->json(['success' => false, 'messages' => ['erreur' => $ex->getMessage()]]);
        }
    }


}
