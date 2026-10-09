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

class AdminDashboardController extends BaseController
{
    // Paiements avec le montant de chaque document, de la plaque et des frais de service
    // (mêmes règles que la facture : plaque IT 300 000, EP/VA 350 000 ; frais = commission() côté front)
    const PAIEMENTS_MONTANTS = "(SELECT p.*,
                                    COALESCE(vg.montant,0) mvg,
                                    COALESCE(cg.montant,0) mcg,
                                    COALESCE(au.montant,0) mau,
                                    COALESCE(p.montant_operation,0) mop,
                                    CASE COALESCE(NULLIF(p.type_plaque,''), p.type_document)
                                         WHEN 'IT' THEN 300000
                                         WHEN 'EP' THEN 350000
                                         WHEN 'VA' THEN 350000
                                         ELSE 0 END mpl,
                                    CASE WHEN p.categorie_id = 4 THEN 30000
                                         WHEN p.categorie_id IN (2,3) THEN 20000
                                         WHEN p.categorie_id = 1 THEN 10000
                                         ELSE 0 END frais
                                 FROM paiements p
                                 LEFT JOIN type_vgs vg ON vg.typevg_id = p.typeVignette
                                 LEFT JOIN type_cgs cg ON cg.typecg_id = p.typeCg
                                 LEFT JOIN autorisations au ON au.autorisation_id = p.autorisation_id) pm";

    const MONTANT_VALIDE = "SUM(CASE WHEN pm.status = 1 THEN pm.mvg + pm.mcg + pm.mau + pm.mop + pm.mpl + pm.frais ELSE 0 END)";

    private function isAdmin($role_id){
        $role = Role::find($role_id);
        return $role && $role->type === 3;
    }

    // Période en cours et même durée écoulée sur la période précédente
    private function periodes($periode, $dateDebut = null, $dateFin = null){
        $now = Carbon::now();
        switch ($periode) {
            case 'perso':
                // Intervalle libre : comparé à l'intervalle de même durée qui le précède
                $debut = Carbon::parse($dateDebut)->startOfDay();
                $fin = Carbon::parse($dateFin)->endOfDay();
                $jours = $debut->diffInDays($fin) + 1;
                return [$debut, $fin, $debut->copy()->subDays($jours), $fin->copy()->subDays($jours)];
            case 'jour':
                $debut = $now->copy()->startOfDay();
                return [$debut, $now, $debut->copy()->subDay(), $now->copy()->subDay()];
            case 'annee':
                $debut = $now->copy()->startOfYear();
                return [$debut, $now, $debut->copy()->subYear(), $now->copy()->subYear()];
            default:
                $debut = $now->copy()->startOfMonth();
                return [$debut, $now, $debut->copy()->subMonthNoOverflow(), $now->copy()->subMonthNoOverflow()];
        }
    }

    public function index(Request $request){
        if(!$this->isAdmin(Auth::user()->role_id))
            return response()->json(['success' => false, 'status' => Response::HTTP_FORBIDDEN,
                'messages' => ['erreur' => 'Accès réservé aux administrateurs.']]);

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

            $kpiSql = 'SELECT COUNT(*) initie, SUM(pm.status = 1) valide, SUM(pm.status = 2) rejete, '
                . self::MONTANT_VALIDE . ' montant' . $from . ' WHERE' . $periodeWhere;
            $kpis = DB::select($kpiSql, $bind)[0];
            $kpisPrec = DB::select($kpiSql, $bindPrec)[0];

            // Indépendant de la période : ce qui reste à traiter aujourd'hui
            $attente = DB::select('SELECT
                    SUM(pm.status = 0) nonValide,
                    SUM(pm.status = 0 AND pm.created_at < ?) nonValide48h,
                    SUM(pm.status IN (2,4) AND pm.isautoriser = 0) aAutoriser,
                    SUM(pm.status = 3 AND pm.isautoriser = 1) aResoumettre
                    FROM paiements pm WHERE 1=1' . $agence,
                array_merge([Carbon::now()->subHours(48)], $agenceBind))[0];

            $mensuel = DB::select("SELECT DATE_FORMAT(pm.created_at,'%Y-%m') mois,
                    SUM(pm.mvg) vignette, SUM(pm.mcg) cartegrise, SUM(pm.mau) autorisation, SUM(pm.mop) operation, SUM(pm.mpl) plaque, SUM(pm.frais) frais"
                . $from . ' WHERE pm.status = 1 AND pm.created_at BETWEEN ? AND ?' . $agence . ' GROUP BY 1 ORDER BY 1',
                array_merge([$fin->copy()->startOfMonth()->subMonths(11), $fin], $agenceBind));

            $statuts = DB::select('SELECT pm.status, COUNT(*) nombre FROM paiements pm WHERE' . $periodeWhere
                . ' GROUP BY pm.status', $bind);

            $typeClient = DB::select('SELECT pm.typeClient libelle, COUNT(*) nombre FROM paiements pm WHERE'
                . $periodeWhere . ' GROUP BY pm.typeClient', $bind);
            $modeExp = DB::select('SELECT pm.modeExp libelle, COUNT(*) nombre FROM paiements pm WHERE'
                . $periodeWhere . ' GROUP BY pm.modeExp', $bind);
            $terminal = DB::select('SELECT COALESCE(pm.terminale,\'PC\') libelle, COUNT(*) nombre FROM paiements pm WHERE'
                . $periodeWhere . ' GROUP BY 1', $bind);
            $operations = DB::select('SELECT pm.type_document libelle, COUNT(*) nombre FROM paiements pm WHERE'
                . $periodeWhere . ' GROUP BY pm.type_document ORDER BY nombre DESC', $bind);

            $regions = DB::select('SELECT r.nom libelle, ' . self::MONTANT_VALIDE . ' montant' . $from . '
                    JOIN communes c ON c.commune_id = pm.commune_id
                    JOIN prefectures pr ON pr.prefecture_id = c.prefecture_id
                    JOIN regions r ON r.region_id = pr.region_id
                    WHERE' . $periodeWhere . ' GROUP BY r.region_id, r.nom HAVING montant > 0 ORDER BY montant DESC', $bind);

            // Moyenne par créneau sur les 4 semaines qui précèdent la fin de la période
            $affluence = DB::select('SELECT WEEKDAY(pm.created_at) jour, HOUR(pm.created_at) heure, COUNT(*) / 4 nombre
                    FROM paiements pm WHERE pm.created_at BETWEEN ? AND ?' . $agence . ' GROUP BY 1, 2',
                array_merge([$fin->copy()->subWeeks(4)->startOfDay(), $fin], $agenceBind));

            $agences = DB::select('SELECT a.agence_id, a.nom_agence, COUNT(pm.paiement_id) nombre,
                    SUM(pm.status = 2) rejete, ' . self::MONTANT_VALIDE . ' montant
                    FROM agences a JOIN ' . self::PAIEMENTS_MONTANTS . ' ON pm.agence_id = a.agence_id
                    WHERE' . $periodeWhere . ' GROUP BY a.agence_id, a.nom_agence ORDER BY montant DESC', $bind);

            $agents = DB::select('SELECT u.id, u.prenom, u.nom, a.nom_agence, COUNT(pm.paiement_id) nombre,
                    SUM(pm.status = 2) rejete, ' . self::MONTANT_VALIDE . ' montant,
                    (SELECT MAX(p2.created_at) FROM paiements p2 WHERE p2.user_id = u.id) derniere
                    FROM users u
                    JOIN ' . self::PAIEMENTS_MONTANTS . ' ON pm.user_id = u.id
                    LEFT JOIN agences a ON a.agence_id = u.agence_id
                    WHERE' . $periodeWhere . ' GROUP BY u.id, u.prenom, u.nom, a.nom_agence
                    ORDER BY montant DESC LIMIT 10', $bind);

            $roles = DB::select('SELECT r.role_id, r.nom_role,
                    SUM(u.isActive = 1) actifs, SUM(u.isActive = 0) desactives, SUM(u.nbre_cnx = 0) jamaisConnectes
                    FROM roles r JOIN users u ON u.role_id = r.role_id
                    GROUP BY r.role_id, r.nom_role ORDER BY r.role_id');

            $file = DB::select('SELECT pm.paiement_id, pm.reference, pm.fullName, pm.chassis, pm.type_document,
                    pm.status, pm.isautoriser, pm.created_at, a.nom_agence,
                    pm.mvg + pm.mcg + pm.mau + pm.mop + pm.mpl + pm.frais montant' . $from . '
                    LEFT JOIN agences a ON a.agence_id = pm.agence_id
                    WHERE (pm.status = 0 OR (pm.status IN (2,4) AND pm.isautoriser = 0) OR (pm.status = 3 AND pm.isautoriser = 1))'
                . $agence . ' ORDER BY pm.created_at ASC LIMIT 50', $agenceBind);

            return response()->json(['success' => true, 'status' => Response::HTTP_OK,
                'periode' => ['debut' => $debut->toDateTimeString(), 'fin' => $fin->toDateTimeString()],
                'kpis' => $kpis, 'kpisPrecedents' => $kpisPrec, 'attente' => $attente,
                'mensuel' => $mensuel, 'statuts' => $statuts, 'typeClient' => $typeClient, 'modeExp' => $modeExp,
                'terminal' => $terminal, 'operations' => $operations, 'regions' => $regions,
                'affluence' => $affluence, 'agences' => $agences, 'agents' => $agents, 'roles' => $roles,
                'file' => $file]);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,
                'messages' => ['errors' => $ex->getMessage()]]);
        }
    }
}
