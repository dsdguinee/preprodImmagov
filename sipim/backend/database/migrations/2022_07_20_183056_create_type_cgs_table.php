<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTypeCgsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('type_cgs', function (Blueprint $table) {
            $table->increments('typecg_id');
            $table->string('nomType',150)->nullable(false)->comment('type de carte de carte grise');
            $table->unsignedInteger('categorie_id');
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
        Schema::dropIfExists('type_cgs');
    }
}
