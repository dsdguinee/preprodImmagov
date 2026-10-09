<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Le menu "Quartiers" devient "Communes" : le privilege qui y donne acces est renomme.
 * Les roles et utilisateurs qui avaient ce privilege le gardent (meme privilege_id).
 */
class RenommerPrivilegeQuartierEnCommune extends Migration
{
    public function up()
    {
        DB::table('privileges')->where('nom_privilege', 'Quartier')->update(['nom_privilege' => 'Commune']);
    }

    public function down()
    {
        DB::table('privileges')->where('nom_privilege', 'Commune')->update(['nom_privilege' => 'Quartier']);
    }
}
