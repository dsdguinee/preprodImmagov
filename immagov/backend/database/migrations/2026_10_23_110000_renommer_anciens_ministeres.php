<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Anciens organismes renommés au nom officiel du gouvernement (liste SIPIM).
 * L'ancien organisme garde son identifiant, donc ses dossiers ; le doublon ajouté par
 * 2026_10_23_100000_aligner_ministeres_sur_sipim est retiré s'il n'est rattaché à aucun dossier
 * (sinon ses rattachements sont reportés sur l'ancien organisme).
 */
return new class extends Migration
{
    // Ancien nom => nom officiel
    const RENOMMAGES = [
        "MINISTERE des Mines" => "MINISTÈRE DES MINES ET DE LA GÉOLOGIE",
        // L'Énergie a désormais son propre ministère : l'hydraulique et les hydrocarbures relèvent de l'Assainissement
        "MINISTERE DE L'ENERGIE, DE L'HYDRAULIQUE ET DES HYDROCARBURES" => "MINISTÈRE DE L'ASSAINISSEMENT, DE L'HYDRAULIQUE ET DES HYDROCARBURES",
        "MINISTERE DES TRANSPORTS" => "MINISTÈRE DES TRANSPORTS",
        "MINISTERE DE L'ENERGIE" => "MINISTÈRE DE L'ÉNERGIE",
    ];

    // Colonnes qui rattachent un dossier à un organisme
    const RATTACHEMENTS = [
        ['immatriculations', 'minister_id'],
        ['directions', 'ministere_id'],
        ['historique_affectations', 'ministere_id'],
        ['mutations', 'ancienMinistere_id'],
        ['reformes', 'ministere_id'],
    ];

    public function up()
    {
        $this->renommer(self::RENOMMAGES);
    }

    public function down()
    {
        $this->renommer(array_flip(self::RENOMMAGES), false);
    }

    private function renommer(array $renommages, $fusionner = true)
    {
        // Comparaison exacte (BINARY) : « MINISTERE … » et « MINISTÈRE … » sont deux noms distincts à l'affichage
        $trouver = fn ($nom) => DB::table('ministeres')->whereRaw('BINARY nom = ?', [$nom])->first();
        foreach ($renommages as $ancien => $officiel) {
            $source = $trouver($ancien);
            if (!$source) continue;
            $doublon = $trouver($officiel);
            if ($doublon && $doublon->ministere_id != $source->ministere_id) {
                if (!$fusionner) continue;
                foreach (self::RATTACHEMENTS as [$table, $colonne])
                    DB::table($table)->where($colonne, $doublon->ministere_id)->update([$colonne => $source->ministere_id]);
                DB::table('ministeres')->where('ministere_id', $doublon->ministere_id)->delete();
            }
            DB::table('ministeres')->where('ministere_id', $source->ministere_id)->update(['nom' => $officiel, 'typeorganisme' => 'Publique']);
            echo "  {$ancien} => {$officiel}".PHP_EOL;
        }
    }
};
