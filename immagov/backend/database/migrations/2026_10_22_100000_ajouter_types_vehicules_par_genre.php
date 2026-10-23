<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Types de véhicule supplémentaires pour chaque genre (genres = catégories SIPIM).
 * Les types existants sont conservés (déjà utilisés par des véhicules) ; seuls les nouveaux sont ajoutés.
 * Le genre est retrouvé par son nom, les identifiants pouvant différer d'un environnement à l'autre.
 */
return new class extends Migration
{
    const TYPES = [
        'MOTOCYCLES' => ['Cyclomoteur', 'Scooter', 'Moto tout-terrain', 'Quad'],
        'VEHICULES LEGERS' => ['Berline', 'Break', 'Monospace', 'Coupé', 'Cabriolet', 'Ambulance'],
        'MINIBUS ET BUS' => ['Midibus', 'Autocar', 'Car scolaire'],
        'CAMIONS' => ['Camion benne', 'Camion plateau', 'Porte-conteneur', 'Camion frigorifique', 'Camion bétonnière', 'Dépanneuse', 'Porte-engins'],
        'ENGINS DE CHANTIERS' => ['Chargeuse', 'Tractopelle', 'Compacteur', 'Grue mobile', 'Chariot élévateur'],
        'ENGINS AGRICOLES' => ['Tracteur agricole', 'Moissonneuse-batteuse', 'Motoculteur', 'Remorque agricole'],
    ];

    // Nom comparé sans accents, casse ni espaces (« Véhicules  légers » = « VEHICULES LEGERS »)
    private static function normaliser($nom)
    {
        return preg_replace('/[^A-Z]/', '', strtoupper(Str::ascii((string) $nom)));
    }

    public function up()
    {
        $genres = DB::table('genres')->get()->keyBy(fn ($g) => self::normaliser($g->nom));
        foreach (self::TYPES as $genre => $types) {
            $genreId = optional($genres->get(self::normaliser($genre)))->genre_id;
            if (!$genreId) {
                // Genre absent : signalé au lieu d'être ignoré en silence
                echo "  Genre introuvable : {$genre} (types non ajoutés)".PHP_EOL;
                continue;
            }
            foreach ($types as $nom) {
                // nom unique : un type déjà présent n'est pas ajouté une seconde fois
                if (!DB::table('typevehicules')->where('nom', $nom)->exists())
                    DB::table('typevehicules')->insert(['genre_id' => $genreId, 'nom' => $nom]);
            }
        }
    }

    public function down()
    {
        // Les types déjà attribués à un véhicule sont conservés
        $utilises = DB::table('vehicules')->whereNotNull('typeVehicule')->distinct()->pluck('typeVehicule');
        DB::table('typevehicules')->whereIn('nom', array_merge(...array_values(self::TYPES)))
            ->whereNotIn('type_id', $utilises)->delete();
    }
};
