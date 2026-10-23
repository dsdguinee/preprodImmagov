<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Il n'y a plus d'organisme privé : tout organisme est un ministère / une institution ou une entreprise publique.
 * Les organismes privés (ou sans catégorie) deviennent des entreprises publiques (« Publique »).
 */
return new class extends Migration
{
    public function up()
    {
        foreach (DB::table('ministeres')->where(fn ($q) => $q->whereNull('categorie')->orWhere('typeorganisme', '<>', 'Publique'))->get() as $m) {
            DB::table('ministeres')->where('ministere_id', $m->ministere_id)->update([
                'typeorganisme' => 'Publique',
                'categorie' => $m->categorie ?: 'Entreprise Publique',
            ]);
            echo "  Entreprise publique : {$m->nom}".PHP_EOL;
        }
    }

    public function down()
    {
        // Le classement précédent n'est pas conservé : rien à rétablir
    }
};
