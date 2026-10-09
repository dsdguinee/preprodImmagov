<?php

namespace App\Http\Middleware\Administrateur;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdministrateurMiddleware
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

        $isAuthenticatedAdmin = ((Auth::check() && Auth::user()->isAdmin === 1));
        if(!$isAuthenticatedAdmin)
        {
            return response()->json(['success' => false,'status' => 400,'messages' => ["Erreur" =>"Vous n'êtes pas autorisé à executer cette action."]]);
        }
        return $next($request);
    }
}
