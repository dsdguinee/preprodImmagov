<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Catégorie des organismes publics, comme dans SIPIM : « Ministère » (ministères et institutions de l'État,
 * client Gouvernement) ou « Entreprise Publique » (client Entreprise Publique). Vide pour les autres organismes.
 * À l'immatriculation, la liste des organismes est filtrée selon le type de client du paiement,
 * pour ne pas mélanger ministères et entreprises publiques.
 */
return new class extends Migration
{
    const PREFIXES_ETAT = ['MINISTERE', 'PRESIDENCE DE LA REPUBLIQUE', 'PRIMATURE', 'SECRETARIAT GENERAL'];

    public function up()
    {
        Schema::table('ministeres', function (Blueprint $table) {
            $table->string('categorie', 30)->nullable()->after('typeorganisme')->index();
        });
        // Entreprises publiques de la liste SIPIM, ajoutées par la migration précédente
        $entreprises = (new ReflectionClass(require __DIR__.'/2026_10_23_130000_ajouter_entreprises_publiques_sipim.php'))->getConstant('ENTREPRISES');
        $normaliser = fn ($nom) => trim(preg_replace('/\s+/', ' ', strtoupper(Str::ascii((string) $nom))));
        $entreprises = array_map($normaliser, $entreprises);
        foreach (DB::table('ministeres')->get() as $m) {
            $nom = $normaliser($m->nom);
            $categorie = in_array($nom, $entreprises, true) ? 'Entreprise Publique' : (Str::startsWith($nom, self::PREFIXES_ETAT) ? 'Ministère' : null);
            if ($categorie) DB::table('ministeres')->where('ministere_id', $m->ministere_id)->update(['categorie' => $categorie]);
        }
    }

    public function down()
    {
        Schema::table('ministeres', function (Blueprint $table) {
            $table->dropIndex(['categorie']);
            $table->dropColumn('categorie');
        });
    }
};
