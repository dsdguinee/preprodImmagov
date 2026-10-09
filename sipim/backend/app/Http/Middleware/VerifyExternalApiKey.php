<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protège les API externes (consultation / utilisation des références de paiement) :
 * la clé doit être envoyée dans l'en-tête « X-API-KEY », jamais en paramètre de la requête.
 */
class VerifyExternalApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $cleAttendue = (string) config('services.external_api.key');
        // Les noms d'en-têtes HTTP sont insensibles à la casse : X-API-KEY, x-api-key, X-Api-Key… sont tous lus ici
        $cleRecue = (string) $request->header('X-API-KEY');

        if ($cleAttendue === '')
            return response()->json(['success' => false, 'status' => Response::HTTP_SERVICE_UNAVAILABLE,
                'messages' => 'Clé des API externes non configurée sur le serveur.'], Response::HTTP_SERVICE_UNAVAILABLE);

        // Comparaison à temps constant
        if ($cleRecue === '' || !hash_equals($cleAttendue, $cleRecue))
            return response()->json(['success' => false, 'status' => Response::HTTP_UNAUTHORIZED,
                'messages' => 'Clé API absente ou invalide (en-tête).'], Response::HTTP_UNAUTHORIZED);

        return $next($request);
    }
}
