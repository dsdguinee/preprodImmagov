<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AjouterTrancheAuxTypeVgs extends Migration
{
    /**
     * Tranche de puissance fiscale (CV) des vignettes, sur le modèle de type_cgs (signe, capacite, unite).
     * Sans tranche, la vignette convient à toute puissance de sa catégorie.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('type_vgs', function (Blueprint $table) {
            $table->string('capacite', 15)->nullable()->after('typecg_id')->comment('« , » = compris entre');
            $table->char('signe', 5)->nullable()->after('capacite')->comment('<, <=, >, >=, ! (bornes exclues), >,<=, >=,<');
            $table->string('unite', 25)->nullable()->after('signe')->comment('CV=Puissance fiscale');
        });

        // Tranches lues dans le libellé des vignettes existantes
        $tranches = [
            "Voiture jusqu'à 12 CV" => ['<=', '12', 'CV'],
            'Voiture entre 13 à 19 CV' => ['>,<=', '12,19', 'CV'],
            'Voiture Supérieur à 19 CV' => ['>', '19', 'CV'],
        ];
        foreach ($tranches as $nomType => [$signe, $capacite, $unite])
            DB::table('type_vgs')->where('nomType', $nomType)->update(['signe' => $signe, 'capacite' => $capacite, 'unite' => $unite]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('type_vgs', function (Blueprint $table) {
            $table->dropColumn(['capacite', 'signe', 'unite']);
        });
    }
}
