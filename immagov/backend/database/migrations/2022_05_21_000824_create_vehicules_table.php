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
        Schema::create('vehicules', function (Blueprint $table) {
            $table->increments('vehicule_id');
            $table->integer('marque_id')->nullable(false);
            $table->integer('model_id')->nullable(false);
            $table->string('type')->nullable(false);
            $table->string('numChassie',20)->nullable(false);
            $table->string('carosserie',20)->nullable(false);
            $table->smallInteger('placeNumberAssis')->default(0);
            $table->smallInteger('placeNumberDebout')->default(0);
            $table->smallInteger('nbPorte')->default(0);
            $table->integer('kilometrage')->default(0);
            $table->smallInteger('cylinderNumber')->default(0)->nullable(false);
            $table->smallInteger('madeYear')->default(1900)->nullable(false);
            $table->date('releaseYear')->nullable(false);
            $table->string('energy',50)->nullable(false);
            $table->string('provenance',70)->nullable(false);
            $table->string('genreVehicule',50)->nullable(false);
            $table->string('colorVehicule',50)->nullable(false);
            $table->string('acquisition',30)->nullable(false);

            $table->string('lettreImage',255)->nullable(false);
            $table->string('faceImage',255)->nullable(false);
            $table->string('profileImage',255)->nullable(false);
            $table->string('backImage',255)->nullable(false);
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
        Schema::dropIfExists('vehicules');
    }
};
