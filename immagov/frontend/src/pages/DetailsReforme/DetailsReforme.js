import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import moment from "moment";
import "moment/locale/fr";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { GiSandsOfTime } from "react-icons/gi";
import RejectionModal from "../../components/RejectionModal/RejectionModal";
import { getReformeByID, ValiderReforme } from "../../services/immatriculation.service";
import { getPaysByID } from "../../utils/helper/functions";
import Erreurs from "../../components/erreurs/Erreurs";
import { UserContext } from "../../services/Context/Contexts";
import Spinner from "../../components/Spinner/Spinner";
import Plaque, { PLAQUE_TYPES } from "../../components/ui/Plaque/Plaque";
import HistoriqueVehicule from "../../components/Immatriculation/HistoriqueVehicule";

const STATUTS = {
  0: { libelle: "En attente", classe: "attente", Icone: GiSandsOfTime },
  1: { libelle: "Validée", classe: "valide", Icone: AiOutlineCheckCircle },
  2: { libelle: "Rejetée", classe: "rejete", Icone: AiOutlineCloseCircle },
};
const ou = (v, defaut = "—") => (v === undefined || v === null || v === "" ? defaut : v);
const date = (d, format = "DD/MM/YYYY") => (d ? moment(d).format(format) : "");
const estPdf = (chemin) => /\.pdf$/i.test(chemin || "");

// Détails d'une réforme : le véhicule quitte son organisme pour un nouveau propriétaire (même design que la fiche de mutation)
const DetailsReforme = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const url = process.env.REACT_APP_URL + "/storage/";
  const { currentUserPrivilege } = useContext(UserContext);
  const [reforme, setReforme] = useState(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erreurs, setErreurs] = useState([]);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getReformeByID(id).then((resp) => {
      if (resp?.success && Array.isArray(resp.reformes) && resp.reformes[0]) setReforme(resp.reformes[0]);
      else setIntrouvable(true);
      setIsLoading(false);
    });
  }, [id, isRejectionModalOpen]);

  // Réforme déclarée depuis un paiement SIPIM : nouveau propriétaire particulier (téléphone, adresse, photo de sa pièce)
  const reformeSipim = !!reforme?.paiementReference;
  // Droits : le validateur valide ou rejette ; l'agent qui a demandé la réforme la reprend après un rejet
  const privileges = Array.isArray(currentUserPrivilege) ? currentUserPrivilege : [];
  const peutValider = privileges.some((p) => p.privilege === "Validation") && reforme?.statusReforme == 0;
  // Réforme SIPIM : saisie depuis la nouvelle immatriculation, l'agent demandeur n'a pas forcément le privilège « Nouvelle Reforme »
  const estDemandeur = reformeSipim
    ? privileges.some((p) => p.user_id == reforme?.demandeur_id)
    : privileges.some((p) => p.privilege === "Nouvelle Reforme" && p.user_id == reforme?.demandeur_id);
  // Réforme SIPIM : reprise possible tant qu'aucune autre demande n'a suivi et que le véhicule n'est pas réformé (le serveur le vérifie)
  const peutResoumettre = estDemandeur && reforme?.statusReforme == 2;

  const valider = () => {
    const formData = new FormData();
    formData.append("reforme_id", id);
    Swal.fire({
      title: "Voulez-vous valider cette réforme ?",
      text: "Le véhicule sera cédé au nouveau propriétaire. Vous ne pourrez plus revenir en arrière.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#017a60",
      cancelButtonColor: "#b42318",
      confirmButtonText: "Valider",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (!result.isConfirmed) return;
      setIsLoading(true);
      ValiderReforme(formData).then((resp) => {
        setIsLoading(false);
        if (resp.success) {
          toast.success("Réforme validée avec succès.");
          navigate("/liste-reforme");
        } else {
          toast.error("Échec de la validation.");
          setErreurs(resp.messages);
        }
      });
    });
  };

  if (!reforme) {
    return (
      <div className="fiche">
        {isLoading && <Spinner />}
        {introuvable && <div className="fiche-alerte fiche-alerte--rejet">Cette réforme est introuvable.</div>}
      </div>
    );
  }

  const statut = STATUTS[reforme.statusReforme] || STATUTS[0];
  const mode = String(reforme.modeImmatriculation || "").toUpperCase();
  const ptac = (parseInt(reforme.pv) || 0) + (parseInt(reforme.cu) || 0);
  const proprietaire = [reforme.PrenomProprietaire, String(reforme.nomProprietaire || "").toUpperCase()].filter(Boolean).join(" ");
  const vehicule = [
    ["Numéro de châssis", reforme.numChassie, true],
    ["Marque", reforme.marque], ["Modèle", reforme.model],
    ["Genre", reforme.genre], ["Type", reforme.typeVehicule],
    ["Carrosserie", reforme.carosserie], ["Couleur", reforme.colorVehicule],
    ["Année de fabrication", reforme.madeYear],
    ["1re mise en circulation", date(reforme.releaseYear)],
    ["Ancien numéro", reforme.ancienImmatriculation, true],
    ["Provenance", getPaysByID(reforme.provenance)],
    ["Énergie", reforme.energy], ["Transmission", reforme.transmission === "Automatic" ? "Automatique" : reforme.transmission],
    ["Cylindres", reforme.cylinderNumber], ["Kilométrage", reforme.kilometrage != null ? `${reforme.kilometrage} km` : ""],
    ["Places assises", reforme.placeNumberAssis], ["Places debout", reforme.placeNumberDebout], ["Portes", reforme.nbPorte],
    ["Essieux", reforme.nbreEssuie || 0], ["Poids à vide", `${reforme.pv || 0} kg`], ["Charge utile", `${reforme.cu || 0} kg`],
    ["Poids total autorisé en charge", `${ptac} kg`],
  ];
  // Ancienne réforme : bénéficiaire agent d'un organisme (date de naissance, fonction, organisme)
  const proprietaireInfos = reformeSipim
    ? [["Prénom", reforme.PrenomProprietaire], ["Nom", reforme.nomProprietaire], ["Téléphone", reforme.telephone, true],
       ["E-mail", ou(reforme.email, "Non renseigné")], ["Adresse", reforme.adresse]]
    : [["Prénom", reforme.PrenomProprietaire], ["Nom", reforme.nomProprietaire], ["Date de naissance", date(reforme.date_naissance)],
       ["Fonction", reforme.fonction], ["Organisme", reforme.NouveauMinistere], ["Direction", reforme.nouvelleDirection],
       ["Valeur résiduelle", reforme.valeurResiduelle ? `${Number(reforme.valeurResiduelle).toLocaleString("fr-FR")} GNF` : ""]];
  const fichiers = [
    { titre: "Pièce jointe du véhicule", chemin: reforme.pieceJointe },
    { titre: "Pièce d'identité du nouveau propriétaire", chemin: reforme.piece },
    { titre: "Reçu de paiement", chemin: reforme.paiement },
  ].filter((f) => f.chemin);

  return (
    <div className="fiche">
      <Helmet>
        <title>Détails de la réforme</title>
      </Helmet>
      <RejectionModal isOpen={isRejectionModalOpen} setIsOpen={setIsRejectionModalOpen} id={id} type="reforme" />
      {isLoading && <Spinner />}

      {/* En-tête : numéro, statut, actions */}
      <div className="fiche__head">
        <div className="fiche__titre">
          <Link to="/liste-reforme" className="fiche__retour">← Réformes</Link>
          <div className="fiche__titre-ligne">
            <h1 className="fiche__numero">Réforme · {ou(reforme.immatriculation_number, "…")}</h1>
            <span className={`fiche-badge fiche-badge--${statut.classe}`}><statut.Icone aria-hidden="true" /> {statut.libelle}</span>
          </div>
          <p className="fiche__sous-titre">
            {reforme.demandeur ? `Demandée par ${reforme.demandeur}` : "Demandée"}
            {reforme.dateDemande ? ` le ${date(reforme.dateDemande, "DD/MM/YYYY [à] HH:mm")}` : ""}
            {reforme.dateDecision ? ` · ${statut.libelle.toLowerCase()} le ${date(reforme.dateDecision)}` : ""}
          </p>
        </div>
        <div className="fiche__actions">
          {peutValider && (
            <>
              <button type="button" className="fiche-btn fiche-btn--danger" onClick={() => setIsRejectionModalOpen(true)}>Rejeter</button>
              <button type="button" className="fiche-btn fiche-btn--primary" onClick={valider}>Valider la réforme</button>
            </>
          )}
          {peutResoumettre && (
            <Link to={`/resoumission-reforme/${reforme.reforme_id}`} className="fiche-btn fiche-btn--primary">Corriger et resoumettre</Link>
          )}
        </div>
      </div>

      {reforme.statusReforme == 2 && reforme.motifRejet && (
        <div className="fiche-alerte fiche-alerte--rejet" role="status">
          <AiOutlineCloseCircle aria-hidden="true" />
          <div><strong>Motif du rejet :</strong> {reforme.motifRejet}</div>
        </div>
      )}
      {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}

      {/* Plaque du véhicule réformé */}
      <section className="fiche-carte fiche-plaque">
        {PLAQUE_TYPES[mode]
          ? <Plaque type={mode} numero={reforme.immatriculation_number} qrcode={reforme.qrcode ? url + reforme.qrcode : null} />
          : <p className="fiche-muted">Numéro {reforme.immatriculation_number}</p>}
      </section>

      {/* Cession : organisme → nouveau propriétaire */}
      <section className="fiche-carte">
        <h2 className="fiche-carte__titre">Cession du véhicule</h2>
        <div className="mut-transfert">
          <div className="mut-transfert__bloc">
            <span className="mut-transfert__etiquette">Organisme cédant</span>
            <strong>{ou(reforme.ancienMinistere)}</strong>
            <span className="fiche-muted">{ou(reforme.ancienDirection, "Sans direction")}</span>
          </div>
          <span className="mut-transfert__fleche" aria-hidden="true">→</span>
          <div className="mut-transfert__bloc mut-transfert__bloc--nouveau">
            <span className="mut-transfert__etiquette">Nouveau propriétaire</span>
            <strong>{ou(proprietaire)}</strong>
            <span className="fiche-muted">{reformeSipim ? ou(reforme.telephone, "") : ou(reforme.NouveauMinistere, "Particulier")}</span>
          </div>
        </div>
      </section>

      <div className="fiche__layout">
        <div className="fiche__main">
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Nouveau propriétaire</h2>
            <dl className="fiche-kv">
              {proprietaireInfos.map(([label, valeur, mono]) => (
                <div key={label}><dt>{label}</dt><dd className={mono ? "fiche-mono" : ""} style={label === "Adresse" ? { whiteSpace: "pre-line" } : undefined}>{ou(valeur)}</dd></div>
              ))}
            </dl>
            {reforme.piece && !estPdf(reforme.piece) && (
              <button type="button" className="ref-piece" onClick={() => window.open(url + reforme.piece)} aria-label="Ouvrir la pièce d'identité">
                <img src={url + reforme.piece} alt="Pièce d'identité du nouveau propriétaire" />
                <span className="fiche-muted">Pièce d'identité · cliquer pour agrandir</span>
              </button>
            )}
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Véhicule</h2>
            <dl className="fiche-kv">
              {vehicule.map(([label, valeur, mono]) => (
                <div key={label}><dt>{label}</dt><dd className={mono ? "fiche-mono" : ""}>{ou(valeur)}</dd></div>
              ))}
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Historique d'utilisation</h2>
            <HistoriqueVehicule immatriculationId={reforme.immatriculation_id} />
          </section>
        </div>

        <aside className="fiche__side">
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Paiement</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Référence SIPIM</dt><dd className="fiche-mono">{ou(reforme.paiementReference, "Réforme saisie sans paiement SIPIM")}</dd></div>
              <div><dt>Type de plaque</dt><dd>{mode ? `${mode}${PLAQUE_TYPES[mode] ? ` · ${PLAQUE_TYPES[mode].toLowerCase()}` : ""}` : "—"}</dd></div>
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Suivi</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Demandée par</dt><dd>{ou(reforme.demandeur)}</dd></div>
              <div><dt>Date de la demande</dt><dd>{ou(date(reforme.dateDemande, "DD/MM/YYYY [à] HH:mm"))}</dd></div>
              {reforme.validePar && <div><dt>{reforme.statusReforme == 2 ? "Rejetée par" : "Validée par"}</dt><dd>{reforme.validePar}</dd></div>}
              {reforme.dateDecision && <div><dt>Date de la décision</dt><dd>{date(reforme.dateDecision, "DD/MM/YYYY [à] HH:mm")}</dd></div>}
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Pièces jointes</h2>
            {fichiers.length === 0 && <p className="fiche-muted">Aucune pièce jointe.</p>}
            {fichiers.map((f) => (
              <div key={f.titre} className="fiche-fichier">
                <span className={`fiche-fichier__icone${estPdf(f.chemin) ? "" : " fiche-fichier__icone--img"}`}>{estPdf(f.chemin) ? "PDF" : "IMG"}</span>
                <span className="fiche-fichier__nom">{f.titre}<br /><span className="fiche-muted">{f.chemin.split("/").pop()}</span></span>
                <button type="button" className="fiche-btn fiche-btn--lien" onClick={() => window.open(url + f.chemin)}>Ouvrir</button>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DetailsReforme;
