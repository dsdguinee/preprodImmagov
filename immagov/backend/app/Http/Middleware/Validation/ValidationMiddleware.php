<?php

namespace App\Http\Middleware\Validation;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Décisions sur les dossiers (valider / rejeter une immatriculation, une mutation, une réforme,
 * approuver un organisme ou une direction proposé) : réservées aux rôles ayant le privilège « Validation »
 * (Directeur, Direction Générale GG). Un agent ne peut pas valider son propre dossier en attente.
 */
class ValidationMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $autorise = Auth::check() && DB::table('role_privileges as rp')
            ->join('privileges as p', 'p.privilege_id', '=', 'rp.privilege_id')
            ->where('rp.role_id', Auth::user()->role_id)
            ->where('p.nom', 'Validation')
            ->exists();
        if (!$autorise)
            return response()->json(['success' => false, 'status' => 403,
                'messages' => ['erreur' => ["Seul le Directeur peut valider ou rejeter un dossier."]]], 403);
        return $next($request);
    }
}
