<?php

namespace App\Models\Concerns;

use App\Services\SipimService;

/**
 * Informe SIPIM de l'état du dossier créé avec une référence de paiement (colonne paiementReference) :
 * statut 0 = en attente de validation (création ou resoumission), 1 = validé, 2 = rejeté.
 * SIPIM refuse la mutation et la réforme d'un châssis tant que son dossier est en attente.
 * L'appel part après l'envoi de la réponse : une indisponibilité de SIPIM ne bloque pas IMMAGOV.
 */
trait NotifieSipim
{
    public static function bootNotifieSipim()
    {
        static::updated(function ($dossier) {
            if (!$dossier->wasChanged('status')) return;
            $statut = [0 => 'en_attente', 1 => 'valide', 2 => 'rejete'][(int) $dossier->status] ?? null;
            $reference = trim((string) $dossier->paiementReference);
            if (!$statut || $reference === '') return;
            dispatch(function () use ($reference, $statut) {
                $reponse = SipimService::statutDossier($reference, $statut);
                if (($reponse['status'] ?? null) !== 200)
                    logger()->warning("SIPIM : statut « $statut » du dossier non enregistré pour la référence $reference.", ['reponse' => $reponse]);
            })->afterResponse();
        });
    }
}
