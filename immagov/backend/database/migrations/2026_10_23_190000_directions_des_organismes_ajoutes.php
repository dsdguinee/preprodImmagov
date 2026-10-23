<?php

use Illuminate\Database\Migrations\Migration;

/**
 * Directions prédéfinies pour les organismes qui ont reçu leur catégorie après
 * 2026_10_23_150000_predefinir_directions (ministères ajoutés par aligner_ministeres_sur_sipim,
 * entreprises publiques reclassées) : ils n'avaient aucune direction à l'immatriculation.
 * Même traitement que 150000, qui ne duplique pas les directions existantes.
 */
return new class extends Migration
{
    public function up()
    {
        (require __DIR__.'/2026_10_23_150000_predefinir_directions.php')->up();
    }

    public function down()
    {
        // Les directions ajoutées sont retirées par le down() de 2026_10_23_150000_predefinir_directions
    }
};
