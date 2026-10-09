<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUtilisationToPaiementsTable extends Migration
{
    /**
     * Statut d'utilisation de la référence de paiement par l'immatriculation :
     * une référence ne peut servir qu'à un seul dossier d'immatriculation.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->boolean('utilise')->default(false)->after('isautoriser')
                ->comment("false=référence non utilisée, true=utilisée pour l'immatriculation");
            $table->timestamp('date_utilisation')->nullable()->after('utilise');
            $table->string('numero_immatriculation', 30)->nullable()->after('date_utilisation')
                ->comment("Numéro d'immatriculation attribué avec cette référence");
            $table->index('utilise');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex(['utilise']);
            $table->dropColumn(['utilise', 'date_utilisation', 'numero_immatriculation']);
        });
    }
}
