import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { getStatsParc, getVehiculesParc } from "../../services/disponibilite.service";
import { exportCsv, exportExcel } from "../DataGrid/utils";
import { dateFr, libelleVehicule } from "./Disponibilite";

// Colonnes de l'export : tout le parc, avec le détail des véhicules indisponibles
const COLONNES_EXPORT = [
  { field: "immatriculation_number", headerName: "Immatriculation" },
  { field: "marque", headerName: "Marque" },
  { field: "modele", headerName: "Modèle" },
  { field: "type", headerName: "Type" },
  { field: "numChassie", headerName: "Châssis" },
  { field: "affectation", headerName: "Affectation" },
  { field: "etat", headerName: "État" },
  { field: "motif", headerName: "Motif" },
  { field: "description", headerName: "Précisions" },
  { field: "depuis", headerName: "Indisponible depuis le" },
  { field: "duree", headerName: "Durée (jours)" },
  { field: "declare_par_nom", headerName: "Déclaré par" },
];

/**
 * Disponibilité du parc automobile, pour les tableaux de bord de l'administrateur et de la Direction Générale GG.
 * Masqué pour les rôles qui n'y ont pas accès (réponse refusée par le serveur).
 */
const ParcDisponibiliteCard = () => {
  const [stats, setStats] = useState();
  const [exportEnCours, setExportEnCours] = useState("");
  const [erreurExport, setErreurExport] = useState("");
  useEffect(() => {
    getStatsParc().then((resp) => setStats(resp?.success ? resp : null));
  }, []);
  if (!stats) return null;

  // Liste complète relue au moment de l'export (indisponibles en tête)
  const exporter = async (format) => {
    setExportEnCours(format); setErreurExport("");
    const resp = await getVehiculesParc();
    setExportEnCours("");
    if (!resp?.success) return setErreurExport("Export impossible : réessayez.");
    const lignes = resp.vehicules.map((v) => ({
      ...v,
      etat: v.indisponibilite_id ? "Indisponible" : "Disponible",
      depuis: v.indisponibilite_id ? dateFr(v.date_debut) : "",
      duree: v.indisponibilite_id ? Math.max(0, moment().startOf("day").diff(moment(v.date_debut).startOf("day"), "days")) : "",
    }));
    const nom = `Parc automobile ${moment().format("YYYY-MM-DD")}`;
    (format === "excel" ? exportExcel : exportCsv)(COLONNES_EXPORT, lignes, (row) => row.immatriculation_id, nom);
  };

  const taux = stats.total ? Math.round((stats.disponibles / stats.total) * 100) : 0;
  return (
    <section className={`agent-card agent-side-card parc-card${stats.indisponibles ? " dir-side--attention" : ""}`}>
      <h2 className="agent-card__title">Parc automobile</h2>
      <div className="parc-card__chiffres">
        <div><span className="agent-kpi__value">{stats.disponibles}</span><span className="agent-muted">disponibles</span></div>
        <div><span className="agent-kpi__value parc-card__indispo">{stats.indisponibles}</span><span className="agent-muted">indisponibles</span></div>
      </div>
      <div className="parc-card__barre" role="img" aria-label={`${taux} % du parc disponible`}>
        <span style={{ width: `${taux}%` }} />
      </div>
      <span className="agent-muted">{taux} % des {stats.total} véhicules du parc disponibles</span>

      {stats.parMotif?.length > 0 && (
        <ul className="parc-card__motifs">
          {stats.parMotif.map((m) => <li key={m.motif}><span>{m.motif}</span><strong>{m.total}</strong></li>)}
        </ul>
      )}
      {stats.recents?.length > 0 && (
        <div className="adm-liste">
          {stats.recents.map((r) => (
            <div key={r.indisponibilite_id} className="dir-approuver">
              <div>
                <span className="agent-cell-main">{r.immatriculation_number} · {libelleVehicule(r)}</span>
                <span className="agent-muted">{r.motif} · depuis le {dateFr(r.date_debut)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="parc-card__export">
        <button type="button" className="agent-btn agent-btn--outline" onClick={() => exporter("excel")} disabled={!!exportEnCours}>
          {exportEnCours === "excel" ? "Export…" : "Exporter en Excel"}
        </button>
        <button type="button" className="agent-btn parc-btn--lien" onClick={() => exporter("csv")} disabled={!!exportEnCours}>
          {exportEnCours === "csv" ? "Export…" : "CSV"}
        </button>
      </div>
      {erreurExport && <span className="agent-error" role="alert">{erreurExport}</span>}
      <Link to="/parc-automobile" className="adm-lien">{stats.gestion ? "Gérer la disponibilité →" : "Voir le parc automobile →"}</Link>
    </section>
  );
};

export default ParcDisponibiliteCard;
