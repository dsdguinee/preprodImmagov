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
import { getMutationById, mutationValided } from "../../services/immatriculation.service";
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

// Détails d'une mutation : changement d'affectation d'un véhicule déjà immatriculé (même design que la fiche d'immatriculation)
const DetailsMutation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const url = process.env.REACT_APP_URL + "/storage/";
  const { currentUserPrivilege } = useContext(UserContext);
  const [mutation, setMutation] = useState(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erreurs, setErreurs] = useState([]);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getMutationById(id).then(({ success, mutation }) => {
      if (success && Array.isArray(mutation) && mutation[0]) setMutation(mutation[0]);
      else setIntrouvable(true);
      setIsLoading(false);
    });
  }, [id, isRejectionModalOpen]);

  // Droits : le validateur valide ou rejette ; l'agent qui a demandé la mutation la resoumet après un rejet
  const privileges = Array.isArray(currentUserPrivilege) ? currentUserPrivilege : [];
  const peutValider = privileges.some((p) => p.privilege === "Validation") && mutation?.NouveauStatus == 0;
  const estDemandeur = privileges.some((p) => p.privilege === "Nouvelle Mutation" && p.user_id == mutation?.demandeur_id);
  const peutResoumettre = estDemandeur && mutation?.NouveauStatus == 2;

  const valider = () => {
    const formData = new FormData();
    formData.append("mutation_id", id);
    Swal.fire({
      title: "Voulez-vous valider cette mutation ?",
      text: "Le véhicule sera affecté au nouvel organisme. Vous ne pourrez plus revenir en arrière.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#017a60",
      cancelButtonColor: "#b42318",
      confirmButtonText: "Valider",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (!result.isConfirmed) return;
      setIsLoading(true);
      mutationValided(formData).then((resp) => {
        setIsLoading(false);
        if (resp.success) {
          toast.success("Mutation validée avec succès.");
          navigate("/liste-mutation");
        } else {
          toast.error("Échec de la validation.");
          setErreurs(resp.messages);
        }
      });
    });
  };

  if (!mutation) {
    return (
      <div className="fiche">
        {isLoading && <Spinner />}
        {introuvable && <div className="fiche-alerte fiche-alerte--rejet">Cette mutation est introuvable.</div>}
      </div>
    );
  }

  const statut = STATUTS[mutation.NouveauStatus] || STATUTS[0];
  const mode = String(mutation.modeImmatriculation || "").toUpperCase();
  const ptac = (parseInt(mutation.pv) || 0) + (parseInt(mutation.cu) || 0);
  const vehicule = [
    ["Numéro de châssis", mutation.numChassie, true],
    ["Marque", mutation.marque], ["Modèle", mutation.model],
    ["Genre", mutation.genre], ["Type", mutation.typeVehicule],
    ["Carrosserie", mutation.carosserie], ["Couleur", mutation.colorVehicule],
    ["Année de fabrication", mutation.madeYear],
    ["1re mise en circulation", date(mutation.releaseYear)],
    ["Ancien numéro", mutation.ancienImmatriculation, true],
    ["Provenance", getPaysByID(mutation.provenance)],
    ["Énergie", mutation.energy], ["Transmission", mutation.transmission === "Automatic" ? "Automatique" : mutation.transmission],
    ["Cylindres", mutation.cylinderNumber], ["Kilométrage", mutation.kilometrage != null ? `${mutation.kilometrage} km` : ""],
    ["Places assises", mutation.placeNumberAssis], ["Places debout", mutation.placeNumberDebout], ["Portes", mutation.nbPorte],
    ["Essieux", mutation.nbreEssuie || 0], ["Poids à vide", `${mutation.pv || 0} kg`], ["Charge utile", `${mutation.cu || 0} kg`],
    ["Poids total autorisé en charge", `${ptac} kg`],
  ];
  const fichiers = [
    { titre: "Pièce jointe du véhicule", chemin: mutation.pieceJointe },
    { titre: "Document de la mutation", chemin: mutation.document1 },
    { titre: "Pièce jointe de la mutation", chemin: mutation.document2 },
  ].filter((f) => f.chemin);

  return (
    <div className="fiche">
      <Helmet>
        <title>Détails de la mutation</title>
      </Helmet>
      <RejectionModal isOpen={isRejectionModalOpen} setIsOpen={setIsRejectionModalOpen} id={id} type="mutation" />
      {isLoading && <Spinner />}

      {/* En-tête : numéro, statut, actions */}
      <div className="fiche__head">
        <div className="fiche__titre">
          <Link to="/liste-mutation" className="fiche__retour">← Mutations</Link>
          <div className="fiche__titre-ligne">
            <h1 className="fiche__numero">Mutation · {ou(mutation.immatriculation_number, "…")}</h1>
            <span className={`fiche-badge fiche-badge--${statut.classe}`}><statut.Icone aria-hidden="true" /> {statut.libelle}</span>
          </div>
          <p className="fiche__sous-titre">
            {mutation.demandeur ? `Demandée par ${mutation.demandeur}` : "Demandée"}
            {mutation.dateDemande ? ` le ${date(mutation.dateDemande, "DD/MM/YYYY [à] HH:mm")}` : ""}
            {mutation.dateDecision ? ` · ${statut.libelle.toLowerCase()} le ${date(mutation.dateDecision)}` : ""}
          </p>
        </div>
        <div className="fiche__actions">
          {peutValider && (
            <>
              <button type="button" className="fiche-btn fiche-btn--danger" onClick={() => setIsRejectionModalOpen(true)}>Rejeter</button>
              <button type="button" className="fiche-btn fiche-btn--primary" onClick={valider}>Valider la mutation</button>
            </>
          )}
          {peutResoumettre && (
            <Link to={`/resoumission-mutation/${mutation.mutation_id}`} state={{ mutationInfo: mutation }} className="fiche-btn fiche-btn--primary">
              Corriger et resoumettre
            </Link>
          )}
        </div>
      </div>

      {mutation.NouveauStatus == 2 && mutation.motifRejet && (
        <div className="fiche-alerte fiche-alerte--rejet" role="status">
          <AiOutlineCloseCircle aria-hidden="true" />
          <div><strong>Motif du rejet :</strong> {mutation.motifRejet}</div>
        </div>
      )}
      {erreurs && Object.keys(erreurs).length > 0 && <Erreurs validation={erreurs} />}

      {/* Plaque (le numéro est conservé par la mutation) */}
      <section className="fiche-carte fiche-plaque">
        {PLAQUE_TYPES[mode]
          ? <Plaque type={mode} numero={mutation.immatriculation_number} qrcode={mutation.qrcode ? url + mutation.qrcode : null} />
          : <p className="fiche-muted">Numéro {mutation.immatriculation_number}</p>}
      </section>

      {/* Changement d'affectation : avant → après */}
      <section className="fiche-carte">
        <h2 className="fiche-carte__titre">Changement d'affectation</h2>
        <div className="mut-transfert">
          <div className="mut-transfert__bloc">
            <span className="mut-transfert__etiquette">Affectation actuelle</span>
            <strong>{ou(mutation.ancienMinistere)}</strong>
            <span className="fiche-muted">{ou(mutation.ancienDirection, "Sans direction")}</span>
          </div>
          <span className="mut-transfert__fleche" aria-hidden="true">→</span>
          <div className="mut-transfert__bloc mut-transfert__bloc--nouveau">
            <span className="mut-transfert__etiquette">Nouvelle affectation</span>
            <strong>{ou(mutation.NouveMinistere)}</strong>
            <span className="fiche-muted">{ou(mutation.nouvelleDirection, "Sans direction")}</span>
          </div>
        </div>
        <dl className="fiche-kv">
          <div><dt>Motif</dt><dd>{ou(mutation.motif)}</dd></div>
          {mutation.fonction && mutation.fonction !== "Non renseignée" && <div><dt>Fonction du nouveau détenteur</dt><dd>{mutation.fonction}</dd></div>}
        </dl>
      </section>

      <div className="fiche__layout">
        <div className="fiche__main">
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
            <HistoriqueVehicule immatriculationId={mutation.immatriculation_id} />
          </section>
        </div>

        <aside className="fiche__side">
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Paiement</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Référence SIPIM</dt><dd className="fiche-mono">{ou(mutation.paiementReference, "Mutation saisie sans paiement")}</dd></div>
              <div><dt>Type de plaque</dt><dd>{mode ? `${mode}${PLAQUE_TYPES[mode] ? ` · ${PLAQUE_TYPES[mode].toLowerCase()}` : ""}` : "—"}</dd></div>
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Suivi</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Demandée par</dt><dd>{ou(mutation.demandeur)}</dd></div>
              <div><dt>Date de la demande</dt><dd>{ou(date(mutation.dateDemande, "DD/MM/YYYY [à] HH:mm"))}</dd></div>
              {mutation.validePar && <div><dt>{mutation.NouveauStatus == 2 ? "Rejetée par" : "Validée par"}</dt><dd>{mutation.validePar}</dd></div>}
              {mutation.dateDecision && <div><dt>Date de la décision</dt><dd>{date(mutation.dateDecision, "DD/MM/YYYY [à] HH:mm")}</dd></div>}
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

export default DetailsMutation;
