<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Le type de client "Société" devient "Entreprise Publique" : les paiements deja enregistres
 * (et leur historique) sont renommes pour rester visibles dans les filtres et statistiques.
 */
class RenommerTypeClientSocieteEnEntreprisePublique extends Migration
{
    public function up()
    {
        foreach (['paiements', 'hpaiements'] as $table) {
            DB::table($table)->where('typeClient', 'Société')->update(['typeClient' => 'Entreprise Publique']);
        }
    }

    public function down()
    {
        foreach (['paiements', 'hpaiements'] as $table) {
            DB::table($table)->where('typeClient', 'Entreprise Publique')->update(['typeClient' => 'Société']);
        }
    }
}
