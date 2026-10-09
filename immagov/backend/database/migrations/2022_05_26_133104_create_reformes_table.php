<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('reformes', function (Blueprint $table) {
            $table->increments('reforme_id');
            $table->unsignedInteger('immatriculation_id')->nullable(false)->unique();
            $table->string('nom',150)->nullable(false);
            $table->string('prenom',150)->nullable(false);
            $table->date('date_naissance')->nullable(false);
            $table->string('fonction')->nullable(false);
            $table->unsignedInteger('ministere_id')->nullable(false);
            $table->unsignedInteger('direction_id')->nullable(false);
            $table->string('piece',255)->nullable(false);
            $table->string('paiement',255)->nullable(false);
            $table->unsignedInteger('user_id')->nullable(false);
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
        Schema::dropIfExists('reformes');
    }
};
