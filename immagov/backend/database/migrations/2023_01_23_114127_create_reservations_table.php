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
        Schema::create('reservations', function (Blueprint $table) {
            $table->bigIncrements('reservation_id');
            $table->string('nomReservation',150)->nullable(false)->comment("Le nom de la reservation");
            $table->unsignedInteger('initial')->nullable(false)->comment("l'interval initial");
            $table->unsignedInteger('final')->nullable(false)->comment("l'interval final");
            $table->unsignedBigInteger('user_id')->nullable(false);
            $table->enum('modeImmatriculation',['VA','EP'])->nullable(false);
            $table->tinyInteger('status')->default(0)->comment('0=interval non bouclé,1=interval bouclé');
            $table->foreign('user_id')->references('id')->on('users');

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
        Schema::dropIfExists('reservations');
    }
};
