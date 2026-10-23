import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Helmet } from "react-helmet-async";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import Spinner from "../../components/Spinner/Spinner";
import { getVehiculesParc, urlFichier } from "../../services/disponibilite.service";
import { DisponibleDialog, HistoriqueDialog, IndisponibleDialog, dateFr, libelleVehicule } from "../../components/Disponibilite/Disponibilite";

const FILTRES = [
  { value: "tous", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "indisponible", label: "Indisponibles" },
];

/**
 * Parc automobile : disponibilité de chaque véhicule immatriculé (hors réformés).
 * La Direction Générale GG rend un véhicule indisponible (fiche technique scannée obligatoire) ou le remet en service.
 */
const ParcAutomobile = () => {
  const [donnees, setDonnees] = useState();
  const [filtre, setFiltre] = useState("tous");
  const [recharger, setRecharger] = useState(0);
  const [action, setAction] = useState(null); // { type: 'indisponible' | 'disponible' | 'historique', vehicule }

  useEffect(() => {
    getVehiculesParc().then((resp) => setDonnees(resp?.success ? resp : { erreur: Object.values(resp?.messages || {}).flat()[0] || "Chargement impossible." }));
  }, [recharger]);

  const vehicules = donnees?.vehicules || [];
  const indisponibles = vehicules.filter((v) => v.indisponibilite_id).length;
  const lignes = useMemo(() => vehicules
    .filter((v) => filtre === "tous" || (filtre === "indisponible") === !!v.indisponibilite_id)
    .map((v) => ({ ...v, id: v.immatriculation_id, vehicule: libelleVehicule(v), etat: v.indisponibilite_id ? "Indisponible" : "Disponible" })),
  [vehicules, filtre]);

  // Véhicules indisponibles : les plus anciens d'abord (immobilisés depuis le plus longtemps)
  const lignesIndisponibles = useMemo(() => vehicules
    .filter((v) => v.indisponibilite_id)
    .map((v) => ({ ...v, id: v.immatriculation_id, vehicule: libelleVehicule(v), duree: moment().startOf("day").diff(moment(v.date_debut).startOf("day"), "days") }))
    .sort((a, b) => b.duree - a.duree),
  [vehicules]);

  const fermer = () => setAction(null);
  const enregistre = () => { setAction(null); setRecharger((n) => n + 1); };
  const gestion = !!donnees?.gestion;

  const colonnes = [
    { field: "immatriculation_number", headerName: "Immatriculation", minWidth: 130,
      renderCell: ({ value }) => <span className="parc-mono">{value}</span> },
    { field: "vehicule", headerName: "Véhicule", flex: 1, minWidth: 160 },
    { field: "type", headerName: "Type", minWidth: 110 },
    { field: "affectation", headerName: "Affectation", flex: 1, minWidth: 200 },
    { field: "etat", headerName: "État", minWidth: 140,
      renderCell: ({ row }) => row.indisponibilite_id ? (
        <span className="parc-etat">
          <span className="agent-badge agent-badge--rejete">Indisponible</span>
          <span className="agent-muted">{row.motif} · depuis le {dateFr(row.date_debut)}</span>
        </span>
      ) : <span className="agent-badge agent-badge--valide">Disponible</span> },
    { field: "fiche", headerName: "Pièces", minWidth: 120, sortable: false, filterable: false, disableExport: true,
      renderCell: ({ row }) => row.indisponibilite_id ? (
        <span className="parc-pieces">
          <a href={urlFichier(row.fiche_technique)} target="_blank" rel="noreferrer">Fiche</a>
          {row.preuve && <a href={urlFichier(row.preuve)} target="_blank" rel="noreferrer">Preuve</a>}
        </span>
      ) : "—" },
    { field: "actions", headerName: "", minWidth: gestion ? 260 : 120, sortable: false, filterable: false, disableExport: true, hideable: false,
      renderCell: ({ row }) => (
        <span className="parc-actions">
          {gestion && (row.indisponibilite_id
            ? <button type="button" className="agent-btn agent-btn--outline" onClick={() => setAction({ type: "disponible", vehicule: row })}>Rendre disponible</button>
            : <button type="button" className="agent-btn parc-btn--danger" onClick={() => setAction({ type: "indisponible", vehicule: row })}>Rendre indisponible</button>)}
          <button type="button" className="agent-btn parc-btn--lien" onClick={() => setAction({ type: "historique", vehicule: row })}>Historique</button>
        </span>
      ) },
  ];

  const pieces = colonnes.find((c) => c.field === "fiche");
  const actions = colonnes.find((c) => c.field === "actions");
  const colonnesIndisponibles = [
    colonnes[0],
    { field: "vehicule", headerName: "Véhicule", flex: 1, minWidth: 150 },
    { field: "affectation", headerName: "Affectation", flex: 1, minWidth: 180 },
    { field: "motif", headerName: "Motif", minWidth: 150,
      renderCell: ({ row }) => (
        <span className="parc-etat">
          <strong>{row.motif}</strong>
          {row.description && <span className="agent-muted" title={row.description}>{row.description}</span>}
        </span>
      ) },
    { field: "date_debut", headerName: "Depuis le", minWidth: 110, valueFormatter: ({ value }) => dateFr(value) },
    { field: "duree", headerName: "Durée", minWidth: 90, valueFormatter: ({ value }) => (value <= 0 ? "Aujourd'hui" : `${value} j`) },
    { field: "declare_par_nom", headerName: "Déclaré par", minWidth: 140 },
    pieces,
    actions,
  ];

  if (!donnees) return <Spinner />;

  return (
    <div className="agent-dash dir-dash parc-page">
      <Helmet><title>Parc automobile</title></Helmet>
      <div className="agent-dash__head">
        <div>
          <h1 className="agent-dash__title">Parc automobile</h1>
          <p className="agent-dash__sub">
            Disponibilité des véhicules immatriculés.{gestion ? " Pour rendre un véhicule indisponible, joignez sa fiche technique scannée." : " Consultation seule : la Direction Générale GG gère la disponibilité."}
          </p>
        </div>
      </div>

      {donnees.erreur ? <p className="agent-error">{donnees.erreur}</p> : (
        <>
          <div className="dir-kpis">
            {[
              { libelle: "Véhicules du parc", valeur: vehicules.length, note: "immatriculés, hors réformés" },
              { libelle: "Disponibles", valeur: vehicules.length - indisponibles, note: vehicules.length ? `${Math.round(((vehicules.length - indisponibles) / vehicules.length) * 100)} % du parc` : "—" },
              { libelle: "Indisponibles", valeur: indisponibles, note: indisponibles ? "fiche technique jointe" : "aucun véhicule", alerte: indisponibles > 0 },
            ].map((k) => (
              <div key={k.libelle} className="dir-kpi">
                <span className="agent-kpi__label">{k.libelle}</span>
                <span className="agent-kpi__value">{k.valeur}</span>
                <span className={`agent-kpi__note${k.alerte ? " dir-kpi__alerte" : ""}`}>{k.note}</span>
              </div>
            ))}
          </div>

          <section className="agent-card parc-liste">
            <div className="agent-card__head">
              <div>
                <h2 className="agent-card__title">Véhicules indisponibles</h2>
                <p className="agent-muted">{indisponibles ? `${indisponibles} véhicule${indisponibles > 1 ? "s" : ""}, immobilisé${indisponibles > 1 ? "s" : ""} depuis le plus longtemps en premier` : "Aucun véhicule indisponible : tout le parc est en service."}</p>
              </div>
            </div>
            {indisponibles > 0 && (
              // Hauteur naturelle (10 lignes par page) : une hauteur fixe trop petite écrasait la première ligne
              <Box sx={{ width: "100%" }}>
                <DataGrid rows={lignesIndisponibles} columns={colonnesIndisponibles} density="standard" components={{ Toolbar: GridToolbar }}
                  pagination pageSize={10} localeText={frFR.components.MuiDataGrid.defaultProps.localeText} />
              </Box>
            )}
          </section>

          <section className="agent-card parc-liste">
            <div className="agent-card__head">
              <div>
                <h2 className="agent-card__title">Tous les véhicules du parc</h2>
                <p className="agent-muted">Rendez un véhicule indisponible ou consultez son historique.</p>
              </div>
            </div>
            <div className="parc-filtres" role="group" aria-label="Filtrer par état">
              {FILTRES.map((f) => (
                <button key={f.value} type="button" aria-pressed={filtre === f.value}
                  className={`parc-filtre${filtre === f.value ? " is-active" : ""}`} onClick={() => setFiltre(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid rows={lignes} columns={colonnes} density="standard" components={{ Toolbar: GridToolbar }}
                autoPageSize pagination localeText={frFR.components.MuiDataGrid.defaultProps.localeText} />
            </Box>
          </section>
        </>
      )}

      {action?.type === "indisponible" && <IndisponibleDialog vehicule={action.vehicule} motifs={donnees.motifs || []} onClose={fermer} onSaved={enregistre} />}
      {action?.type === "disponible" && <DisponibleDialog vehicule={action.vehicule} onClose={fermer} onSaved={enregistre} />}
      {action?.type === "historique" && <HistoriqueDialog vehicule={action.vehicule} onClose={fermer} />}
    </div>
  );
};

export default ParcAutomobile;
