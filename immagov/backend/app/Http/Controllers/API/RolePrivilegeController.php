<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Privilege;
use App\Models\Role;
use App\Models\RolePrivilege;
use App\Models\User;
use App\Models\UserPrivilege;
use App\Rules\Utilisateurs\RolePermission\updateRole;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RolePrivilegeController extends Controller
{
    // Rôle de base (Directeur, Direction Générale GG, Agent, Admin) : ni modifiable ni désactivable
    private function refusSiRoleDeBase($role_id){
        $role = Role::find($role_id);
        if ($role && $role->systeme)
            return response()->json(['success' => false, 'status' => 403,
                'messages' => ['role' => ["« {$role->nom_role} » est un rôle de base : son nom, ses droits et son statut ne peuvent pas être modifiés."]]]);
        return null;
    }

    public function getAllPrivilege(){
        try {
            $privileges = Privilege::orderBy('privilege_id','ASC')->where('privilege_id','<>',1)->get();
            return response()->json(['success' => true,'status' => 200,'privileges' => $privileges]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
        }
    }
    public function newRole(Request $request){
        if($request->isMethod('post')) {
            $input = $request->all();
            $messages = [
                "roleName.required" => "Le nom du Rôle est obligatoire.",
                "roleName.unique" => "Ce Nom du Rôle existe.",
                "privileges.required" => "Veuillez choisir au moin un Privilèges",
                "privileges.distinct" => "Vous aviez choisi plusieurs fois un Privilège.",
                "privileges.array" => "Veuillez choisir au moin deux Privilèges.",
                "privileges.min" => "Veuillez choisir au moin deux Privilèges.",
                "status" => "Status non Spécifié."
            ];
            $validator = Validator::make($input, [
                'roleName' => 'required|unique:roles,nom_role',
                "privileges" => "required|array|min:2",
                "privileges.*" => "required|distinct",
                "status" => "required"

            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
            else{
                try{
                     $role = new Role();
                     $role->nom_role = ucfirst(trim($input['roleName']));
                    if($input['status'] === 'true')
                        $role->operations = 1;
                    else $role->operations = 0;
                    $role->save();
                    $roleprivilege = new RolePrivilege();
                    $roleprivilege->role_id = $role->role_id;
                    $roleprivilege->privilege_id = 1;
                    $privilegeData1 = Privilege::where('nom','Impressions')->get()->first();
                    $privilegeData2 = Privilege::where('nom','Carte Grise')->get()->first();
                    $isImpression = in_array($privilegeData1->privilege_id,$input['privileges']);
                    $isCarteGrise = in_array($privilegeData2->privilege_id,$input['privileges']);
                     $roleprivilege->save();
                     foreach ($input['privileges']  as $privilege){
                         if($privilege != 1){
                             $roleprivilege = new RolePrivilege();
                             $roleprivilege->role_id = $role->role_id;
                             $roleprivilege->privilege_id = $privilege;
                             $roleprivilege->save();
                         }

                     }
                    if($isImpression && !$isCarteGrise) {
                        $roleprivilege = new RolePrivilege();
                        $roleprivilege->role_id = $role->role_id;
                        $roleprivilege->privilege_id = $privilegeData2->privilege_id;
                        $roleprivilege->save();
                    }
                    return response()->json(['success' => true,'status' => 200,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => 400,'messages' => [$ex->getMessage()]]);
                }
            }
        }
    }

    public function getAllRoles(){
        try{
            $roles = Role::orderBy('role_id','ASC')->get();
            return response()->json(['success' => true,'status' => 200,'roles' => $roles]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'message'=>[$ex->getMessage()]]);
        }
    }

    public function getAllRolePrivilege(){
        try {
            $getRolePermissions = DB::select('SELECT p.privilege_id,p.nom privilege,r.role_id,nom_role,r.status,r.operations
                                               FROM privileges p,role_privileges rp,roles r
                                                where p.privilege_id = rp.privilege_id and rp.role_id = r.role_id and p.privilege_id != 1');
            $roles = Role::orderBy('role_id','ASC')->get();
            $rolesPermissions = [];
            foreach ($roles as $role) {
                $permission = '';
                foreach ($getRolePermissions as $getRolePermission)
                {
                    if($getRolePermission->role_id === $role->role_id){
                       $permission .= $getRolePermission->privilege . ",";
                    }
                }
                $rolesPermissions[$role->role_id][$role->nom_role]['permissions'] = explode(',',$permission);
                $rolesPermissions[$role->role_id]['status'] = $role->status;
                $rolesPermissions[$role->role_id]['operations'] = $role->operations;
                $rolesPermissions[$role->role_id]['systeme'] = (bool) $role->systeme;


            }
            return response()->json(['success' => true, 'status' => 200,'rolesPermissions' => $rolesPermissions]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
        }
    }
    public function getAllRolePrivilegeByRoleID($role_id){
        try{
            $getRolePermissions = DB::select('SELECT p.privilege_id,p.nom privilege,r.role_id,nom_role
                                               FROM privileges p,role_privileges rp,roles r
                                                where p.privilege_id = rp.privilege_id and rp.role_id = r.role_id and r.role_id=? and p.privilege_id !=1',[$role_id]);
            return response()->json(['success' => true, 'status' => 200,'rolesPrivileges' => $getRolePermissions]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
        }
    }
    public function updateRolePrivilege(Request $request){
        if($request->isMethod('post')) {
            $input = $request->all();
            $messages = [
               'role_id.required' => "Le role n'est pas correctement identifié.",
                "role_id.exists" => "Nous ne retrouvons pas le rôle à modifier.",
                "privileges.required" => "Veuillez choisir au moin un Privilèges",
                "privileges.distinct" => "Vous aviez choisi plusieurs fois un Privilège.",
                "privileges.array" => "Veuillez choisir au moin deux Privilèges.",
                "privileges.min" => "Veuillez choisir au moin deux Privilèges.",
                "roleName.required" => "Vous n'avez pas fourni le nom du Rôle.",
                "privileges.*.required" => "Vous n'avez pas fourni d'information pour le :attribute",
                "status.required" => "Le status est obligatoire."
            ];
            $validator = Validator::make($input,[
                'role_id' => 'required|exists:roles,role_id',
                "roleName" => ["required",new updateRole($input['role_id'])],
                "privileges" => "required|array|min:2",
                "privileges.*" => "required|distinct",
                'status' => 'required',
            ],$messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
            else if ($refus = $this->refusSiRoleDeBase($input['role_id']))
                return $refus;
            else{
                try {
                     $role = Role::find($input['role_id']);
                     $role->nom_role = ucfirst(trim($input['roleName']));
                    if($input['status'] === 'true')
                        $role->operations = 1;
                    else $role->operations = 0;
                     $role->save();
                     DB::delete('delete from role_privileges where role_id =?',[$role->role_id]);

                    $roleprivilege = new RolePrivilege();
                    $roleprivilege->role_id = $role->role_id;
                    $roleprivilege->privilege_id = 1;
                    $roleprivilege->save();
                    $privilegeData1 = Privilege::where('nom','Impressions')->get()->first();
                    $privilegeData2 = Privilege::where('nom','Carte Grise')->get()->first();
                    $isImpression = in_array($privilegeData1->privilege_id,$input['privileges']);
                    $isCarteGrise = in_array($privilegeData2->privilege_id,$input['privileges']);
                    foreach ($input['privileges']  as $privilege){
                        if($privilege != 1){
                            $roleprivilege = new RolePrivilege();
                            $roleprivilege->role_id = $role->role_id;
                            $roleprivilege->privilege_id = $privilege;
                            $roleprivilege->save();
                       }
                    }
                    if($isImpression && !$isCarteGrise) {
                        $roleprivilege = new RolePrivilege();
                        $roleprivilege->role_id = $role->role_id;
                        $roleprivilege->privilege_id = $privilegeData2->privilege_id;
                        $roleprivilege->save();
                    }
                    $users = User::where('role_id',$role->role_id)->get();
                    $roleprivileges = RolePrivilege::where('role_id',$role->role_id)->get();
                    foreach ($users as $user){
                        DB::delete("delete from user_privileges where user_id =?",[$user->id]);
                        foreach ($roleprivileges as $roleprivilege){
                            $user_privilege = new UserPrivilege();
                            $user_privilege->user_id = $user->id;
                            $user_privilege->privilege_id = $roleprivilege->privilege_id;
                            $user_privilege->save();
                       }
                    }

                    return response()->json(['success' => true,'status' => 200,]);
                }
                catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
                }
            }
        }
    }

    public function activeDesactive(Request $request){
        if($request->isMethod('post')) {
            $input = $request->all();
            $messages = [
                'role_id.required' => "Le role n'est pas correctement identifié.",
                "role_id.exists" => "Nous ne retrouvons pas le rôle à modifier.",
                "status.required" => "Le status est obligatoire",
                "status.integer" => "Mauvais Formattage du status",
            ];
            $validator = Validator::make($input, [
                'role_id' => 'required|exists:roles,role_id',
                "status" => 'required|integer'
            ], $messages);
            if ($validator->fails())
                return response()->json(['success' => false, 'status' => 400, 'messages' => $validator->messages()]);
            else if ($refus = $this->refusSiRoleDeBase($input['role_id']))
                return $refus;
            else{
                try{
                     $role = Role::find($input['role_id']);
                     $role->status = $input['status'];
                     $role->save();
                     return response()->json(['success' => true,'status' => 200,]);
                }catch (QueryException $ex){
                    return response()->json(['success' => false,'status' => 400,'messages'=>[$ex->getMessage()]]);
                }
            }
        }
    }
}
