<?php

namespace App\Http\Controllers\API;

use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

// Tableau de bord du guichet : l'agent ne voit que ses propres paiements
class AgentDashboardController extends BaseController
{
    // Documents + plaque (IT 300 000, EP/VA 350 000, comme la facture) + montant saisi (reforme)
    // + frais de service
    const MONTANT = "(COALESCE(vg.montant,0) + COALESCE(cg.montant,0) + COALESCE(au.montant,0)
                      + COALESCE(p.montant_operation,0)
                      + CASE COALESCE(NULLIF(p.type_plaque,''), p.type_document)
                             WHEN 'IT' THEN 300000 WHEN 'EP' THEN 350000 WHEN 'VA' THEN 350000 ELSE 0 END
                      + CASE WHEN p.categorie_id = 4 THEN 30000
                             WHEN p.categorie_id IN (2,3) THEN 20000
                             WHEN p.categorie_id = 1 THEN 10000
                             ELSE 0 END)";

    const JOINTURES_MONTANT = " LEFT JOIN type_vgs vg ON vg.typevg_id = p.typeVignette
                                LEFT JOIN type_cgs cg ON cg.typecg_id = p.typeCg
                                LEFT JOIN autorisations au ON au.autorisation_id = p.autorisation_id";

    // Document dont la date d'expiration approche, sans paiement plus récent pour le même châssis.
    // Vignette et autorisation : dateExp vaut le 1er janvier de l'année payée, valable jusqu'au 31 décembre.
    private function expirations($table, $libelle, $user_id, $debut, $fin, $finAnnee = false){
        $expiration = $finAnnee ? "DATE(CONCAT(YEAR(d.dateExp), '-12-31'))" : 'DATE(d.dateExp)';
        return "SELECT p.paiement_id, p.fullName, p.tel, p.chassis, '$libelle' document, $expiration dateExp
                FROM $table d JOIN paiements p ON p.paiement_id = d.paiement_id
                WHERE p.user_id = $user_id AND p.status = 1 AND $expiration BETWEEN '$debut' AND '$fin'
                AND NOT EXISTS (SELECT 1 FROM $table d2 JOIN paiements p2 ON p2.paiement_id = d2.paiement_id
                                WHERE TRIM(p2.chassis) = TRIM(p.chassis) AND d2.dateExp > d.dateExp)";
    }

    public function index(Request $request){
        try {
            $user = Auth::user();
            $uid = (int) $user->id;
            $now = Carbon::now();
            $aujourdhui = $now->copy()->startOfDay();
            $debutMois = $now->copy()->startOfMonth();

            $jour = DB::select('SELECT COUNT(*) saisis, SUM(p.status = 1) valides,
                    SUM(CASE WHEN p.status = 1 THEN ' . self::MONTANT . ' ELSE 0 END) montant
                    FROM paiements p' . self::JOINTURES_MONTANT . '
                    WHERE p.user_id = ? AND p.created_at >= ?', [$uid, $aujourdhui])[0];

            // Moyenne sur les jours où l'agent a effectivement saisi (30 derniers jours, aujourd'hui exclu)
            $moyenne = DB::select('SELECT COUNT(*) / NULLIF(COUNT(DISTINCT DATE(created_at)), 0) moyenne
                    FROM paiements WHERE user_id = ? AND created_at >= ? AND created_at < ?',
                [$uid, $aujourdhui->copy()->subDays(30), $aujourdhui])[0]->moyenne;

            // Statut 0 = nouveau, 4 = resoumis : tous deux attendent une validation
            $attente = DB::select('SELECT COUNT(*) nombre, MIN(created_at) plusAncien
                    FROM paiements WHERE user_id = ? AND status IN (0,4)', [$uid])[0];

            $rejetes = DB::select('SELECT p.paiement_id, p.reference, p.fullName, p.type_document, r.motif,
                    COALESCE(r.created_at, p.updated_at) date
                    FROM paiements p LEFT JOIN paiement_rejetes r ON r.paiement_id = p.paiement_id
                    WHERE p.user_id = ? AND p.status = 2 ORDER BY date DESC', [$uid]);

            $aResoumettre = DB::select('SELECT p.paiement_id, p.reference, p.fullName, p.type_document, p.updated_at date
                    FROM paiements p WHERE p.user_id = ? AND p.status = 3 AND p.isautoriser = 1
                    ORDER BY p.updated_at ASC', [$uid]);

            $paiementsJour = DB::select('SELECT p.paiement_id, p.reference, p.fullName, p.chassis, p.type_document,
                    p.status, p.created_at, ' . self::MONTANT . ' montant
                    FROM paiements p' . self::JOINTURES_MONTANT . '
                    WHERE p.user_id = ? AND p.created_at >= ? ORDER BY p.created_at DESC', [$uid, $aujourdhui]);

            $activite = DB::select('SELECT DATE(created_at) jour, COUNT(*) nombre FROM paiements
                    WHERE user_id = ? AND created_at >= ? GROUP BY 1 ORDER BY 1',
                [$uid, $aujourdhui->copy()->subDays(20)]);

            $mois = DB::select('SELECT COUNT(*) nombre, SUM(status = 2) rejetes FROM paiements
                    WHERE user_id = ? AND created_at >= ?', [$uid, $debutMois])[0];
            $agenceMois = DB::select('SELECT COUNT(*) nombre, SUM(status = 2) rejetes FROM paiements
                    WHERE agence_id = ? AND created_at >= ?', [$user->agence_id, $debutMois])[0];

            // Encaissements validés du mois, par composante, et même durée écoulée le mois précédent
            $sqlEncaissements = 'SELECT SUM(COALESCE(cg.montant,0)) cartegrise, SUM(COALESCE(vg.montant,0)) vignette,
                    SUM(COALESCE(au.montant,0)) autorisation,
                    SUM(CASE COALESCE(NULLIF(p.type_plaque,\'\'), p.type_document)
                        WHEN \'IT\' THEN 300000 WHEN \'EP\' THEN 350000 WHEN \'VA\' THEN 350000 ELSE 0 END) plaque,
                    SUM(CASE WHEN p.categorie_id = 4 THEN 30000 WHEN p.categorie_id IN (2,3) THEN 20000
                        WHEN p.categorie_id = 1 THEN 10000 ELSE 0 END) frais,
                    SUM(COALESCE(p.montant_operation,0)) operation,
                    COUNT(*) nombre
                    FROM paiements p' . self::JOINTURES_MONTANT . '
                    WHERE p.user_id = ? AND p.status = 1 AND p.created_at BETWEEN ? AND ?';
            $encaissements = DB::select($sqlEncaissements, [$uid, $debutMois, $now])[0];
            $encaissementsPrecedents = DB::select($sqlEncaissements,
                [$uid, $debutMois->copy()->subMonthNoOverflow(), $now->copy()->subMonthNoOverflow()])[0];

            $debut = $aujourdhui->toDateString();
            $fin = $now->copy()->addDays(30)->toDateString();
            $renouvellements = DB::select($this->expirations('paiement_vignettes', 'Vignette', $uid, $debut, $fin, true)
                . ' UNION ALL ' . $this->expirations('paiement_carte_grises', 'Carte grise', $uid, $debut, $fin)
                . ' UNION ALL ' . $this->expirations('paiement_autorisations', 'Autorisation de transport', $uid, $debut, $fin, true)
                . ' ORDER BY dateExp ASC LIMIT 50');

            return response()->json(['success' => true, 'status' => Response::HTTP_OK,
                'jour' => $jour, 'moyenne' => $moyenne, 'attente' => $attente,
                'rejetes' => $rejetes, 'aResoumettre' => $aResoumettre, 'paiementsJour' => $paiementsJour,
                'activite' => $activite, 'mois' => $mois, 'agenceMois' => $agenceMois,
                'encaissements' => $encaissements, 'encaissementsPrecedents' => $encaissementsPrecedents,
                'renouvellements' => $renouvellements]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
}
