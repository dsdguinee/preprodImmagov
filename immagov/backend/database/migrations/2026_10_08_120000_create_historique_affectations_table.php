<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Historique de tous ceux qui ont utilisé un véhicule : une ligne par période d'affectation
 * (organisme, direction, du … au …), ouverte à la validation de l'immatriculation ou d'une mutation,
 * close à la mutation suivante ou à la réforme. Les noms sont copiés pour que le passé ne change pas
 * si un organisme est renommé ou supprimé.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('historique_affectations', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('immatriculation_id')->index();
            $table->unsignedInteger('vehicule_id')->nullable()->index();
            $table->unsignedInteger('ministere_id')->nullable();
            $table->unsignedInteger('direction_id')->nullable();
            $table->string('ministere_nom', 255)->nullable();
            $table->string('direction_nom', 255)->nullable();
            $table->timestamp('debut')->nullable();
            $table->timestamp('fin')->nullable();
            $table->string('origine', 20);            // immatriculation | mutation | reprise
            $table->unsignedInteger('mutation_id')->nullable();
            $table->string('reference', 50)->nullable(); // référence de paiement SIPIM
            $table->string('fonction', 85)->nullable();   // fonction du détenteur (mutation)
            $table->unsignedBigInteger('valide_par')->nullable();
            $table->string('motif_fin', 20)->nullable();  // mutation | reforme
            $table->timestamps();
        });

        // Référence de paiement d'une mutation (mutation payée dans SIPIM)
        Schema::table('mutations', function (Blueprint $table) {
            $table->string('paiementReference', 50)->nullable()->after('motif');
        });

        // Reprise : une période en cours pour chaque véhicule immatriculé (aucune mutation enregistrée à ce jour)
        $maintenant = now();
        $dossiers = DB::select("select i.immatriculation_id, i.vehicule_id, i.minister_id, i.direction_id, i.autreministere, i.autredirection,
                                       coalesce(i.date_decision, i.updated_at, i.created_at) debut, i.valided_by, i.status,
                                       mi.nom ministere_nom, d.nom direction_nom
                                from immatriculations i
                                left join ministeres mi on mi.ministere_id = i.minister_id
                                left join directions d on d.direction_id = i.direction_id
                                where i.status in (1, 3, 4)");
        foreach ($dossiers as $d) {
            DB::table('historique_affectations')->insert([
                'immatriculation_id' => $d->immatriculation_id,
                'vehicule_id' => $d->vehicule_id,
                'ministere_id' => $d->ministere_nom ? $d->minister_id : null,
                'direction_id' => $d->direction_nom ? $d->direction_id : null,
                'ministere_nom' => $d->ministere_nom ?: ($d->autreministere ?: null),
                'direction_nom' => $d->direction_nom ?: ($d->autredirection ?: null),
                'debut' => $d->debut,
                'fin' => null,
                'origine' => 'reprise',
                'valide_par' => $d->valided_by,
                'created_at' => $maintenant,
                'updated_at' => $maintenant,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('historique_affectations');
        Schema::table('mutations', function (Blueprint $table) {
            $table->dropColumn('paiementReference');
        });
    }
};
