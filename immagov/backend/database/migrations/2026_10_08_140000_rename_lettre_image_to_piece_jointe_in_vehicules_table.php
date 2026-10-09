<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * « Lettre » devient « Pièce jointe » : la colonne vehicules.lettreImage est renommée pieceJointe.
 * Les chemins enregistrés (documents/lettreImage/…) restent valables : les fichiers ne sont pas déplacés.
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
        DB::statement('ALTER TABLE vehicules RENAME COLUMN lettreImage TO pieceJointe');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('ALTER TABLE vehicules RENAME COLUMN pieceJointe TO lettreImage');
    }
};
