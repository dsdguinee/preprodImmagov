<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Ministères alignés sur la liste SIPIM (client « Gouvernement ») pour que le ministère du paiement
 * soit retrouvé et présélectionné à l'immatriculation :
 *  - les ministères / institutions de l'État classés « Privé » passent en « Publique » ;
 *  - les ministères SIPIM absents d'immagov sont ajoutés (« Publique »).
 * Les noms sont comparés sans accents, casse ni espaces ; les organismes existants ne sont pas renommés.
 */
return new class extends Migration
{
    // Même liste que la migration SIPIM 2026_10_23_000000_creer_ministeres
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

    // Institutions de l'État reconnues à leur nom
    const PREFIXES_ETAT = ['MINISTERE', 'PRESIDENCE DE LA REPUBLIQUE', 'PRIMATURE', 'SECRETARIAT GENERAL'];

    private static function normaliser($nom)
    {
        return trim(preg_replace('/\s+/', ' ', strtoupper(Str::ascii((string) $nom))));
    }

    public function up()
    {
        foreach (DB::table('ministeres')->get() as $m) {
            $nom = self::normaliser($m->nom);
            if ($m->typeorganisme !== 'Publique' && Str::startsWith($nom, self::PREFIXES_ETAT)) {
                DB::table('ministeres')->where('ministere_id', $m->ministere_id)->update(['typeorganisme' => 'Publique']);
                echo "  Passé en Publique : {$m->nom}".PHP_EOL;
            }
        }

        $existants = DB::table('ministeres')->pluck('nom')->map(fn ($n) => self::normaliser($n))->all();
        foreach (self::MINISTERES as $nom) {
            if (!in_array(self::normaliser($nom), $existants, true))
                DB::table('ministeres')->insert(['nom' => $nom, 'typeorganisme' => 'Publique']);
        }
    }

    public function down()
    {
        // Retire les ministères ajoutés qui ne sont rattachés à aucun dossier ; le passage en « Publique » est conservé
        $utilises = collect([
            DB::table('immatriculations')->pluck('minister_id'),
            DB::table('directions')->pluck('ministere_id'),
            DB::table('historique_affectations')->pluck('ministere_id'),
            DB::table('mutations')->pluck('ancienMinistere_id'),
            DB::table('reformes')->pluck('ministere_id'),
        ])->flatten()->filter()->unique()->all();
        DB::table('ministeres')->whereIn('nom', self::MINISTERES)->whereNotIn('ministere_id', $utilises)->delete();
    }
};
