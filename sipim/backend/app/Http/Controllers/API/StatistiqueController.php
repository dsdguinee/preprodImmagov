<?php

namespace App\Http\Controllers\API;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

/**
 * Etat des recettes : paiements valides d'une periode, regroupes par territoire ou par date.
 * Memes montants que les tableaux de bord (AdminDashboardController::PAIEMENTS_MONTANTS).
 */
class StatistiqueController extends BaseController
{
    // Colonnes affichees et regroupement SQL de chaque niveau
    const GROUPES = [
        'agence' => [
            'select' => "r.nom region, pr.nom prefecture, c.nom commune, COALESCE(a.nom_agence, 'Sans agence') agence",
            'group' => 'r.region_id, r.nom, pr.prefecture_id, pr.nom, c.commune_id, c.nom, a.agence_id, a.nom_agence',
            'order' => 'r.nom, pr.nom, c.nom, a.nom_agence',
        ],
        'prefecture' => [
            'select' => 'r.nom region, pr.nom prefecture',
            'group' => 'r.region_id, r.nom, pr.prefecture_id, pr.nom',
            'order' => 'r.nom, pr.nom',
        ],
        'region' => ['select' => 'r.nom region', 'group' => 'r.region_id, r.nom', 'order' => 'r.nom'],
        'jour' => ['select' => 'DATE(pm.created_at) date', 'group' => 'DATE(pm.created_at)', 'order' => '1'],
        'mois' => ['select' => "DATE_FORMAT(pm.created_at, '%Y-%m') mois", 'group' => "DATE_FORMAT(pm.created_at, '%Y-%m')", 'order' => '1'],
    ];

    // GET /paiement/etat-recettes?date_debut&date_fin&groupe&region_id&prefecture_id&agence_id
    public function etatRecettes(Request $request){
        $validator = Validator::make($request->query(), [
            'date_debut' => 'required|date_format:Y-m-d',
            'date_fin' => 'required|date_format:Y-m-d|after_or_equal:date_debut',
            'groupe' => 'nullable|in:' . implode(',', array_keys(self::GROUPES)),
        ], [
            'date_debut.required' => 'Choisissez une date de début.',
            'date_debut.date_format' => 'La date de début est invalide.',
            'date_fin.required' => 'Choisissez une date de fin.',
            'date_fin.date_format' => 'La date de fin est invalide.',
            'date_fin.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
            'groupe.in' => 'Regroupement inconnu.',
        ]);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => Response::HTTP_UNPROCESSABLE_ENTITY, 'messages' => $validator->errors()->all()]);

        try {
            $groupe = self::GROUPES[$request->query('groupe', 'agence')];
            $where = ' WHERE pm.status = 1 AND pm.created_at BETWEEN ? AND ?';
            $bind = [$request->query('date_debut') . ' 00:00:00', $request->query('date_fin') . ' 23:59:59'];
            foreach (['region_id' => 'r.region_id', 'prefecture_id' => 'pr.prefecture_id', 'agence_id' => 'pm.agence_id'] as $param => $colonne) {
                if ((int) $request->query($param) > 0) {
                    $where .= " AND $colonne = ?";
                    $bind[] = (int) $request->query($param);
                }
            }
            $operation = DirecteurDashboardController::OPERATION;
            $lignes = DB::select('SELECT ' . $groupe['select'] . ',
                    COUNT(*) paiements,
                    SUM(' . $operation . " = 'immatriculation') immatriculations,
                    SUM(" . $operation . " = 'reimmatriculation') reimmatriculations,
                    SUM(" . $operation . " = 'mutation') mutations,
                    SUM(" . $operation . " = 'reforme') reformes,
                    SUM(" . $operation . " = 'services') services,
                    SUM(pm.mvg) vignette, SUM(pm.mcg) cartegrise, SUM(pm.mau) autorisation,
                    SUM(pm.mpl) plaque, SUM(pm.mop) reforme, SUM(pm.frais) frais,
                    SUM(" . DirecteurDashboardController::TOTAL . ') total
                FROM ' . AdminDashboardController::PAIEMENTS_MONTANTS . '
                LEFT JOIN agences a ON a.agence_id = pm.agence_id
                LEFT JOIN communes c ON c.commune_id = pm.commune_id
                LEFT JOIN prefectures pr ON pr.prefecture_id = c.prefecture_id
                LEFT JOIN regions r ON r.region_id = pr.region_id'
                . $where . ' GROUP BY ' . $groupe['group'] . ' ORDER BY ' . $groupe['order'], $bind);

            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'lignes' => $lignes]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
}
