<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Réforme payée dans SIPIM et déclarée depuis la nouvelle immatriculation :
 * le nouveau propriétaire est une personne (téléphone, e-mail, adresse, photo de sa pièce d'identité dans `piece`).
 * Date de naissance, fonction et ministère ne sont plus demandés : ils deviennent facultatifs.
 * L'historique garde les coordonnées du détenteur.
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
        Schema::table('reformes', function (Blueprint $table) {
            $table->string('telephone', 30)->nullable()->after('prenom');
            $table->string('email', 150)->nullable()->after('telephone');
            $table->string('adresse', 255)->nullable()->after('email');
            $table->string('paiementReference', 50)->nullable()->after('paiement');
            // Statut du dossier avant la réforme, rétabli si la réforme est rejetée
            $table->tinyInteger('ancienStatus')->nullable()->after('status');
        });
        DB::statement('alter table reformes modify date_naissance date null, modify fonction varchar(255) null, modify ministere_id int unsigned null');

        Schema::table('historique_affectations', function (Blueprint $table) {
            $table->string('telephone', 30)->nullable()->after('detenteur');
            $table->string('email', 150)->nullable()->after('telephone');
            $table->string('adresse', 255)->nullable()->after('email');
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
            $table->dropColumn(['telephone', 'email', 'adresse']);
        });
        Schema::table('reformes', function (Blueprint $table) {
            $table->dropColumn(['telephone', 'email', 'adresse', 'paiementReference', 'ancienStatus']);
        });
    }
};
