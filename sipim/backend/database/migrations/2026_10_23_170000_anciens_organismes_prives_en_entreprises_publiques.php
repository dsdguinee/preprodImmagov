<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Organismes d'immagov autrefois classés privés, devenus entreprises publiques :
 * ajoutés à la liste des entreprises publiques (client « Entreprise Publique ») pour être présélectionnés dans immagov.
 */
class AnciensOrganismesPrivesEnEntreprisesPubliques extends Migration
{
    const ENTREPRISES = [
        'CBG',
        'BEREMAT SANGAREDI',
        'ADMINISTRATION ET CONTRÔLE DES GRANDS PROJETS',
        'ACGP',
        'CAISSE NATIONALE DE LA SECURITE SOCIALE',
        'PAAEG',
        'YESIL ADAMLAR GD - SARLU',
    ];

    public function up()
    {
        foreach (self::ENTREPRISES as $nom) {
            if (DB::table('ministeres')->where('nom', $nom)->exists())
                DB::table('ministeres')->where('nom', $nom)->update(['categorie' => 'Entreprise Publique']);
            else
                DB::table('ministeres')->insert(['nom' => $nom, 'categorie' => 'Entreprise Publique', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()]);
        }
    }

    public function down()
    {
        $utilises = DB::table('paiements')->whereNotNull('ministere_id')->distinct()->pluck('ministere_id');
        DB::table('ministeres')->whereIn('nom', self::ENTREPRISES)->whereNotIn('ministere_id', $utilises)->delete();
    }
}
