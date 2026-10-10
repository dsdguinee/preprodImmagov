<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AjouterStatutDossierAuxPaiements extends Migration
{
    /**
     * État, dans immagov, du dossier créé avec la référence (immatriculation, mutation ou réforme) :
     * en_attente de validation, valide ou rejete ; null tant que la référence n'est pas utilisée.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('statut_dossier', 15)->nullable()->after('numero_immatriculation')
                ->comment('Dossier immagov : en_attente, valide, rejete');
        });
        // Références déjà utilisées avant ce suivi : dossiers considérés comme validés (comportement inchangé)
        DB::table('paiements')->where('utilise', true)->update(['statut_dossier' => 'valide']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn('statut_dossier');
        });
    }
}
