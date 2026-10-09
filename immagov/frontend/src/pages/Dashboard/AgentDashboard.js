import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/fr";
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlinePlus } from "react-icons/ai";
import { GiSandsOfTime } from "react-icons/gi";
import { BsArrowUpRight } from "react-icons/bs";
import Input from "../../components/ui/Input/Input";

// Statuts d'un dossier d'immatriculation (0 attente, 1 validé, 2 rejeté) : icône + libellé, jamais la couleur seule
const STATUTS = {
  0: { libelle: "En attente", classe: "attente", Icone: GiSandsOfTime },
  1: { libelle: "Validé", classe: "valide", Icone: AiOutlineCheckCircle },
  2: { libelle: "Rejeté", classe: "rejete", Icone: AiOutlineCloseCircle },
};
const FILTRES = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: 0, libelle: "En attente" },
  { valeur: 1, libelle: "Validés" },
  { valeur: 2, libelle: "Rejetés" },
];
const ATTENTE_LONGUE_JOURS = 3;

const Statut = ({ status }) => {
  const s = STATUTS[status];
  if (!s) return null;
  return (
    <span className={`agent-badge agent-badge--${s.classe}`}>
      <s.Icone aria-hidden="true" /> {s.libelle}
    </span>
  );
};

const vehicule = (d) => [d.marque, d.modele].filter(Boolean).join(" ") || "Véhicule";
// Correction d'un dossier rejeté : resoumission, directement à l'étape 3 si c'est l'organisme proposé qui a été rejeté
const correction = (r) => ({ to: `/resoumission/${r.immatriculation_id}`, state: r?.typeRejet === "organisme" ? { etape: 3 } : undefined });
// Mutation ou réforme rejetée : sa fiche (motif, resoumission d'une mutation)
const OPERATIONS = {
  mutation: { libelle: "Mutation", lien: (o) => `/details-mutation/${o.id}`, cible: "Vers", action: "Voir et corriger la mutation" },
  reforme: { libelle: "Réforme", lien: (o) => `/details-reforme/${o.id}`, cible: "Pour", action: "Voir et reprendre la réforme" },
};

const AgentDashboard = ({ data, user }) => {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState("tous");
  const [survol, setSurvol] = useState(-1);
  const [reference, setReference] = useState("");
  const [erreurReference, setErreurReference] = useState("");

  const { stats, parMois = [], derniers = [], rejets = [], rejetsOperations = [], attente = [], attenteOperations = [], moisCourant = 0, moisPrecedent = 0 } = data;
  const nbRejetes = rejets.length + rejetsOperations.length;
  // Carte « Rejetés à corriger » : immatriculations, mutations et réformes rejetées
  const aCorriger = (stats.rejete || 0) + rejetsOperations.length;
  const compterParType = (liste) => liste.reduce((acc, o) => ({ ...acc, [o.type]: (acc[o.type] || 0) + 1 }), {});
  // « 2 immatriculations · 1 mutation · 1 réforme »
  const detail = (immatriculations, liste) => [`${immatriculations} immatriculation${immatriculations > 1 ? "s" : ""}`,
    ...Object.entries(compterParType(liste)).map(([t, n]) => `${n} ${OPERATIONS[t].libelle.toLowerCase()}${n > 1 ? "s" : ""}`)].join(" · ");
  const ecart = moisCourant - moisPrecedent;
  // Plus ancienne demande en attente : immatriculation, mutation ou réforme
  const plusAncien = [...attente, ...attenteOperations].sort((a, b) => moment(a.created_at).diff(moment(b.created_at)))[0];
  // Carte « En attente de validation » : immatriculations, mutations et réformes en attente
  const enAttente = (stats.attente || 0) + attenteOperations.length;

  const kpis = [
    { cle: "tous", libelle: "Soumis ce mois-ci", valeur: moisCourant, Icone: BsArrowUpRight, ton: "neutre",
      note: ecart === 0 ? "Autant que le mois dernier" : `${ecart > 0 ? "+" : ""}${ecart} par rapport au mois dernier` },
    { cle: 0, libelle: "En attente de validation", valeur: enAttente, Icone: GiSandsOfTime, ton: "ambre",
      note: !plusAncien ? "Aucun dossier en attente"
        : `${attenteOperations.length ? detail(stats.attente || 0, attenteOperations) + " · " : ""}le plus ancien : ${moment(plusAncien.created_at).fromNow(true)}` },
    { cle: 1, libelle: "Validés", valeur: stats.valider, Icone: AiOutlineCheckCircle, ton: "vert",
      note: `Sur ${stats.totaux} dossier${stats.totaux > 1 ? "s" : ""} soumis` },
    { cle: 2, libelle: "Rejetés à corriger", valeur: aCorriger, Icone: AiOutlineCloseCircle, ton: "rouge",
      note: !aCorriger ? "Aucun dossier à corriger"
        : rejetsOperations.length ? detail(stats.rejete || 0, rejetsOperations)
        : "Motif indiqué par le validateur" },
  ];

  // Filtre « Rejetés » : tous les dossiers rejetés (pas seulement parmi les plus récents)
  const rejetsParId = Object.fromEntries(rejets.map((r) => [r.immatriculation_id, r]));
  // Mutations et réformes rejetées ajoutées au filtre « Rejetés », avec un lien vers leur fiche
  // Mutations et réformes en attente ajoutées au filtre « En attente »
  const enLignes = (liste, status) => liste.map((o) => ({ ...o, status, operation: OPERATIONS[o.type] || OPERATIONS.mutation }));
  const lignes = filtre === 2 ? [...rejets, ...enLignes(rejetsOperations, 2)]
    : filtre === 0 ? [...derniers.filter((d) => d.status === 0), ...enLignes(attenteOperations, 0)]
    : derniers.filter((d) => filtre === "tous" || d.status === filtre);
  const max = Math.max(4, ...parMois.map((m) => m.total));

  const commencer = (e) => {
    e.preventDefault();
    const ref = reference.trim().toUpperCase();
    if (ref.length < 10 || ref.length > 22) {
      setErreurReference("La référence compte entre 10 et 22 caractères.");
      return;
    }
    navigate("/nouvelleimmatriculation", { state: { reference: ref } });
  };

  return (
    <div className="agent-dash">
      <div className="agent-dash__head">
        <div>
          <h1 className="agent-dash__title">Bonjour, {user?.prenom}</h1>
          <p className="agent-dash__sub">{moment().locale("fr").format("dddd D MMMM YYYY")} · Voici l'état de vos dossiers d'immatriculation.</p>
        </div>
        <Link to="/nouvelleimmatriculation" className="agent-btn agent-btn--primary">
          <AiOutlinePlus aria-hidden="true" /> Nouvelle immatriculation
        </Link>
      </div>

      {/* Indicateurs : un clic filtre la liste des derniers dossiers */}
      <div className="agent-kpis">
        {kpis.map((k) => (
          <button
            key={k.libelle}
            type="button"
            className={`agent-kpi${filtre === k.cle && k.cle !== "tous" ? " is-active" : ""}`}
            onClick={() => setFiltre(k.cle)}
          >
            <span className="agent-kpi__top">
              <span className="agent-kpi__label">{k.libelle}</span>
              <span className={`agent-kpi__icon agent-kpi__icon--${k.ton}`}><k.Icone aria-hidden="true" /></span>
            </span>
            <span className="agent-kpi__value">{k.valeur}</span>
            <span className="agent-kpi__note">{k.note}</span>
          </button>
        ))}
      </div>

      <div className="agent-dash__layout">
        <div className="agent-dash__main">
          {/* Activité : une seule série, survol = détail */}
          <section className="agent-card agent-chart">
            <div className="agent-card__head">
              <h2 className="agent-card__title">Dossiers soumis par mois</h2>
              <span className="agent-muted">6 derniers mois · survolez une barre pour le détail</span>
            </div>
            <div className="agent-chart__plot" onMouseLeave={() => setSurvol(-1)}>
              <span className="agent-chart__grid" style={{ bottom: "50%" }} />
              {parMois.map((m, i) => {
                const pct = Math.round((m.total / max) * 100);
                const actif = survol === i;
                const libelleMois = moment(m.mois + "-01").locale("fr").format("MMMM YYYY");
                return (
                  <div
                    key={m.mois}
                    className="agent-chart__col"
                    onMouseEnter={() => setSurvol(i)}
                    tabIndex={0}
                    onFocus={() => setSurvol(i)}
                    onBlur={() => setSurvol(-1)}
                    aria-label={`${libelleMois} : ${m.total} dossiers, dont ${m.valides} validés`}
                  >
                    {actif && (
                      <div className="agent-chart__tip" style={{ bottom: `calc(${pct}% + 8px)` }}>
                        <strong>{libelleMois}</strong>
                        <span>{m.total} dossier{m.total > 1 ? "s" : ""} · {m.valides} validé{m.valides > 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {!actif && i === parMois.length - 1 && <span className="agent-chart__value">{m.total}</span>}
                    <div className={`agent-chart__bar${actif ? " is-active" : ""}`} style={{ height: `${Math.max(pct, m.total ? 2 : 0)}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="agent-chart__labels">
              {parMois.map((m) => <span key={m.mois}>{moment(m.mois + "-01").locale("fr").format("MMM")}</span>)}
            </div>
          </section>

          {/* Derniers dossiers */}
          <section className="agent-card">
            <div className="agent-card__head agent-card__head--bordered">
              <h2 className="agent-card__title">Mes derniers dossiers</h2>
              <div className="agent-filtres" role="group" aria-label="Filtrer par statut">
                {FILTRES.map((f) => (
                  <button key={f.libelle} type="button" aria-pressed={filtre === f.valeur}
                    className={`agent-filtre${filtre === f.valeur ? " is-active" : ""}`} onClick={() => setFiltre(f.valeur)}>
                    {f.libelle}
                  </button>
                ))}
              </div>
            </div>
            <div className="agent-table-wrap">
              <table className="agent-table">
                <thead>
                  <tr>
                    <th>N° d'immatriculation</th>
                    <th>Véhicule</th>
                    <th>Affectation</th>
                    <th>Statut</th>
                    <th className="is-right">Soumis le</th>
                    <th className="is-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((d) => (
                    <tr key={d.operation ? `${d.type}-${d.id}` : d.immatriculation_id}>
                      <td>
                        <Link className="agent-mono" to={d.operation ? d.operation.lien(d) : `/details-immatriculation/${d.immatriculation_id}`}>{d.immatriculation_number}</Link>
                        {d.operation && <span className="agent-tag">{d.operation.libelle}</span>}
                      </td>
                      <td>
                        <span className="agent-cell-main">{vehicule(d)}</span>
                        <span className="agent-mono agent-muted">{d.numChassie}</span>
                      </td>
                      <td>{d.affectation || "—"}</td>
                      <td><Statut status={d.status} /></td>
                      <td className="is-right">{moment(d.created_at).format("DD/MM/YYYY")}</td>
                      <td className="is-right">
                        {d.operation
                          ? <Link to={d.operation.lien(d)} className={d.status === 2 ? "agent-btn agent-btn--outline agent-btn--table" : "agent-lien-table"}>Voir</Link>
                          : d.status === 2
                          ? <Link {...correction(rejetsParId[d.immatriculation_id] || d)} className="agent-btn agent-btn--outline agent-btn--table">Corriger</Link>
                          : <Link to={`/details-immatriculation/${d.immatriculation_id}`} className="agent-lien-table">Voir</Link>}
                      </td>
                    </tr>
                  ))}
                  {lignes.length === 0 && (
                    <tr><td colSpan={6} className="agent-empty">Aucun dossier {filtre === "tous" ? "pour le moment" : "avec ce statut parmi les plus récents"}.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="agent-card__foot">
              <Link to="/liste-immatriculation" state={{ title: "Tout", filter_id: -1 }}>Voir toutes mes immatriculations →</Link>
            </div>
          </section>
        </div>

        <aside className="agent-dash__side">
          {/* À corriger */}
          <section className={`agent-card agent-side-card${nbRejetes ? " agent-side-card--alert" : ""}`}>
            <div className="agent-side-card__head">
              <span className="agent-count">{nbRejetes}</span>
              <h2 className="agent-card__title">Dossiers rejetés à corriger</h2>
            </div>
            {nbRejetes === 0 && <p className="agent-muted">Aucun dossier rejeté. Rien à corriger.</p>}
            <div className="agent-rejets">
              {rejets.map((r) => (
                // Tout le dossier est cliquable : il ouvre la correction
                <Link key={r.immatriculation_id} {...correction(r)} className="agent-rejet"
                  aria-label={`Corriger le dossier ${r.immatriculation_number}`}>
                  <span className="agent-rejet__top">
                    <span className="agent-mono">{r.immatriculation_number}</span>
                    <span className="agent-muted">Rejeté le {moment(r.updated_at).format("DD/MM/YYYY")}</span>
                  </span>
                  <span className="agent-cell-main">{vehicule(r)}{r.affectation ? ` · ${r.affectation}` : ""}</span>
                  <span className="agent-rejet__motif"><strong>Motif :</strong> {r.motif || "non précisé"}</span>
                  <span className="agent-rejet__action">
                    {r.typeRejet === "organisme" ? "Choisir un autre organisme" : "Corriger et resoumettre"} →
                  </span>
                </Link>
              ))}
              {rejetsOperations.map((o) => {
                const op = OPERATIONS[o.type] || OPERATIONS.mutation;
                return (
                  <Link key={`${o.type}-${o.id}`} to={op.lien(o)} className="agent-rejet"
                    aria-label={`${op.libelle} rejetée du véhicule ${o.immatriculation_number}`}>
                    <span className="agent-rejet__top">
                      <span><span className="agent-mono">{o.immatriculation_number}</span> <span className="agent-tag">{op.libelle}</span></span>
                      <span className="agent-muted">Rejetée le {moment(o.updated_at).format("DD/MM/YYYY")}</span>
                    </span>
                    <span className="agent-cell-main">{vehicule(o)}{o.affectation ? ` · ${op.cible.toLowerCase()} ${o.affectation}` : ""}</span>
                    <span className="agent-rejet__motif"><strong>Motif :</strong> {o.motif || "non précisé"}</span>
                    <span className="agent-rejet__action">{op.action} →</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Démarrage rapide : la référence est vérifiée sur la page de nouvelle immatriculation */}
          <form className="agent-card agent-side-card" onSubmit={commencer}>
            <h2 className="agent-card__title">Démarrer un dossier</h2>
            <p className="agent-muted">Saisissez la référence de paiement SIPIM : le véhicule sera pré-rempli.</p>
            <label className="agent-field">
              <span>Référence SIPIM <span className="agent-req">*</span></span>
              <Input mono value={reference} maxLength={22} placeholder="Ex. IB8HBCT9V9L533073" invalid={!!erreurReference}
                onChange={(e) => { setReference(e.target.value.toUpperCase()); setErreurReference(""); }} />
              {erreurReference && <span className="agent-error" role="alert">{erreurReference}</span>}
            </label>
            <button type="submit" className="agent-btn agent-btn--primary agent-btn--block">Vérifier et commencer</button>
          </form>

          {/* En attente les plus anciens */}
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">En attente de validation</h2>
            <p className="agent-muted">Vos dossiers en attente depuis le plus longtemps.</p>
            {attente.length === 0 && <p className="agent-muted">Aucun dossier en attente.</p>}
            {attente.map((a) => {
              const long = moment().diff(moment(a.created_at), "days") >= ATTENTE_LONGUE_JOURS;
              return (
                <div key={a.immatriculation_id} className="agent-attente">
                  <Link className="agent-mono" to={`/details-immatriculation/${a.immatriculation_id}`}>{a.immatriculation_number}</Link>
                  <span className={`agent-delai${long ? " agent-delai--long" : ""}`}>Depuis {moment(a.created_at).locale("fr").fromNow(true)}</span>
                </div>
              );
            })}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AgentDashboard;
