<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Directions prédéfinies : les services transversaux présents dans chaque ministère / institution
 * et chaque entreprise publique (organismes avec une catégorie). Les directions propres à un organisme
 * sont proposées par les agents à l'immatriculation, puis validées par le Directeur.
 * Une direction déjà présente (même nom, accents et casse ignorés) n'est pas dupliquée.
 */
return new class extends Migration
{
    const DIRECTIONS_MINISTERE = [
        "CABINET",
        "SECRÉTARIAT GÉNÉRAL",
        "INSPECTION GÉNÉRALE",
        "DIRECTION DES AFFAIRES FINANCIÈRES (DAF)",
        "DIRECTION DES RESSOURCES HUMAINES (DRH)",
        "BUREAU DE STRATÉGIE ET DE DÉVELOPPEMENT (BSD)",
        "SERVICE COMMUNICATION ET RELATIONS PUBLIQUES",
    ];
    const DIRECTIONS_ENTREPRISE = [
        "DIRECTION GÉNÉRALE",
        "DIRECTION ADMINISTRATIVE ET FINANCIÈRE (DAF)",
        "DIRECTION DES RESSOURCES HUMAINES (DRH)",
        "DIRECTION TECHNIQUE",
        "DIRECTION COMMERCIALE",
        "AUDIT INTERNE",
    ];

    private static function normaliser($nom)
    {
        return trim(preg_replace('/\s+/', ' ', strtoupper(Str::ascii((string) $nom))));
    }

    private static function directionsPour($categorie)
    {
        return $categorie === 'Entreprise Publique' ? self::DIRECTIONS_ENTREPRISE : self::DIRECTIONS_MINISTERE;
    }

    public function up()
    {
        foreach (DB::table('ministeres')->whereNotNull('categorie')->get() as $organisme) {
            $existantes = DB::table('directions')->where('ministere_id', $organisme->ministere_id)->pluck('nom')->map(fn ($n) => self::normaliser($n))->all();
            foreach (self::directionsPour($organisme->categorie) as $nom) {
                if (!in_array(self::normaliser($nom), $existantes, true))
                    DB::table('directions')->insert(['ministere_id' => $organisme->ministere_id, 'nom' => $nom]);
            }
        }
    }

    public function down()
    {
        // Retire les directions prédéfinies qui ne sont rattachées à aucun dossier
        $utilisees = collect([
            DB::table('immatriculations')->pluck('direction_id'),
            DB::table('historique_affectations')->pluck('direction_id'),
        ])->flatten()->filter()->unique()->all();
        DB::table('directions')->whereIn('nom', array_merge(self::DIRECTIONS_MINISTERE, self::DIRECTIONS_ENTREPRISE))
            ->whereNotIn('direction_id', $utilisees)->delete();
    }
};
