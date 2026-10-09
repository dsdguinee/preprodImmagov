<?php

namespace App\Services;

use App\Models\Direction;
use App\Models\Immatriculation;
use App\Models\Ministere;

/**
 * Organismes (ministères) et directions : un nom ne peut exister qu'une fois.
 * La colonne ministeres.nom est unique et en collation utf8mb4_unicode_ci :
 * la comparaison ignore les majuscules et les accents.
 */
class OrganismeService
{
    // Code de la proposition « autre ministère » saisie par un agent
    const AUTRE_MINISTERE = 1000000;

    // Espaces superflus retirés (début, fin, espaces multiples)
    public static function normaliser($nom)
    {
        return trim(preg_replace('/\s+/u', ' ', (string) $nom));
    }

    public static function trouverParNom($nom)
    {
        $nom = self::normaliser($nom);
        return $nom === '' ? null : Ministere::where('nom', $nom)->first();
    }

    // Direction du ministère portant ce nom, créée si elle n'existe pas
    public static function directionPourNom($ministereId, $nom)
    {
        $nom = self::normaliser($nom);
        if ($nom === '') return null;
        $direction = Direction::where('ministere_id', $ministereId)->where('nom', $nom)->first();
        if (!$direction) {
            $direction = new Direction();
            $direction->ministere_id = $ministereId;
            $direction->nom = ucfirst($nom);
            $direction->save();
        }
        return $direction;
    }

    /**
     * Proposition d'un agent (« autre ministère ») dont le nom existe déjà : elle est validée automatiquement,
     * en affectant au dossier le code de l'organisme existant (et la direction proposée, réutilisée ou créée).
     * Ne sauvegarde pas le dossier. Renvoie l'organisme retenu, ou null si la proposition reste à valider.
     */
    public static function rattacherSiExistant(Immatriculation $immatriculation)
    {
        if ((int) $immatriculation->minister_id !== self::AUTRE_MINISTERE) return null;
        $ministere = self::trouverParNom($immatriculation->autreministere);
        if (!$ministere) return null;

        $immatriculation->minister_id = $ministere->ministere_id;
        $direction = self::directionPourNom($ministere->ministere_id, $immatriculation->autredirection);
        $immatriculation->direction_id = $direction ? $direction->direction_id : 0;
        $immatriculation->autreministere = '';
        $immatriculation->autredirection = '';
        return $ministere;
    }
}
