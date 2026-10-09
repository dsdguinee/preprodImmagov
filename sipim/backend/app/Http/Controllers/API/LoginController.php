<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\Privilege;
use App\Models\Role;
use App\Models\RolePrivilege;
use App\Models\User;
use App\Models\UserPrivilege;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class Roles
{
    public $role_id;
    public $role_name;
    public $status;
    public $privileges = [];
    public $type;
}
class Privileges {
    public $privilege_id;
    public $privilege;
}
class LoginController extends BaseController
{
    public function login(Request $request)
    {
        // Connexion par email ou telephone
        $input = $request->all();
        $input['login'] = trim($request->input('login', ''));
        $messages = [
            'login.required' => 'L\'email ou le numero de telephone est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.'
        ];
        $validator = Validator::make($input, [
            'login' => 'required|string',
            'password'=> 'required'
        ],$messages);
        if ($validator->fails()) {
            return response()->json(['success' => false,'status'=> Response::HTTP_NON_AUTHORITATIVE_INFORMATION,'messages' => $validator->errors()]);
        }
        $user = $this->findUserByEmailOrTelephone($input['login']);
        try {
            if($user) {
                //$role = Role::find($user->role_id);
                $isAuthenticationAutorized = $user->isActive === 1?true:false;
                if ($isAuthenticationAutorized) {
                    if (!Hash::check($input['password'], $user->password) || !$token = JWTAuth::fromUser($user)) {

                        return response()->json(['success' => false, 'status' => Response::HTTP_UNAUTHORIZED, 'messages' => ['errors' => 'Information de connexion Incorrect.']]);
                    }else{
                        if($user->nbre_cnx < 1000000)
                          $user->nbre_cnx = $user->nbre_cnx + 1;
                        else  $user->nbre_cnx = 0;

                        $user->save();
                    }
                  } else {
                      return response()->json(['success' => false, 'status' => Response::HTTP_UNAUTHORIZED, 'messages' => ['errors' => 'Connexion non autorisée.']]);
                 }
            }else{
                return response()->json(['success' => false, 'status' => Response::HTTP_FORBIDDEN, 'messages' => ['errors' => 'Information de connexion Incorrect.']]);
            }
        } catch (JWTException $e) {
            return response()->json(['success' => false,'status'=>401,'messages' => ['errors' => $e->getMessage()]]);
        }
        // $user->nbreCnx = intval($user->nbreCnx) + 1;
        $user->updated_at = Carbon::now();
        $user->save();
        return response()->json(['success' => true,'status' => Response::HTTP_OK,'token' => $token,'messages' => ['success' => 'Connexion reussie.']]);
    }
    private function findUserByEmailOrTelephone($login){
        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $login)->first();
        }
        // Telephone : on retire espaces, tirets, points et l'indicatif de la Guinee (+224 / 00224)
        $telephone = preg_replace('/[^0-9]/', '', $login);
        $telephone = preg_replace('/^(00224|224)(?=\d{9}$)/', '', $telephone);
        return $telephone !== '' ? User::where('telephone', $telephone)->first() : null;
    }
    public function refreshTohen(){
        if(auth()->check()){
            return response()->json(['success' => true,'status' => Response::HTTP_OK,'token' => auth()->refresh(),'messages' => ['success' => 'Connexion reussie.']]);
        }
    }
    public function currentUser(Request $request){
        try{
            $user = Auth::user();

            if($user){
                $role = Role::find($user->role_id);
                $ag = Agence::find($user->agence_id);

                if($ag){
                    $agence = Agence::join('agence_communes','agence_communes.agence_id','=',
                        'agences.agence_id')
                        ->where('agences.agence_id',$ag->agence_id)
                       ->where('agence_communes.commune_id',$user->commune_id)
                        ->get()->first();

               return response()->json(['success' => true,'status' => Response::HTTP_OK,
                   'user' => $user,
                   'role' => $role,
                   'agence' => $agence]);
                }
                return response()->json(['success' => true,'status' => Response::HTTP_NOT_FOUND,'messages' => ['erreur' => 'Agence non trouvée.']]);
            }
            else return response()->json(['success' => true,'status' => Response::HTTP_NOT_FOUND,'user' => $user]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_FORBIDDEN,'messages' => ['errors' => $ex->getMessage()]]);
        }
    }

    public function getAllUsers(Request $request){
        try{
            $users = DB::select('SELECT * FROM users u ,roles r,agences a
                                         where r.role_id = u.role_id and u.agence_id = a.agence_id
                                         and id !=:user_id order by u.updated_at desc',[Auth::user()->id]);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'users' => $users,]);
        }catch (QueryException $ex){
            return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
    public function updateUser(Request $request){
      if($request->isMethod('post')){
          $input = $request->all();
         // $user = User::find($input['user_id']);
          $messages = [
              "prenom.required" => "Le prenom est obligatoire.",
              "prenom.min" => "Le caractère minimum pour le prenom est deux (2).",
              "nom.required" => "Le nom est obligatoire.",
              "nom.min" => "Le caractère minimum pour le nom est deux (2).",
              "telephone.required" => "Le numero de telephone est obligatoire",
              "telephone.unique" => "Ce numero de telephone  existe déjà.",
              "telephone.max" => "Le maximum de Caractère est dix (10).",
              "email.required" => "L'email est obligatoire",
              "email.email" => "Mauvais format d'email.Example:example@example.com.",
              "email.unique" => "Cet email existe déjà.",
              "role_id.required" => "Veuillez Choisir le rôle.",
              "role_id.exists" => "Ce rôle n'existe pas.",
              "id.exists" => "Cet utilisateur n'existe pas.",
              "agence_id.required" => "Le nom de l'agence est obligatoire.",
              "agence_id.not_in" => "Le nom de l'agence est obligatoire.",
              "agence_id.exists" => "Cette agence n'est pas repertorié.",
              "commune_id.required" => "Veuillez choisir la commune.",
              "commune_id.exists" => "Cette commune n'existe pas."

          ];
          $validator = Validator::make($input,[
            "user_id" => 'exists:users,id',
            "prenom" => ['required','min:2'],
            "nom" => ['required','min:2'],
            "email" =>['required','email',Rule::unique('users', 'email')->ignore($input['id'])],
            "telephone" => ['required','max:10',Rule::unique('users', 'telephone')->ignore($input['id'])],
            "role_id" => "required|not_in:0|numeric|exists:roles,role_id",
            "agence_id" => "required|not_in|numeric|exists:agences,agence_id",
            "commune_id" => "required|exists:communes,commune_id",
            "password" => [
                  'nullable',
                  Password::min(5)
                      ->mixedCase()
                      ->letters()
                      ->numbers()
                      ->uncompromised(),
              ],
          ],$messages);
          if ($validator->fails()) {
              return response()->json(['success' => false,'status'=> Response::HTTP_NON_AUTHORITATIVE_INFORMATION,'messages' => $validator->errors()]);
          }else{
            $user = User::find($input['id']);
            if($user){
                $user->prenom = ucfirst($input['prenom']);
                $user->nom = mb_strtoupper($input['nom']);
                $user->telephone = $input['telephone'];
                $user->email = $input['email'];
                $user->agence_id = $input['agence_id'];
                $user->commune_id = $input['commune_id'];

                if(isset($input['password'])) {
                    $user->nbre_cnx = 0;
                    $user->password = Hash::make($input['password']);
                }

                $user->role_id = $input['role_id'];
                $user->save();
                DB::delete('delete from user_privileges where user_id=?',[$user->id]);
                $privileges = $this->getPrivilegeByRole($user->role_id);
                foreach ($privileges as $privilege){
                    $userPrivelege = new UserPrivilege();
                    $userPrivelege->user_id = $user->id;
                    $userPrivelege->privilege_id = $privilege->privilege_id;
                    $userPrivelege->save();
                }
            }
             return response()->json(['success' => true,'status'=> Response::HTTP_OK,]);
          }
      }
    }
    public function useSetting(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                "prenom.required" => "Le prenom est obligatoire.",
                "prenom.min" => "Le caractère minimum pour le prenom est deux (2).",
                "nom.required" => "Le nom est obligatoire.",
                "nom.min" => "Le caractère minimum pour le nom est deux (2).",
                "password.required" => "Le mot de passe est obligatoire.",
                "Changedphoto.mimes" => "Les format accepter sont jpeg,jpg ou png.",
                "confirm_password.required" => "Le mot de passe de confirmation est obligatoire.",
                "confirm_password.same" => "Les deux mot de passe doivent être identique."
            ];
            $validator = Validator::make($input,[
                "id" => 'exists:users,id',
                "prenom" => ['required','min:2'],
                "nom" => ['required','min:2'],
                'Changedphoto' => 'nullable|mimes:jpeg,jpg,png|max:1024',
                "password" => [
                    'nullable',
                    Password::min(5)
                        ->mixedCase()
                        ->letters()
                        ->numbers()
                        ->uncompromised(),
                ],
                "confirm_password" => "nullable|same:password"
            ],$messages);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'status' => Response::HTTP_NON_AUTHORITATIVE_INFORMATION, 'messages' => $validator->errors()]);
            }else{
                try{
                    $user = Auth::user();
                    $user->nom = $input['nom'];
                    $user->prenom = $input['prenom'];
                    if(isset($input['password'])){
                        $user->nbre_cnx = 2;
                        $user->password = Hash::make($input['password']);
                    }
                    if( $request->file('Changedphoto') ){
                        $photoProfile ='profile'.$user->id.'.'.$input['Changedphoto']->getClientOriginalExtension();
                        $request->file('Changedphoto')->storeAs('public/images/face', $photoProfile);
                        $user->photo = 'images/face/'.$photoProfile;
                    }
                    $user->save();
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,'userData' => $user]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $ex->getMessage()]]);
                }
            }
        }
    }
    public function newUser(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            if($input['type_id'] == 3 || $input['type_id'] == 2){
               $input['agence_id'] = 12;
            }
            $messages = [
                "prenom.required" => "Le prenom est obligatoire.",
                "prenom.min" => "Le caractère minimum pour le prenom est deux (2).",
                "nom.required" => "Le nom est obligatoire.",
                "nom.min" => "Le caractère minimum pour le nom est deux (2).",
                "telephone.required" => "Le numero de telephone est obligatoire",
                "telephone.unique" => "Ce numero de telephone  existe déjà.",
                "telephone.max" => "Le maximum de Caractère est dix (10).",
                "email.required" => "L'email est obligatoire",
                "email.email" => "Mauvais format d'email.Example:example@example.com.",
                "email.unique" => "Cet email existe déjà.",
                "role_id.required" => "Veuillez Choisir le rôle.",
                "role_id.exists" => "Ce rôle n'existe pas.",
                "role_id.not_in" => "Le rôle selectionné est invalide.",
                "agence_id.required" => "Veuillez choisir une agence.",
                "agence_id.not_in" => "Veuillez choisir une agence.",
                "prefecture_id" => "Veuillez choisir la prefecture.",
                "commune_id.required" => "Veuillez choisir la commune.",
                "commune_id.exists" => "Cette commune n'existe pas."
            ];
            $validator = Validator::make($input,[
                "prenom" => ['required','min:2'],
                "nom" => ['required','min:2'],
                "email" =>['required','email',Rule::unique('users', 'email')],
                "telephone" => ['required','max:10',Rule::unique('users', 'telephone')],
                "role_id" => "required|not_in:0|numeric|exists:roles,role_id",
                "agence_id" =>"required|not_in:0|numeric|exists:agences,agence_id",
                "prefecture_id" => "required",
                "commune_id" => "required|exists:communes,commune_id",
                "password" => [
                    'required',
                    Password::min(5)
                        ->mixedCase()
                        ->letters()
                        ->numbers()
                        ->uncompromised(),
                ],
            ],$messages);
            if ($validator->fails()) {
                return response()->json(['success' => false,'status'=> Response::HTTP_NON_AUTHORITATIVE_INFORMATION,'messages' => $validator->errors()]);
            }else{
                try {
                    $user = new User();
                    $user->prenom = ucfirst($input['prenom']);
                    $user->nom = mb_strtoupper($input['nom']);
                    $user->telephone = $input['telephone'];
                    $user->email = $input['email'];
                    $user->password = Hash::make($input['password']);
                    $user->role_id = $input['role_id'];
                    $user->agence_id = $input['agence_id'];
                    $user->photo = 'images/face/default.png';
                    $user->email_verified_at = Carbon::now();
                    $user->commune_id = $input['commune_id'];
                    $user->remember_token = Str::random(10);
                    $user->save();
                    $privileges = $this->getPrivilegeByRole($user->role_id);
                    foreach ($privileges as $privilege){
                        $userPrivelege = new UserPrivilege();
                        $userPrivelege->user_id = $user->id;
                        $userPrivelege->privilege_id = $privilege->privilege_id;
                        $userPrivelege->save();
                    }
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
                }
                catch (QueryException $e) {
                    return response()->json(['success' => false,'status'=>Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $e->getMessage()]]);
                }
            }
        }
    }
    public function userStatus(Request $request,$user_id){
        if($request->isMethod('get')){
            try{
                $user = User::find($user_id);
                if($user->isActive == 1){
                    $user->isActive = 0;
                }else if($user->isActive == 0){
                        $user->isActive = 1;
                }
                $user->save();
                return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
            }
            catch (QueryException $e) {
                return response()->json(['success' => false,'status'=>Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $e->getMessage()]]);
            }
        }
    }

    public function roleStatus(Request $request,$role_id){
        if($request->isMethod('get')){
            try{
                $status = 0;
                $role = Role::find($role_id);
                if($role->status == 1){
                    $role->status = 0;$status = 0;
                }else if($role->status == 0){
                    $role->status = 1;$status = 1;
                }
                $role->save();
                DB::update('update users set isActive =:isActive where role_id=:role_id',['isActive' => $status,'role_id'=>$role_id]);
                return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
            }
            catch (QueryException $e) {
                return response()->json(['success' => false,'status'=>Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $e->getMessage()]]);
            }
        }
    }

    public function getroles(){
        try{
            $datas = Role::all();
            $roles = [];
            foreach ($datas as $data){
                $role = new Roles();
                 $role->role_id = $data->role_id;
                 $role->role_name = $data->nom_role;
                 $role->status = $data->status;
                 $role->type = $data->type;
                 $getPrivilegefromRoles = DB::select('select nom_privilege from privileges p,role_privileges rp
                                         where p.privilege_id = rp.privilege_id and rp.role_id=? order by nom_privilege asc',[$data->role_id]);
                 $stringroleprivilege = '';
                 foreach ($getPrivilegefromRoles as $rolePriv){
                     $stringroleprivilege  .= $rolePriv->nom_privilege.',';
                 }
                 $privilenames = explode(',',substr_replace($stringroleprivilege,'',strlen($stringroleprivilege) - 1,1));
                 foreach ($privilenames as $privilename){
                    array_push($role->privileges,$privilename);
                 }
                 array_push($roles,$role);
            }
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'roles' =>$roles]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }
    public function getprivileges(){
        try{
           $privleges = Privilege::all();
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'privileges' =>$privleges]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }
    }
    public function addRole(Request $request){
        if($request->isMethod('post')){
            $input = $request->all();
            $messages = [
                "roleName.required" => "Le nom du Rôle est obligatoire.",
                "roleName.unique" => "Ce Nom du Rôle existe.",
                "privileges.*.required" => "Le privilège est obligatoire.",
                "privileges.*.distinct" => "Vous aviez choisi plusieurs fois un Privilège.",
                "privileges.array" => "Veuillez choisir au moin deux Privilèges.",
                "privileges.min" => "Veuillez choisir au moin deux Privilèges.",
                "privileges.*.exists" => "Il y a  un privilège qui n'existe pas.",
                "type.required" => "Veuillez choisir le type de compte",
                "type.not_in" => "Veuillez choisir le type de compte",
                "type.integer" => "Mauvais type de donnée sur le type de compte.",

            ];
            $validator = Validator::make($input,[
                'roleName' => 'required|unique:roles,nom_role',
                "privileges" => "required|array|min:2",
                "type" => "required|not_in:0|integer",
                "privileges.*" => "required|distinct|exists:privileges,privilege_id",
            ],$messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
            else{
                try{
                    $role = new Role();
                    $role->nom_role = ucfirst(trim($input['roleName']));
                    $role->type = $input['type'];
                    $role->save();
                    foreach ($input['privileges'] as $privilege){
                        $prilege = new RolePrivilege();
                        $prilege->role_id = $role->role_id;
                        $prilege->privilege_id = $privilege;
                        $prilege->save();
                    }
                    return response()->json(['success' => true, 'status' => Response::HTTP_OK,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
                }
           }
        }
    }
    public function updateRole(Request $request){
       if($request->isMethod('post')) {
           $input = $request->all();
           $messages = [
               "roleName.required" => "Le nom du Rôle est obligatoire.",
               "roleName.unique" => "Ce Nom du Rôle existe.",
               "privileges.*.required" => "Le privilège est obligatoire.",
               "privileges.*.distinct" => "Vous aviez choisi plusieurs fois un Privilège.",
               "privileges.array" => "Veuillez choisir au moin deux Privilèges.",
               "privileges.min" => "Veuillez choisir au moin deux Privilèges.",
               "privileges.*.exists" => "Il y a  un privilège qui n'existe pas.",
               "role_id.required" => "Nous ne retrouvons pas ce rôle.",
               "role_id.exists" => "Nous ne retrouvons pas ce rôle.",
               "role_id.integer" => "Mauvais format de rôle.",
               "type.required" => "Veuillez choisir le type de compte",
               "type.not_in" => "Veuillez choisir le type de compte",
               "type.integer" => "Mauvais type de donnée sur le type de compte.",
           ];
           $validator = Validator::make($input, [
               'role_id' => 'required|integer|exists:roles,role_id',
               'roleName' => ['required','min:2',Rule::unique('roles', 'nom_role')->ignore($input['role_id'],'role_id')],
               "privileges" => "required|array|min:2",
               "type" => "required|not_in:0|integer",
               "privileges.*" => "required|distinct|exists:privileges,privilege_id",
           ], $messages);
           if ($validator->fails())
               return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
           else{
               try{
                   $role = Role::find($input['role_id']);
                   if($role){
                       $role->nom_role = $input['roleName'];
                       $role->type = $input['type'];
                       $role->save();
                       DB::delete('delete from role_privileges where role_id =?',[$input['role_id']]);
                       foreach ($input['privileges'] as $privilege){
                           $prilege = new RolePrivilege();
                           $prilege->role_id = $role->role_id;
                           $prilege->privilege_id = $privilege;
                           $prilege->save();
                       }
                       $privileges = $this->getPrivilegeByRole($role->role_id);
                       $users = User::where('role_id','=',$role->role_id)->get();
                       if($users){
                           foreach ($users as $user){
                               DB::delete('delete from user_privileges where user_id=?',[$user->id]);
                               foreach ($privileges as $privilege){
                                   $userPrivelege = new UserPrivilege();
                                   $userPrivelege->user_id = $user->id;
                                   $userPrivelege->privilege_id = $privilege->privilege_id;
                                   $userPrivelege->save();
                               }
                           }

                       }
                       return response()->json(['success' => true, 'status' => Response::HTTP_OK]);
                   }
               }
               catch (QueryException $ex){
                   return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
               }
           }
       }
    }
    public function getprivelegebyrole($role_id){
        try{
            $privileges = DB::select('select rp.role_id,p.privilege_id,nom_privilege from role_privileges rp,privileges p
                                     where rp.privilege_id = p.privilege_id and rp.role_id=?
                                    ',[$role_id]);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'privileges' => $privileges]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
        }
    }

    public function getUserPrivileges(){
        try {
            $userprivileges = DB::select("SELECT p.privilege_id,p.nom_privilege privilege,u.user_id
                                            FROM privileges p,user_privileges u
                                            where p.privilege_id = u.privilege_id and u.user_id =?", [Auth::user()->id]);

            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'privileges' =>$userprivileges]);
        }  catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => ["erreur" => $ex->getMessage()]]);
        }


    }

    public function userByID($user_id){
        try{
             $user = DB::select('select id,prenom,u.nom,email,telephone,photo,u.agence_id,u.commune_id,c.nom commune,a.nom_agence,logo
                                         from users u,communes c,agences a
                                         where u.commune_id = c.commune_id
                                         and a.agence_id = u.agence_id and id=?',[$user_id]);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'user' => $user]);
        }catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
        }
    }
    public function userRoleByID($user_id){
        try{
            $user = DB::select('select u.id,r.type,r.nom_role from users u ,roles r where r.role_id = u.role_id and id=?',[$user_id]) ;
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'user' => $user]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
        }
    }
    public function roleByID($role_id){
        try{
            $role = Role::find($role_id);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK,'role' => $role]);
        } catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
        }

    }
}
