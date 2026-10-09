<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAutorisationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('autorisations', function (Blueprint $table) {
            $table->increments('autorisation_id');
            $table->string('nomAutorisation',150)->nullable(false)->comment('Les autorisations de transport');
            $table->decimal('montant',15,1)->default(0);
            $table->unsignedInteger('categorie_id')->nullable(false);
            $table->foreign('categorie_id')->references('categorie_id')->on('categories')->onDelete('restrict');
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
        Schema::dropIfExists('autorisations');
    }
}
