<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Un organisme public est un ministère / une institution ou une entreprise publique (catégorie renseignée).
 * ASHANTI est une entreprise publique ; les autres organismes « Publique » sans catégorie deviennent « Privé ».
 */
return new class extends Migration
{
    // Organismes publics sans catégorie identifiés comme entreprises publiques
    const ENTREPRISES_PUBLIQUES = ['ASHANTI'];

    public function up()
    {
        DB::table('ministeres')->whereIn('nom', self::ENTREPRISES_PUBLIQUES)->update(['typeorganisme' => 'Publique', 'categorie' => 'Entreprise Publique']);
        foreach (DB::table('ministeres')->where('typeorganisme', 'Publique')->whereNull('categorie')->get() as $m) {
            DB::table('ministeres')->where('ministere_id', $m->ministere_id)->update(['typeorganisme' => 'Privé']);
            echo "  Passé en Privé : {$m->nom}".PHP_EOL;
        }
    }

    public function down()
    {
        // Le classement précédent n'est pas conservé : rien à rétablir
    }
};
