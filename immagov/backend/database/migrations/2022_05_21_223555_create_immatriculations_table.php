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
        Schema::create('immatriculations', function (Blueprint $table) {
            $table->increments('immatriculation_id');
            $table->unsignedInteger('vehicule_id')->nullable(false);
            $table->string('modeImmatriculation')->nullable(false);
            $table->string('ancienImmatriculation')->nullable(true)->default(null);
            $table->string('immatriculation_number')->nullable(false)->unique();
            $table->unsignedInteger('minister_id')->nullable(false);
            $table->unsignedInteger('direction_id')->nullable(true);
            $table->unsignedInteger('user_id')->nullable(false);
            $table->boolean('status')->default(false);
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
        Schema::dropIfExists('immatriculations');
    }
};
