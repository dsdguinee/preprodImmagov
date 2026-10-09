<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaiementsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */

    public function up()
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->bigIncrements('paiement_id');
            $table->string('typeClient',150)->nullable(false)->comment('valeur:Particulier,Societe');
            $table->string('modeExp',150)->nullable(false)->comment('valeur:usage Personnel,Transport');
            $table->string('fullName',180)->nullable(false)->comment('Nom de la societe ou de la personne.');
            $table->string('tel',80)->nullable(false)->comment('Numero de telephone');
            $table->string("nif",40)->nullable(true);
            $table->string('chassis',40)->nullable(false)->comment("Numero de Chassis");
            $table->tinyInteger('modeImma')->nullable(false)->comment("Mode d'immatriculation");
            $table->unsignedInteger('categorie_id')->nullable(false);
            $table->unsignedInteger('typeCg')->nullable(false)->comment("type de Carte grise");
            $table->unsignedInteger("typeVignette")->nullable(false)->comment("type de Vignette");
            $table->unsignedInteger("autorisation_id")->nullable(true)->default(0)->comment("Autorisation de Transport");
            $table->unsignedBigInteger("pv")->nullable(true)->default(0)->comment("Poids Total Autorisé à Charge");
            $table->unsignedBigInteger("cu")->nullable(true)->default(0)->comment("Charge Utile");
            $table->integer("user_id");
            $table->foreign('categorie_id')->references('categorie_id')->on('categories');
            $table->foreign('typeCg')->references('typeCg')->on('type_cgs');
            $table->foreign('typeVignette')->references('typeVignette')->on('type_vgs');
            $table->foreign('autorisation_id')->references('autorisation_id')->on('autorisations');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
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
        Schema::dropIfExists('paiements');
    }
}
