<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;
use Exception;
use Tymon\JWTAuth\Http\Middleware\BaseMiddleware;

class JwtMiddleware extends BaseMiddleware
{

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        try {

            $user = JWTAuth::parseToken()->authenticate();
            if($user){
                $myTTL = 180 ;//3 heures
                JWTAuth::factory()->setTTL($myTTL);
            }
        } catch (Exception $e) {
            if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException){
                return response()->json(['messages' => 'Token invalid','success' => false,'status'=>403]);
            }else if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException){
                return response()->json(['messages' => ['erreur' => 'Token expiré'],'success' => false,'status'=>404]);
            }else{
                return response()->json(['messages' => ["erreur" => 'Authorisation non trouvée'],'success' => false,'status'=>405]);
            }
        }
        return $next($request);
    }
}