<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTypeVigsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('type_vigs', function (Blueprint $table) {
            $table->increments('typevig_id');
            $table->string('nomType',150)->nullable(false);
            $table->unsignedInteger('typecg_id');
            $table->foreign('typecg_id')->references('typecg_id')->on('type_cgs')->onDelete('restrict');
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
        Schema::dropIfExists('type_vigs');
    }
}
