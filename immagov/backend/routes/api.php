<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use \App\Http\Controllers\API\LoginController;

use \App\Http\Controllers\API\ImmatriculationController;
use \App\Http\Controllers\API\VehiculeController;
use \App\Http\Controllers\API\Organisation;
use \Illuminate\Support\Facades\DB;
use \App\Http\Controllers\API\ReformeController;
use \App\Http\Controllers\API\MutationController;
use \App\Http\Controllers\API\MenuController;
use \App\Http\Controllers\API\UtilisateurController;
use \App\Http\Controllers\API\RolePrivilegeController;
use \App\Http\Controllers\API\TestController;
use \App\Http\Controllers\API\ImpressionController;
use \App\Http\Controllers\API\PaiementController;

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
Route::middleware('jwt.auth')->get('user', function(Request $request) {
    return auth()->user();
});

Route::group(['middleware' => ['jwt.verify']],function (){
    Route::get('/test', [ImmatriculationController::class, 'test']);

    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user/{user_id}', [UtilisateurController::class, 'userByID']);
    //Vehicule Controller
    Route::prefix('menu')->group(function () {
        Route::get('/getmenus', [MenuController::class, 'getallmenus']);
    });
    //Reservation
    Route::prefix('reservation')->group(function (){
        Route::get('getReservations',[ImmatriculationController::class,'getReservations']);
        Route::get('/getAllUser', [UtilisateurController::class, 'getAllUserReservation']);
        Route::get('getBorne/{modeImma}',[ImmatriculationController::class,'getBorne']);
        Route::post('Reserver',[ImmatriculationController::class,'Reserver']);
        Route::post('update',[ImmatriculationController::class,'updateReservation']);
        Route::get('getvalistList',[ImmatriculationController::class,'getvalistList']);
        Route::post('donumerotation',[ImmatriculationController::class,'donumerotation']);
    });

    Route::prefix('vehicule')->group(function () {
        Route::get('/marques', [VehiculeController::class, 'getallmarques']);
        Route::get('/marque/{marque_id}', [VehiculeController::class, 'getMarqueByID']);
        Route::get('/models/{marque_id}', [VehiculeController::class, 'getModelByMarque']);
        Route::get('/models', [VehiculeController::class, 'getallmodels']);
        Route::get('/genres', [VehiculeController::class, 'getallgenres']);
        Route::get('/genre/{genre_id}', [VehiculeController::class, 'getGenreByID']);
        Route::get('/type/{genre_id}', [VehiculeController::class, 'typeByGenreID']);
        Route::get('/types', [VehiculeController::class, 'getalltype']);
        Route::get('/gettype/{type_id}', [VehiculeController::class, 'getTypeByID']);
        Route::post('/marque/update', [VehiculeController::class, 'updateMarque']);
        Route::post('/modele/update', [VehiculeController::class, 'updateModele']);
        Route::post('/modele/add', [VehiculeController::class, 'addModele']);
        Route::post('/modele/delete', [VehiculeController::class, 'deleteModele']);
        Route::post('/marque/delete', [VehiculeController::class, 'deleteMarque']);
        Route::post('/marque/add', [VehiculeController::class, 'addMarque']);
    });

    //Paiement SIPIM (la cle API reste cote serveur)
    Route::get('/paiement/sipim', [PaiementController::class, 'getPaiementSipim']);

    Route::prefix('immatriculation')->group(function () {
        Route::post('/new', [ImmatriculationController::class, 'newimmatriculation']);
        Route::get('/getAllImmatriculation', [ImmatriculationController::class, 'getAllImmatriculation']);
        Route::get('/getImmatriculationByID/{immatriculation_ID}', [ImmatriculationController::class, 'getImmatriculationByID']);
        Route::get('/getAllImmatriculationValidee', [ImmatriculationController::class, 'getAllImmatriculationValidee']);
        Route::get('/searchImmatriculation/{option?}/{option_id}', [ImmatriculationController::class, 'searchImmatriculationOption']);
        Route::get('/dashboardStat', [ImmatriculationController::class, 'dashboardStat']);
        Route::get('/dashboardAgent', [ImmatriculationController::class, 'dashboardAgent']);
        Route::get('/dashboardDirecteur', [ImmatriculationController::class, 'dashboardDirecteur']);
        Route::get('/dashboardAdmin', [ImmatriculationController::class, 'dashboardAdmin']);
        Route::get('/dashboardStat/graph1/{mois?}', [ImmatriculationController::class, 'graph1']);
        Route::get('/dashboardStat/graph2', [ImmatriculationController::class, 'graph2']);
        Route::get('/rejet/{immatriculation_id}', [ImmatriculationController::class, 'getrejetbyimmatriculation']);
        Route::get('/historique/{immatriculation_id}', [ImmatriculationController::class, 'historique']);
        Route::get('/statistique/global', [ImmatriculationController::class, 'globalstatistique']);
        Route::get('/laurent', [ImmatriculationController::class, 'laurent']);

        //la resoumission
        Route::post('/resoumission', [ImmatriculationController::class, 'resoumission']);

        Route::post('/validerImmatriculation', [ImmatriculationController::class, 'validerImmatriculation']);
        Route::post('/rejet', [ImmatriculationController::class, 'rejet']);
        Route::post('/rejetOrganisme', [ImmatriculationController::class, 'rejeterPropositionOrganisme']);
        Route::post('/generateqrcode', [ImmatriculationController::class, 'generateqrcode']);
        Route::post('/ImmatriculationforNewMinistere', [ImmatriculationController::class, 'ImmatriculationforNewMinistere']);

        Route::get('/testImmatriculation/{modeImmatriculation}', [TestController::class, 'TestNumeroImmatriculation']);

    });
    Route::prefix('mutation')->group(function () {
        Route::post('/new', [MutationController::class, 'newMutation']);
        Route::get('/dossierParChassis', [MutationController::class, 'dossierParChassis']);
        Route::post('/depuisPaiement', [MutationController::class, 'mutationDepuisPaiement']);
        Route::get('/mutations', [MutationController::class, 'getallmutation']);
        Route::get('/status/{immatriculation_id}', [MutationController::class, 'getStatus']);
        Route::get('/getmutationBy/{mutation_id}', [MutationController::class, 'getmutationBy']);
        Route::post('/resoumission', [MutationController::class, 'resoumission']);

        Route::post('/valider', [MutationController::class, 'validerMutation']);
        Route::post('/rejet', [MutationController::class, 'rejet']);
        Route::get('/immatriculationtionmutations', [MutationController::class, 'immatriculationtionmutations']);
        Route::get('/isStatusAttente', [MutationController::class, 'isStatusAttente']);
    });
    Route::prefix('reforme')->group(function () {
        Route::post('/new', [ReformeController::class, 'NewReforme']);
        Route::post('/depuisPaiement', [ReformeController::class, 'reformeDepuisPaiement']);
        Route::post('/resoumettreDepuisPaiement', [ReformeController::class, 'resoumettreDepuisPaiement']);
        //reforme
        Route::get('/getAllReformes', [ReformeController::class, 'getAllReformes']);
        Route::get('/reforme/{reforme_id}', [ReformeController::class, 'getReformeByID']);
        Route::get('/status/{immatriculation_id}', [ReformeController::class, 'getStatus']);
        Route::get('/getReformeByImmatriculationID/{immatriculation_id}', [ReformeController::class, 'getReformeByImmatriculationID']);
        Route::post('/resoumission', [ReformeController::class, 'resoumission']);
        Route::get('/immatriculationtoreforme', [ReformeController::class, 'immatriculationtoreforme']);
        //valider une reforme
        Route::post('/valider', [ReformeController::class, 'validerReforme']);
        Route::post('/rejet', [ReformeController::class, 'rejet']);

    });
    Route::prefix('organisation')->group(function () {
        Route::get('/ministeres', [Organisation::class, 'getallministere']);
        Route::get('/directions', [Organisation::class, 'getalldirection']);
        Route::get('/ministere/{ministere_id}', [Organisation::class, 'getMinistereById']);
        Route::get('/getdirectionsByMinistere/{ministere_id}', [Organisation::class, 'getdirectionsByMinistere']);
        Route::get('/direction/{direction_id}', [Organisation::class, 'getdirectionbyID']);
        Route::get('/getministereByName/{ministereName}', [Organisation::class, 'getministereByName']);
        Route::post('/create/New/Ministere/directions/validedation', [Organisation::class, 'createMinistereDirectionsValidation']);

        Route::post('/ministere/New', [Organisation::class, 'addNewMinistere']);
        Route::post('/ministere/update', [Organisation::class, 'UpdateMinistere']);
        Route::post('/direction/New', [Organisation::class, 'addNewDirection']);
        Route::post('/direction/update', [Organisation::class, 'updateDirection']);
        Route::post('/direction/delete', [Organisation::class, 'DeleteDirection']);
        Route::post('/ministere/delete', [Organisation::class, 'DeleteMinistere']);


    });

    //Logout

    //Gestion des utilisateurs
    Route::prefix('utilisateur')->group(function () {
        Route::group(['middleware' => ['administrateur']], function () {
            Route::post('/new', [UtilisateurController::class, 'newuser']);
            Route::get('/getAllUser', [UtilisateurController::class, 'getAllUser']);
            Route::post('/update', [UtilisateurController::class, 'updateUser']);
            Route::post('/delete', [UtilisateurController::class, 'deleteUser']);
        });
        Route::prefix('user-role')->group(function () {
            Route::get('/getrole', function () {
                $user = DB::select("select r.role_id,r.nom_role from users u,roles r where r.role_id=u.role_id and u.id=?", [auth()->user()->id])[0];
                return $user;
            });
            Route::get('/getUserRolePrivilege', [UtilisateurController::class, 'getUserRolePrivilege']);
            Route::get('/getUserRolePrivilege/{user_id}', [UtilisateurController::class, 'getUserRolePrivilegeByUserID']);
        });
        //Utilisateur Change son mot de pass
        Route::post('/change-password', [UtilisateurController::class, 'change_password']);
    });

    //Gestion des Role et Privilges
    Route::prefix('role-privilege')->group(function () {
        Route::get('/privileges', [RolePrivilegeController::class, 'getAllPrivilege']);
        Route::post('/new-role', [RolePrivilegeController::class, 'newRole']);
        Route::get('/roles', [RolePrivilegeController::class, 'getAllRoles']);
        Route::get('/roles-privileges', [RolePrivilegeController::class, 'getAllRolePrivilege']);
        Route::get('/roles-privileges/{role_id}', [RolePrivilegeController::class, 'getAllRolePrivilegeByRoleID']);
        Route::post('/update', [RolePrivilegeController::class, 'updateRolePrivilege']);
        Route::post('/ActiveDesactive', [RolePrivilegeController::class, 'activeDesactive']);
    });
    Route::prefix('impression')->group(function () {
        Route::get('/getAllImmatriculationValidee', [ImpressionController::class, 'getAllImmatriculationValidee']);
        Route::post('/printed/{immatriculation_id}', [ImpressionController::class, 'printed']);
    });
});
Route::group(['middleware' => 'guest'],function (){

    Route::get('/getImmatriculationByNumber', [ImmatriculationController::class, 'getImmatriculationByNumber']);

    Route::post('/login', [LoginController::class,'login']);
    //E-validator
    Route::prefix('evalidator')->group(function () {
        Route::post('/auth', [\App\Http\Controllers\API\Evalidator\LoginController::class, 'fnauthentication']);
    });
});


