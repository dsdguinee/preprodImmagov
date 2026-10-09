import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/fr";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { GiSandsOfTime } from "react-icons/gi";
import { BiTimer, BiCar } from "react-icons/bi";
import { dashboardDirecteur } from "../../services/immatriculation.service";
import Spinner from "../../components/Spinner/Spinner";

const FORMAT = "YYYY-MM-DD";
// Périodes rapides : dates calculées ici, envoyées au backend en du / au
const PERIODES = [
  { cle: "jour", libelle: "Aujourd'hui", dates: () => [moment(), moment()] },
  { cle: "sept", libelle: "7 derniers jours", dates: () => [moment().subtract(6, "days"), moment()] },
  { cle: "mois", libelle: "Ce mois-ci", dates: () => [moment().startOf("month"), moment()] },
  { cle: "trim", libelle: "3 derniers mois", dates: () => [moment().subtract(3, "months").add(1, "day"), moment()] },
  { cle: "an", libelle: "12 derniers mois", dates: () => [moment().subtract(12, "months").add(1, "day"), moment()] },
  { cle: "perso", libelle: "Personnalisée" },
];
const ONGLETS = [
  { cle: "immatriculations", libelle: "Immatriculations", lien: (id) => `/details-immatriculation/${id}`, liste: { to: "/liste-immatriculation", state: { title: "Attente", filter_id: 0 } } },
  { cle: "resoumis", libelle: "Resoumis", lien: (id) => `/details-immatriculation/${id}`, liste: { to: "/liste-immatriculation", state: { title: "Attente", filter_id: 0 } }, resoumis: true },
  { cle: "reformes", libelle: "Réformes", lien: (id) => `/details-reforme/${id}`, liste: { to: "/liste-reforme" } },
  { cle: "mutations", libelle: "Mutations", lien: (id) => `/details-mutation/${id}`, liste: { to: "/liste-mutation" } },
];
const RETARD_JOURS = 7;

const anciennete = (date) => {
  const jours = moment().diff(moment(date), "days");
  const texte = jours === 0 ? "Aujourd'hui" : jours <= 30 ? `${jours} j` : moment(date).locale("fr").fromNow(true);
  const ton = jours >= RETARD_JOURS ? "rouge" : jours >= 3 ? "ambre" : "neutre";
  return { jours, texte, ton };
};

// Libellés du graphique selon le découpage renvoyé par le backend
const libellePoint = (p, pas) => {
  if (pas === "heure") return { court: p.cle, long: `${p.cle} – ${String(parseInt(p.cle) + 2).padStart(2, "0")}h` };
  const d = moment(p.debut).locale("fr");
  if (pas === "jour") return { court: d.format("ddd D"), long: d.format("dddd D MMMM YYYY") };
  if (pas === "semaine") return { court: p.cle.split("-")[1], long: `Semaine du ${d.startOf("isoWeek").format("D MMMM YYYY")}` };
  return { court: d.format("MMM"), long: d.format("MMMM YYYY") };
};
const TITRES_PAS = { heure: "par tranche de 2 heures", jour: "par jour", semaine: "par semaine", mois: "par mois" };

const DirecteurDashboard = ({ user }) => {
  const [periode, setPeriode] = useState("mois");
  const [perso, setPerso] = useState({ du: moment().subtract(3, "months").format(FORMAT), au: moment().format(FORMAT) });
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [onglet, setOnglet] = useState("immatriculations");
  const [retardSeul, setRetardSeul] = useState(false);
  const [survol, setSurvol] = useState(-1);

  const choisie = PERIODES.find((p) => p.cle === periode);
  const [du, au] = periode === "perso" ? [perso.du, perso.au] : choisie.dates().map((d) => d.format(FORMAT));

  useEffect(() => {
    if (!du || !au) return;
    let actif = true;
    setChargement(true);
    dashboardDirecteur(du, au).then((resp) => {
      if (!actif) return;
      if (resp?.success) { setData(resp); setErreur(""); }
      else setErreur(resp?.messages ? Object.values(resp.messages).flat().join(" ") : "Impossible de charger le tableau de bord.");
      setChargement(false);
      setSurvol(-1);
    });
    return () => { actif = false; };
  }, [du, au]);

  if (!data) return <div className="agent-dash dir-dash">{chargement ? <Spinner /> : <p className="agent-muted">{erreur}</p>}</div>;

  const { decisions, precedente, serie, attente, file, compteurs, aApprouver, aImprimer, parc, organismes, agents } = data;
  const traites = decisions.valides + decisions.rejets;
  const taux = traites ? Math.round((decisions.rejets / traites) * 100) : 0;
  const ecart = decisions.valides - precedente.valides;
  const resume = data.periode.du === data.periode.au
    ? moment(data.periode.du).locale("fr").format("dddd D MMMM YYYY")
    : `Du ${moment(data.periode.du).format("DD/MM/YYYY")} au ${moment(data.periode.au).format("DD/MM/YYYY")}`;

  const kpis = [
    { libelle: "En attente de validation", valeur: attente.total, Icone: GiSandsOfTime, ton: "ambre", alerte: attente.retard > 0,
      note: attente.retard ? `Dont ${attente.retard} depuis plus de ${RETARD_JOURS} jours · toutes périodes` : "Aucun retard · toutes périodes" },
    { libelle: "Validées sur la période", valeur: decisions.valides, Icone: AiOutlineCheckCircle, ton: "vert",
      note: ecart === 0 ? "Autant que sur la période précédente" : `${ecart > 0 ? "+" : ""}${ecart} par rapport à la période précédente` },
    { libelle: "Taux de rejet", valeur: `${taux} %`, Icone: AiOutlineCloseCircle, ton: "rouge",
      note: `${decisions.rejets} rejet${decisions.rejets > 1 ? "s" : ""} sur ${traites} dossier${traites > 1 ? "s" : ""} traité${traites > 1 ? "s" : ""}` },
    { libelle: "Délai moyen de validation", valeur: decisions.delai !== null ? `${String(decisions.delai).replace(".", ",")} j` : "—", Icone: BiTimer, ton: "neutre",
      note: "Entre la soumission et la décision" },
    { libelle: "Parc immatriculé", valeur: parc.total, Icone: BiCar, ton: "neutre",
      note: `${parc.ep} EP · ${parc.va} VA · toutes périodes` },
  ];

  const ongletActif = ONGLETS.find((o) => o.cle === onglet);
  // Resoumis : ancienneté comptée depuis la resoumission
  const lignes = (file[onglet] || []).map((l) => ({ ...l, age: anciennete(ongletActif.resoumis ? l.resoumis_le : l.created_at) }))
    .filter((l) => !retardSeul || l.age.jours >= RETARD_JOURS);
  const maxSerie = Math.max(4, ...serie.map((p) => p.valides)) * 1.15;
  const maxOrg = Math.max(1, ...organismes.map((o) => o.n));

  return (
    <div className="agent-dash dir-dash">
      {chargement && <Spinner />}
      <div className="agent-dash__head">
        <div>
          <h1 className="agent-dash__title">Bonjour, {user?.prenom}</h1>
          <p className="agent-dash__sub">{moment().locale("fr").format("dddd D MMMM YYYY")} · Vue d'ensemble du parc et des dossiers à valider.</p>
        </div>
        <div className="dir-head-actions">
          <Link to="/statistiques" className="agent-btn dir-btn--secondary">Statistiques</Link>
          <a href="#file-validation" className="agent-btn agent-btn--primary">Traiter la file de validation</a>
        </div>
      </div>

      {/* Période : indicateurs de décision, graphique et activité des agents */}
      <div className="dir-periode">
        <span className="dir-periode__label">Période</span>
        <div className="agent-filtres" role="group" aria-label="Période">
          {PERIODES.map((p) => (
            <button key={p.cle} type="button" aria-pressed={periode === p.cle}
              className={`agent-filtre${periode === p.cle ? " is-active" : ""}`} onClick={() => setPeriode(p.cle)}>
              {p.libelle}
            </button>
          ))}
        </div>
        {periode === "perso" && (
          <div className="dir-periode__dates">
            <label>Du<input type="date" value={perso.du} max={perso.au} onChange={(e) => setPerso({ ...perso, du: e.target.value })} /></label>
            <label>Au<input type="date" value={perso.au} min={perso.du} max={moment().format(FORMAT)} onChange={(e) => setPerso({ ...perso, au: e.target.value })} /></label>
          </div>
        )}
        <span className="dir-periode__resume">{resume}</span>
        {erreur && <span className="agent-error" role="alert">{erreur}</span>}
      </div>

      <div className="dir-kpis">
        {kpis.map((k) => (
          <div key={k.libelle} className="dir-kpi">
            <span className="agent-kpi__top">
              <span className="agent-kpi__label">{k.libelle}</span>
              <span className={`agent-kpi__icon agent-kpi__icon--${k.ton}`}><k.Icone aria-hidden="true" /></span>
            </span>
            <span className="agent-kpi__value">{k.valeur}</span>
            <span className={`agent-kpi__note${k.alerte ? " dir-kpi__alerte" : ""}`}>{k.note}</span>
          </div>
        ))}
      </div>

      <div className="agent-dash__layout">
        <div className="agent-dash__main">
          {/* File de validation */}
          <section id="file-validation" className="agent-card">
            <div className="dir-file__head">
              <div className="dir-file__titre">
                <div>
                  <h2 className="agent-card__title">File de validation</h2>
                  <p className="agent-muted">Tous les dossiers en attente, quelle que soit la période · les plus récents d'abord</p>
                </div>
                <label className="dir-checkbox">
                  <input type="checkbox" checked={retardSeul} onChange={() => setRetardSeul(!retardSeul)} />
                  Plus de {RETARD_JOURS} jours seulement
                </label>
              </div>
              <div className="dir-onglets" role="tablist" aria-label="Type de dossier">
                {ONGLETS.map((o) => (
                  <button key={o.cle} type="button" role="tab" aria-selected={onglet === o.cle}
                    className={`dir-onglet${onglet === o.cle ? " is-active" : ""}`} onClick={() => setOnglet(o.cle)}>
                    {o.libelle} <span className={`dir-onglet__count${compteurs[o.cle] ? " has-items" : ""}`}>{compteurs[o.cle]}</span>
                  </button>
                ))}
              </div>
            </div>
            {lignes.length > 0 ? (
              <div className="agent-table-wrap">
                <table className="agent-table dir-table">
                  <thead>
                    <tr>
                      <th>N° d'immatriculation</th><th>Véhicule</th><th>Affectation</th><th>Agent</th><th>{ongletActif.resoumis ? "Resoumis depuis" : "En attente depuis"}</th><th className="is-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <span className="agent-mono">{l.numero}</span>
                          {Number(l.nb_rejets) > 0 && (
                            <span className="dir-tag dir-tag--resoumis">Resoumis{Number(l.nb_rejets) > 1 ? ` · ${l.nb_rejets} rejets` : ""}</span>
                          )}
                        </td>
                        <td>
                          <span className="agent-cell-main">{[l.marque, l.modele].filter(Boolean).join(" ") || "Véhicule"}</span>
                          <span className="agent-mono agent-muted">{l.chassis}</span>
                        </td>
                        <td>
                          {l.affectation || "—"}
                          {!!Number(l.nouvel) && <span className="dir-tag">Nouvel organisme à approuver</span>}
                          {ongletActif.resoumis && l.dernier_motif && (
                            <span className="dir-motif">Rejet précédent : {l.dernier_motif}</span>
                          )}
                        </td>
                        <td>{l.agent || "—"}</td>
                        <td><span className={`agent-delai dir-delai--${l.age.ton}`}>{l.age.texte}</span></td>
                        <td className="is-right">
                          {Number(l.nouvel)
                            ? <Link to={`/organisation/ministere/create/${l.id}`} className="agent-btn dir-btn--approuver">Approuver l'organisme</Link>
                            : <Link to={ongletActif.lien(l.id)} className="agent-btn agent-btn--outline">Examiner</Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dir-vide">
                {retardSeul ? `Aucun dossier en attente depuis plus de ${RETARD_JOURS} jours.`
                  : ongletActif.resoumis ? "Aucun dossier resoumis en attente de validation." : "Aucun dossier de ce type en attente de validation."}
              </p>
            )}
            <div className="agent-card__foot dir-file__foot">
              <span className="agent-muted">{lignes.length} affiché{lignes.length > 1 ? "s" : ""} sur {compteurs[onglet]}</span>
              <Link to={ongletActif.liste.to} state={ongletActif.liste.state}>Voir toute la liste →</Link>
            </div>
          </section>

          <div className="dir-graphs">
            {/* Validées sur la période */}
            <section className="agent-card agent-chart">
              <div className="agent-card__head">
                <h2 className="agent-card__title">Immatriculations validées {TITRES_PAS[data.periode.pas]}</h2>
                <span className="agent-muted">{resume} · survolez une barre</span>
              </div>
              <div className="agent-chart__plot" style={{ gap: serie.length > 8 ? 6 : 16 }} onMouseLeave={() => setSurvol(-1)}>
                <span className="agent-chart__grid" style={{ bottom: "50%" }} />
                {serie.map((p, i) => {
                  const pct = Math.round((p.valides / maxSerie) * 100);
                  const actif = survol === i;
                  const lib = libellePoint(p, data.periode.pas);
                  return (
                    <div key={p.cle} className="agent-chart__col" tabIndex={0}
                      onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} onBlur={() => setSurvol(-1)}
                      aria-label={`${lib.long} : ${p.valides} validées, ${p.rejets} rejetées`}>
                      {actif && (
                        <div className="agent-chart__tip" style={{ bottom: `calc(${pct}% + 8px)` }}>
                          <strong>{lib.long}</strong>
                          <span>{p.valides} validée{p.valides > 1 ? "s" : ""} · {p.rejets} rejetée{p.rejets > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      <div className={`agent-chart__bar${actif ? " is-active" : ""}`} style={{ height: `${p.valides ? Math.max(pct, 2) : 0}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="agent-chart__labels" style={{ gap: serie.length > 8 ? 6 : 16 }}>
                {serie.map((p) => <span key={p.cle}>{serie.length > 12 ? "" : libellePoint(p, data.periode.pas).court}</span>)}
              </div>
            </section>

            {/* Parc par organisme */}
            <section className="agent-card dir-orgs">
              <div className="agent-card__head">
                <h2 className="agent-card__title">Parc par organisme</h2>
                <span className="agent-muted">Ensemble du parc · 5 premiers</span>
              </div>
              <div className="dir-orgs__list">
                {organismes.map((o) => (
                  <div key={o.nom} className="dir-org">
                    <div className="dir-org__top"><span title={o.nom}>{o.nom}</span><strong>{o.n}</strong></div>
                    <div className="dir-org__track"><div className="dir-org__bar" style={{ width: `${Math.max(2, Math.round((o.n / maxOrg) * 100))}%` }} /></div>
                  </div>
                ))}
                {organismes.length === 0 && <p className="agent-muted">Aucun véhicule immatriculé.</p>}
              </div>
            </section>
          </div>
        </div>

        <aside className="agent-dash__side">
          {/* Organismes à approuver */}
          <section className={`agent-card agent-side-card${aApprouver.length ? " dir-side--attention" : ""}`}>
            <div className="agent-side-card__head">
              <span className="agent-count dir-count--ambre">{aApprouver.length}</span>
              <h2 className="agent-card__title">Organismes à approuver</h2>
            </div>
            <p className="agent-muted">Proposés par les agents ; ils bloquent la validation de leur dossier.</p>
            {aApprouver.length === 0 && <p className="agent-muted">Aucun organisme à approuver.</p>}
            {aApprouver.map((a) => (
              <div key={a.id} className="dir-approuver">
                <div className="dir-approuver__info">
                  <span className="agent-cell-main">{a.nom}</span>
                  <span className="agent-muted"><span className="agent-mono">{a.numero}</span> · {a.agent}</span>
                </div>
                <Link to={`/organisation/ministere/create/${a.id}`} className="agent-btn agent-btn--outline">Examiner</Link>
              </div>
            ))}
          </section>

          {/* Cartes grises */}
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">Cartes grises à imprimer</h2>
            <div className="dir-imprimer">
              <span className="agent-kpi__value">{aImprimer}</span>
              <span className="agent-muted">immatriculation{aImprimer > 1 ? "s" : ""} validée{aImprimer > 1 ? "s" : ""} non imprimée{aImprimer > 1 ? "s" : ""}</span>
            </div>
            <Link to="/cartes-grises" className="agent-btn agent-btn--primary dir-btn--compact">Ouvrir les impressions</Link>
          </section>

          {/* Activité des agents */}
          <section className="agent-card agent-side-card">
            <div>
              <h2 className="agent-card__title">Activité des agents</h2>
              <p className="agent-muted">Dossiers créés sur la période · {resume}</p>
            </div>
            {agents.length === 0 ? <p className="agent-muted">Aucun dossier créé sur la période.</p> : (
              <table className="dir-agents">
                <thead>
                  <tr><th>Agent</th><th>Soumis</th><th>Attente</th><th>Rejets</th></tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.nom}><td>{a.nom}</td><td>{Number(a.soumis)}</td><td>{Number(a.attente)}</td><td>{Number(a.rejets)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DirecteurDashboard;
