<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Montant saisi par l'agent pour les operations sans bareme (reforme du vehicule).
 */
class AjouterMontantOperationAuxPaiements extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('paiements', 'montant_operation')) {
            Schema::table('paiements', function (Blueprint $t) {
                $t->unsignedInteger('montant_operation')->nullable()->after('penalite');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('paiements', 'montant_operation')) {
            Schema::table('paiements', function (Blueprint $t) {
                $t->dropColumn('montant_operation');
            });
        }
    }
}
