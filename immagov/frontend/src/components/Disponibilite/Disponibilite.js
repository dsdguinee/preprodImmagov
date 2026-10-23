import { useEffect, useRef, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { getHistoriqueDisponibilite, rendreDisponible, rendreIndisponible, urlFichier } from "../../services/disponibilite.service";

const AUJOURDHUI = () => moment().format("YYYY-MM-DD");
const TYPES_FICHIER = ".pdf,.jpg,.jpeg,.png";
const TAILLE_MAX = 10 * 1024 * 1024;
export const libelleVehicule = (v) => [v.marque, v.modele].filter(Boolean).join(" ") || "Véhicule";
export const dateFr = (d) => (d ? moment(d).format("DD/MM/YYYY") : "—");

// Messages d'erreur du serveur : { champ: [messages] } -> liste de textes
const messagesServeur = (messages) => Object.values(messages || {}).flat().filter(Boolean);

// Fenêtre modale : fermeture par Échap, clic à l'extérieur ou bouton
const Dialog = ({ titre, sousTitre, onClose, children, actions }) => {
  const boite = useRef(null);
  useEffect(() => {
    const fermer = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fermer);
    boite.current?.querySelector("select, input, textarea, button")?.focus();
    return () => document.removeEventListener("keydown", fermer);
  }, [onClose]);
  return (
    <div className="parc-dialog" role="dialog" aria-modal="true" aria-labelledby="parc-dialog-titre" onClick={onClose}>
      <div className="parc-dialog__box" ref={boite} onClick={(e) => e.stopPropagation()}>
        <header className="parc-dialog__head">
          <div>
            <h2 id="parc-dialog-titre">{titre}</h2>
            {sousTitre && <p className="agent-muted">{sousTitre}</p>}
          </div>
          <button type="button" className="parc-dialog__close" onClick={onClose} aria-label="Fermer">×</button>
        </header>
        <div className="parc-dialog__body">{children}</div>
        {actions && <footer className="parc-dialog__actions">{actions}</footer>}
      </div>
    </div>
  );
};

const ErreursServeur = ({ liste }) => liste.length ? (
  <div className="parc-alert parc-alert--error" role="alert">{liste.map((m) => <p key={m}>{m}</p>)}</div>
) : null;

// Choix d'un fichier (PDF ou image, 10 Mo au plus)
const ChampFichier = ({ id, label, aide, requis, fichier, onChange, erreur }) => (
  <div className="parc-field">
    <label htmlFor={id}>{label}{requis && <span className="parc-requis"> *</span>}</label>
    <input id={id} type="file" accept={TYPES_FICHIER} aria-invalid={!!erreur}
      onChange={(e) => onChange(e.target.files?.[0] || null)} />
    <span className="parc-aide">{fichier ? `${fichier.name} · ${(fichier.size / 1048576).toFixed(1)} Mo` : aide}</span>
    {erreur && <span className="parc-erreur">{erreur}</span>}
  </div>
);

const verifierFichier = (fichier, requis, libelle) => {
  if (!fichier) return requis ? `${libelle} est obligatoire.` : "";
  if (!/\.(pdf|jpe?g|png)$/i.test(fichier.name)) return "Format accepté : PDF, JPEG ou PNG.";
  if (fichier.size > TAILLE_MAX) return "Le fichier ne doit pas dépasser 10 Mo.";
  return "";
};

/** Rendre un véhicule indisponible : motif, date, fiche technique scannée (obligatoire), autre preuve (facultative). */
export const IndisponibleDialog = ({ vehicule, motifs, onClose, onSaved }) => {
  const [form, setForm] = useState({ motif: "", description: "", date_debut: AUJOURDHUI() });
  const [fiche, setFiche] = useState(null);
  const [preuve, setPreuve] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [serveur, setServeur] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const maj = (champ) => (e) => setForm((f) => ({ ...f, [champ]: e.target.value }));

  const valider = async (e) => {
    e.preventDefault();
    const err = {
      motif: !form.motif && "Choisissez le motif.",
      description: form.motif === "Autre" && !form.description.trim() && "Précisez le motif.",
      date_debut: !form.date_debut ? "La date est obligatoire." : form.date_debut > AUJOURDHUI() && "La date ne peut pas être dans le futur.",
      fiche: verifierFichier(fiche, true, "La fiche technique scannée"),
      preuve: verifierFichier(preuve, false),
    };
    setErreurs(err);
    if (Object.values(err).some(Boolean)) return;
    setEnvoi(true); setServeur([]);
    const resp = await rendreIndisponible({ immatriculation_id: vehicule.immatriculation_id, ...form, fiche_technique: fiche, preuve });
    setEnvoi(false);
    if (resp?.success) {
      toast.success(`${vehicule.immatriculation_number} est maintenant indisponible.`);
      onSaved();
    } else setServeur(messagesServeur(resp?.messages));
  };

  return (
    <Dialog titre="Rendre le véhicule indisponible" sousTitre={`${vehicule.immatriculation_number} · ${libelleVehicule(vehicule)}`} onClose={onClose}
      actions={<>
        <button type="button" className="agent-btn dir-btn--secondary" onClick={onClose}>Annuler</button>
        <button type="submit" form="parc-indispo" className="agent-btn agent-btn--primary" disabled={envoi}>{envoi ? "Enregistrement…" : "Rendre indisponible"}</button>
      </>}>
      <form id="parc-indispo" onSubmit={valider} noValidate className="parc-form">
        <div className="parc-grid">
          <div className="parc-field">
            <label htmlFor="parc-motif">Motif<span className="parc-requis"> *</span></label>
            <select id="parc-motif" value={form.motif} onChange={maj("motif")} aria-invalid={!!erreurs.motif}>
              <option value="">Choisir le motif</option>
              {motifs.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {erreurs.motif && <span className="parc-erreur">{erreurs.motif}</span>}
          </div>
          <div className="parc-field">
            <label htmlFor="parc-debut">Indisponible depuis le<span className="parc-requis"> *</span></label>
            <input id="parc-debut" type="date" max={AUJOURDHUI()} value={form.date_debut} onChange={maj("date_debut")} aria-invalid={!!erreurs.date_debut} />
            {erreurs.date_debut && <span className="parc-erreur">{erreurs.date_debut}</span>}
          </div>
        </div>
        <div className="parc-field">
          <label htmlFor="parc-description">Précisions{form.motif === "Autre" && <span className="parc-requis"> *</span>}</label>
          <textarea id="parc-description" rows={3} maxLength={1000} value={form.description} onChange={maj("description")}
            placeholder="Ex. moteur en panne, au garage central" aria-invalid={!!erreurs.description} />
          {erreurs.description && <span className="parc-erreur">{erreurs.description}</span>}
        </div>
        <ChampFichier id="parc-fiche" label="Fiche technique du véhicule (scannée)" requis fichier={fiche} onChange={setFiche}
          aide="Scan de la fiche technique à l'état actuel · PDF, JPEG ou PNG, 10 Mo max." erreur={erreurs.fiche} />
        <ChampFichier id="parc-preuve" label="Autre preuve (facultatif)" fichier={preuve} onChange={setPreuve}
          aide="Photo, constat, devis… · PDF, JPEG ou PNG, 10 Mo max." erreur={erreurs.preuve} />
        <ErreursServeur liste={serveur} />
      </form>
    </Dialog>
  );
};

/** Remettre le véhicule en service : la période d'indisponibilité en cours est levée. */
export const DisponibleDialog = ({ vehicule, onClose, onSaved }) => {
  const [dateFin, setDateFin] = useState(AUJOURDHUI());
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");
  const [serveur, setServeur] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const debut = moment(vehicule.date_debut).format("YYYY-MM-DD");

  const valider = async (e) => {
    e.preventDefault();
    const err = !dateFin ? "La date est obligatoire." : dateFin > AUJOURDHUI() ? "La date ne peut pas être dans le futur."
      : dateFin < debut ? "La date ne peut pas précéder le début de l'indisponibilité." : "";
    setErreur(err);
    if (err) return;
    setEnvoi(true); setServeur([]);
    const resp = await rendreDisponible({ indisponibilite_id: vehicule.indisponibilite_id, date_fin: dateFin, commentaire });
    setEnvoi(false);
    if (resp?.success) {
      toast.success(`${vehicule.immatriculation_number} est de nouveau disponible.`);
      onSaved();
    } else setServeur(messagesServeur(resp?.messages));
  };

  return (
    <Dialog titre="Remettre le véhicule en service" sousTitre={`${vehicule.immatriculation_number} · ${libelleVehicule(vehicule)}`} onClose={onClose}
      actions={<>
        <button type="button" className="agent-btn dir-btn--secondary" onClick={onClose}>Annuler</button>
        <button type="submit" form="parc-dispo" className="agent-btn agent-btn--primary" disabled={envoi}>{envoi ? "Enregistrement…" : "Rendre disponible"}</button>
      </>}>
      <form id="parc-dispo" onSubmit={valider} noValidate className="parc-form">
        <p className="parc-rappel">Indisponible depuis le {dateFr(vehicule.date_debut)} · {vehicule.motif}{vehicule.description ? ` — ${vehicule.description}` : ""}</p>
        <div className="parc-field">
          <label htmlFor="parc-fin">Disponible à partir du<span className="parc-requis"> *</span></label>
          <input id="parc-fin" type="date" min={debut} max={AUJOURDHUI()} value={dateFin} onChange={(e) => setDateFin(e.target.value)} aria-invalid={!!erreur} />
          {erreur && <span className="parc-erreur">{erreur}</span>}
        </div>
        <div className="parc-field">
          <label htmlFor="parc-commentaire">Commentaire (facultatif)</label>
          <textarea id="parc-commentaire" rows={3} maxLength={1000} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ex. réparation terminée" />
        </div>
        <ErreursServeur liste={serveur} />
      </form>
    </Dialog>
  );
};

/** Périodes d'indisponibilité d'un véhicule, avec leurs pièces jointes. */
export const HistoriqueDialog = ({ vehicule, onClose }) => {
  const [historique, setHistorique] = useState();
  useEffect(() => {
    getHistoriqueDisponibilite(vehicule.immatriculation_id).then((resp) => setHistorique(resp?.success ? resp.historique : []));
  }, [vehicule.immatriculation_id]);
  return (
    <Dialog titre="Historique de disponibilité" sousTitre={`${vehicule.immatriculation_number} · ${libelleVehicule(vehicule)}`} onClose={onClose}
      actions={<button type="button" className="agent-btn dir-btn--secondary" onClick={onClose}>Fermer</button>}>
      {historique === undefined && <p className="agent-muted">Chargement…</p>}
      {historique?.length === 0 && <p className="agent-muted">Ce véhicule n'a jamais été déclaré indisponible.</p>}
      <ol className="parc-historique">
        {historique?.map((p) => (
          <li key={p.indisponibilite_id}>
            <div className="parc-historique__top">
              <strong>{p.motif}</strong>
              <span className={`agent-badge ${Number(p.statut) === 1 ? "agent-badge--rejete" : "agent-badge--valide"}`}>
                {Number(p.statut) === 1 ? "En cours" : "Levée"}
              </span>
            </div>
            <span className="agent-muted">
              Du {dateFr(p.date_debut)}{p.date_fin ? ` au ${dateFr(p.date_fin)}` : " à aujourd'hui"} · déclarée par {p.declare_par_nom || "—"}
              {p.leve_par_nom ? ` · levée par ${p.leve_par_nom}` : ""}
            </span>
            {p.description && <p>{p.description}</p>}
            {p.commentaire_levee && <p className="agent-muted">Remise en service : {p.commentaire_levee}</p>}
            <div className="parc-pieces">
              <a href={urlFichier(p.fiche_technique)} target="_blank" rel="noreferrer">Fiche technique</a>
              {p.preuve && <a href={urlFichier(p.preuve)} target="_blank" rel="noreferrer">Autre preuve</a>}
            </div>
          </li>
        ))}
      </ol>
    </Dialog>
  );
};
