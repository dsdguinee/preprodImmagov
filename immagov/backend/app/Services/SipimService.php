<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Appels aux API externes de SIPIM.
 * La clé (SIPIM_API_KEY) reste côté serveur : elle est envoyée dans l'en-tête X-API-KEY, jamais exposée au frontend.
 */
class SipimService
{
    /**
     * Informations d'un paiement SIPIM à partir de sa référence.
     * Retourne le corps JSON de SIPIM ({ success, status, paiement | messages }),
     * ou une réponse d'erreur de même forme si SIPIM est injoignable.
     */
    public static function getPaiement($reference)
    {
        return self::call('get', '', ['reference' => trim($reference)]);
    }

    /**
     * Marque la référence comme utilisée dans SIPIM (une seule utilisation possible).
     * Échoue (success=false) si la référence est introuvable, non validée ou déjà utilisée.
     */
    public static function utiliserPaiement($reference, $numeroImmatriculation = null)
    {
        return self::call('put', '/utiliser', ['reference' => trim($reference), 'immatriculation' => $numeroImmatriculation]);
    }

    // Libère une référence marquée utilisée (dossier d'immatriculation annulé)
    public static function libererPaiement($reference)
    {
        return self::call('post', '/liberer', ['reference' => trim($reference)]);
    }

    private static function call($method, $path, array $data)
    {
        try {
            $response = Http::withHeaders([
                    'X-API-KEY' => config('services.sipim.key'),
                    'Accept' => 'application/json',
                ])
                ->timeout(20)
                ->$method(rtrim(config('services.sipim.url'), '/').'/api/external/paiement'.$path, $data);

            // Seules les réponses au format SIPIM sont relayées (pas les pages d'exception du serveur distant)
            $body = $response->json();
            if (is_array($body) && isset($body['status']))
                return $body;
            return ['success' => false, 'status' => $response->status(), 'messages' => 'Réponse invalide du service de paiement.'];
        } catch (ConnectionException $ex) {
            return ['success' => false, 'status' => 503, 'messages' => 'Service de paiement indisponible.'];
        }
    }
}
