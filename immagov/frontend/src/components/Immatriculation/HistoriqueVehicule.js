import { useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/fr";
import { historiqueVehicule } from "../../services/immatriculation.service";

const ORIGINES = {
  reprise: "Immatriculation",
  immatriculation: "Immatriculation",
  mutation: "Mutation",
  reforme: "Réforme",
};
const STATUTS_DEMANDE = { 0: "En attente", 2: "Rejetée" };
const date = (d) => (d ? moment(d).format("DD/MM/YYYY") : "");
const duree = (debut, fin) => {
  if (!debut) return "";
  const jours = moment(fin || undefined).diff(moment(debut), "days");
  return jours < 1 ? "moins d'un jour" : moment.duration(jours, "days").locale("fr").humanize();
};

/**
 * Historique d'utilisation du véhicule : tous ceux qui l'ont utilisé (organismes, bénéficiaire d'une réforme),
 * du plus récent au plus ancien, et les demandes de mutation / réforme en attente ou rejetées.
 */
const HistoriqueVehicule = ({ immatriculationId, compact = false }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!immatriculationId) return;
    historiqueVehicule(immatriculationId).then((resp) => setData(resp?.success ? resp : { periodes: [], demandes: [] }));
  }, [immatriculationId]);

  if (!data) return <p className="hist-vide">Chargement de l'historique…</p>;
  const { periodes, demandes } = data;

  return (
    <div className={`hist${compact ? " hist--compact" : ""}`}>
      {periodes.length === 0 && (
        <p className="hist-vide">Aucune période d'utilisation enregistrée : le véhicule n'a pas encore été validé.</p>
      )}
      <ol className="hist-liste">
        {periodes.map((p) => {
          const enCours = !p.fin;
          return (
            <li key={p.id} className={`hist-item${enCours ? " is-en-cours" : ""}`}>
              <span className="hist-point" aria-hidden="true" />
              <div className="hist-contenu">
                <div className="hist-entete">
                  <strong>{p.detenteur || p.ministere_nom || "Organisme non renseigné"}</strong>
                  <span className={`hist-badge hist-badge--${p.origine}`}>{ORIGINES[p.origine] || p.origine}</span>
                  {enCours && <span className="hist-badge hist-badge--actuel">Utilisateur actuel</span>}
                </div>
                {p.detenteur && p.ministere_nom && <span className="hist-ligne">{p.ministere_nom}</span>}
                {p.direction_nom && <span className="hist-ligne">{p.direction_nom}</span>}
                {p.fonction && p.fonction !== "Non renseignée" && <span className="hist-ligne">Fonction : {p.fonction}</span>}
                {(p.telephone || p.email) && <span className="hist-ligne">{[p.telephone && `Tél. ${p.telephone}`, p.email].filter(Boolean).join(" · ")}</span>}
                {p.adresse && <span className="hist-ligne">{p.adresse}</span>}
                <span className="hist-dates">
                  {enCours ? `Depuis le ${date(p.debut)}` : `Du ${date(p.debut)} au ${date(p.fin)}`} · {duree(p.debut, p.fin)}
                  {!enCours && p.motif_fin && ` · fin par ${p.motif_fin === "reforme" ? "réforme" : "mutation"}`}
                </span>
                {(p.reference || p.valide_par_nom) && (
                  <span className="hist-meta">
                    {p.reference && <>Référence <span className="hist-mono">{p.reference}</span></>}
                    {p.reference && p.valide_par_nom && " · "}
                    {p.valide_par_nom && `validé par ${p.valide_par_nom}`}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {demandes.length > 0 && (
        <div className="hist-demandes">
          <span className="hist-sous-titre">Demandes non abouties ou en cours</span>
          {demandes.map((d) => (
            <div key={`${d.type}-${d.id}`} className="hist-demande">
              <div className="hist-entete">
                <strong>{d.type === "reforme" ? `Réforme vers ${d.detenteur || "—"}` : `Mutation vers ${d.nouveau || "—"}`}</strong>
                <span className={`hist-badge ${Number(d.status) === 2 ? "hist-badge--rejete" : "hist-badge--attente"}`}>{STATUTS_DEMANDE[d.status] || d.status}</span>
              </div>
              <span className="hist-ligne">
                Demandée le {date(d.created_at)}{d.demandeur ? ` par ${d.demandeur}` : ""}{d.ancien ? ` · depuis ${d.ancien}` : ""}
              </span>
              {(d.telephone || d.adresse) && <span className="hist-ligne">{[d.telephone && `Tél. ${d.telephone}`, d.adresse].filter(Boolean).join(" · ")}</span>}
              {d.reference && <span className="hist-meta">Référence <span className="hist-mono">{d.reference}</span></span>}
              {Number(d.status) === 2 && d.motif_rejet && <span className="hist-ligne hist-rejet">Motif du rejet : {d.motif_rejet}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoriqueVehicule;
