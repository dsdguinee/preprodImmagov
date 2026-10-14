<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rôle « Administrateur Général » (top manager de la Présidence de la République) :
 * rôle de base (systeme), en consultation seule, avec le seul droit « Tableau de bord ».
 * Le droit est retrouvé par son nom, les identifiants pouvant différer d'un environnement à l'autre.
 */
return new class extends Migration
{
    const ROLE = 'Administrateur Général';
    const PRIVILEGE = 'Tableau de bord';

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $privilege = DB::table('privileges')->where('nom', self::PRIVILEGE)->value('privilege_id');
        if (!$privilege) return; // droit absent dans cet environnement : rien à faire

        $role = DB::table('roles')->where('nom_role', self::ROLE)->value('role_id');
        if (!$role)
            $role = DB::table('roles')->insertGetId(['nom_role' => self::ROLE, 'status' => 1, 'operations' => 0, 'systeme' => true]);
        else
            DB::table('roles')->where('role_id', $role)->update(['status' => 1, 'systeme' => true]);

        DB::table('role_privileges')->where('role_id', $role)->delete();
        DB::table('role_privileges')->insert(['role_id' => $role, 'privilege_id' => $privilege]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $role = DB::table('roles')->where('nom_role', self::ROLE)->value('role_id');
        if (!$role) return;
        // Rôle conservé s'il est déjà attribué : le supprimer laisserait des comptes sans rôle
        if (DB::table('users')->where('role_id', $role)->exists()) return;
        DB::table('role_privileges')->where('role_id', $role)->delete();
        DB::table('roles')->where('role_id', $role)->delete();
    }
};
