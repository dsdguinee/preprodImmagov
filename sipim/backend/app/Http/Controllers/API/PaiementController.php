<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\Autorisation;
use App\Models\Categorie;
use App\Models\Paiement;
use App\Models\PaiementAutorisation;
use App\Models\PaiementCarteGrise;
use App\Models\PaiementRejete;
use App\Models\PaiementVignette;
use App\Models\Role;
use App\Models\TypeCg;
use App\Models\TypeVg;
use App\Models\VignetteReference;
use App\Rules\Paiement\News\CheckChassis;
use App\Rules\Paiement\News\CheckNif;
use App\Rules\Paiement\News\TypeCartegrise;
use App\Rules\Paiement\News\TypeClient;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Symfony\Component\HttpFoundation\Response;

class PaiementController extends BaseController
{
   public function generateVignetteNumber($vignette_id,$paiement_id){
       $vignette = TypeVg::find($vignette_id);
       $vignetteCode = '';
       if($vignette){
           $rand = rand(1,9999);
           if(intval($rand) >= 0 && intval($rand) <= 9)
               $rand = "000".$rand;
           else if(intval($rand) > 9 && intval($rand) <= 99)
               $rand = "00".$rand;
           else if(intval($rand) > 99 && intval($rand) <= 999)
               $rand = "0".$rand;

           $vignetteCode = Carbon::parse(Carbon::now())->format('Ymd').'-'.$vignette->code."-".$paiement_id.$rand;

       }
       return $vignetteCode;
   }
    public function newPaiement(Request $request){
       if($request->isMethod('post')){
           $input = $request->all();
           $messages = [
               "autorisation_id.required" => "Veuillez selectionner l'autorisation du Transport.",
               "typeClient.required" => "Veuillez selectionner le type de Client.",
               "typeClient.not_in" => "Veuillez selectionner le type de Client.",
               "categorieCg.required" => "Veuillez selectionner la categorie du vehicule.",
               "modeExp.required" => "Le mode d'usage est obligatoire(Personnel ou Transport).",
               "modeExp.not_in" => "Le mode d'usage est obligatoire(Personnel ou Transport).",
               "modeImma.required" => "Veuillez selectionner le mode d'immatriculation.",
               "modeImma.not_in" => "Veuillez selectionner le mode d'immatriculation.",
//               "typeCg.required" => "Veuillez selectionner le type de Carte Grise.",
//               "typeCg.not_in" => "Veuillez selectionner le type de Carte Grise.",
               "typeVignette.required" => "Veuillez selectionner le type de Vignette.",
               "typeVignette.not_in" => "Veuillez selectionner le type de Vignette.",
               "cu.min" => "Veuillez Saisir la charge utile.",
               "pv.min" => "Veuillez Saisir le poids à vide.",
               "categorie_id.exists" => "Cette Categorie n'exists pas",
               "chassis.required" => "Le Numéro de Chassis est Obligatoire.",
               "chassis.string" => "Le Numéro de Chassi doit être une chaine caractère.",
               "chassis.max" => "La taille maximale pour le numéro de Chassis est vingt cinq (25).",
               "chassis.max" => "La taille minimale pour le numéro de Chassis est dix (10).",
               "chassis.unique" => "ce  numéro de Chassis  existe déjà.",
               "dateExpCg.date_format" => "Mauvais format de la date.example:jj/mm/année",
               "dateExpCg.after" => "La date d'expiration ne peut pas être inférieur à celle d'aujourd'hui.",

           ];

           // Immatriculation / reimmatriculation : carte grise ou plaque. Sinon vignette / autorisation seules
           $estImmatriculation = !empty($input['typeCg']) || in_array($input['document'] ?? '', ['EP', 'VA']);
           $paiementResoumis = $input['paiement_id'] ?? null;
           $reglesChassis = ["bail","required","string","min:10","max:25",
               // Vehicule reforme : seul ce message est affiche (bail)
               function ($attribute, $value, $fail) {
                   if ($reforme = $this->reformeDuChassis($value)) $fail($this->messageReforme($reforme));
               }];
           if ($estImmatriculation) {
               $reglesChassis[] = function ($attribute, $value, $fail) use ($paiementResoumis) {
                   if ($operation = $this->operationEnCours($value, $paiementResoumis)) $fail($this->messageOperationEnCours($operation));
                   // Vehicule deja immatricule : plus d'immatriculation / reimmatriculation
                   else if ($vehicule = $this->paiementImmatriculationUtilise($value))
                       $fail("Ce châssis est déjà immatriculé (réf. ".$vehicule->reference.") : choisissez Mutation, Réforme ou Autres (vignette, autorisation de transport).");
               };
               $reglesChassis[] = new CheckChassis("new");
           }
           // Vignette / autorisation d'un vehicule deja enregistre : categorie et capacite stockees,
           // la vignette doit correspondre a sa puissance fiscale
           $reglesVignette = ["nullable"];
           if (!$estImmatriculation && ($vehicule = $this->vehiculeDeReference($input['chassis'] ?? ''))) {
               $input['categorieCg'] = $vehicule->categorie_id;
               foreach (['pv', 'cu', 'pf', 'nbrePlace', 'ptra'] as $champ) $input[$champ] = $vehicule->$champ;
               $reglesVignette[] = function ($attribute, $value, $fail) use ($vehicule) {
                   if (empty($value)) return;
                   $vignette = TypeVg::find($value);
                   $puissance = $this->puissanceVehicule($vehicule);
                   if (!$vignette || (int) $vignette->typecg_id !== (int) $vehicule->categorie_id)
                       $fail("Cette vignette ne correspond pas à la catégorie du véhicule (réf. ".$vehicule->reference.").");
                   else if ($puissance !== null && $vignette->unite === 'CV' && !$this->trancheCorrespond($vignette->signe, $vignette->capacite, $puissance))
                       $fail("Cette vignette ne correspond pas à la puissance fiscale enregistrée du véhicule (".$puissance." CV, réf. ".$vehicule->reference.").");
               };
           }

           $validator = Validator::make($input,[
             "autorisation_id" => ['nullable',"not_in:''",],
             "categorieCg" => "required|not_in:0|exists:categories,categorie_id",
             "cu" => ["nullable","min:1"],
             "typeClient" => ["required","not_in:''"],
             "fullName" => [new TypeClient($input['typeClient'])],
             "chassis" => $reglesChassis,
             "modeExp" => ["required","not_in:''"],
             "modeImma" => ["required","not_in:0"],
             "nif" => [new CheckNif($input['typeClient'])],
             "pv" => ["nullable","min:1"],
             "tel" => ["required","min:1"],
             "typeCg" => ["required",new TypeCartegrise($input['expressionCg'],$input['categorieCg'],$input['typeCg'],$input['pv'],$input['cu'],$input['pf'] ?? 0,$input['nbrePlace'] ?? 0)],
             "dateExpCg" => "nullable|date_format:Y-m-d|after:today",
             "typeVignette" => $reglesVignette,
           ],$messages);
           if ($validator->fails()) {
               return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,'messages' => $validator->messages()]);
           }else{

               $paiement = new Paiement();
               $type_document = '';
               $paiement->typeClient = $input['typeClient'];
               $paiement->modeExp = $input['modeExp'];
               $paiement->fullName = $input['fullName'];
               $paiement->tel = $input['tel'];
               $paiement->nif = $input['nif'];
               $paiement->chassis = $input['chassis'];
               $paiement->modeImma = $input['modeImma'];
               $paiement->categorie_id = $input['categorieCg'];
               $paiement->typeCg = $input['typeCg'];
               $paiement->typeVignette = $input['typeVignette'];
               $paiement->autorisation_id = $input['autorisation_id'];
               $paiement->pv = $input['pv'];
               $paiement->cu = $input['cu'];
               // Capacite stockee : puissance / cylindree, places, PTRA (controle des vignettes, pre-remplissage immagov)
               $paiement->pf = (int) ($input['pf'] ?? 0);
               $paiement->nbrePlace = (int) ($input['nbrePlace'] ?? 0);
               $paiement->ptra = (int) ($input['ptra'] ?? 0);
               $paiement->status = 1;
               if($input['typeCg'] != 0 && $input['typeVignette'] == 0 && $input['autorisation_id'] == 0){
                   $type_document = 'cartegrise';
               }else if($input['typeCg'] == 0 && $input['typeVignette'] != 0 && $input['autorisation_id'] == 0){
                   $type_document = 'vignette';

               }else if($input['typeCg'] == 0 && $input['typeVignette'] == 0 && $input['autorisation_id'] != 0){
                   $type_document = 'autorisation';
               }else if($input['typeCg'] !== 0 && $input['typeVignette'] !== 0 && $input['autorisation_id'] !== 0){
                   $type_document = 'ordinaire';
               }
               if($input['isIT'] === "true"){
                   $type_document = "IT";

               }
               if(isset($input['document']) && in_array($input['document'],['EP','VA','IT']))
                   $paiement->type_plaque = $input['document'];
               $paiement->user_id = Auth::user()->id;
               $dayNow = Carbon::now()->format('sd');
               $reference = strtoupper(Str::random(11)).rand(1,10).$dayNow.Auth::user()->id;
               $paiement->reference = $reference;
               $qrcodpath = self::genererQrCode($reference);
               $paiement->qrcode = $qrcodpath;

               $paiement->agence_id = $input['agence_id'];
               $paiement->commune_id = !empty($input['commune_id']) ? $input['commune_id'] : Auth::user()->commune_id;
               $paiement->type_document = $type_document;
               if(isset($input['paiement_id'])){
                   if(is_numeric($input['paiement_id'])){
                      $paie = Paiement::find($input['paiement_id']);
                      if($paie){
                          $paiement->oldereference = $paie->reference;
                          $paie->isautoriser = 1;$paie->status = 4;
                          $paie->save();
                      }

                   }
               }
               $paiement->save();
               if($input['typeVignette'] != 0 && $input['typeVignette'] != ''){
                   $vignetteNumber = $this->generateVignetteNumber($input['typeVignette'],$paiement->paiement_id);
                   $vignette_reference = new VignetteReference();
                   $vignette_reference->paiement_id = $paiement->paiement_id;
                   $vignette_reference->vignette_code = $vignetteNumber;
                   $vignette_reference->save();
               }
               $paiementVignette = new PaiementVignette();
               $paiementVignette->paiement_id = $paiement->paiement_id;
               $Actualyear = Carbon::now()->year;
               $paiementVignette->dateExp = Carbon::parse($Actualyear.'/01/01')->format('Y-m-d');
               $paiementVignette->save();

               $carteGrise = new PaiementCarteGrise();
               $carteGrise->paiement_id = $paiement->paiement_id;
               if(!$input['isIT']){
                 $fiveyear = Carbon::now()->addYears(5);
                 $carteGrise->dateExp = $fiveyear;
               }
               else $carteGrise->dateExp = $input['dateExpCg'];
               $carteGrise->save();

               $autorisation = new PaiementAutorisation();
               $autorisation->paiement_id = $paiement->paiement_id;
               $autorisation->dateExp = Carbon::parse($Actualyear.'/01/01')->format('Y-m-d');
               $autorisation->save();
               return response()->json(['success' => true, 'status' => Response::HTTP_OK,
                    'data' => ['qrpath' => $qrcodpath,'reference' => $reference,'paiement_id' => $paiement->paiement_id]]);
           }
       }
   }
    public function printed(Request  $request){
       if($request->isMethod('post')){
           try{
               $paiement = Paiement::find($request->input('paiement_id'));
               if($paiement) {
                   $paiement->printed = 1;
                   $paiement->save();
                   return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
               }else{
                   return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND,'messages'=>['erreur' => 'Identifiant Non Retrouvé.']]);
               }

           }catch (QueryException $ex){
               return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
           }
       }
   }

    public function getPaiementByDateDay(Request $request,$paiement_id = 0){

        try
        {
            if(!$this->fullAccess(Auth::user()->role_id)){
                if($paiement_id === 0){
                    $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,p.type_document document,p.autorisation_id,p.status,p.created_at
                                                FROM paiements p,categories c
                                                where p.categorie_id = c.categorie_id and p.status = 1
                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id where user_id =:user_id and DATE_FORMAT(a.created_at, '%m-%d-%Y')=:created_at order by created_at desc",
                        ["user_id" => Auth::user()->id,"created_at" => Carbon::now()->isoFormat('MM-DD-YYYY')]);
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiements' => $paiements]);
                }
                else{
                    $paiement = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,p.type_document,reference,p.autorisation_id,p.status,p.created_at
                                                FROM paiements p,categories c
                                                where p.categorie_id = c.categorie_id and p.status = 1
                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id where user_id =:user_id
                                               and DATE_FORMAT(a.created_at, '%m-%d-%Y')=:created_at and a.paiement_id=:paiement_id  order by created_at desc",
                        ["user_id" => Auth::user()->id,"created_at" => Carbon::now()->isoFormat('MM-DD-YYYY'),'paiement_id' => $paiement_id]);

                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiement' => $paiement]);
                }
            }else{
                if($paiement_id === 0){
                    $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,p.type_document document,p.autorisation_id,p.status,p.created_at
                                                FROM paiements p,categories c
                                                where p.categorie_id = c.categorie_id and p.status = 1
                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id where  DATE_FORMAT(a.created_at, '%m-%d-%Y')=:created_at order by created_at desc",
                        ["created_at" => Carbon::now()->isoFormat('MM-DD-YYYY')]);
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiements' => $paiements]);
                }
                else{
                    $paiement = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,p.type_document,reference,p.autorisation_id,p.status,p.created_at
                                                FROM paiements p,categories c
                                                where p.categorie_id = c.categorie_id and p.status = 1
                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id where  DATE_FORMAT(a.created_at, '%m-%d-%Y')=:created_at and a.paiement_id=:paiement_id  order by created_at desc",
                        ["created_at" => Carbon::now()->isoFormat('MM-DD-YYYY'),'paiement_id' => $paiement_id]);

                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiement' => $paiement]);
                }
            }
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }

    public function getpaiementByID(Request $request,$paiement_id){
        try {
            $paiement = [];
            if(!$this->fullAccess(Auth::user()->role_id)){
                $paiement = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                            typeVignette,pv,cu,montant_operation,user_id,status,typeCg,reference,p.qrcode,p.type_document,u.agence_id,p.commune_id,p.autorisation_id,p.created_at,
                                            p.type_paiement,p.type_plaque
                                            FROM paiements p,categories c,users u,agences a
                                            where p.categorie_id = c.categorie_id
                                            and u.id = p.user_id and a.agence_id = u.agence_id

                                            ) a
                                            left join
                                            (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                            on a.typeVignette = b.typevg_id
                                            left join
                                            (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                            on a.typeCg = c.typecg_id
                                            left join
                                            (select autorisation_id ,montant montantautorisation
                                            from autorisations) d
                                            on a.autorisation_id = d.autorisation_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpVg from paiement_vignettes group by paiement_id) ev
                                            on a.paiement_id = ev.paiement_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpCg from paiement_carte_grises group by paiement_id) ec
                                            on a.paiement_id = ec.paiement_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpAu from paiement_autorisations group by paiement_id) ea
                                            on a.paiement_id = ea.paiement_id
                                            where user_id=:user_id and a.paiement_id=:paiement_id
                                            order by a.created_at desc",
                    ["user_id" => Auth::user()->id, 'paiement_id' => $paiement_id]);
            }else{
                $paiement = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                            typeVignette,pv,cu,montant_operation,status,user_id,typeCg,reference,p.qrcode,p.type_document,u.agence_id,u.commune_id,p.autorisation_id,p.created_at,
                                            p.type_paiement,p.type_plaque
                                            FROM paiements p,categories c,users u,agences a
                                            where p.categorie_id = c.categorie_id
                                            and u.id = p.user_id and a.agence_id = u.agence_id

                                            ) a
                                            left join
                                            (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                            on a.typeVignette = b.typevg_id
                                            left join
                                            (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                            on a.typeCg = c.typecg_id
                                            left join
                                            (select autorisation_id ,montant montantautorisation
                                            from autorisations) d
                                            on a.autorisation_id = d.autorisation_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpVg from paiement_vignettes group by paiement_id) ev
                                            on a.paiement_id = ev.paiement_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpCg from paiement_carte_grises group by paiement_id) ec
                                            on a.paiement_id = ec.paiement_id
                                            left join
                                            (select paiement_id,max(dateExp) dateExpAu from paiement_autorisations group by paiement_id) ea
                                            on a.paiement_id = ea.paiement_id
                                            where  a.paiement_id=:paiement_id
                                            order by a.created_at desc",
                    ['paiement_id' => $paiement_id]);
            }

            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiement' => $paiement]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }

    public function getElements(){

           try{
               $categories = Categorie::all();
               $typeCarteGrises = TypeCg::all();
               $typeVignettes = TypeVg::all();
               $autorisations = Autorisation::all();
               $roles = Role::all();
               $agences = DB::select('select * from agences a,agence_communes ac where a.agence_id = ac.agence_id');
               return response()->json(['success' => true,'status' => Response::HTTP_OK,'Elements' => [
                   'categories' => $categories,
                   'typeCarteGrise' => $typeCarteGrises,
                   'typeVignette' => $typeVignettes,
                   'autorisations' => $autorisations,
                   'agences' => $agences,
                   'roles' => $roles,
               ]
               ]);
           }
           catch (QueryException $ex){
               return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                   'messages' => ['errors' => $ex->getMessage()]]);
           }
    }
    public function getPaiements(){
       try {

           $paiements = [];
           if(!$this->fullAccess(Auth::user()->role_id)) {
               $paiements = DB::select("select a.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,status,reference,type_document,a.type_plaque,a.utilise,a.date_utilisation,a.created_at, region_id,regionName,agence,
                                                typevg_id,montantvignette,typecg_id,montantcartegrise ,a.autorisation_id ,montantautorisation,vignette_code
                                                from(SELECT distinct p.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,p.user_id,typeCg,status,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.created_at,p.commune_id,
                                                r.region_id,r.nom regionName,a.nom_agence agence
                                                FROM paiements p,categories c,communes co,prefectures pr,regions r,
                                                     agence_communes ag,agences a
                                                where p.categorie_id = c.categorie_id
                                                and co.commune_id = p.commune_id
                                                and co.prefecture_id = pr.prefecture_id
                                                and r.region_id = pr.region_id
                                                and ag.commune_id = co.commune_id
                                                and a.agence_id = ag.agence_id
                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id
                                                left join
                                                (select paiement_id,vignette_code  from vignette_references) e
                                                on e.paiement_id = a.paiement_id where user_id =:user_id order by created_at desc",
                                                ["user_id" => Auth::user()->id]);
           }else{
               $paiements = DB::select("select a.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,user_id,typeCg,status,reference,type_document,a.type_plaque,a.utilise,a.date_utilisation,a.created_at, region_id,regionName,agence,
                                                typevg_id,montantvignette,typecg_id,montantcartegrise ,a.autorisation_id ,montantautorisation,vignette_code
                                                from(SELECT distinct p.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,montant_operation,p.user_id,typeCg,status,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.created_at,p.commune_id,
                                                r.region_id,r.nom regionName,a.nom_agence agence
                                                FROM paiements p,categories c,communes co,prefectures pr,regions r,
                                                     agence_communes ag,agences a
                                                where p.categorie_id = c.categorie_id
                                                and co.commune_id = p.commune_id
                                                and co.prefecture_id = pr.prefecture_id
                                                and r.region_id = pr.region_id
                                                and ag.commune_id = co.commune_id
                                                and a.agence_id = ag.agence_id

                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id
                                                left join
                                                (select paiement_id,vignette_code from vignette_references) e
                                                on e.paiement_id = a.paiement_id  order by created_at desc");
           }

           return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiements' => $paiements]);
       }
       catch (QueryException $ex){
           return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
               'messages' => ['errors' => $ex->getMessage()]]);
       }
    }

    public function getPaiementsforvalidation(){
        try {
            $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,status,reference,type_document,p.autorisation_id,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id and ((status = 2 or status=4) and isautoriser = 0)
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id order by created_at desc",
                );
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'paiements' => $paiements]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function raisonRejet($paiement_id){
        try{
            $raisons = PaiementRejete::where('paiement_id','=',$paiement_id)->get()->first();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'raisons' => $raisons]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function autoriser(Request $request,$paiement_id){
        try{
           if($request->isMethod('get')){
               $raison = Paiement::find($paiement_id);
               if($raison){
                   $raison->status = 3;
                   $raison->isautoriser = 1;
                   $raison->validedBy = Auth::user()->id;
                   $raison->save();
               }
               return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
           }
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function searchpaiement(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            try {
                $paiements = [];
             if(!$this->fullAccess(Auth::user()->role_id)) {
                 if (!empty($input['startDate']) && !empty($input['endDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where user_id =:user_id and reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') >=:datedebut and  DATE_FORMAT(created_at, '%Y-%m-%d') <=:datefin
                                        order by created_at desc",
                         ["user_id" => Auth::user()->id, 'reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datedebut" => $input['startDate'], "datefin" => $input['endDate']
                         ],
                     );
                 } else if (!empty($input['startDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where user_id =:user_id and reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') >=:datedebut
                                        order by created_at desc",
                         ["user_id" => Auth::user()->id, 'reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datedebut" => $input['startDate']
                         ],
                     );
                 } else if (!empty($input['endDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where user_id =:user_id and reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') <=:datefin
                                        order by created_at desc",
                         ["user_id" => Auth::user()->id, 'reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datefin" => $input['endDate']
                         ],
                     );
                 } else {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where user_id =:user_id and reference like :reference and chassis like :chassis
                                        order by created_at desc",
                         ["user_id" => Auth::user()->id, 'reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",],
                     );
                 }
             }else{
                 if (!empty($input['startDate']) && !empty($input['endDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') >=:datedebut and  DATE_FORMAT(created_at, '%Y-%m-%d') <=:datefin
                                        order by created_at desc",
                         ['reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datedebut" => $input['startDate'], "datefin" => $input['endDate']
                         ],
                     );
                 } else if (!empty($input['startDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where user_id =:user_id and reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') >=:datedebut
                                        order by created_at desc",
                         ["user_id" => Auth::user()->id, 'reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datedebut" => $input['startDate']
                         ],
                     );
                 } else if (!empty($input['endDate'])) {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where reference like :reference and chassis like :chassis
                                        and DATE_FORMAT(created_at, '%Y-%m-%d') <=:datefin
                                        order by created_at desc",
                         ['reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",
                             "datefin" => $input['endDate']
                         ],
                     );
                 } else {
                     $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,reference,type_document,p.type_plaque,p.utilise,p.date_utilisation,p.autorisation_id,p.status,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id
                                        where  reference like :reference and chassis like :chassis
                                        order by created_at desc",
                         ['reference' => "%{$input['numRef']}%", 'chassis' => "%{$input['numChassis']}%",],
                     );
                 }
             }
                return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiements' => $paiements]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                    'messages' => ['errors' => $ex->getMessage()]]);
            }
        }
    }

    public function paiementautorise(Request $request){
        try {
            $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                        typeVignette,pv,cu,montant_operation,user_id,typeCg,status,reference,type_document,p.autorisation_id,p.created_at
                                        FROM paiements p,categories c
                                        where p.categorie_id = c.categorie_id and ((status = 3) and isautoriser = 1)
                                        ) a
                                        left join
                                        (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                        on a.typeVignette = b.typevg_id
                                        left join
                                        (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                        on a.typeCg = c.typecg_id
                                        left join
                                        (select autorisation_id ,montant montantautorisation
                                        from autorisations) d
                                        on a.autorisation_id = d.autorisation_id  order by created_at desc");
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'paiements' => $paiements]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

    public function getResoumissionPaiement(Request $request,$paiement_id){
        try {

            $paiement = DB::select("select * from(SELECT pr.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                            typeVignette,pv,cu,montant_operation,user_id,status,typeCg,reference,p.qrcode,p.type_document,u.agence_id,p.commune_id,p.autorisation_id,motif,p.created_at
                                            FROM paiements p,categories c,users u,agences a,paiement_rejetes pr
                                            where p.categorie_id = c.categorie_id
                                            and u.id = p.user_id and a.agence_id = u.agence_id
                                            and pr.paiement_id = p.paiement_id
                                            ) a
                                            left join
                                            (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                            on a.typeVignette = b.typevg_id
                                            left join
                                            (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                            on a.typeCg = c.typecg_id
                                            left join
                                            (select autorisation_id ,montant montantautorisation
                                            from autorisations) d
                                            on a.autorisation_id = d.autorisation_id where  a.paiement_id=:paiement_id
                                            order by a.created_at desc",
                ['paiement_id' => $paiement_id]);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'paiement1' => $paiement]);
        }
     catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function dashboardStat(){
       try {
           $year = Carbon::now()->format('Y');
           $grap1 =[];
           $stat = ['totalpaiement' => 0, 'clientByType' => ""];
           if (!$this->fullAccess(Auth::user()->role_id)){
               $totalPaiement = DB::select("SELECT count(*) totalpayement FROM paiements where user_id=?  and status = 1", [Auth::user()->id]);
               $nbreByTypeClient = DB::select("SELECT typeClient,count(*) NbretypeClient
                 FROM paiements  where user_id=?  and status = 1 group by typeClient", [Auth::user()->id]);

           $grap1 = DB::select('select * from(SELECT month(created_at) mois,count(*) Particulier FROM paiements
                                        where typeClient="Particulier" and year(created_at) =:year1 and user_id=:user_id1
                                        group by month(created_at),typeClient) a
                                        right outer join
                                        (SELECT month(created_at) mois1,count(*) Société FROM paiements
                                        where typeClient="Société" and year(created_at) =:year2 and user_id=:user_id2
                                         and status = 1
                                        group by month(created_at),typeClient) b
                                        on a.mois = b.mois1', ['user_id1' => Auth::user()->id,
               'user_id2' => Auth::user()->id, "year2" => $year, "year1" => $year]);
       }else{
               $totalPaiement = DB::select("SELECT count(*) totalpayement FROM paiements where status = 1");
               $nbreByTypeClient = DB::select("SELECT typeClient,count(*) NbretypeClient
                 FROM paiements where status = 1 group by typeClient");

               $grap1 = DB::select('select * from(SELECT month(created_at) mois,count(*) Particulier FROM paiements
                                        where typeClient="Particulier" and year(created_at) =:year1
                                        group by month(created_at),typeClient) a
                                        left join
                                        (SELECT month(created_at) mois1,count(*) Société FROM paiements
                                        where typeClient="Société" and year(created_at) =:year2
                                        and status = 1
                                        group by month(created_at),typeClient) b
                                        on a.mois = b.mois1', [
                   "year2" => $year, "year1" => $year]);
           }

           if(count($totalPaiement) > 0)
               $stat["totalpaiement"] = $totalPaiement[0]->totalpayement;

           if(count($nbreByTypeClient) > 0)
               $stat['clientByType'] = $nbreByTypeClient;

           return response()->json(['success' => true, 'status' => Response::HTTP_OK,'stats' => $stat,'grap1' => $grap1 ]);

       }
       catch (QueryException $ex){
           return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
               'messages' => ['errors' => $ex->getMessage()]]);
       }
    }
    public function getpaiementByNumChassis($NumChassis){
       try{

           $paiement = DB::select("select a.paiement_id,a.agence_id,a.autorisation_id,a.categorie_id,a.chassis,dateExpAu,dateExpCg,dateExpVg,date_exp,
                        fullName,isautoriser,modeExp,modeImma,nif,nomCategorie,oldereference,a.paiement_id,pv,cu,pf,nbrePlace,ptra,qrcode,commune_id,
                        reference,status,tel,a.typeCg,typeClient,a.typeVignette,a.autorisation_id,type_document,type_paiement,user_id,validedBy,type_plaque,utilise,montant_operation,
                        a.updated_at
                        from (select p.*,c.nomCategorie from paiements p,categories c
                        where p.categorie_id = c.categorie_id) a
                        left join
                        (select paiement_id,dateExp dateExpAu from paiement_autorisations) b
                        on a.paiement_id = b.paiement_id
                        left join
                        (select paiement_id,dateExp dateExpCg from paiement_carte_grises) c
                        on a.paiement_id = c.paiement_id
                        left join
                        (select paiement_id,dateExp dateExpVg from paiement_vignettes) d
                        on a.paiement_id = d.paiement_id where trim(chassis)=? order by a.updated_at asc",[trim($NumChassis)]);


           return response()->json(['success' => true, 'status' => Response::HTTP_OK,'payment' => $paiement]);
       }
       catch (QueryException $ex){
           return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
               'messages' => ['errors' => $ex->getMessage()]]);
       }
    }

    // QR code du recu : la reference du paiement en clair, un fichier par paiement
    public static function genererQrCode($reference){
        $chemin = 'images/paiements/qrcodes/'.$reference.'.svg';
        Storage::disk('local')->put('public/'.$chemin, QrCode::size(300)->generate($reference), 'public');
        return $chemin;
    }

    // Operations sur un vehicule deja immatricule
    const OPERATIONS_VEHICULE = ['mutation', 'reforme'];
    const MONTANT_MIN_REFORME = 500000;

    /**
     * Dernier paiement d'immatriculation / reimmatriculation de ce chassis
     * deja utilise par immagov. Sans lui, mutation et reforme sont impossibles.
     */
    private function paiementImmatriculationUtilise($chassis){
        return DB::table('paiements as p')
            ->join('categories as c', 'c.categorie_id', '=', 'p.categorie_id')
            ->leftJoin('type_cgs as cg', 'cg.typecg_id', '=', 'p.typeCg')
            ->whereRaw('trim(p.chassis) = ?', [trim($chassis)])
            ->where('p.utilise', true)
            ->whereIn('p.modeImma', [1, 2])
            ->where('p.status', 1)
            ->whereNotIn('p.type_document', self::OPERATIONS_VEHICULE)
            ->orderByDesc('p.date_utilisation')->orderByDesc('p.paiement_id')
            ->select('p.paiement_id', 'p.reference', 'p.chassis', 'p.fullName', 'p.tel', 'p.nif', 'p.typeClient',
                'p.modeExp', 'p.modeImma', 'p.categorie_id', 'c.nomCategorie', 'p.type_plaque', 'p.typeCg',
                DB::raw('COALESCE(cg.montant,0) montantcartegrise'), 'p.numero_immatriculation', 'p.date_utilisation')
            ->first();
    }

    /**
     * Reforme (validee ou en attente de validation) de ce chassis : le vehicule est retire
     * de la circulation, plus aucun paiement n'est possible pour lui.
     */
    private function reformeDuChassis($chassis){
        return DB::table('paiements')
            ->whereRaw('trim(chassis) = ?', [trim($chassis)])
            ->where('type_document', 'reforme')
            ->whereIn('status', [0, 1])
            ->orderBy('paiement_id')
            ->first(['paiement_id', 'reference', 'created_at']);
    }

    private function messageReforme($reforme){
        return "Ce véhicule a été réformé le ".Carbon::parse($reforme->created_at)->format('d/m/Y')
            ." (réf. ".$reforme->reference.") : aucun paiement n'est plus possible pour ce châssis.";
    }

    /**
     * Operation en cours sur ce chassis : immatriculation / reimmatriculation (carte grise ou plaque),
     * mutation ou reforme payee (non rejetee) mais pas encore utilisee par immagov.
     * Tant qu'elle existe, seuls la vignette et l'autorisation de transport peuvent etre payees.
     */
    // Paiement d'immatriculation / reimmatriculation (carte grise ou plaque), de mutation ou de reforme
    private function estOperation($q){
        $q->where('typeCg', '<>', 0)
          ->orWhereIn('type_plaque', ['EP', 'VA'])
          ->orWhereIn('type_document', self::OPERATIONS_VEHICULE);
    }

    /**
     * Vehicule tel qu'enregistre par sa derniere operation non rejetee (la mutation reprend
     * les caracteristiques de l'immatriculation) : categorie et capacite stockees.
     */
    private function vehiculeDeReference($chassis){
        if (trim((string) $chassis) === '') return null;
        return DB::table('paiements')
            ->whereRaw('trim(chassis) = ?', [trim($chassis)])
            ->whereIn('status', [0, 1])
            ->where(function ($q) { $this->estOperation($q); })
            ->orderByDesc('paiement_id')
            ->first(['paiement_id', 'reference', 'categorie_id', 'pf', 'nbrePlace', 'pv', 'cu', 'ptra']);
    }

    // Puissance fiscale enregistree (CV) ; null si inconnue
    private function puissanceVehicule($vehicule){
        return $vehicule->pf > 0 ? (int) $vehicule->pf : null;
    }

    // Meme regle que trancheCorrespond (frontend) ; sans tranche, la vignette convient a toute capacite
    private function trancheCorrespond($signe, $capacite, $valeur){
        if (!$signe) return true;
        $bornes = array_map('floatval', explode(',', (string) $capacite));
        $a = $bornes[0]; $b = $bornes[1] ?? null;
        switch ($signe) {
            case '<': return $valeur < $a;
            case '<=': return $valeur <= $a;
            case '>': return $valeur > $a;
            case '>=': return $valeur >= $a;
            case '!': return $valeur > $a && $valeur < $b;
            case '>,<=': return $valeur > $a && $valeur <= $b;
            case '>=,<': return $valeur >= $a && $valeur < $b;
            default: return false;
        }
    }

    private function operationEnCours($chassis, $saufPaiementId = null){
        return DB::table('paiements')
            ->whereRaw('trim(chassis) = ?', [trim($chassis)])
            ->whereIn('status', [0, 1])
            ->where('utilise', false)
            ->where(function ($q) { $this->estOperation($q); })
            ->when(is_numeric($saufPaiementId), function ($q) use ($saufPaiementId) {
                $q->where('paiement_id', '<>', $saufPaiementId);
            })
            ->orderByDesc('paiement_id')
            ->first(['paiement_id', 'reference', 'modeImma', 'type_document']);
    }

    private function messageOperationEnCours($operation){
        $libelle = ['mutation' => 'mutation', 'reforme' => 'réforme'][$operation->type_document] ?? null;
        if (!$libelle) $libelle = (int) $operation->modeImma === 2 ? 'réimmatriculation' : 'immatriculation';
        return "Une ".$libelle." est déjà en cours pour ce châssis (réf. ".$operation->reference.")."
            ." Seules la vignette et l'autorisation de transport peuvent être payées.";
    }

    // Montant d'une mutation : carte grise du paiement d'immatriculation, gratuite pour une plaque VA
    private function montantMutation($vehicule){
        return $vehicule->type_plaque === 'VA' ? 0 : (float) $vehicule->montantcartegrise;
    }

    // GET /paiement/vehicule-utilise/{chassis} : verifie qu'une mutation / reforme est possible
    public function vehiculeUtilise($chassis){
        try{
            if($reforme = $this->reformeDuChassis($chassis))
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND,
                    'messages' => ['numChassis' => [$this->messageReforme($reforme)]]]);
            if($operation = $this->operationEnCours($chassis))
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND,
                    'messages' => ['numChassis' => [$this->messageOperationEnCours($operation)]]]);
            $vehicule = $this->paiementImmatriculationUtilise($chassis);
            if(!$vehicule)
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND,
                    'messages' => ['numChassis' => ["Ce châssis n'a pas encore été utilisé pour une immatriculation ou une réimmatriculation."]]]);
            $vehicule->montantMutation = $this->montantMutation($vehicule);
            $vehicule->montantMinReforme = self::MONTANT_MIN_REFORME;
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'vehicule' => $vehicule]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

    /**
     * POST /paiement/operation-vehicule : mutation ou reforme d'un vehicule deja immatricule.
     * Le vehicule (chassis, categorie, plaque, carte grise) est repris du paiement
     * d'immatriculation / reimmatriculation utilise par immagov ; le client est saisi.
     *  - mutation : carte grise de ce paiement (gratuite pour une plaque VA)
     *  - reforme  : montant saisi, 500 000 GNF minimum
     * Ni plaque, ni autre document ; les frais de service s'ajoutent selon la categorie.
     */
    public function operationVehicule(Request $request){
        $input = $request->all();
        $messages = [
            "document.required" => "Veuillez choisir l'opération (mutation ou réforme).",
            "document.in" => "Opération inconnue.",
            "chassis.required" => "Le numéro de châssis est obligatoire.",
            "typeClient.required" => "Veuillez selectionner le type de client.",
            "typeClient.in" => "Type de client inconnu.",
            "tel.required" => "Le numéro de téléphone est obligatoire.",
            "tel.regex" => "Le numéro de téléphone compte 9 chiffres et commence par 6.",
            "montant_operation.required" => "Le montant de la réforme est obligatoire.",
            "montant_operation.integer" => "Le montant de la réforme doit être un nombre entier.",
            "montant_operation.min" => "Le montant minimum de la réforme est de 500 000 GNF.",
        ];
        $validator = Validator::make($input, [
            "document" => ["required", "in:".implode(',', self::OPERATIONS_VEHICULE)],
            "chassis" => ["required", "string", "min:10", "max:25"],
            "typeClient" => ["required", "in:Particulier,Société,Gouvernement"],
            "fullName" => [new TypeClient($input['typeClient'] ?? '')],
            "tel" => ["required", "regex:/^6\\d{8}$/"],
            "nif" => [new CheckNif($input['typeClient'] ?? '')],
            "montant_operation" => ($input['document'] ?? '') === 'reforme'
                ? ["required", "integer", "min:".self::MONTANT_MIN_REFORME] : ["nullable"],
        ], $messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);

        if ($reforme = $this->reformeDuChassis($input['chassis']))
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,
                'messages' => ['chassis' => [$this->messageReforme($reforme)]]]);
        if ($operation = $this->operationEnCours($input['chassis']))
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,
                'messages' => ['chassis' => [$this->messageOperationEnCours($operation)]]]);
        $vehicule = $this->paiementImmatriculationUtilise($input['chassis']);
        if (!$vehicule)
            return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED,
                'messages' => ['chassis' => ["Ce châssis n'a pas encore été utilisé pour une immatriculation ou une réimmatriculation."]]]);

        try {
            $origine = Paiement::find($vehicule->paiement_id);
            $paiement = new Paiement();
            $paiement->typeClient = $input['typeClient'];
            $paiement->fullName = $input['fullName'];
            $paiement->tel = $input['tel'];
            $paiement->nif = $input['nif'] ?? '';
            // Caracteristiques du vehicule reprises du paiement d'immatriculation
            foreach (['chassis', 'modeExp', 'modeImma', 'categorie_id', 'pv', 'cu', 'pf', 'ptra', 'nbrePlace'] as $champ)
                $paiement->$champ = $origine->$champ;
            $paiement->typeVignette = 0;
            $paiement->autorisation_id = 0;
            if ($input['document'] === 'mutation') {
                $paiement->typeCg = $vehicule->type_plaque === 'VA' ? 0 : $origine->typeCg;
            } else {
                $paiement->typeCg = 0;
                $paiement->montant_operation = (int) $input['montant_operation'];
            }
            $paiement->type_document = $input['document'];
            $paiement->type_paiement = 'Operation';
            $paiement->user_id = Auth::user()->id;
            $paiement->agence_id = Auth::user()->agence_id;
            $paiement->commune_id = Auth::user()->commune_id;
            $paiement->status = 1;
            $paiement->isautoriser = 0;

            $reference = strtoupper(Str::random(11)).rand(1,10).Carbon::now()->format('sd').Auth::user()->id;
            $paiement->reference = $reference;
            $qrcodpath = self::genererQrCode($reference);
            $paiement->qrcode = $qrcodpath;
            $paiement->save();

            // La mutation donne lieu a une nouvelle carte grise
            if ($input['document'] === 'mutation') {
                $carteGrise = new PaiementCarteGrise();
                $carteGrise->paiement_id = $paiement->paiement_id;
                $carteGrise->dateExp = Carbon::now()->addYears(5)->format('Y-m-d');
                $carteGrise->save();
            }
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,
                'data' => ['qrpath' => $qrcodpath, 'reference' => $reference, 'paiement_id' => $paiement->paiement_id]]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

   public function statistiquePaiement(Request  $request){
        if($request->isMethod('get')){
            try {
                $PrefectureAgences = DB::select('select  a.paiement_id,a.prefecture_id,prefecture,a.region_id,a.region,type_document,
                                        a.commune_id,commune,agence_id,a.nom_agence,a.typeVignette,a.typeCg,a.autorisation_id,a.montant_operation,a.updated_at,a.created_at,
                                        b.totalvg,b.NbreTypeVignette,b.vignette,b.typeVignette,totalcg,cartegrise,totalau,nomAutorisation
                                         from (
                                        SELECT distinct pa.paiement_id, p.prefecture_id,p.nom prefecture,r.region_id,r.nom region,type_document,
                                        c.commune_id,c.nom commune,a.agence_id,a.nom_agence,pa.typeVignette,typeCg,autorisation_id,pa.montant_operation,pa.updated_at,pa.created_at
                                        FROM paiements pa,communes c,prefectures p,regions r,agences a
                                        where c.commune_id = pa.commune_id
                                        and p.prefecture_id = c.prefecture_id
                                        and a.agence_id = pa.agence_id
                                        and r.region_id = p.region_id
                                        order by 1,a.agence_id) a
                                        inner join

                                        (select prefecture_id,typeVignette,nomType vignette,NbreTypeVignette,sum(montant) totalvg
                                         from (SELECT p.prefecture_id,typeVignette,count(*) NbreTypeVignette
                                        FROM paiements pa,communes c,prefectures p
                                        where c.commune_id = pa.commune_id
                                        and p.prefecture_id = c.prefecture_id
                                        group by p.prefecture_id,typeVignette) a,
                                        (select typevg_id,nomType,montant from type_vgs) b
                                        where a.typeVignette = b.typevg_id
                                        group by prefecture_id,nomType,typeVignette,NbreTypeVignette) b
                                        on a.prefecture_id = b.prefecture_id
                                        and a.typeVignette = b.typeVignette
                                        left join
                                        (select prefecture_id, typeCg,cartegrise,sum(montant) totalcg
                                        from (SELECT  p.prefecture_id,typeCg
                                            FROM paiements pa,communes c,prefectures p
                                            where c.commune_id = pa.commune_id
                                            and p.prefecture_id = c.prefecture_id
                                            ) a,
                                            (select typecg_id,nomType cartegrise,montant from type_vgs) b
                                            where a.typeCg = b.typecg_id
                                            group by prefecture_id, typeCg,cartegrise
                                            ) c


                                        on  b.prefecture_id = c.prefecture_id
                                        and a.typeCg = c.typeCg
                                        left join
                                        (select prefecture_id,a.autorisation_id,nomAutorisation,sum(montant) totalau from(SELECT p.prefecture_id,autorisation_id
                                            FROM paiements pa,communes c,prefectures p
                                            where c.commune_id = pa.commune_id
                                            and p.prefecture_id = c.prefecture_id
                                            ) a,
                                            (select autorisation_id,nomAutorisation,montant from autorisations) b
                                            where a.autorisation_id = b.autorisation_id
                                        group by prefecture_id,a.autorisation_id,nomAutorisation) d
                                        on c.prefecture_id = d.prefecture_id
                                        and a.autorisation_id = d.autorisation_id
                                        order by a.prefecture_id,agence_id');

                return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'PrefectureAgences' => $PrefectureAgences]);
            }
            catch (QueryException $ex){
                return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                    'messages' => ['errors' => $ex->getMessage()]]);
            }
        }else if($request->isMethod('post')){
              $input = $request->all();
              $PrefectureAgences = DB::select('select  a.paiement_id,a.prefecture_id,prefecture,a.region_id,a.region,type_document,
                                        a.commune_id,commune,agence_id,a.nom_agence,a.typeVignette,a.typeCg,a.autorisation_id,a.montant_operation,a.updated_at,a.created_at,
                                        b.totalvg,b.NbreTypeVignette,b.vignette,b.typeVignette,totalcg,cartegrise,d.totalau,nomAutorisation
                                        from (
                                        SELECT distinct pa.paiement_id, p.prefecture_id,p.nom prefecture,r.region_id,r.nom region,type_document,
                                        c.commune_id,c.nom commune,a.agence_id,a.nom_agence,pa.typeVignette,typeCg,autorisation_id,pa.montant_operation,pa.updated_at,pa.created_at
                                        FROM paiements pa,communes c,prefectures p,regions r,agences a
                                        where c.commune_id = pa.commune_id
                                        and p.prefecture_id = c.prefecture_id
                                        and a.agence_id = pa.agence_id
                                        and r.region_id = p.region_id
                                        order by 1,a.agence_id) a
                                        inner join

                                        (select prefecture_id,typeVignette,nomType vignette,NbreTypeVignette,sum(montant) totalvg
                                         from (SELECT p.prefecture_id,typeVignette,count(*) NbreTypeVignette
                                        FROM paiements pa,communes c,prefectures p
                                        where c.commune_id = pa.commune_id
                                        and p.prefecture_id = c.prefecture_id
                                        group by p.prefecture_id,typeVignette) a,
                                        (select typevg_id,nomType,montant from type_vgs) b
                                        where a.typeVignette = b.typevg_id
                                        group by prefecture_id,nomType,typeVignette,NbreTypeVignette) b
                                        on a.prefecture_id = b.prefecture_id
                                        and a.typeVignette = b.typeVignette
                                        left join
                                        (select prefecture_id, typeCg,cartegrise,sum(montant) totalcg
                                        from (SELECT  p.prefecture_id,typeCg
                                            FROM paiements pa,communes c,prefectures p
                                            where c.commune_id = pa.commune_id
                                            and p.prefecture_id = c.prefecture_id
                                            ) a,
                                            (select typecg_id,nomType cartegrise,montant from type_vgs) b
                                            where a.typeCg = b.typecg_id
                                            group by prefecture_id, typeCg,cartegrise
                                            ) c
                                        on  b.prefecture_id = c.prefecture_id
                                        and a.typeCg = c.typeCg
                                        left join
                                        (select prefecture_id,a.autorisation_id,nomAutorisation,sum(montant) totalau
                                            from(SELECT p.prefecture_id,autorisation_id
                                            FROM paiements pa,communes c,prefectures p
                                            where c.commune_id = pa.commune_id
                                            and p.prefecture_id = c.prefecture_id
                                            ) a,
                                            (select autorisation_id,nomAutorisation,montant from autorisations) b
                                            where a.autorisation_id = b.autorisation_id
                                        group by prefecture_id,a.autorisation_id,nomAutorisation) d
                                        on c.prefecture_id = d.prefecture_id
                                        and a.prefecture_id = d.prefecture_id
                                        order by a.prefecture_id,agence_id');
              $paiements = $this->searchStats($PrefectureAgences,$input['region_id'],
                  $input['prefecture_id'],$input['agence_id'],$input['startDate'],$input['endDate']);
              return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'PrefectureAgences' => $paiements]);

        }

   }
   private function searchStats($initialData,$region_id = '',$prefecture_id = '', $agence_id = '',$datedebut = '',$datefin = ''){
        $resultData = [];

        if(empty($region_id) && empty($prefecture_id)  && empty($agence_id)  && empty($datedebut) && empty($datefin))
            return $initialData;
        else{

          if(!empty($region_id) && empty($prefecture_id) && empty($agence_id) && empty($datedebut) && empty($datefin)){
             foreach ($initialData as $paiement){
                 if( intval($paiement->region_id) === intval($region_id))
                     array_push($resultData,$paiement);
             }
        }else if(!empty($region_id) && !empty($prefecture_id) && empty($agence_id) && empty($datedebut)&& empty($datefin)){
              foreach ($initialData as $paiement){
                  if(intval($paiement->prefecture_id) === intval($prefecture_id))
                      array_push($resultData,$paiement);
              }
          }else if(!empty($region_id) && !empty($prefecture_id) && !empty($agence_id) && empty($datedebut) && empty($datefin)){
           foreach ($initialData as $paiement){
               if( intval($paiement->prefecture_id) === intval($prefecture_id) && intval($paiement->agence_id) === intval($agence_id))
                   array_push($resultData,$paiement);
           }
        }else if(!empty($region_id) && !empty($prefecture_id) && !empty($agence_id) && !empty($datedebut)  && empty($datefin)){
           foreach ($initialData as $paiement){
              if( intval($paiement->prefecture_id) === intval($prefecture_id) && intval($paiement->agence_id) === intval($agence_id)
                && Carbon::parse($paiement->created_at)->format('Y-M-d') >= $datedebut)
                  array_push($resultData,$paiement);
           }
      }else if(!empty($region_id) && !empty($prefecture_id) && !empty($agence_id) && !empty($datedebut) && !empty($datefin)){

          foreach ($initialData as $paiement){
              if( intval($paiement->prefecture_id) === intval($prefecture_id) && intval($paiement->agence_id) === intval($agence_id)
                  && (Carbon::parse($paiement->created_at)->gte( Carbon::parse($datedebut))
                  && Carbon::parse($paiement->created_at)->lte(Carbon::parse($datefin))))
                  array_push($resultData,$paiement);
          }
      }else if(!empty($datedebut) && empty($datefin)){
              foreach ($initialData as $paiement){
                  if( (Carbon::parse($paiement->created_at)->gte( Carbon::parse($datedebut))))
                      array_push($resultData,$paiement);
              }
       }else if(empty($datedebut) && !empty($datefin)){
              foreach ($initialData as $paiement){
                  if((Carbon::parse($paiement->created_at)->lte( Carbon::parse($datefin))))
                      array_push($resultData,$paiement);
              }
       }else if(!empty($datedebut) && !empty($datefin)){
              foreach ($initialData as $paiement){
                  if((Carbon::parse($paiement->created_at)->gte( Carbon::parse($datedebut))
                      && Carbon::parse($paiement->created_at)->lte(Carbon::parse($datefin))))
                      array_push($resultData,$paiement);
              }
        }
     }

    return $resultData;
   }

   public function modifystatus(Request $request,$paiement_id,$type2){
       try{
           if($request->isMethod('get')){
              $paiment = Paiement::find($paiement_id);
              if($paiment){
                  if($type2 === "Valider"){
                      $paiment->status = 1;
                      $paiment->isautoriser = 1;
                  }
                  else if(strcmp($type2,"Annuler") === 0){
                      $paiment->status = 2;
                      $paiment->isautoriser = 0;
                  }
                 $paiment->validedBy = Auth::user()->id;
                 $paiment->save();
              }
           }
          return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
       }catch (QueryException $ex){
           return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
       }
   }
   public function annulerPaiement(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
             'id.required' => "L'identifiant est obligatoire.",
             'id.exists' => "L'identifiant du paiement introuvable.",
             'motifs.required' => "Le motif est obligatoire.",
             'motifs.min' => "Le caractere minimum pour le motif est trois (3)."
            ];
            $validator = Validator::make($input, [
                'id' => 'required|exists:paiements,paiement_id',
                'motifs' => 'required|min:3'
            ],$messages);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'status' => Response::HTTP_EXPECTATION_FAILED, 'messages' => $validator->messages()]);
            }else {
                try {
                    $paiement = Paiement::find($input['id']);
                    $paiement->status = 2;
                    $paiement->validedBy = Auth::user()->id;
                    $paiement->save();
                    if($paiement){
                        $paiementRejet = new PaiementRejete();
                        $paiementRejet->paiement_id = $paiement->paiement_id;
                        $paiementRejet->motif = $input['motifs'];
                        $paiementRejet->save();
                    }
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);

                } catch (QueryException $ex) {
                    return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ["erreur" => $ex->getMessage()]]);
                }
            }
        }
   }

   public function getpaiementexpiration($paiement_id,$document){


           try {
               if($document === 'cartegrise')
                 $table = "paiement_carte_grises";
               else if($document === "vignette")
                   $table = "paiement_vignettes";
               else if($document === "autorisation")
                   $table = "paiement_vignettes";
               $paiement = DB::select("select * from ".$table. " where Year(dateExp) >=:dateExp and paiement_id=:paiement_id", [
                       'dateExp' => Carbon::now()->year,
                       'paiement_id' => $paiement_id]
               );
               return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'payment' => $paiement]);
           }
           catch (QueryException $ex){
               return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                   'messages' => ['errors' => $ex->getMessage()]]);
           }

   }
public function gethistorique(Request $request){
   if($request->isMethod('get')){
       try{
           $paiements = DB::select("select * from(SELECT paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                    typeVignette,pv,cu,montant_operation,user_id,status,typeCg,reference,oldereference,p.qrcode,p.type_document,u.agence_id,p.commune_id,p.autorisation_id,p.created_at,
                                    CONCAT(u.prenom,' ',u.nom) agent
                                    FROM paiements p,categories c,users u,agences a
                                    where p.categorie_id = c.categorie_id
                                    and u.id = p.user_id and a.agence_id = u.agence_id
                                    and oldereference != ''
                                    ) a
                                    left join
                                    (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                    on a.typeVignette = b.typevg_id
                                    left join
                                    (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                    on a.typeCg = c.typecg_id
                                    left join
                                    (select autorisation_id ,montant montantautorisation
                                    from autorisations) d
                                    on a.autorisation_id = d.autorisation_id
                                    order by a.created_at desc");
           return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'paiements' => $paiements]);
       }
       catch (QueryException $ex){
           return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
               'messages' => ['errors' => $ex->getMessage()]]);
       }
   }
}

}
