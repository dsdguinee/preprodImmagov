<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Disponibilité des véhicules du parc automobile (immatriculations validées ou mutées, hors réformés).
 * Gestion (rendre indisponible / disponible) : privilège « Disponibilité » (Direction Générale GG).
 * Consultation : ce privilège ou l'administrateur (« Gestion des Utilisateurs »).
 */
class DisponibiliteController extends Controller
{
    const PRIVILEGE = 'Disponibilité';
    const MOTIFS = ['Panne', 'Accident', 'Entretien / réparation', 'Immobilisé', 'Vol', 'Autre'];
    const DOSSIER = 'documents/disponibilite';

    // Véhicules du parc : dossier validé (1) ou muté (4) ; réformé (3) exclu
    const PARC = 'i.status in (1,4)';

    public function vehicules(Request $request)
    {
        if ($refus = $this->refus(false)) return $refus;
        try {
            $etat = $request->query('etat');
            $filtre = $etat === 'disponible' ? ' and d.indisponibilite_id is null' : ($etat === 'indisponible' ? ' and d.indisponibilite_id is not null' : '');
            $vehicules = DB::select("select i.immatriculation_id, i.immatriculation_number, i.modeImmatriculation,
                                            v.numChassie, ma.title marque, mo.title modele, t.nom type, v.colorVehicule couleur,
                                            coalesce(mi.nom, i.autreministere) affectation,
                                            d.indisponibilite_id, d.motif, d.description, d.date_debut, d.fiche_technique, d.preuve,
                                            concat_ws(' ', ud.prenom, ud.nom) declare_par_nom
                                     from immatriculations i
                                     join vehicules v on v.vehicule_id = i.vehicule_id
                                     left join marques ma on ma.id = v.marque_id
                                     left join modeles mo on mo.id = v.model_id
                                     left join typevehicules t on t.type_id = v.typeVehicule
                                     left join ministeres mi on mi.ministere_id = i.minister_id
                                     left join indisponibilites d on d.immatriculation_id = i.immatriculation_id and d.statut = 1
                                     left join users ud on ud.id = d.declare_par
                                     where ".self::PARC.$filtre."
                                     order by d.indisponibilite_id is null, d.date_debut desc, i.immatriculation_number");
            return response()->json(['success' => true, 'status' => 200, 'vehicules' => $vehicules,
                'motifs' => self::MOTIFS, 'gestion' => $this->aLePrivilege()]);
        } catch (QueryException $ex) {
            return $this->erreur($ex);
        }
    }

    /** Synthèse pour les tableaux de bord (administrateur et Direction Générale GG). */
    public function stats()
    {
        if ($refus = $this->refus(false)) return $refus;
        try {
            $total = DB::table('immatriculations as i')->whereRaw(self::PARC)->count();
            $enCours = DB::table('indisponibilites as d')->join('immatriculations as i', 'i.immatriculation_id', '=', 'd.immatriculation_id')
                ->where('d.statut', 1)->whereRaw(self::PARC);
            $indisponibles = (clone $enCours)->count();
            $parMotif = (clone $enCours)->select('d.motif', DB::raw('count(*) total'))->groupBy('d.motif')->orderByDesc('total')->get();
            $recents = DB::select("select d.indisponibilite_id, d.motif, d.date_debut, i.immatriculation_id, i.immatriculation_number,
                                          ma.title marque, mo.title modele
                                   from indisponibilites d
                                   join immatriculations i on i.immatriculation_id = d.immatriculation_id
                                   join vehicules v on v.vehicule_id = i.vehicule_id
                                   left join marques ma on ma.id = v.marque_id left join modeles mo on mo.id = v.model_id
                                   where d.statut = 1 and ".self::PARC."
                                   order by d.date_debut desc, d.indisponibilite_id desc limit 5");
            return response()->json(['success' => true, 'status' => 200, 'total' => $total, 'indisponibles' => $indisponibles,
                'disponibles' => $total - $indisponibles, 'parMotif' => $parMotif, 'recents' => $recents, 'gestion' => $this->aLePrivilege()]);
        } catch (QueryException $ex) {
            return $this->erreur($ex);
        }
    }

    /** Toutes les périodes d'indisponibilité d'un véhicule, la plus récente d'abord. */
    public function historique($immatriculation_id)
    {
        if ($refus = $this->refus(false)) return $refus;
        try {
            $periodes = DB::select("select d.*, concat_ws(' ', ud.prenom, ud.nom) declare_par_nom, concat_ws(' ', ul.prenom, ul.nom) leve_par_nom
                                    from indisponibilites d
                                    left join users ud on ud.id = d.declare_par
                                    left join users ul on ul.id = d.leve_par
                                    where d.immatriculation_id = ? order by d.indisponibilite_id desc", [$immatriculation_id]);
            return response()->json(['success' => true, 'status' => 200, 'historique' => $periodes]);
        } catch (QueryException $ex) {
            return $this->erreur($ex);
        }
    }

    /** Rendre un véhicule indisponible : fiche technique scannée obligatoire, autre preuve facultative. */
    public function indisponible(Request $request)
    {
        if ($refus = $this->refus(true)) return $refus;
        $messages = [
            'immatriculation_id.required' => "Le véhicule est obligatoire.",
            'immatriculation_id.exists' => "Ce véhicule n'existe pas.",
            'motif.required' => "Le motif est obligatoire.",
            'motif.in' => "Motif inconnu.",
            'description.required_if' => "Précisez le motif « Autre ».",
            'description.max' => "La description ne doit pas dépasser 1000 caractères.",
            'date_debut.required' => "La date de début est obligatoire.",
            'date_debut.date' => "La date de début n'est pas valide.",
            'date_debut.before_or_equal' => "La date de début ne peut pas être dans le futur.",
            'fiche_technique.required' => "La fiche technique scannée est obligatoire.",
            'fiche_technique.mimes' => "La fiche technique doit être un PDF ou une image (JPEG, PNG).",
            'fiche_technique.max' => "La fiche technique ne doit pas dépasser 10 Mo.",
            'fiche_technique.uploaded' => "La fiche technique n'a pas pu être envoyée (fichier trop volumineux).",
            'preuve.mimes' => "La preuve doit être un PDF ou une image (JPEG, PNG).",
            'preuve.max' => "La preuve ne doit pas dépasser 10 Mo.",
            'preuve.uploaded' => "La preuve n'a pas pu être envoyée (fichier trop volumineux).",
        ];
        $validator = Validator::make($request->all(), [
            'immatriculation_id' => 'required|exists:immatriculations,immatriculation_id',
            'motif' => 'required|in:'.implode(',', self::MOTIFS),
            'description' => 'nullable|required_if:motif,Autre|max:1000',
            'date_debut' => 'required|date|before_or_equal:today',
            'fiche_technique' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'preuve' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ], $messages);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => 417, 'messages' => $validator->messages()]);

        $immatriculation = DB::table('immatriculations')->where('immatriculation_id', $request->input('immatriculation_id'))->first();
        if (!in_array((int) $immatriculation->status, [1, 4], true))
            return response()->json(['success' => false, 'status' => 417, 'messages' => ['immatriculation_id' => ["Le véhicule {$immatriculation->immatriculation_number} ne fait pas partie du parc (dossier non validé ou réformé)."]]]);
        if (DB::table('indisponibilites')->where(['immatriculation_id' => $immatriculation->immatriculation_id, 'statut' => 1])->exists())
            return response()->json(['success' => false, 'status' => 417, 'messages' => ['immatriculation_id' => ["Le véhicule {$immatriculation->immatriculation_number} est déjà indisponible."]]]);

        try {
            $base = Str::slug($immatriculation->immatriculation_number).'_'.Carbon::now()->format('YmdHis');
            $id = DB::table('indisponibilites')->insertGetId([
                'immatriculation_id' => $immatriculation->immatriculation_id,
                'motif' => $request->input('motif'),
                'description' => $request->input('description'),
                'date_debut' => $request->input('date_debut'),
                'fiche_technique' => $this->enregistrer($request, 'fiche_technique', $base.'_fiche'),
                'preuve' => $request->file('preuve') ? $this->enregistrer($request, 'preuve', $base.'_preuve') : null,
                'statut' => 1,
                'declare_par' => Auth::id(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            return response()->json(['success' => true, 'status' => 200, 'indisponibilite_id' => $id]);
        } catch (QueryException $ex) {
            return $this->erreur($ex);
        }
    }

    /** Rendre le véhicule de nouveau disponible : la période en cours est levée. */
    public function disponible(Request $request)
    {
        if ($refus = $this->refus(true)) return $refus;
        $periode = DB::table('indisponibilites')->where('indisponibilite_id', $request->input('indisponibilite_id'))->first();
        if (!$periode || (int) $periode->statut !== 1)
            return response()->json(['success' => false, 'status' => 417, 'messages' => ['indisponibilite_id' => ["Ce véhicule n'est pas indisponible."]]]);
        $validator = Validator::make($request->all(), [
            'date_fin' => 'required|date|before_or_equal:today|after_or_equal:'.$periode->date_debut,
            'commentaire' => 'nullable|max:1000',
        ], [
            'date_fin.required' => "La date de remise en service est obligatoire.",
            'date_fin.date' => "La date de remise en service n'est pas valide.",
            'date_fin.before_or_equal' => "La date de remise en service ne peut pas être dans le futur.",
            'date_fin.after_or_equal' => "La date de remise en service ne peut pas précéder le début de l'indisponibilité.",
            'commentaire.max' => "Le commentaire ne doit pas dépasser 1000 caractères.",
        ]);
        if ($validator->fails())
            return response()->json(['success' => false, 'status' => 417, 'messages' => $validator->messages()]);
        try {
            DB::table('indisponibilites')->where('indisponibilite_id', $periode->indisponibilite_id)->update([
                'statut' => 0,
                'date_fin' => $request->input('date_fin'),
                'commentaire_levee' => $request->input('commentaire'),
                'leve_par' => Auth::id(),
                'updated_at' => Carbon::now(),
            ]);
            return response()->json(['success' => true, 'status' => 200]);
        } catch (QueryException $ex) {
            return $this->erreur($ex);
        }
    }

    // Fichier enregistré tel quel (sans redimensionnement : une fiche scannée doit rester lisible)
    private function enregistrer(Request $request, $champ, $nom)
    {
        $fichier = $request->file($champ);
        return $fichier->storeAs(self::DOSSIER, $nom.'.'.$fichier->extension(), 'public');
    }

    private function aDroit($privilege)
    {
        return DB::table('role_privileges as rp')->join('privileges as p', 'p.privilege_id', '=', 'rp.privilege_id')
            ->where('rp.role_id', Auth::user()->role_id)->where('p.nom', $privilege)->exists();
    }

    private function aLePrivilege()
    {
        return $this->aDroit(self::PRIVILEGE);
    }

    // Écriture : privilège « Disponibilité » ; lecture : ce privilège ou l'administrateur
    private function refus($ecriture)
    {
        $autorise = $this->aLePrivilege() || (!$ecriture && $this->aDroit('Gestion des Utilisateurs'));
        return $autorise ? null : response()->json(['success' => false, 'status' => 403,
            'messages' => ['erreur' => [$ecriture ? "Seule la Direction Générale GG peut modifier la disponibilité des véhicules." : "Accès réservé."]]], 403);
    }

    private function erreur(QueryException $ex)
    {
        return response()->json(['success' => false, 'status' => 400, 'messages' => ['erreur' => [$ex->getMessage()]]]);
    }
}
