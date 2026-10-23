<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Entreprises publiques proposées quand le client est « Entreprise Publique ».
 * Même liste que les ministères (table ministeres), distinguée par la catégorie.
 * Liste initiale : entreprises à capital public majoritaire du portefeuille de l'État (Ledjely, mars 2023) et la RTG ;
 * elle est ensuite tenue à jour par l'administrateur (privilège « Ministère »).
 */
class AjouterEntreprisesPubliques extends Migration
{
    const ENTREPRISES = [
        "ÉLECTRICITÉ DE GUINÉE (EDG)",
        "SOCIÉTÉ DES EAUX DE GUINÉE (SEG)",
        "PORT AUTONOME DE CONAKRY (PAC)",
        "SOCIÉTÉ DE GESTION ET D'EXPLOITATION DE L'AÉROPORT DE CONAKRY (SOGEAC)",
        "SOCIÉTÉ GUINÉENNE DU PATRIMOINE MINIER (SOGUIPAMI)",
        "OFFICE NATIONAL DES PÉTROLES (ONAP)",
        "AGENCE NATIONALE D'AMÉNAGEMENT DES INFRASTRUCTURES MINIÈRES (ANAIM)",
        "SOCIÉTÉ NATIONALE DES CHEMINS DE FER DE GUINÉE",
        "SOCIÉTÉ NAVALE DE GUINÉE (SNG)",
        "OFFICE GUINÉEN DES CHARGEURS (OGC)",
        "FONDS D'ENTRETIEN ROUTIER (FER)",
        "PHARMACIE CENTRALE DE GUINÉE (PCG)",
        "OFFICE DE LA POSTE GUINÉENNE (OPG)",
        "OFFICE NATIONAL DU TOURISME (ONT)",
        "OFFICE GUINÉEN DE PUBLICITÉ (OGP)",
        "SOCIÉTÉ GUINÉENNE DE PALMIERS À HUILE (SOGUIPAH)",
        "LOTERIE NATIONALE DE GUINÉE (LONAGUI)",
        "GUINÉENNE DE LA LARGE BANDE (GUILAB)",
        "RADIODIFFUSION TÉLÉVISION GUINÉENNE (RTG)",
    ];

    public function up()
    {
        Schema::table('ministeres', function (Blueprint $table) {
            $table->string('categorie', 30)->default('Ministère')->after('nom')->index()
                ->comment('Ministère (client Gouvernement) ou Entreprise Publique (client Entreprise Publique)');
        });
        $now = Carbon::now();
        foreach (self::ENTREPRISES as $nom) {
            if (!DB::table('ministeres')->where('nom', $nom)->exists())
                DB::table('ministeres')->insert(['nom' => $nom, 'categorie' => 'Entreprise Publique', 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down()
    {
        $utilises = DB::table('paiements')->whereNotNull('ministere_id')->distinct()->pluck('ministere_id');
        DB::table('ministeres')->where('categorie', 'Entreprise Publique')->whereNotIn('ministere_id', $utilises)->delete();
        Schema::table('ministeres', function (Blueprint $table) {
            $table->dropIndex(['categorie']);
            $table->dropColumn('categorie');
        });
    }
}
