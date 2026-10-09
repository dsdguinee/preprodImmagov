<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateManifestesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('manifestes', function (Blueprint $table) {
            $table->unsignedBigInteger('mrn_id');
            $table->integer('nbreBL')->nullable(false);
            $table->integer('conteneurvingtft')->default(0);
            $table->integer('conteneurvingtftexo')->default(0);
            $table->integer('conteneurquaranteft')->default(0);
            $table->integer('conteneurquaranteftexo')->default(0);
            $table->integer('conteneurquarantecinq')->default(0);
            $table->integer('conteneurquarantecinqexo')->default(0);
            $table->integer('poids')->default(0);
            $table->integer('poidsexo')->default(0);
            $table->integer('roro')->default(0);
            $table->integer('roroexo')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('manifestes');
    }
}
