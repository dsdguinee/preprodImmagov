<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Historique des affectations d'un véhicule (table historique_affectations) :
 * une période par organisme utilisateur, de la validation de l'immatriculation ou de la mutation
 * jusqu'à la mutation suivante ou la réforme.
 */
class HistoriqueService
{
    // Ferme la période en cours du dossier (fin = date, motif = mutation | reforme)
    public static function fermer($immatriculationId, $fin, $motif)
    {
        DB::table('historique_affectations')->where('immatriculation_id', $immatriculationId)->whereNull('fin')
            ->update(['fin' => $fin, 'motif_fin' => $motif, 'updated_at' => now()]);
    }

    /**
     * Ouvre une nouvelle période pour le dossier, après avoir fermé l'éventuelle période en cours.
     * $infos : mutation_id, reforme_id, reference, fonction, detenteur, telephone, email, adresse (facultatifs).
     * Une réforme cède le véhicule à un particulier : sans organisme, aucun organisme n'est repris du dossier.
     */
    public static function ouvrir($immatriculation, $ministereId, $directionId, $debut, $origine, $validePar, array $infos = [])
    {
        self::fermer($immatriculation->immatriculation_id, $debut, in_array($origine, ['mutation', 'reforme']) ? $origine : null);

        // Noms copiés : l'historique ne change pas si un organisme est renommé ou supprimé
        $ministereNom = $ministereId ? DB::table('ministeres')->where('ministere_id', $ministereId)->value('nom') : null;
        $directionNom = $directionId ? DB::table('directions')->where('direction_id', $directionId)->value('nom') : null;
        if ($origine !== 'reforme') {
            if (!$ministereNom && !empty($immatriculation->autreministere)) $ministereNom = $immatriculation->autreministere;
            if (!$directionNom && !empty($immatriculation->autredirection)) $directionNom = $immatriculation->autredirection;
        }

        DB::table('historique_affectations')->insert([
            'immatriculation_id' => $immatriculation->immatriculation_id,
            'vehicule_id' => $immatriculation->vehicule_id,
            'ministere_id' => $ministereNom && $ministereId ? $ministereId : null,
            'direction_id' => $directionNom && $directionId ? $directionId : null,
            'ministere_nom' => $ministereNom,
            'direction_nom' => $directionNom,
            'debut' => $debut,
            'origine' => $origine,
            'mutation_id' => $infos['mutation_id'] ?? null,
            'reforme_id' => $infos['reforme_id'] ?? null,
            'reference' => $infos['reference'] ?? null,
            'fonction' => $infos['fonction'] ?? null,
            'detenteur' => $infos['detenteur'] ?? null,
            'telephone' => $infos['telephone'] ?? null,
            'email' => $infos['email'] ?? null,
            'adresse' => $infos['adresse'] ?? null,
            'valide_par' => $validePar,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
