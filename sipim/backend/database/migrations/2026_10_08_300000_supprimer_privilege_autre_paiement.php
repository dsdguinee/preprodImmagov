<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La page "Autre paiement" est supprimee (mutation et reforme passent dans "Nouveau paiement") :
 * son privilege et ses attributions aux roles / utilisateurs sont retires.
 */
class SupprimerPrivilegeAutrePaiement extends Migration
{
    public function up()
    {
        $id = DB::table('privileges')->where('nom_privilege', 'Autre Paiement')->value('privilege_id');
        if ($id) {
            DB::table('role_privileges')->where('privilege_id', $id)->delete();
            DB::table('user_privileges')->where('privilege_id', $id)->delete();
            DB::table('privileges')->where('privilege_id', $id)->delete();
        }
    }

    // Recree le privilege, sans ses anciennes attributions
    public function down()
    {
        if (!DB::table('privileges')->where('nom_privilege', 'Autre Paiement')->exists())
            DB::table('privileges')->insert(['nom_privilege' => 'Autre Paiement']);
    }
}
