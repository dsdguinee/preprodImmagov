<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TypeVg;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class Paie{
    public $genre;
    public $modeExploitation;
    public $chassis;
    public $reference;
    public $dateExp;
    public $modeImmat;
    public $status;
    public $type_plaque;
    public $utilise;
    public $dateUtilisation;
    public $numeroImmatriculation;
}
class EcashController extends Controller
{
    public function expression($cartegrise_id){
        $cartegrise = TypeVg::find($cartegrise_id);
        $expression = '';
        if($cartegrise){
            switch ($cartegrise->signe){

            }
        }
        return $expression;
    }
    public function getpaiement(Request $request){
        try {
           // Clé vérifiée par le middleware external.key (en-tête X-API-KEY)
           if(!$request->reference)
               return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => 'Paramettres Incorrects.']);

          if($request->isMethod('get')) {
              $paiements = DB::select("select typeClient,pf,nbrePlace,modeExp,chassis,modeImma,nomCategorie,
                                                typeVignette,pv,cu,user_id,typeCg,status,reference,type_document,type_plaque,
                                                utilise,date_utilisation,numero_immatriculation,
                                                vignette_code,dateExp
                                                from(SELECT distinct p.paiement_id,typeClient,modeExp,fullName,tel,nif,chassis,modeImma,c.categorie_id,nomCategorie,
                                                typeVignette,pv,cu,p.pf,p.nbrePlace,p.user_id,typeCg,status,reference,type_document,type_plaque,
                                                p.utilise,p.date_utilisation,p.numero_immatriculation,p.autorisation_id,p.created_at
                                                FROM paiements p,categories c
                                                where p.categorie_id = c.categorie_id

                                                ) a
                                                left join
                                                (select tpvn.typevg_id,tpvn.montant montantvignette from type_vgs tpvn) b
                                                on a.typeVignette = b.typevg_id
                                                left join
                                                (select typecg_id,tpcg.montant montantcartegrise from type_cgs tpcg) c
                                                on a.typeCg = c.typecg_id
                                                left join
                                                (select autorisation_id ,montant montantautorisation
                                                from autorisations) d
                                                on a.autorisation_id = d.autorisation_id
                                                left join
                                                (select paiement_id,vignette_code  from vignette_references) e
                                                on e.paiement_id = a.paiement_id
                                                left join
                                                (select paiement_id,dateExp from paiement_carte_grises) f
                                                on f.paiement_id = a.paiement_id
                                               where a.reference =:reference order by created_at desc",
                  ["reference" => trim($request->reference)]);
            //   return $paiements;

              if (count($paiements) > 0) {

                  $paiements = $paiements[count($paiements) - 1];

                  if ($paiements) {
                      if ($paiements->type_document !== 'IT') {
                          $paiements->modeExp = "Ordinaire";
                      } else $paiements->modeExp = "IT";
                      // Mutation / Réforme d'un véhicule déjà immatriculé, sinon (ré)immatriculation
                      if ($paiements->type_document === 'mutation')
                          $paiements->modeImma = "Mutation";
                      else if ($paiements->type_document === 'reforme')
                          $paiements->modeImma = "Réforme";
                      else if ($paiements->modeImma == 1)
                          $paiements->modeImma = "Immatriculation";
                      else $paiements->modeImma = "ReImmatriculation";
                      $paiement = new Paie();
                      $paiement->genre = $paiements->nomCategorie;
                      $paiement->reference = $paiements->reference;
                      $paiement->chassis = $paiements->chassis;                      $paiement->modeExploitation = $paiements->modeExp;
                      $paiement->modeImmat = $paiements->modeImma;
                      //Mode d'immatriculation immagov (préfixe de plaque : EP, VA, IT)
                      $paiement->type_plaque = $paiements->type_plaque;
                      // Caracteristiques du vehicule et type d'organisme (Gouvernement => Publique, sinon Privé) pour pre-remplir immagov
                      $paiement->pv = $paiements->pv;
                      $paiement->cu = $paiements->cu;
                      $paiement->pf = $paiements->pf;
                      $paiement->nbrePlace = $paiements->nbrePlace;
                      $paiement->typeClient = $paiements->typeClient;
                      $paiement->typeOrganisme = $paiements->typeClient === 'Gouvernement' ? 'Publique' : 'Privé';
                      $paiement->dateExp = $paiements->dateExp;
                      if ($paiements->status == 1)
                          $paiement->status = 'Validé';
                      else  $paiement->status = 'Non Validé';
                      // Référence déjà consommée par un dossier d'immatriculation
                      $paiement->utilise = (bool) $paiements->utilise;
                      $paiement->dateUtilisation = $paiements->date_utilisation;
                      $paiement->numeroImmatriculation = $paiements->numero_immatriculation;
                  }
              } else return response()->json(['success' => true, 'status' => Response::HTTP_NOT_FOUND, 'messages' => 'Numéro de référence du paiement non trouvé']);
              return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'paiement' => $paiement]);
          }else return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => 'Mauvaise Requête']);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST,'messages' => [$ex->getMessage()]]);
        }
    }

    /**
     * Marque une référence comme utilisée pour l'immatriculation.
     * POST /api/paiement/utiliser  { reference, immatriculation? } — en-tête X-API-KEY
     * La référence doit exister, être validée (status = 1) et ne pas déjà être utilisée.
     */
    public function utiliser(Request $request){
        $reference = trim((string) $request->reference);
        if ($reference === '' || !$reference)
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => 'La référence est obligatoire.']);
        try {
            $paiement = DB::table('paiements')->where('reference', $reference)->first();
            if (!$paiement)
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND, 'messages' => 'Numéro de référence du paiement non trouvé']);
            if ((int) $paiement->status !== 1)
                return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => 'Ce paiement n\'est pas validé : la référence ne peut pas être utilisée.']);

            // Mise à jour conditionnelle : une seule utilisation possible, même en cas d'appels simultanés
            $maj = DB::table('paiements')->where('paiement_id', $paiement->paiement_id)->where('utilise', false)->update([
                'utilise' => true,
                'date_utilisation' => now(),
                'numero_immatriculation' => $request->immatriculation ? trim($request->immatriculation) : null,
            ]);
            if ($maj === 0) {
                $date = DB::table('paiements')->where('paiement_id', $paiement->paiement_id)->value('date_utilisation');
                return response()->json(['success' => false, 'status' => Response::HTTP_CONFLICT,
                    'messages' => 'Référence déjà utilisée' . ($date ? ' le ' . \Carbon\Carbon::parse($date)->format('d/m/Y à H:i') : '') . '.']);
            }
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'messages' => 'Référence marquée comme utilisée.']);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => [$ex->getMessage()]]);
        }
    }

    /**
     * Libère une référence (dossier d'immatriculation annulé) pour qu'elle puisse être réutilisée.
     * POST /api/paiement/liberer  { reference } — en-tête X-API-KEY
     */
    public function liberer(Request $request){
        $reference = trim((string) $request->reference);
        if ($reference === '')
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => 'La référence est obligatoire.']);
        try {
            $maj = DB::table('paiements')->where('reference', $reference)->update([
                'utilise' => false, 'date_utilisation' => null, 'numero_immatriculation' => null,
            ]);
            if ($maj === 0 && !DB::table('paiements')->where('reference', $reference)->exists())
                return response()->json(['success' => false, 'status' => Response::HTTP_NOT_FOUND, 'messages' => 'Numéro de référence du paiement non trouvé']);
            return response()->json(['success' => true, 'status' => Response::HTTP_OK, 'messages' => 'Référence libérée.']);
        }
        catch (QueryException $ex){
            return response()->json(['success' => false, 'status' => Response::HTTP_BAD_REQUEST, 'messages' => [$ex->getMessage()]]);
        }
    }
}
