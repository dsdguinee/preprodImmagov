<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class BaseController extends Controller
{
    public function Messages(){

    }
    public function fullAccess($role_id){
//        $userAccess = DB::select('select privilege_id  from user_privileges where user_id =?',[$user_id]);
//        //$fullAccess = DB::select("SELECT privilege_id FROM immagov_db.privileges where nom NOT IN ('Nouvelle immatriculation','Nouvelle Mutation','Nouvelle Reforme','Carte Grise')");
//        //$fullAccess = DB::select("SELECT privilege_id FROM immagov_db.privileges");
//        $fullAccess = DB::select("SELECT privilege_id FROM privileges");
//        $result = array_udiff($fullAccess,$userAccess,function ($obj_a, $obj_b) {
//            return strcmp($obj_a->privilege_id, $obj_b->privilege_id);
//        });
//        if(count($result) === 0)
//            return true;
//        else return false;

        $role = Role::find($role_id);

        if($role){
            if($role->type === 1)
                return false;
            else if($role->type === 3 || $role->type === 2)
                return true;
        }
        return false;

    }
    public function getPrivilegeByRole($role_id){
        try {
            $role_privileges = DB::select('SELECT p.privilege_id,p.nom_privilege privilege
                                    FROM privileges p,role_privileges rp
                                    where p.privilege_id = rp.privilege_id and rp.role_id=?', [$role_id]);
            return $role_privileges;
        }
        catch (QueryException $e) {
            return response()->json(['success' => false,'status'=>Response::HTTP_BAD_REQUEST,'messages' => ['errors' => $e->getMessage()]]);
        }
    }
}
