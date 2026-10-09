<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Type de plaque (VA / EP) du dossier à l'origine d'un organisme proposé par un agent.
 * Le classement Publique / Privé (typeorganisme) reste inchangé.
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
        Schema::table('ministeres', function (Blueprint $table) {
            $table->string('typeplaque', 2)->nullable()->after('typeorganisme');
        });

        // Valeur « undefined » envoyée par l'ancien formulaire quand SIPIM ne fournissait pas le type d'organisme
        DB::table('immatriculations')->where('typeOrganisme', 'undefined')->update(['typeOrganisme' => null]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ministeres', function (Blueprint $table) {
            $table->dropColumn('typeplaque');
        });
    }
};
