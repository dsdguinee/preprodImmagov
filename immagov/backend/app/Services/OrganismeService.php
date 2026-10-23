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
    // Code de la proposition d'une nouvelle direction pour un organisme existant (nom dans autredirection)
    const AUTRE_DIRECTION = 1000000;
    // Dossier (alias i) avec un organisme ou une direction proposé, à approuver par le Directeur avant validation
    const SQL_PROPOSITION = '(i.minister_id = 1000000 or i.direction_id = 1000000)';

    public static function propositionEnAttente(Immatriculation $immatriculation)
    {
        return (int) $immatriculation->minister_id === self::AUTRE_MINISTERE || (int) $immatriculation->direction_id === self::AUTRE_DIRECTION;
    }

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
        // Direction proposée pour un organisme existant : rattachée si une direction de ce nom existe déjà
        if ((int) $immatriculation->direction_id === self::AUTRE_DIRECTION && (int) $immatriculation->minister_id !== self::AUTRE_MINISTERE) {
            $nom = self::normaliser($immatriculation->autredirection);
            $direction = $nom === '' ? null : Direction::where('ministere_id', $immatriculation->minister_id)->where('nom', $nom)->first();
            if (!$direction) return null;
            $immatriculation->direction_id = $direction->direction_id;
            $immatriculation->autredirection = '';
            return Ministere::find($immatriculation->minister_id);
        }
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
