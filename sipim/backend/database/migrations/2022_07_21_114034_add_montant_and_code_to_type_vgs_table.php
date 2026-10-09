<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMontantAndCodeToTypeVgsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('type_vgs', function (Blueprint $table) {
//            $table->decimal('montant',15,1)->default(0)->comment('Montant de la vignette correspondante');;
            $table->string('code',20)->default(null)->nullable(true)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('type_vgs', function (Blueprint $table) {
//            $table->dropColumn('montant');$table->dropColumn('code');
        });
    }
}
