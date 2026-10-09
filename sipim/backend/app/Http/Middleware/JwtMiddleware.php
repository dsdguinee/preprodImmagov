<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;
use Exception;
use Symfony\Component\HttpFoundation\Response;
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
//            if($user)
//                if(!auth()->refresh())
//                    return response()->json(['messages' => ['erreur' => 'Token Expiré'],'success' => false,'status'=>Response::HTTP_FORBIDDEN]);


        } catch (Exception $e) {
            if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException){
                return response()->json(['messages' => ['erreur' => 'Token invalid'],'success' => false,'status'=>Response::HTTP_FORBIDDEN]);
            }else if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException){
                return response()->json(['messages' => ['erreur' => 'Token expiré'],'success' => false,'status'=>Response::HTTP_NOT_FOUND]);
            }else{
                return response()->json(['messages' => ["erreur" => 'Authorisation non trouvée'],'success' => false,'status'=>Response::HTTP_METHOD_NOT_ALLOWED]);
            }
        }
        return $next($request);
    }
}
