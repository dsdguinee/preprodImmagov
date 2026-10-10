<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use \App\Http\Controllers\API\LoginController;
use \App\Http\Controllers\API\PaiementController;
use \App\Http\Controllers\API\DecoupageController;
use \App\Http\Controllers\API\AgenceController;
use \App\Http\Controllers\API\EcashController;
use \App\Http\Controllers\API\AdminDashboardController;
use \App\Http\Controllers\API\AgentDashboardController;
use \App\Http\Controllers\API\DirecteurDashboardController;
use \App\Http\Controllers\API\StatistiqueController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

//Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//    return $request->user();
//});
// API externes (immatriculation) : clé dans l'en-tête X-API-KEY
Route::middleware('external.key')->group(function () {
     Route::prefix('external/paiement')->group(function () {
         Route::get('/', [EcashController::class,'getpaiement']);
        Route::put('/utiliser', [EcashController::class,'utiliser']);
       Route::post('/liberer', [EcashController::class,'liberer']);
        Route::post('/statut-dossier', [EcashController::class,'statutDossier']);
    });
  
});

Route::group(['middleware' => ['jwt.verify']],function (){
    Route::post('/authRefresh', [LoginController::class,'refreshTohen']);
    Route::get('/user',[LoginController::class,"currentUser"]);

    Route::prefix('user')->group(function () {
        Route::get('/getAll',[LoginController::class,"getAllUsers"]);
        Route::post('/add',[LoginController::class,"newUser"]);
        Route::post('/update',[LoginController::class,"updateUser"]);
        Route::get('/status/{user_id}',[LoginController::class,"userStatus"]);
        Route::post('/usersetting',[LoginController::class,"useSetting"]);
        Route::get('/{user_id}',[LoginController::class,"userByID"]);
        Route::get('/role/{user_id}',[LoginController::class,"userRoleByID"]);
    });
    Route::prefix('paiement')->group(function () {
        Route::get('/getelements', [PaiementController::class, 'getElements']);
        Route::post('/new', [PaiementController::class, 'newPaiement']);
        Route::post('/printed', [PaiementController::class, 'printed']);
        Route::get('/getPaiementByDateDay/{paiement_id?}',[PaiementController::class, 'getPaiementByDateDay']);
        Route::get('/getPaiements',[PaiementController::class, 'getPaiements']);
        Route::get('/dashboardStat',[PaiementController::class, 'dashboardStat']);
        Route::get('/etat-recettes',[StatistiqueController::class, 'etatRecettes']);
        Route::get('/getpaiementByID/{paiement_id}',[PaiementController::class, 'getpaiementByID']);
        Route::get('/getpaiementByNumChassis/{NumChassis}',[PaiementController::class, 'getpaiementByNumChassis']);
        Route::get('/vehicule-utilise/{chassis}',[PaiementController::class, 'vehiculeUtilise']);
        Route::get('/getpaiementexpiration/{paiement_id}&type={valeur}',[PaiementController::class, 'getpaiementexpiration']);
        //other paiement
        Route::post('/operation-vehicule',[PaiementController::class, 'operationVehicule']);
        //search paiement
        Route::post('/search',[PaiementController::class, 'searchpaiement']);
        //
        Route::get('/statistiques',[PaiementController::class,'statistiquePaiement']);
        Route::post('/statistiques',[PaiementController::class,'statistiquePaiement']);
        Route::get('/status/{paiement_id}&type={valeur}',[PaiementController::class,'modifystatus']);

        Route::post('/annuler',[PaiementController::class,'annulerPaiement']);

        Route::get('/getPaiementsforvalidation',[PaiementController::class, 'getPaiementsforvalidation']);
        Route::get('/raisonRejet/{paiement_id}',[PaiementController::class, 'raisonRejet']);
        Route::get('/autoriser/{paiement_id}',[PaiementController::class, 'autoriser']);
        Route::get('/list/autorises',[PaiementController::class, 'paiementautorise']);
        Route::get('/resoumission/{paiement_id}',[PaiementController::class, 'getResoumissionPaiement']);
        Route::get('/historique',[PaiementController::class, 'gethistorique']);

    });
    Route::prefix('roles')->group(function () {
        Route::get('/all', [LoginController::class, 'getroles']);
        Route::get('/privilege/all', [LoginController::class, 'getprivileges']);
        Route::post('/add', [LoginController::class, 'addRole']);
        Route::get('/privilege/role/{role_id}', [LoginController::class, 'getprivelegebyrole']);
        Route::post('/update', [LoginController::class, 'updateRole']);
        Route::get('/role-status/{role_id}', [LoginController::class, 'roleStatus']);
        Route::get('/getUserPrivileges', [LoginController::class, 'getUserPrivileges']);
        Route::get('/{role_id}', [LoginController::class, 'roleByID']);
    });
    Route::prefix('decoupage')->group(function () {
        Route::get('/getAll',[DecoupageController::class,"getAllDecoupage"]);
        Route::get('/communes',[DecoupageController::class,"getCommunes"]);
        Route::post('/commune/new',[DecoupageController::class,"newCommune"]);
        Route::post('/commune/update',[DecoupageController::class,"updateCommune"]);
        Route::get('/commune/delete/{commune_id}',[DecoupageController::class,"deleteCommune"]);
    });
    Route::get('/admin/dashboard',[AdminDashboardController::class,"index"]);
    Route::get('/agent/dashboard',[AgentDashboardController::class,"index"]);
    Route::get('/directeur/dashboard',[DirecteurDashboardController::class,"index"]);
    Route::prefix('agence')->group(function () {
        Route::get('/getAll',[AgenceController::class,"getAgences"]);
        Route::get('/agencebyid/{agence_id}',[AgenceController::class,"getagencebyid"]);
        Route::get('/agencebyid2/{agence_id}/{commune_id}',[AgenceController::class,"getagencebyid2"]);
        Route::post('/new',[AgenceController::class,"newAgence"]);
        Route::post('/update',[AgenceController::class,"updateAgence"]);
        Route::get('/agenceprefecture/{prefecture_id}',[AgenceController::class,"agenceprefecture"]);

    });
});
Route::group(['middleware' => 'guest'],function (){
    Route::post('/auth', [LoginController::class,'login']);
});
