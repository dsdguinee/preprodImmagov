<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Le rôle « Direction Générale GG » reçoit les mêmes droits que le rôle « Directeur »
 * (dont « Validation » : même tableau de bord), pour le rôle et pour chacun de ses utilisateurs.
 * Les rôles sont retrouvés par leur nom, les identifiants pouvant différer d'un environnement à l'autre.
 */
return new class extends Migration
{
    const SOURCE = 'Directeur';
    const CIBLE = 'Direction Générale GG';
    // Droits ajoutés par cette migration, pour pouvoir les retirer au rollback
    const AJOUTS = 'migration_privileges_direction_generale';

    private function roles()
    {
        $source = DB::table('roles')->where('nom_role', self::SOURCE)->value('role_id');
        $cible = DB::table('roles')->where('nom_role', self::CIBLE)->value('role_id');
        return [$source, $cible];
    }

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        [$source, $cible] = $this->roles();
        if (!$source || !$cible) return; // rôle absent dans cet environnement : rien à faire

        $manquants = DB::table('role_privileges')->where('role_id', $source)
            ->whereNotIn('privilege_id', DB::table('role_privileges')->where('role_id', $cible)->pluck('privilege_id'))
            ->pluck('privilege_id');

        foreach ($manquants as $privilege) {
            DB::table('role_privileges')->insert(['role_id' => $cible, 'privilege_id' => $privilege]);
        }
        // Copie par utilisateur (lue pour les menus et les droits de chaque compte)
        $maintenant = now();
        foreach (DB::table('users')->where('role_id', $cible)->pluck('id') as $userId) {
            $existants = DB::table('user_privileges')->where('user_id', $userId)->pluck('privilege_id')->all();
            foreach ($manquants as $privilege) {
                if (!in_array($privilege, $existants))
                    DB::table('user_privileges')->insert(['user_id' => $userId, 'privilege_id' => $privilege, 'status' => 1,
                        'created_at' => $maintenant, 'updated_at' => $maintenant]);
            }
        }
        // Mémorise les droits ajoutés (cache applicatif persistant : table cache absente, on utilise un fichier)
        file_put_contents(storage_path('app/'.self::AJOUTS.'.json'), json_encode($manquants->values()));
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        [$source, $cible] = $this->roles();
        $fichier = storage_path('app/'.self::AJOUTS.'.json');
        if (!$cible || !file_exists($fichier)) return;
        $ajouts = json_decode(file_get_contents($fichier), true) ?: [];
        DB::table('role_privileges')->where('role_id', $cible)->whereIn('privilege_id', $ajouts)->delete();
        DB::table('user_privileges')->whereIn('user_id', DB::table('users')->where('role_id', $cible)->pluck('id'))
            ->whereIn('privilege_id', $ajouts)->delete();
        unlink($fichier);
    }
};
