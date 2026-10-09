<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RolePrivilege;
use App\Models\User;
use App\Models\UserPrivilege;
use App\Rules\Utilisateurs\CheckTelephoneFormat;
use App\Rules\Utilisateurs\delete\CheckUserExiste;
use App\Rules\Utilisateurs\Update\CheckEmailExist;
use App\Rules\Utilisateurs\Update\CheckTelephoneExist;
use App\Rules\Utilisateurs\Update\CheckUserMadeOperation;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Hash;
class UtilisateurController extends Controller
{
    public function newuser(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
               "nom.required" => "Le nom est obligatoire.",
               "nom.string" => "Le nom doit être une chaine de Caractère." ,
               "nom.min" => "Le Caractère minimum pour le nom est deux (2).",
               "prenom.required" => "Le prénom est obligatoire.",
               "prenom.string" => "Le prénom doit être une chaine de Caractère." ,
               "prenom.min" => "Le Caractère minimum pour le prénom est deux (2).",
               "email.email" =>"Vous devez fournir une email au format example@exemple.com",
               "email.unique" => "Cet email existe deja.",
               "telephone.required" => "Le numéro de téléphone est obligatoire.",
               "telephone.unique" => "Ce numéro de téléphone existe deja.",
               "role_id.required" => "Vous n'avez pas fourni de rôle.",
               "role_id.exists" => "Ce rôle n'existe pas.",
               "password.required" => "Le mot de passe est obligatoire."
            ];
            $validator = Validator::make($input,[
                'nom' => "required|string|min:2",
                "prenom" => "required|string|min:2",
                "email" => "nullable|email|unique:users,email",
               // "telephone" => "required|regex:/6[0-9]{8}$/g|unique:users,telephone",
                "telephone" => ['required',"unique:users",new CheckTelephoneFormat()],
                "role_id" => "required|numeric|exists:roles,role_id",
                "password" => [
                    'required',
                    Password::min(5)
                        ->mixedCase()
                        ->letters()
                        ->numbers()
                        ->uncompromised(),
                ],

            ],$messages);
            if($validator->fails())
                return response()->json(['success' => false,'status' => 400,'messages' => $validator->messages()]);
            else{
               try {
                   $rolePrivileges = RolePrivilege::where('role_id', '=', $input['role_id'])->get();
                   $user = new User();
                   $user->nom = strtoupper($input['nom']);
                   $user->prenom = ucfirst($input['prenom']);
                   isset($input['email']) && $user->email = $input['email'];
                   $user->telephone = $input['telephone'];
                   $user->role_id = $input['role_id'];
                   $user->password = bcrypt($input['password']);
                   $user->isAdmin = $input['isAdmin'] === 'true'?1:0;
                   $user->save();
                   foreach ($rolePrivileges as $rolePrivilege) {
                       $userPrivileges = new UserPrivilege();
                       $userPrivileges->user_id = $user->id;
                       $userPrivileges->privilege_id = $rolePrivilege->privilege_id;
                       $userPrivileges->save();
                   }
                   return response()->json(['success' => true, 'status' => 200]);
               }
               catch (QueryException $ex){
                   return response()->json(['success' => true, 'status' => 400,'messages' => [$ex->getMessage()]]);
               }
            }
        }
    }
    public function updateUser(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                "nom.required" => "Le nom est obligatoire.",
                "nom.string" => "Le nom doit être une chaine de Caractère." ,
                "nom.min" => "Le Caractère minimum pour le nom est deux (2).",
                "prenom.required" => "Le prénom est obligatoire.",
                "prenom.string" => "Le prénom doit être une chaine de Caractère." ,
                "prenom.min" => "Le Caractère minimum pour le prénom est deux (2).",
                "email.email" =>"Vous devez fournir une email au format example@exemple.com",
                "email.unique" => "Cet email existe deja.",
                "telephone.required" => "Le numéro de téléphone est obligatoire.",
                "telephone.unique" => "Ce numéro de téléphone existe deja.",
                "role_id.required" => "Vous n'avez pas fourni de rôle.",
                "role_id.exists" => "Ce rôle n'existe pas.",
                //"password.required" => "Le mot de passe est obligatoire."
            ];
            $validator = Validator::make($input,[
                "user_id" => "required",
                'nom' => "required|string|min:2",
                "prenom" => "required|string|min:2",
                "email" => ['nullable',"email",new CheckEmailExist($input['user_id'])],
                // "telephone" => "required|regex:/6[0-9]{8}$/g|unique:users,telephone",
                "telephone" => ['required',new CheckTelephoneExist($input['user_id']),new CheckTelephoneFormat()],
                "role_id" => "required|numeric|exists:roles,role_id",
                "password" => [
                    'nullable',
                    Password::min(5)
                        ->mixedCase()
                        ->letters()
                        ->numbers()
                        ->uncompromised(),
                ],

            ],$messages);
            if($validator->fails())
                return response()->json(['success' => false,'status' => 400,'messages' => $validator->messages()]);
            else{
                $rolePrivileges = RolePrivilege::where('role_id','=',$input['role_id'])->get();
                $user = User::find($input['user_id']);
                $user->nom = strtoupper($input['nom']);
                $user->prenom = ucfirst($input['prenom']);
                $user->email = $input['email'];
                $user->telephone = $input['telephone'];
                $user->role_id = $input['role_id'];
                $user->updated_at = Carbon::now();
                $user->isAdmin = $input['isAdmin'] === 'true'?1:0;
                if(!empty($input['password'])) {
                    $user->password = Hash::make($input['password']);
                    $user->nbreCnx = 0;
                }
                $user->save();
                DB::delete('delete from user_privileges where user_id=?',[$input['user_id']]);
                foreach ($rolePrivileges as $rolePrivilege){
                    $userPrivileges = new UserPrivilege();
                    $userPrivileges->user_id = $user->id;
                    $userPrivileges->privilege_id = $rolePrivilege->privilege_id;
                    $userPrivileges->save();
                }
                return response()->json(['success' => true,'status' => 200]);
            }
        }
     }
    public function deleteUser(Request $request){
       if($request->isMethod('post')) {
           $input = $request->all();
           $messages = [
             'user.required' => "Utilisateur non Trouvé.",
             'status.required' => 'Status non trouvé.',
             'status.integer' => 'Type de Status non conforme.',
           ];
           $validator = Validator::make($input, [
//               'user_id' => ['required',new CheckUserExiste(),new CheckUserMadeOperation($input['user_id'])]
                'user_id' => ['required'],
                'status' => ['required','integer']
           ], $messages);
           if ($validator->fails())
               return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
           else{
               try{
                  $user = User::find($input['user_id']);
                  if($user){
//                      $user->delete();
//                      DB::delete('delete from user_privileges where user_id=?',[$input['user_id']]);
                        if($user->statusCnx == 1)
                            DB::update('update users set statusCnx = 0 where id=?',[$input['user_id']]);
                        else if ($user->statusCnx == 0)
                            DB::update('update users set statusCnx = 1 where id=?',[$input['user_id']]);

                  }
                  return response()->json(['success' => true,'status' => 200]);
               }
               catch (QueryException $ex){
                   return response()->json(['success' => true, 'status' => 400,'erreur' => [$ex->getMessage()]]);
               }
           }
       }
    }
    public function getAllUserReservation(Request $request){
        try{
            $users = DB::select("SELECT distinct id user_id,email,u.nom,prenom,u.telephone,r.role_id,u.statusCnx,nom_role,u.isAdmin,u.updated_at
                                        FROM users u,roles r,privileges p,role_privileges rp
                                         where u.role_id = r.role_id
                                         and p.privilege_id = rp.privilege_id
                                         and rp.role_id = r.role_id
                                         and rp.role_id = u.role_id
                                         and u.id <>?
                                         order by updated_at desc ",[Auth::id()]);
            return response()->json(['success' => true,'status' => 200,'users' => $users]);

        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'message' => ['erreur' => $ex->getMessage()]]);
        }
    }
    public function getAllUser(){
        try{
          $users = DB::select('SELECT id user_id,email,nom,prenom,u.telephone,r.role_id,u.statusCnx,nom_role,u.updated_at
                                      FROM users u,roles r where u.role_id = r.role_id order by updated_at desc');
          return response()->json(['success' => true,'status' => 200,'users' => $users]);

        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'message' => ['erreur' => $ex->getMessage()]]);
        }
    }
  //get User Roles
    public function getUserRolePrivilege(){
        try {
           $menus = [
              "Tableau_de_bord" => '',
              "Nouvelle_immatriculation" => "",
               "Immatriculations" => "",
               "reformes" => [
                   "Nouvelle_Reforme" => '',
                   "Liste_Reforme" => '',

               ],
               "mutations" => [
                   "Nouvelle_Mutation" => "",
                   "Liste_Mutation" => ""
               ],
               "utilisateurs" => [
                   "gestion_des_Utilisateurs" => "",
                   "gestion_des_Rôles" => "",
               ],
               "ministères" => "",
               "carte_Grise" => "",
               "editeur" => "",
               "statistique" => "",
               "reservation" => "",


           ];
        
            $user_role_privileges = DB::select('select u.id user_id,u.role_id,nom_role,rp.privilege_id,p.nom privilege
                                         from users u ,roles r,role_privileges rp,privileges p
                                         where r.role_id = u.role_id and rp.role_id = r.role_id and p.privilege_id = rp.privilege_id and u.id=? order by p.privilege_id',[Auth::user()->id]);
           foreach ($user_role_privileges as $user_role_privilege) {
               if($user_role_privilege->privilege === "Tableau de bord")
                   $menus['Tableau_de_bord'] = "Tableau de bord";
               else if($user_role_privilege->privilege === "Nouvelle immatriculation")
                   $menus['Nouvelle_immatriculation'] = "Nouvelle immatriculation";
               else if($user_role_privilege->privilege === "Immatriculations")
                   $menus['Immatriculations'] = "Liste Immatriculations";
               else if($user_role_privilege->privilege === "Nouvelle Reforme")
                   $menus['reformes']["Nouvelle_Reforme"] = "Nouvelle Reforme";
               else if($user_role_privilege->privilege === "Liste Reforme")
                   $menus['reformes']["Liste_Reforme"] = "Liste Reforme";
               else if($user_role_privilege->privilege === "Nouvelle Mutation")
                   $menus['mutations']["Nouvelle_Mutation"] = "Nouvelle Mutation";
               else if($user_role_privilege->privilege === "Liste Mutation")
                   $menus['mutations']["Liste_Mutation"] = "Liste Mutation";
               else if($user_role_privilege->privilege === "Gestion des Utilisateurs")
                   $menus['utilisateurs']["gestion_des_Utilisateurs"] = "Gestion des Utilisateurs";
               else if($user_role_privilege->privilege === "Gestion des Rôles")
                   $menus['utilisateurs']["gestion_des_Rôles"] = "Gestion des Rôles";
               else if($user_role_privilege->privilege === "Ministères")
                   $menus['ministères'] = "Ministères";
               else if($user_role_privilege->privilege === "Carte Grise")
                   $menus['carte_Grise'] = "Carte Grise";
               else if($user_role_privilege->privilege === "Editeur")
                   $menus['editeur'] = "editeur";
               else if($user_role_privilege->privilege === "Statistique")
                   $menus['statistique'] = "statistique";
               else if($user_role_privilege->privilege === "Reservation")
                   $menus['reservation'] = "reservation";
           }

            return response()->json(['success' => true, 'status' => 200,
                                        "menus" => $menus,
                                       'user_role_privileges' => $user_role_privileges]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => $ex->getMessage()] ]);
        }
    }

    public function getUserRolePrivilegeByUserID($userID){
        try {
            $userPrivilege = DB::select("SELECT u.nom,u.prenom,u.id user_id,p.privilege_id,p.nom privilege,rp.role_id,statusCnx
                                    FROM users u,role_privileges rp,user_privileges up,privileges p
                                    where u.role_id = rp.role_id and up.privilege_id = rp.privilege_id
                                    and up.user_id = u.id and p.privilege_id = rp.privilege_id and u.id=?", [$userID]);
            return response()->json(['success' => true, 'status' => 200,'userPrivilege' => $userPrivilege]);

        }catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
        }

    }

    public function userByID($user_id){
        try{
            $user = User::find($user_id);
            if($user)
                return response()->json(['success' => true,'user' => $user]);
            else return response()->json(['success' => false]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'message' => ['erreur' => $ex->getMessage()]]);
        }
    }
    public function change_password(Request $request){
        if($request->isMethod('post')){
            $messages = [
                "password.required" => "Le Mot de Passe est obligatore.",
                "password.min" => "Le minimum de caractères pour le mot de passe est cinq (5 ).",
                "password.mixedCase" => "Le Mot de Passe doit contenir aumoin une lettre Majuscule.",
                "confirm_password.required" => "Le mot de Passe de confirmation est obligatoire.",
                "password.confirmed" => "Les deux mots de passe doivent être identiques.",
                "confirm_password.same" => "Les deux mots de passe doivent être identiques.",
                'user_id.required' => "L'utilisateur est obligatoire.",
                'user_id.exists' => 'Nous ne trouvons pas cet utilisateur.'
            ];
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'password' => ['required',
                                Password::min(5)
                                    ->mixedCase()
                                    ->letters()
                                    ->numbers()
                                    ->uncompromised(),
                    ],
                'confirm_password'=> 'required|same:password'
            ],$messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
            else{
                try {
                    $user = User::find($request->input('user_id'));
                    $user->password = Hash::make($request->input('password'));
                    $user->nbreCnx =  $user->nbreCnx + 1;
                    $user->save();
                    return response()->json(['success' => true, 'status' => 200]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => 400,'message' => ['erreur' => $ex->getMessage()]]);
                }
            }
        }
    }
    private function AddingRole($role_id){

    }
}
