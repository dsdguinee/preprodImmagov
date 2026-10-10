<?php

namespace App\Http\Controllers\API;

use App\Models\Role;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tableau de bord du directeur : pilotage des recettes et de l'activite (lecture seule).
 * Memes montants que le tableau de bord administrateur (PAIEMENTS_MONTANTS).
 */
class DirecteurDashboardController extends AdminDashboardController
{
    const TOTAL = '(pm.mvg + pm.mcg + pm.mau + pm.mop + pm.mpl + pm.frais)';
    // Immatriculation / reimmatriculation (carte grise ou plaque), mutation, reforme, sinon autres services
    const OPERATION = "CASE WHEN pm.type_document IN ('mutation','reforme') THEN pm.type_document
                            WHEN pm.typeCg <> 0 OR pm.type_plaque IN ('EP','VA') OR pm.type_document = 'IT'
                                 THEN CASE WHEN pm.modeImma = 2 THEN 'reimmatriculation' ELSE 'immatriculation' END
                            ELSE 'services' END";
    const SEUIL_REJET = 0.05;

    // Directeur, ou administrateur
    private function autorise($role_id){
        $role = Role::find($role_id);
        return $role && ($role->nom_role === 'Directeur' || (int) $role->type === 3);
    }

    public function index(Request $request){
        if (!$this->autorise(Auth::user()->role_id))
            return response()->json(['success' => false, 'status' => Response::HTTP_FORBIDDEN,
                'messages' => ['erreur' => 'Accès réservé au directeur.']]);

        try {
            $periode = in_array($request->query('periode'), ['jour', 'mois', 'annee', 'perso']) ? $request->query('periode') : 'mois';
            if ($periode === 'perso') {
                $validator = Validator::make($request->query(), [
                    'date_debut' => 'required|date_format:Y-m-d',
                    'date_fin' => 'required|date_format:Y-m-d|after_or_equal:date_debut',
                ], [
                    'date_debut.required' => 'Choisissez une date de début.',
                    'date_debut.date_format' => 'La date de début est invalide.',
                    'date_fin.required' => 'Choisissez une date de fin.',
                    'date_fin.date_format' => 'La date de fin est invalide.',
                    'date_fin.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
                ]);
                if ($validator->fails())
                    return response()->json(['success' => false, 'status' => Response::HTTP_UNPROCESSABLE_ENTITY,
                        'messages' => $validator->errors()->all()]);
            }
            $agence_id = (int) $request->query('agence_id', 0);
            [$debut, $fin, $debutPrec, $finPrec] = $this->periodes($periode, $request->query('date_debut'), $request->query('date_fin'));

            $agence = $agence_id > 0 ? ' AND pm.agence_id = ?' : '';
            $agenceBind = $agence_id > 0 ? [$agence_id] : [];
            $periodeWhere = ' pm.created_at BETWEEN ? AND ?' . $agence;
            $bind = array_merge([$debut, $fin], $agenceBind);
            $bindPrec = array_merge([$debutPrec, $finPrec], $agenceBind);
            $from = ' FROM ' . self::PAIEMENTS_MONTANTS;
            $valide = 'SUM(CASE WHEN pm.status = 1 THEN %s ELSE 0 END)';

            // Indicateurs de la periode et de la periode precedente de meme duree
            $kpiSql = 'SELECT COUNT(*) initie, SUM(pm.status = 1) valide, SUM(pm.status = 2) rejete, '
                . self::MONTANT_VALIDE . ' montant' . $from . ' WHERE' . $periodeWhere;
            $kpis = DB::select($kpiSql, $bind)[0];
            $kpisPrec = DB::select($kpiSql, $bindPrec)[0];

            // Cumul depuis le 1er janvier, compare a la meme date l'an dernier
            $now = Carbon::now();
            $cumulSql = 'SELECT ' . self::MONTANT_VALIDE . ' montant' . $from . ' WHERE pm.created_at BETWEEN ? AND ?' . $agence;
            $cumul = [
                'montant' => DB::select($cumulSql, array_merge([$now->copy()->startOfYear(), $now], $agenceBind))[0]->montant,
                'montantPrec' => DB::select($cumulSql, array_merge([$now->copy()->subYear()->startOfYear(), $now->copy()->subYear()], $agenceBind))[0]->montant,
            ];

            // Recettes validees par source sur la periode
            $sources = DB::select('SELECT ' . implode(', ', array_map(function ($champ, $alias) use ($valide) {
                    return sprintf($valide, 'pm.' . $champ) . ' ' . $alias;
                }, ['mvg', 'mcg', 'mau', 'mpl', 'mop', 'frais'], ['vignette', 'cartegrise', 'autorisation', 'plaque', 'reforme', 'frais']))
                . $from . ' WHERE' . $periodeWhere, $bind)[0];

            $operations = DB::select('SELECT ' . self::OPERATION . ' libelle, COUNT(*) nombre, SUM(pm.status = 1) valide, '
                . self::MONTANT_VALIDE . ' montant' . $from . ' WHERE' . $periodeWhere . ' GROUP BY 1 ORDER BY montant DESC', $bind);

            $mensuel = DB::select("SELECT DATE_FORMAT(pm.created_at,'%Y-%m') mois,
                    SUM(pm.mvg) vignette, SUM(pm.mcg) cartegrise, SUM(pm.mau) autorisation, SUM(pm.mop) reforme, SUM(pm.mpl) plaque, SUM(pm.frais) frais"
                . $from . ' WHERE pm.status = 1 AND pm.created_at BETWEEN ? AND ?' . $agence . ' GROUP BY 1 ORDER BY 1',
                array_merge([$fin->copy()->startOfMonth()->subMonths(11), $fin], $agenceBind));

            $regions = DB::select('SELECT r.nom libelle, ' . self::MONTANT_VALIDE . ' montant' . $from . '
                    JOIN communes c ON c.commune_id = pm.commune_id
                    JOIN prefectures pr ON pr.prefecture_id = c.prefecture_id
                    JOIN regions r ON r.region_id = pr.region_id
                    WHERE' . $periodeWhere . ' GROUP BY r.region_id, r.nom HAVING montant > 0 ORDER BY montant DESC', $bind);

            // Toutes les agences (y compris sans activite), periode et periode precedente
            $entre = 'pm.created_at BETWEEN ? AND ?';
            $agences = DB::select('SELECT a.agence_id, a.nom_agence,
                    SUM(' . $entre . ') nombre,
                    SUM(pm.status = 2 AND ' . $entre . ') rejete,
                    SUM(CASE WHEN pm.status = 1 AND ' . $entre . ' THEN ' . self::TOTAL . ' ELSE 0 END) montant,
                    SUM(CASE WHEN pm.status = 1 AND ' . $entre . ' THEN ' . self::TOTAL . ' ELSE 0 END) montantPrec
                    FROM agences a LEFT JOIN ' . self::PAIEMENTS_MONTANTS . ' ON pm.agence_id = a.agence_id AND pm.created_at BETWEEN ? AND ?
                    WHERE 1=1' . ($agence_id > 0 ? ' AND a.agence_id = ?' : '') . '
                    GROUP BY a.agence_id, a.nom_agence ORDER BY montant DESC, a.nom_agence',
                array_merge([$debut, $fin, $debut, $fin, $debut, $fin, $debutPrec, $finPrec, min($debutPrec, $debut), $fin], $agenceBind));

            // Suivi immagov des operations validees de la periode : references utilisees ou encore en attente
            $immagov = DB::select('SELECT
                    COUNT(*) total,
                    SUM(pm.utilise = 1) utilises,
                    SUM(pm.utilise = 0) nonUtilises,
                    SUM(CASE WHEN pm.utilise = 0 THEN ' . self::TOTAL . ' ELSE 0 END) montantNonUtilise,
                    SUM(pm.utilise = 0 AND pm.created_at < ?) nonUtilises7j,
                    AVG(CASE WHEN pm.utilise = 1 THEN TIMESTAMPDIFF(HOUR, pm.created_at, pm.date_utilisation) END) delaiHeures'
                . $from . ' WHERE pm.status = 1 AND ' . self::OPERATION . " <> 'services' AND" . $periodeWhere,
                array_merge([$now->copy()->subDays(7)], $bind))[0];

            // Points de vigilance (independants de la periode, sauf les agents)
            $vigilance = DB::select('SELECT
                    SUM(pm.status = 0) nonValide,
                    SUM(pm.status = 0 AND pm.created_at < ?) nonValide48h,
                    SUM(pm.status IN (2,4) AND pm.isautoriser = 0) aAutoriser
                    FROM paiements pm WHERE 1=1' . $agence,
                array_merge([Carbon::now()->subHours(48)], $agenceBind))[0];
            $vigilance->agentsRejet = DB::select('SELECT COUNT(*) nombre FROM (SELECT pm.user_id FROM paiements pm WHERE'
                . $periodeWhere . ' GROUP BY pm.user_id HAVING COUNT(*) >= 10 AND SUM(pm.status = 2) / COUNT(*) > ?) t',
                array_merge($bind, [self::SEUIL_REJET]))[0]->nombre;

            return response()->json(['success' => true, 'status' => Response::HTTP_OK,
                'periode' => ['debut' => $debut->toDateTimeString(), 'fin' => $fin->toDateTimeString()],
                'kpis' => $kpis, 'kpisPrecedents' => $kpisPrec, 'cumul' => $cumul, 'sources' => $sources,
                'operations' => $operations, 'mensuel' => $mensuel, 'regions' => $regions, 'agences' => $agences,
                'immagov' => $immagov, 'vigilance' => $vigilance]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
}
