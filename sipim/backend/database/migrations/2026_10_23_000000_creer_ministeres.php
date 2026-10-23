<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ministères et institutions proposés quand le client est « Gouvernement ».
 * Liste initiale : Présidence, Primature et gouvernement remanié le 27 juillet 2026 ;
 * elle est ensuite tenue à jour par l'administrateur (privilège « Ministère »).
 * Le paiement garde le ministère choisi (paiements.ministere_id).
 */
class CreerMinisteres extends Migration
{
    const PRIVILEGE = 'Ministère';
    const ROLE_ADMIN = 'Administrateur';

    const MINISTERES = [
        "PRÉSIDENCE DE LA RÉPUBLIQUE",
        "PRIMATURE",
        "MINISTÈRE DE LA JUSTICE ET DES DROITS DE L'HOMME",
        "MINISTÈRE DE LA DÉFENSE NATIONALE",
        "MINISTÈRE DE L'ADMINISTRATION DU TERRITOIRE ET DE LA DÉCENTRALISATION",
        "MINISTÈRE DE LA SÉCURITÉ ET DE LA PROTECTION CIVILE",
        "MINISTÈRE DES AFFAIRES ÉTRANGÈRES, DE L'INTÉGRATION AFRICAINE ET DES GUINÉENS ÉTABLIS À L'ÉTRANGER",
        "MINISTÈRE DE L'ÉCONOMIE, DES FINANCES ET DU BUDGET",
        "MINISTÈRE DU PLAN, DE LA COOPÉRATION INTERNATIONALE ET DU DÉVELOPPEMENT",
        "MINISTÈRE DE L'EMPLOI, DU TRAVAIL ET DE LA PROTECTION SOCIALE",
        "MINISTÈRE DE LA MODERNISATION DE L'ADMINISTRATION ET DE LA FONCTION PUBLIQUE",
        "MINISTÈRE DES MINES ET DE LA GÉOLOGIE",
        "MINISTÈRE DE L'AGRICULTURE",
        "MINISTÈRE DE L'ÉLEVAGE",
        "MINISTÈRE DE LA PÊCHE ET DE L'ÉCONOMIE MARITIME",
        "MINISTÈRE DE L'INDUSTRIE ET DU COMMERCE",
        "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE",
        "MINISTÈRE DE L'ÉDUCATION NATIONALE, DE L'ALPHABÉTISATION, DE L'ENSEIGNEMENT TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE",
        "MINISTÈRE DE LA CULTURE, DU TOURISME ET DE L'ARTISANAT",
        "MINISTÈRE DE LA SANTÉ ET DE L'HYGIÈNE PUBLIQUE",
        "MINISTÈRE DE LA FEMME, DE LA FAMILLE ET DE LA SOLIDARITÉ",
        "MINISTÈRE DE LA JEUNESSE",
        "MINISTÈRE DES SPORTS",
        "MINISTÈRE DES INFRASTRUCTURES",
        "MINISTÈRE DES TRANSPORTS",
        "MINISTÈRE DE LA COMMUNICATION, DE L'ÉCONOMIE NUMÉRIQUE ET DE L'INNOVATION",
        "MINISTÈRE DE L'ENVIRONNEMENT ET DU DÉVELOPPEMENT DURABLE",
        "MINISTÈRE DE L'ÉNERGIE",
        "MINISTÈRE DE L'ASSAINISSEMENT, DE L'HYDRAULIQUE ET DES HYDROCARBURES",
        "MINISTÈRE DE L'URBANISME, DE L'HABITAT ET DE L'AMÉNAGEMENT DU TERRITOIRE",
        "SECRÉTARIAT GÉNÉRAL DU GOUVERNEMENT",
        "SECRÉTARIAT GÉNÉRAL DES AFFAIRES RELIGIEUSES",
    ];

    public function up()
    {
        Schema::create('ministeres', function (Blueprint $table) {
            $table->id('ministere_id');
            $table->string('nom', 191)->unique();
            $table->timestamps();
        });
        $now = Carbon::now();
        DB::table('ministeres')->insert(array_map(fn ($nom) => ['nom' => $nom, 'created_at' => $now, 'updated_at' => $now], self::MINISTERES));

        Schema::table('paiements', function (Blueprint $table) {
            $table->unsignedBigInteger('ministere_id')->nullable()->index()->comment('Ministère du client Gouvernement');
        });

        // Privilège de gestion des ministères, donné au rôle Administrateur et à ses utilisateurs
        $privilegeId = DB::table('privileges')->where('nom_privilege', self::PRIVILEGE)->value('privilege_id')
            ?: DB::table('privileges')->insertGetId(['nom_privilege' => self::PRIVILEGE]);
        $roleId = DB::table('roles')->where('nom_role', self::ROLE_ADMIN)->value('role_id');
        if ($roleId) {
            DB::table('role_privileges')->insertOrIgnore(['role_id' => $roleId, 'privilege_id' => $privilegeId]);
            foreach (DB::table('users')->where('role_id', $roleId)->pluck('id') as $userId) {
                if (!DB::table('user_privileges')->where(['user_id' => $userId, 'privilege_id' => $privilegeId])->exists())
                    DB::table('user_privileges')->insert(['user_id' => $userId, 'privilege_id' => $privilegeId, 'status' => 1, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }

    public function down()
    {
        $privilegeId = DB::table('privileges')->where('nom_privilege', self::PRIVILEGE)->value('privilege_id');
        if ($privilegeId) {
            DB::table('user_privileges')->where('privilege_id', $privilegeId)->delete();
            DB::table('role_privileges')->where('privilege_id', $privilegeId)->delete();
            DB::table('privileges')->where('privilege_id', $privilegeId)->delete();
        }
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex(['ministere_id']);
            $table->dropColumn('ministere_id');
        });
        Schema::dropIfExists('ministeres');
    }
}
