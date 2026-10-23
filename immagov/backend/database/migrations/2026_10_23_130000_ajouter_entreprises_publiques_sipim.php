<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Entreprises publiques de la liste SIPIM (client « Entreprise Publique ») ajoutées comme organismes « Publique »,
 * pour que l'entreprise du paiement soit retrouvée et présélectionnée à l'immatriculation.
 * Noms comparés sans accents, casse ni espaces : un organisme existant n'est pas dupliqué.
 */
return new class extends Migration
{
    // Même liste que la migration SIPIM 2026_10_23_130000_ajouter_entreprises_publiques
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

    private static function normaliser($nom)
    {
        return trim(preg_replace('/\s+/', ' ', strtoupper(Str::ascii((string) $nom))));
    }

    public function up()
    {
        $existants = DB::table('ministeres')->get()->keyBy(fn ($m) => self::normaliser($m->nom));
        foreach (self::ENTREPRISES as $nom) {
            $existant = $existants->get(self::normaliser($nom));
            if (!$existant)
                DB::table('ministeres')->insert(['nom' => $nom, 'typeorganisme' => 'Publique']);
            else if ($existant->typeorganisme !== 'Publique') {
                DB::table('ministeres')->where('ministere_id', $existant->ministere_id)->update(['typeorganisme' => 'Publique']);
                echo "  Passé en Publique : {$existant->nom}".PHP_EOL;
            }
        }
    }

    public function down()
    {
        $utilises = collect([
            DB::table('immatriculations')->pluck('minister_id'),
            DB::table('directions')->pluck('ministere_id'),
            DB::table('historique_affectations')->pluck('ministere_id'),
            DB::table('mutations')->pluck('ancienMinistere_id'),
            DB::table('reformes')->pluck('ministere_id'),
        ])->flatten()->filter()->unique()->all();
        DB::table('ministeres')->whereIn('nom', self::ENTREPRISES)->whereNotIn('ministere_id', $utilises)->delete();
    }
};
