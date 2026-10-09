<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rôles de base de l'application : ni modifiables (nom, droits) ni désactivables.
 * Leurs droits restent ceux définis à la date de la migration. De nouveaux rôles peuvent toujours être créés.
 */
return new class extends Migration
{
    const ROLES_DE_BASE = ['Directeur', 'Direction Générale GG', 'Agent', 'Admin'];

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->boolean('systeme')->default(false)->after('operations');
        });
        // Rôles de base : marqués et maintenus actifs
        DB::table('roles')->whereIn('nom_role', self::ROLES_DE_BASE)->update(['systeme' => true, 'status' => 1]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('systeme');
        });
    }
};
