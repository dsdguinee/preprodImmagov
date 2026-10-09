<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Les photos du vehicule (face, profil, dos) ne sont plus demandees : seule la lettre (lettreImage) est conservee.
 * Les chemins existants ont ete sauvegardes dans storage/app/backups/vehicules_photos_2026-10-07.json ;
 * les fichiers restent dans storage/app/public/documents/{faceImage,profileImage,backImage}.
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
        Schema::table('vehicules', function (Blueprint $table) {
            $table->dropColumn(['faceImage', 'profileImage', 'backImage']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('vehicules', function (Blueprint $table) {
            $table->string('faceImage', 255)->nullable();
            $table->string('profileImage', 255)->nullable();
            $table->string('backImage', 255)->nullable();
        });
    }
};
