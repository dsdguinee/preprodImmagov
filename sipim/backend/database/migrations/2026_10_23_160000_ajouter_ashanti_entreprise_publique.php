<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * ASHANTI ajoutée aux entreprises publiques (client « Entreprise Publique »), comme dans immagov.
 */
class AjouterAshantiEntreprisePublique extends Migration
{
    public function up()
    {
        if (!DB::table('ministeres')->where('nom', 'ASHANTI')->exists())
            DB::table('ministeres')->insert(['nom' => 'ASHANTI', 'categorie' => 'Entreprise Publique', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()]);
        else
            DB::table('ministeres')->where('nom', 'ASHANTI')->update(['categorie' => 'Entreprise Publique']);
    }

    public function down()
    {
        if (!DB::table('paiements')->whereIn('ministere_id', DB::table('ministeres')->where('nom', 'ASHANTI')->pluck('ministere_id'))->exists())
            DB::table('ministeres')->where('nom', 'ASHANTI')->delete();
    }
}
