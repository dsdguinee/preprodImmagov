<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Disponibilité des véhicules du parc automobile.
 * Une ligne par période d'indisponibilité : fiche technique scannée obligatoire, autre preuve facultative.
 * Le véhicule redevient disponible quand la période est levée (statut 0). Historique conservé.
 * Gestion réservée au privilège « Disponibilité », donné au rôle « Direction Générale GG ».
 */
return new class extends Migration
{
    const PRIVILEGE = 'Disponibilité';
    const ROLE = 'Direction Générale GG';

    public function up()
    {
        Schema::create('indisponibilites', function (Blueprint $table) {
            $table->id('indisponibilite_id');
            $table->unsignedInteger('immatriculation_id');
            $table->string('motif', 50);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->string('fiche_technique');
            $table->string('preuve')->nullable();
            $table->boolean('statut')->default(1)->comment('1 = en cours (véhicule indisponible), 0 = levée');
            $table->unsignedBigInteger('declare_par');
            $table->date('date_fin')->nullable();
            $table->text('commentaire_levee')->nullable();
            $table->unsignedBigInteger('leve_par')->nullable();
            $table->timestamps();
            $table->index(['immatriculation_id', 'statut']);
        });

        $now = Carbon::now();
        $privilegeId = DB::table('privileges')->where('nom', self::PRIVILEGE)->value('privilege_id')
            ?: DB::table('privileges')->insertGetId(['nom' => self::PRIVILEGE]);
        $roleId = DB::table('roles')->where('nom_role', self::ROLE)->value('role_id');
        if ($roleId) {
            if (!DB::table('role_privileges')->where(['role_id' => $roleId, 'privilege_id' => $privilegeId])->exists())
                DB::table('role_privileges')->insert(['role_id' => $roleId, 'privilege_id' => $privilegeId]);
            foreach (DB::table('users')->where('role_id', $roleId)->pluck('id') as $userId) {
                if (!DB::table('user_privileges')->where(['user_id' => $userId, 'privilege_id' => $privilegeId])->exists())
                    DB::table('user_privileges')->insert(['user_id' => $userId, 'privilege_id' => $privilegeId, 'status' => 1, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }

    public function down()
    {
        $privilegeId = DB::table('privileges')->where('nom', self::PRIVILEGE)->value('privilege_id');
        if ($privilegeId) {
            DB::table('user_privileges')->where('privilege_id', $privilegeId)->delete();
            DB::table('role_privileges')->where('privilege_id', $privilegeId)->delete();
            DB::table('privileges')->where('privilege_id', $privilegeId)->delete();
        }
        Schema::dropIfExists('indisponibilites');
    }
};
