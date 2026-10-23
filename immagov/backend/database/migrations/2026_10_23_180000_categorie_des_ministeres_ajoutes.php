<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Catégorie « Ministère » pour les ministères / institutions de l'État publics qui n'en ont pas.
 * Les ministères ajoutés par 2026_10_23_100000_aligner_ministeres_sur_sipim exécutée après
 * 2026_10_23_140000_ajouter_categorie_aux_ministeres n'avaient pas de catégorie : pour un paiement
 * client « Gouvernement », ils n'étaient ni proposés ni présélectionnés à l'immatriculation.
 */
return new class extends Migration
{
    // Même règle que 2026_10_23_140000_ajouter_categorie_aux_ministeres
    const PREFIXES_ETAT = ['MINISTERE', 'PRESIDENCE DE LA REPUBLIQUE', 'PRIMATURE', 'SECRETARIAT GENERAL'];

    public function up()
    {
        $normaliser = fn ($nom) => trim(preg_replace('/\s+/', ' ', strtoupper(Str::ascii((string) $nom))));
        foreach (DB::table('ministeres')->where('typeorganisme', 'Publique')->whereNull('categorie')->get() as $m) {
            if (Str::startsWith($normaliser($m->nom), self::PREFIXES_ETAT)) {
                DB::table('ministeres')->where('ministere_id', $m->ministere_id)->update(['categorie' => 'Ministère']);
                echo "  Catégorie Ministère : {$m->nom}".PHP_EOL;
            }
        }
    }

    public function down()
    {
        // Les catégories renseignées sont conservées
    }
};
