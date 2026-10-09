<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Détenteur (personne) d'une période d'utilisation : bénéficiaire d'une réforme (nom, prénom).
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
        Schema::table('historique_affectations', function (Blueprint $table) {
            $table->string('detenteur', 255)->nullable()->after('fonction');
            $table->unsignedInteger('reforme_id')->nullable()->after('mutation_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('historique_affectations', function (Blueprint $table) {
            $table->dropColumn(['detenteur', 'reforme_id']);
        });
    }
};
