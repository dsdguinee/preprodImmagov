<?php

namespace App\Http\Middleware;

use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use JWTAuth;

class DirecteurMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = JWTAuth::parseToken()->authenticate();
        if($user){
            $myTTL = 180 ;//3 heures
            JWTAuth::factory()->setTTL($myTTL);
        }
        if($user) {
            $userAccess = DB::select("select privilege_id from user_privileges where user_id=?", [Auth::user()->id]);
            $roleStatus = Role::where('role_id','=',$user->role_id)->where('status',1)->orWhere('status',2)->get()->first();
            if($roleStatus) {
                $rolePrivileges = DB::select("select privilege_id from role_privileges where role_id=?", [$user->role_id]);
                $result = array_udiff($userAccess, $rolePrivileges, function ($obj_a, $obj_b) {
                    return strcmp($obj_a->privilege_id, $obj_b->privilege_id);
                });
                if (count($result) !== 0)
                    return response()->json(['success' => false, 'status' => 403, 'messages' => ["Erreur" => "Vous n'êtes pas autorisé à executer cette action."]]);
            }else
                return response()->json(['success' => false, 'status' => 403, 'messages' => ["Erreur" => "Vous n'êtes pas autorisé à executer cette action."]]);

        }else
            return response()->json(['success' => false, 'status' => 403, 'messages' => ["Erreur" => "Vous n'êtes pas autorisé à executer cette action."]]);



        return $next($request);
    }
}
