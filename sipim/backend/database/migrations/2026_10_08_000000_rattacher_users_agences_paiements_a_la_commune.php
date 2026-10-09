<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Les utilisateurs (et donc leurs roles), les agences et les paiements sont
 * desormais rattaches a la commune au lieu du quartier.
 * La commune est reprise du quartier existant, puis les liens vers le quartier sont supprimes.
 */
class RattacherUsersAgencesPaiementsALaCommune extends Migration
{
    // Tables qui portent directement un quartier_id
    private $tables = ['users', 'paiements', 'hpaiements'];

    public function up()
    {
        foreach ($this->tables as $table) {
            if (!Schema::hasColumn($table, 'quartier_id')) {
                continue;
            }
            if (!Schema::hasColumn($table, 'commune_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->integer('commune_id')->nullable()->after('agence_id');
                });
            }
            DB::statement("UPDATE {$table} x JOIN quartiers q ON q.quartier_id = x.quartier_id SET x.commune_id = q.commune_id");
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('quartier_id');
            });
        }

        if (!Schema::hasTable('agence_communes')) {
            Schema::create('agence_communes', function (Blueprint $t) {
                $t->increments('agenceCommune_id');
                $t->integer('agence_id');
                $t->integer('commune_id');
                $t->unique(['agence_id', 'commune_id']);
            });
        }
        if (Schema::hasTable('agence_quartiers')) {
            DB::statement('INSERT IGNORE INTO agence_communes (agence_id, commune_id)
                           SELECT DISTINCT aq.agence_id, q.commune_id
                           FROM agence_quartiers aq JOIN quartiers q ON q.quartier_id = aq.quartier_id
                           WHERE aq.agence_id IS NOT NULL AND q.commune_id IS NOT NULL');
            Schema::drop('agence_quartiers');
        }
    }

    /**
     * Retour arriere approximatif : le quartier d'origine est perdu,
     * on reprend le premier quartier de la commune.
     */
    public function down()
    {
        if (!Schema::hasTable('agence_quartiers')) {
            Schema::create('agence_quartiers', function (Blueprint $t) {
                $t->increments('agenceQuartier_id');
                $t->integer('agence_id')->nullable();
                $t->integer('quartier_id')->nullable();
            });
        }
        if (Schema::hasTable('agence_communes')) {
            DB::statement('INSERT INTO agence_quartiers (agence_id, quartier_id)
                           SELECT ac.agence_id, (SELECT MIN(q.quartier_id) FROM quartiers q WHERE q.commune_id = ac.commune_id)
                           FROM agence_communes ac');
            Schema::drop('agence_communes');
        }

        foreach ($this->tables as $table) {
            if (!Schema::hasColumn($table, 'commune_id')) {
                continue;
            }
            if (!Schema::hasColumn($table, 'quartier_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->integer('quartier_id')->nullable()->after('agence_id');
                });
            }
            DB::statement("UPDATE {$table} x SET x.quartier_id = (SELECT MIN(q.quartier_id) FROM quartiers q WHERE q.commune_id = x.commune_id)");
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('commune_id');
            });
        }
    }
}
