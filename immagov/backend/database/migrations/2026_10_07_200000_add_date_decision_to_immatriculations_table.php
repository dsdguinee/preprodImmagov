<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Date de la décision (validation ou rejet) d'une immatriculation, pour le tableau de bord du Directeur.
 * updated_at ne convient pas : il change aussi à l'impression de la carte grise.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('immatriculations', function (Blueprint $table) {
            $table->timestamp('date_decision')->nullable()->after('valided_by');
        });

        // Reprise : pour les dossiers déjà décidés, la dernière modification correspond à la décision
        // (aucune carte grise n'a encore été imprimée, donc updated_at n'a pas été déplacé par une impression)
        DB::table('immatriculations')->whereIn('status', [1, 2])->update(['date_decision' => DB::raw('updated_at')]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('immatriculations', function (Blueprint $table) {
            $table->dropColumn('date_decision');
        });
    }
};
