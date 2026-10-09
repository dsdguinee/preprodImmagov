import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilState } from "recoil";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import moment from "moment";
import "moment/locale/fr";
import Api from "../../services/Api";
import { UserContext } from "../../services/Context/Context";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { isEmpty } from "../../services/Helpers/fonctions";
import { COLORS, STATUTS, num, fmt, pct, fmtMoney, docLabel, Pill } from "../../services/Helpers/dashboard";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import Erreurs from "../../components/Erreurs/Erreurs";

const SERIES = [
  { key: "vignette", label: "Vignette", color: COLORS.primary },
  { key: "cartegrise", label: "Carte grise", color: COLORS.nightBlue },
  { key: "autorisation", label: "Autorisation de transport", color: COLORS.green },
  { key: "plaque", label: "Plaque", color: COLORS.yellow },
  { key: "frais", label: "Frais de service", color: COLORS.darkGrey },
];
const PROFILE_COLORS = [COLORS.primary, COLORS.darkGrey, COLORS.nightBlue, COLORS.lightGreen];
const PERIODES = [
  { value: "jour", label: "Aujourd'hui", compare: "vs hier" },
  { value: "mois", label: "Ce mois", compare: "vs mois précédent" },
  { value: "annee", label: "Cette année", compare: "vs année précédente" },
  { value: "perso", label: "Personnalisée", compare: "vs période précédente de même durée" },
];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HEURES = Array.from({ length: 12 }, (_, i) => i + 7);
// Teintes de $night-blue, du plus clair au plus foncé
const HEAT_STEPS = ["#eef2f8", "#cdd9ea", "#9bb2d4", "#5f84bb", "#2a5a9e", COLORS.nightBlue];
const SEUIL_REJET = 5;

const variation = (cur, prev) => (num(prev) > 0 ? (num(cur) - num(prev)) / num(prev) : null);

const Delta = ({ value, goodWhenUp = true }) => {
  if (value === null) return <span className="delta muted">—</span>;
  const up = value >= 0;
  return (
    <span className={`delta ${up === goodWhenUp ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {pct(Math.abs(value * 100))} %
    </span>
  );
};

const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + num(p.value), 0);
  return (
    <div className="chart-tip">
      <b>{label}</b>
      {payload.map((p) => (
        <div className="tr" key={p.dataKey}>
          <span><i style={{ background: p.color }} />{p.name}</span>
          <span>{fmt(p.value)} GNF</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="tr total"><span>Total</span><span>{fmt(total)} GNF</span></div>
      )}
    </div>
  );
};

const CountTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tip">
      <b>{p.payload.libelle}</b>
      <div className="tr"><span>{unit}</span><span>{unit.includes("GNF") ? fmtMoney(p.value) : fmt(p.value)}</span></div>
    </div>
  );
};

// Barre segmentée à 100 % avec légende chiffrée
const Repartition = ({ rows }) => {
  const total = rows.reduce((s, r) => s + num(r.nombre), 0);
  if (total === 0) return <p className="empty">Aucun paiement sur la période.</p>;
  return (
    <>
      <div className="segbar">
        {rows.map((r) => (
          <div key={r.label} style={{ flex: num(r.nombre), background: r.color }} title={r.label} />
        ))}
      </div>
      <ul className="seglist">
        {rows.map((r) => (
          <li key={r.label}>
            <i style={{ background: r.color }} />
            <span>{r.label}</span>
            <strong>{fmt(r.nombre)}</strong>
            <span className="muted">{pct((num(r.nombre) / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </>
  );
};

const AdminDashboard = () => {
  const api = new Api();
  const { user } = useContext(UserContext);
  const [, setIsLoading] = useRecoilState(loadingState);
  const [periode, setPeriode] = useState("mois");
  // Saisie en cours et intervalle effectivement appliqué (la requête ne part qu'au clic sur Appliquer)
  const [intervalle, setIntervalle] = useState({ debut: moment().startOf("month").format("YYYY-MM-DD"), fin: moment().format("YYYY-MM-DD") });
  const [intervalleApplique, setIntervalleApplique] = useState();
  const [agenceId, setAgenceId] = useState("");
  const [agences, setAgences] = useState([]);
  const [filtreFile, setFiltreFile] = useState("all");
  const [data, setData] = useState();
  const [erreurs, setErreurs] = useState();

  useEffect(() => {
    api.apiData("get", "/agence/getAll").then((resp) => {
      if (resp?.status === 200) setAgences(resp.agences);
    });
  }, []);

  useEffect(() => {
    if (periode === "perso" && !intervalleApplique) return;
    let url = `/admin/dashboard?periode=${periode}&agence_id=${agenceId || 0}`;
    if (periode === "perso") url += `&date_debut=${intervalleApplique.debut}&date_fin=${intervalleApplique.fin}`;
    setIsLoading(true);
    setErreurs([]);
    api.apiData("get", url).then((resp) => {
      setIsLoading(false);
      if (resp?.status === 200) setData(resp);
      else setErreurs(resp?.messages);
    });
  }, [periode, agenceId, intervalleApplique]);

  const appliquerIntervalle = (e) => {
    e.preventDefault();
    if (!intervalle.debut || !intervalle.fin) return setErreurs(["Choisissez une date de début et une date de fin."]);
    if (intervalle.fin < intervalle.debut) return setErreurs(["La date de fin doit être postérieure ou égale à la date de début."]);
    setIntervalleApplique({ ...intervalle });
  };

  const mensuel = useMemo(() => {
    const parMois = {};
    (data?.mensuel || []).forEach((m) => (parMois[m.mois] = m));
    const finPeriode = moment(data?.periode?.fin);
    return Array.from({ length: 12 }, (_, i) => {
      const mois = finPeriode.clone().startOf("month").subtract(11 - i, "months");
      const row = parMois[mois.format("YYYY-MM")] || {};
      return {
        mois: mois.format("MMM YY"),
        ...Object.fromEntries(SERIES.map((s) => [s.key, num(row[s.key])])),
      };
    });
  }, [data]);

  const heat = useMemo(() => {
    const grid = JOURS.map(() => HEURES.map(() => 0));
    (data?.affluence || []).forEach((a) => {
      const h = HEURES.indexOf(num(a.heure));
      if (h >= 0) grid[num(a.jour)][h] = num(a.nombre);
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [data]);

  const file = useMemo(() => {
    return (data?.file || [])
      .map((p) => {
        let type = "0";
        if (p.status === 3) type = "resoumettre";
        else if (p.status === 2 || p.status === 4) type = "autoriser";
        return { ...p, type };
      })
      .filter((p) => filtreFile === "all" || p.type === filtreFile);
  }, [data, filtreFile]);

  if (!data) return <div className="admin-dashboard page"><Erreurs validation={erreurs} /></div>;

  const { kpis, kpisPrecedents: prec, attente } = data;
  const periodeInfo = PERIODES.find((p) => p.value === periode);
  const tauxValidation = num(kpis.initie) > 0 ? (num(kpis.valide) / num(kpis.initie)) * 100 : 0;
  const tauxRejet = num(kpis.initie) > 0 ? (num(kpis.rejete) / num(kpis.initie)) * 100 : 0;
  const totalRoles = data.roles.reduce(
    (s, r) => ({ actifs: s.actifs + num(r.actifs), total: s.total + num(r.actifs) + num(r.desactives), jamais: s.jamais + num(r.jamaisConnectes) }),
    { actifs: 0, total: 0, jamais: 0 }
  );
  const agentsAlerte = data.agents.filter((a) => num(a.nombre) >= 10 && (num(a.rejete) / num(a.nombre)) * 100 > SEUIL_REJET);
  const maxAgent = Math.max(1, ...data.agents.map((a) => num(a.montant)));
  const totalAgences = data.agences.reduce((s, a) => s + num(a.montant), 0);
  const operations = data.operations.map((o) => ({ libelle: docLabel(o.libelle), nombre: num(o.nombre) }));
  const regions = data.regions.map((r) => ({ libelle: r.libelle, montant: num(r.montant) }));
  const statuts = Object.keys(STATUTS).map((k) => ({
    label: STATUTS[k].label,
    color: `var(--${STATUTS[k].tone})`,
    nombre: num(data.statuts.find((s) => String(s.status) === k)?.nombre),
  }));
  const profil = (rows) => rows.map((r, i) => ({ label: r.libelle || "Non renseigné", nombre: r.nombre, color: PROFILE_COLORS[i % PROFILE_COLORS.length] }));

  return (
    <div className="admin-dashboard page">
      <DocumentTitle title="Tableau de bord administrateur" />
      <Erreurs validation={erreurs} />

      <header className="head">
        <div>
          <span className="role">Administrateur</span>
          <h2>
            {parseInt(moment().format("HH")) >= 12 ? "Bonsoir " : "Bonjour "}
            {!isEmpty(user) && user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1)}
          </h2>
          <p className="muted">
            Recettes, paiements, agences et comptes utilisateurs, du {moment(data.periode.debut).format("D MMMM YYYY")} au {moment(data.periode.fin).format("D MMMM YYYY")}.
          </p>
        </div>
        <div className="filters">
          <div className="seg" role="group" aria-label="Période">
            {PERIODES.map((p) => (
              <button key={p.value} type="button" aria-pressed={periode === p.value} onClick={() => setPeriode(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          {periode === "perso" && (
            <form className="range" onSubmit={appliquerIntervalle}>
              <label>
                Du
                <input type="date" id="date_debut" value={intervalle.debut} max={intervalle.fin || undefined}
                  onChange={(e) => setIntervalle({ ...intervalle, debut: e.target.value })} />
              </label>
              <label>
                au
                <input type="date" id="date_fin" value={intervalle.fin} min={intervalle.debut || undefined}
                  onChange={(e) => setIntervalle({ ...intervalle, fin: e.target.value })} />
              </label>
              <button type="submit" className="btn pri">Appliquer</button>
            </form>
          )}
          <select value={agenceId} onChange={(e) => setAgenceId(e.target.value)} aria-label="Agence">
            <option value="">Toutes les agences</option>
            {agences.map((a) => (
              <option key={a.agence_id} value={a.agence_id}>{a.nom_agence}</option>
            ))}
          </select>
        </div>
      </header>

      {(num(attente.nonValide48h) > 0 || num(attente.aAutoriser) > 0 || agentsAlerte.length > 0) && (
        <div className="alerts">
          {num(attente.nonValide48h) > 0 && (
            <div className="alert warn">
              <span><b>{fmt(attente.nonValide48h)}</b> paiements attendent une validation depuis plus de 48 h</span>
              <a href="#file-attente">Voir →</a>
            </div>
          )}
          {num(attente.aAutoriser) > 0 && (
            <div className="alert accent">
              <span><b>{fmt(attente.aAutoriser)}</b> paiements rejetés attendent une autorisation de resoumission</span>
              <Link to="/payment/rejected/list">Autoriser →</Link>
            </div>
          )}
          {agentsAlerte.length > 0 && (
            <div className="alert crit">
              <span><b>{agentsAlerte.length}</b> agent(s) avec un taux de rejet supérieur à {SEUIL_REJET} %</span>
              <a href="#agents">Examiner →</a>
            </div>
          )}
        </div>
      )}

      <section className="kpis">
        <div className="kpi hl">
          <span className="eyebrow">Montant encaissé</span>
          <span className="v">{fmtMoney(kpis.montant)}<small>GNF</small></span>
          <div className="row"><span className="muted">{periodeInfo.compare}</span><Delta value={variation(kpis.montant, prec.montant)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Paiements initiés</span>
          <span className="v">{fmt(kpis.initie)}</span>
          <div className="row"><span className="muted">{periodeInfo.compare}</span><Delta value={variation(kpis.initie, prec.initie)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Taux de validation</span>
          <span className="v">{pct(tauxValidation)}<small>%</small></span>
          <div className="row"><span className="muted">{fmt(kpis.valide)} validés</span></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">En attente de validation</span>
          <span className="v">{fmt(attente.nonValide)}</span>
          <div className="row"><span className="muted">dont {fmt(attente.nonValide48h)} de plus de 48 h</span></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Paiements rejetés</span>
          <span className="v">{fmt(kpis.rejete)}</span>
          <div className="row"><span className="muted">{pct(tauxRejet)} % des paiements</span><Delta value={variation(kpis.rejete, prec.rejete)} goodWhenUp={false} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Utilisateurs actifs</span>
          <span className="v">{fmt(totalRoles.actifs)}<small>/ {fmt(totalRoles.total)}</small></span>
          <div className="row"><span className="muted">{fmt(totalRoles.jamais)} jamais connectés</span></div>
        </div>
      </section>

      <h3 className="section">Finances</h3>
      <div className="grid">
        <article className="panel c8">
          <div className="ph">
            <div><h4>Recettes mensuelles par document</h4><p>Paiements validés, 12 mois jusqu'à la fin de la période, en GNF</p></div>
            <div className="legend">
              {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mensuel} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={COLORS.darkGrey} strokeOpacity={0.25} />
                <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
                <YAxis tickFormatter={fmtMoney} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(141,153,174,.12)" }} />
                {SERIES.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} stroke={COLORS.white} strokeWidth={1}
                    radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel c4">
          <div className="ph"><div><h4>Cycle de vie des paiements</h4><p>Répartition par statut sur la période</p></div></div>
          <Repartition rows={statuts} />
          <div className="ph"><div><h4>Type de client</h4></div></div>
          <Repartition rows={profil(data.typeClient)} />
          <div className="ph"><div><h4>Mode d'exploitation</h4></div></div>
          <Repartition rows={profil(data.modeExp)} />
        </article>
      </div>

      <h3 className="section">Opérations et territoire</h3>
      <div className="grid">
        <article className="panel c6">
          <div className="ph"><div><h4>Recettes par région</h4><p>Paiements validés sur la période</p></div></div>
          {regions.length ? (
            <ResponsiveContainer width="100%" height={Math.max(120, regions.length * 36 + 20)}>
              <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="libelle" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.darkerGrey }} />
                <Tooltip content={<CountTooltip unit="Recettes (GNF)" />} cursor={{ fill: "rgba(141,153,174,.12)" }} />
                <Bar dataKey="montant" fill={COLORS.nightBlue} radius={[0, 4, 4, 0]} barSize={16}>
                  <LabelList dataKey="montant" position="right" formatter={fmtMoney} style={{ fontSize: 12, fill: COLORS.darkerGrey, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="empty">Aucune recette sur la période.</p>}
        </article>
        <article className="panel c6">
          <div className="ph"><div><h4>Paiements par type d'opération</h4><p>Nombre de dossiers sur la période</p></div></div>
          {operations.length ? (
            <ResponsiveContainer width="100%" height={Math.max(120, operations.length * 36 + 20)}>
              <BarChart data={operations} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="libelle" width={170} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.darkerGrey }} />
                <Tooltip content={<CountTooltip unit="Paiements" />} cursor={{ fill: "rgba(141,153,174,.12)" }} />
                <Bar dataKey="nombre" fill={COLORS.nightBlue} radius={[0, 4, 4, 0]} barSize={16}>
                  <LabelList dataKey="nombre" position="right" formatter={fmt} style={{ fontSize: 12, fill: COLORS.darkerGrey, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="empty">Aucun paiement sur la période.</p>}
        </article>
        <article className="panel c7">
          <div className="ph">
            <div><h4>Affluence par jour et par heure</h4><p>Paiements initiés par heure, moyenne des 4 semaines précédant la fin de la période</p></div>
            <div className="scale">Faible{HEAT_STEPS.map((c) => <i key={c} style={{ background: c }} />)}Fort</div>
          </div>
          <div className="heat" style={{ gridTemplateColumns: `34px repeat(${HEURES.length}, minmax(0, 1fr))` }}>
            <span />
            {HEURES.map((h) => <span key={h} className="h">{h}h</span>)}
            {heat.grid.map((row, d) => [
              <span key={`d${d}`} className="d">{JOURS[d]}</span>,
              ...row.map((v, h) => (
                <div key={`${d}-${h}`} style={{ background: HEAT_STEPS[Math.min(5, Math.floor((v / heat.max) * 5.999))] }}
                  title={`${JOURS[d]} ${HEURES[h]}h–${HEURES[h] + 1}h : ${pct(v)} paiement(s) / heure`} />
              )),
            ])}
          </div>
        </article>
        <article className="panel c5">
          <div className="ph"><div><h4>Agences</h4><p>Comparaison sur la période</p></div></div>
          <div className="tw">
            <table>
              <thead><tr><th>Agence</th><th className="r">Paiements</th><th className="r">Recettes (GNF)</th><th className="r">Rejets</th><th className="r">Part</th></tr></thead>
              <tbody>
                {data.agences.length ? data.agences.map((a) => {
                  const rejet = num(a.nombre) ? (num(a.rejete) / num(a.nombre)) * 100 : 0;
                  return (
                    <tr key={a.agence_id}>
                      <td><b>{a.nom_agence}</b></td>
                      <td className="r">{fmt(a.nombre)}</td>
                      <td className="r">{fmtMoney(a.montant)}</td>
                      <td className="r"><Pill tone={rejet > SEUIL_REJET ? "warn" : "good"}>{pct(rejet)} %</Pill></td>
                      <td className="r">{totalAgences ? pct((num(a.montant) / totalAgences) * 100) : 0} %</td>
                    </tr>
                  );
                }) : <tr><td colSpan={5} className="empty">Aucune activité sur la période.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="ph"><div><h4>Canal de saisie</h4></div></div>
          <Repartition rows={data.terminal.map((t, i) => ({ label: t.libelle === "PC" ? "PC (agence)" : t.libelle, nombre: t.nombre, color: [COLORS.primary, COLORS.green, COLORS.darkGrey][i % 3] }))} />
        </article>
      </div>

      <h3 className="section">Équipes et comptes</h3>
      <div className="grid">
        <article className="panel c7" id="agents">
          <div className="ph"><div><h4>Performance des agents</h4><p>Top 10 par recettes validées sur la période</p></div><Link className="btn" to="/users/list">Voir les utilisateurs</Link></div>
          <div className="tw">
            <table>
              <thead><tr><th>Agent</th><th>Agence</th><th className="r">Paiements</th><th>Recettes (GNF)</th><th className="r">Taux de rejet</th><th>Dernière saisie</th></tr></thead>
              <tbody>
                {data.agents.length ? data.agents.map((a) => {
                  const rejet = num(a.nombre) ? (num(a.rejete) / num(a.nombre)) * 100 : 0;
                  const inactif = a.derniere && moment().diff(moment(a.derniere), "days") >= 3;
                  return (
                    <tr key={a.id}>
                      <td><div className="who"><span className="av">{(a.prenom?.[0] || "") + (a.nom?.[0] || "")}</span>{a.prenom} {a.nom}</div></td>
                      <td>{a.nom_agence}</td>
                      <td className="r">{fmt(a.nombre)}</td>
                      <td className="nowrap"><span className="minibar" style={{ width: Math.round((num(a.montant) / maxAgent) * 80) }} />{fmtMoney(a.montant)}</td>
                      <td className="r"><Pill tone={rejet > SEUIL_REJET ? "crit" : "good"}>{pct(rejet)} %</Pill></td>
                      <td>{inactif ? <Pill tone="warn">{moment(a.derniere).fromNow()}</Pill> : <span className="muted">{a.derniere ? moment(a.derniere).fromNow() : "—"}</span>}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={6} className="empty">Aucun paiement saisi sur la période.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
        <article className="panel c5">
          <div className="ph"><div><h4>Comptes par rôle</h4></div><Link className="btn" to="/users/roles/list">Rôles et privilèges</Link></div>
          <div className="tw">
            <table>
              <thead><tr><th>Rôle</th><th className="r">Actifs</th><th className="r">Désactivés</th><th className="r">Jamais connectés</th></tr></thead>
              <tbody>
                {data.roles.map((r) => (
                  <tr key={r.role_id}>
                    <td>{r.nom_role}</td>
                    <td className="r">{fmt(r.actifs)}</td>
                    <td className={`r ${num(r.desactives) ? "" : "muted"}`}>{fmt(r.desactives)}</td>
                    <td className="r">{num(r.jamaisConnectes) ? <Pill tone="warn">{fmt(r.jamaisConnectes)}</Pill> : <span className="muted">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <h3 className="section">À traiter</h3>
      <article className="panel" id="file-attente">
        <div className="ph">
          <div><h4>File d'attente</h4><p>Paiements non validés, à autoriser ou à resoumettre, du plus ancien au plus récent</p></div>
          <div className="seg" role="group" aria-label="Filtrer la file">
            {[["all", "Tout"], ["0", `Non validés (${fmt(attente.nonValide)})`], ["autoriser", `À autoriser (${fmt(attente.aAutoriser)})`], ["resoumettre", `À resoumettre (${fmt(attente.aResoumettre)})`]].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={filtreFile === v} onClick={() => setFiltreFile(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="tw">
          <table className="wide">
            <thead><tr><th>Référence</th><th>Client</th><th>Châssis</th><th>Agence</th><th className="r">Montant (GNF)</th><th>Statut</th><th>Attente</th><th /></tr></thead>
            <tbody>
              {file.length ? file.map((p) => {
                const heures = moment().diff(moment(p.created_at), "hours");
                const action = p.type === "autoriser"
                  ? { to: "/payment/rejected/list", label: "Autoriser" }
                  : p.type === "resoumettre"
                    ? { to: "/payment/autoriser/list", label: "Resoumettre" }
                    : { to: `/payment/invoice/${p.paiement_id}`, label: "Valider" };
                return (
                  <tr key={p.paiement_id}>
                    <td className="mono">{p.reference || "—"}</td>
                    <td>{p.fullName}</td>
                    <td className="mono muted">{p.chassis}</td>
                    <td>{p.nom_agence}</td>
                    <td className="r">{fmt(p.montant)}</td>
                    <td><Pill tone={p.type === "autoriser" ? "accent" : STATUTS[p.status]?.tone}>{p.type === "autoriser" ? "À autoriser" : STATUTS[p.status]?.label}</Pill></td>
                    <td className={heures >= 48 ? "late" : ""}>{moment(p.created_at).fromNow(true)}</td>
                    <td className="r"><Link className="btn pri" to={action.to}>{action.label}</Link></td>
                  </tr>
                );
              }) : <tr><td colSpan={8} className="empty">Rien à traiter dans cette catégorie.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default AdminDashboard;
