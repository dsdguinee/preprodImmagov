import { useContext, useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import moment from "moment";
import "moment/locale/fr";
import Api from "../../services/Api";
import { UserContext } from "../../services/Context/Context";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { isEmpty } from "../../services/Helpers/fonctions";
import { COLORS, PERIODES, num, fmt, pct, fmtMoney, variation, Pill, Delta, MoneyTooltip, CountTooltip, Repartition } from "../../services/Helpers/dashboard";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import Erreurs from "../../components/Erreurs/Erreurs";

// Sources de recettes (paiements validés)
const SOURCES = [
  { key: "vignette", label: "Vignette", color: COLORS.primary },
  { key: "cartegrise", label: "Carte grise", color: COLORS.nightBlue },
  { key: "autorisation", label: "Autorisation de transport", color: COLORS.green },
  { key: "plaque", label: "Plaque", color: COLORS.yellow },
  { key: "reforme", label: "Réforme", color: COLORS.lightGreen },
  { key: "frais", label: "Frais de service", color: COLORS.darkGrey },
];
const OPERATIONS = {
  immatriculation: "Immatriculation",
  reimmatriculation: "Réimmatriculation",
  mutation: "Mutation",
  reforme: "Réforme",
  services: "Vignette / autorisation seules",
};
const SEUIL_REJET = 5;

const delai = (heures) => {
  const h = num(heures);
  if (!h) return "—";
  return h < 48 ? `${pct(h)} h` : `${pct(h / 24)} j`;
};

// Tableau de bord du directeur : pilotage des recettes, de l'activité et des agences (lecture seule)
const DirecteurDashboard = () => {
  const api = new Api();
  const { user } = useContext(UserContext);
  const [, setIsLoading] = useRecoilState(loadingState);
  const [periode, setPeriode] = useState("mois");
  const [intervalle, setIntervalle] = useState({ debut: moment().startOf("month").format("YYYY-MM-DD"), fin: moment().format("YYYY-MM-DD") });
  const [intervalleApplique, setIntervalleApplique] = useState();
  const [agenceId, setAgenceId] = useState("");
  const [agences, setAgences] = useState([]);
  const [data, setData] = useState();
  const [erreurs, setErreurs] = useState();

  useEffect(() => {
    api.apiData("get", "/agence/getAll").then((resp) => {
      if (resp?.status === 200) setAgences(resp.agences);
    });
  }, []);

  useEffect(() => {
    if (periode === "perso" && !intervalleApplique) return;
    let url = `/directeur/dashboard?periode=${periode}&agence_id=${agenceId || 0}`;
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
      return { mois: mois.format("MMM YY"), ...Object.fromEntries(SOURCES.map((s) => [s.key, num(row[s.key])])) };
    });
  }, [data]);

  if (!data) return <div className="admin-dashboard directeur-dashboard page"><Erreurs validation={erreurs} /></div>;

  const { kpis, kpisPrecedents: prec, cumul, immagov, vigilance } = data;
  const periodeInfo = PERIODES.find((p) => p.value === periode);
  const paiementMoyen = num(kpis.valide) ? num(kpis.montant) / num(kpis.valide) : 0;
  const paiementMoyenPrec = num(prec.valide) ? num(prec.montant) / num(prec.valide) : 0;
  const tauxRejet = num(kpis.initie) ? (num(kpis.rejete) / num(kpis.initie)) * 100 : 0;
  const tauxRejetPrec = num(prec.initie) ? (num(prec.rejete) / num(prec.initie)) * 100 : 0;
  const tauxUtilisation = num(immagov.total) ? (num(immagov.utilises) / num(immagov.total)) * 100 : 0;
  const sources = SOURCES.map((s) => ({ label: s.label, color: s.color, nombre: num(data.sources[s.key]) })).filter((s) => s.nombre > 0);
  const totalOperations = data.operations.reduce((s, o) => s + num(o.montant), 0);
  const regions = data.regions.map((r) => ({ libelle: r.libelle, montant: num(r.montant) }));
  const totalAgences = data.agences.reduce((s, a) => s + num(a.montant), 0);
  const agencesInactives = data.agences.filter((a) => !num(a.nombre)).length;

  const alertes = [
    num(vigilance.nonValide48h) > 0 && { ton: "warn", texte: <><b>{fmt(vigilance.nonValide48h)}</b> paiements attendent une validation depuis plus de 48 h</> },
    num(vigilance.aAutoriser) > 0 && { ton: "accent", texte: <><b>{fmt(vigilance.aAutoriser)}</b> paiements rejetés attendent une autorisation de resoumission</> },
    num(vigilance.agentsRejet) > 0 && { ton: "crit", texte: <><b>{fmt(vigilance.agentsRejet)}</b> agent(s) avec un taux de rejet supérieur à {SEUIL_REJET} % sur la période</> },
    num(immagov.nonUtilises7j) > 0 && { ton: "warn", texte: <><b>{fmt(immagov.nonUtilises7j)}</b> opérations payées depuis plus de 7 jours ne sont pas encore traitées par immagov</> },
  ].filter(Boolean);

  return (
    <div className="admin-dashboard directeur-dashboard page">
      <DocumentTitle title="Tableau de bord directeur" />
      <Erreurs validation={erreurs} />

      <header className="head">
        <div>
          <span className="role">Directeur</span>
          <h2>
            {parseInt(moment().format("HH")) >= 12 ? "Bonsoir " : "Bonjour "}
            {!isEmpty(user) && user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1)}
          </h2>
          <p className="muted">
            Recettes, activité et agences, du {moment(data.periode.debut).format("D MMMM YYYY")} au {moment(data.periode.fin).format("D MMMM YYYY")}.
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

      {alertes.length > 0 && (
        <div className="alerts">
          {alertes.map((a, i) => <div key={i} className={`alert ${a.ton}`}><span>{a.texte}</span></div>)}
        </div>
      )}

      <section className="kpis">
        <div className="kpi hl">
          <span className="eyebrow">Recettes encaissées</span>
          <span className="v">{fmtMoney(kpis.montant)}<small>GNF</small></span>
          <div className="row"><span className="muted">{periodeInfo.compare}</span><Delta value={variation(kpis.montant, prec.montant)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Cumul de l'année</span>
          <span className="v">{fmtMoney(cumul.montant)}<small>GNF</small></span>
          <div className="row"><span className="muted">vs même date l'an dernier</span><Delta value={variation(cumul.montant, cumul.montantPrec)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Paiements validés</span>
          <span className="v">{fmt(kpis.valide)}</span>
          <div className="row"><span className="muted">sur {fmt(kpis.initie)} initiés</span><Delta value={variation(kpis.valide, prec.valide)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Paiement moyen</span>
          <span className="v">{fmtMoney(paiementMoyen)}<small>GNF</small></span>
          <div className="row"><span className="muted">par paiement validé</span><Delta value={variation(paiementMoyen, paiementMoyenPrec)} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Taux de rejet</span>
          <span className="v">{pct(tauxRejet)}<small>%</small></span>
          <div className="row"><span className="muted">{fmt(kpis.rejete)} rejetés</span><Delta value={variation(tauxRejet, tauxRejetPrec)} goodWhenUp={false} /></div>
        </div>
        <div className="kpi">
          <span className="eyebrow">Traitées par immagov</span>
          <span className="v">{pct(tauxUtilisation)}<small>%</small></span>
          <div className="row"><span className="muted">{fmt(immagov.nonUtilises)} opération(s) en attente</span></div>
        </div>
      </section>

      <h3 className="section">Recettes</h3>
      <div className="grid">
        <article className="panel c8">
          <div className="ph">
            <div><h4>Recettes mensuelles par source</h4><p>Paiements validés, 12 mois jusqu'à la fin de la période, en GNF</p></div>
            <div className="legend">
              {SOURCES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mensuel} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={COLORS.darkGrey} strokeOpacity={0.25} />
                <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
                <YAxis tickFormatter={fmtMoney} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(141,153,174,.12)" }} />
                {SOURCES.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} stroke={COLORS.white} strokeWidth={1}
                    radius={i === SOURCES.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel c4">
          <div className="ph"><div><h4>Origine des recettes</h4><p>Paiements validés sur la période, en GNF</p></div></div>
          {sources.length ? <Repartition rows={sources} /> : <p className="empty">Aucune recette sur la période.</p>}
        </article>
      </div>

      <h3 className="section">Activité</h3>
      <div className="grid">
        <article className="panel c7">
          <div className="ph"><div><h4>Opérations</h4><p>Paiements initiés et recettes validées sur la période</p></div></div>
          <div className="tw">
            <table>
              <thead><tr><th>Opération</th><th className="r">Paiements</th><th className="r">Validés</th><th className="r">Recettes (GNF)</th><th className="r">Part</th></tr></thead>
              <tbody>
                {data.operations.length ? data.operations.map((o) => (
                  <tr key={o.libelle}>
                    <td><b>{OPERATIONS[o.libelle] || o.libelle}</b></td>
                    <td className="r">{fmt(o.nombre)}</td>
                    <td className="r">{fmt(o.valide)}</td>
                    <td className="r">{fmtMoney(o.montant)}</td>
                    <td className="r">{totalOperations ? pct((num(o.montant) / totalOperations) * 100) : 0} %</td>
                  </tr>
                )) : <tr><td colSpan={5} className="empty">Aucun paiement sur la période.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
        <article className="panel c5">
          <div className="ph"><div><h4>Suivi immagov</h4><p>Immatriculations, réimmatriculations, mutations et réformes validées sur la période</p></div></div>
          <div className="tw">
            <table>
              <tbody>
                <tr><td>Opérations validées</td><td className="r"><b>{fmt(immagov.total)}</b></td></tr>
                <tr><td>Traitées par immagov</td><td className="r">{fmt(immagov.utilises)} <span className="muted">({pct(tauxUtilisation)} %)</span></td></tr>
                <tr><td>En attente de traitement</td><td className="r">{num(immagov.nonUtilises) ? <Pill tone="warn">{fmt(immagov.nonUtilises)}</Pill> : <span className="muted">0</span>}</td></tr>
                <tr><td>Montant des opérations en attente</td><td className="r">{fmtMoney(immagov.montantNonUtilise)} GNF</td></tr>
                <tr><td>En attente depuis plus de 7 jours</td><td className="r">{num(immagov.nonUtilises7j) ? <Pill tone="crit">{fmt(immagov.nonUtilises7j)}</Pill> : <span className="muted">0</span>}</td></tr>
                <tr><td>Délai moyen paiement → immatriculation</td><td className="r">{delai(immagov.delaiHeures)}</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <h3 className="section">Territoire</h3>
      <div className="grid">
        <article className="panel c5">
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
        <article className="panel c7">
          <div className="ph">
            <div><h4>Classement des agences</h4><p>Recettes validées {periodeInfo.compare}{agencesInactives ? ` · ${agencesInactives} agence(s) sans activité` : ""}</p></div>
          </div>
          <div className="tw">
            <table>
              <thead><tr><th>Agence</th><th className="r">Paiements</th><th className="r">Recettes (GNF)</th><th className="r">Évolution</th><th className="r">Rejets</th><th className="r">Part</th></tr></thead>
              <tbody>
                {data.agences.length ? data.agences.map((a) => {
                  const rejet = num(a.nombre) ? (num(a.rejete) / num(a.nombre)) * 100 : 0;
                  return (
                    <tr key={a.agence_id}>
                      <td><b>{a.nom_agence}</b></td>
                      <td className="r">{num(a.nombre) ? fmt(a.nombre) : <Pill tone="neutral">Aucune activité</Pill>}</td>
                      <td className="r">{fmtMoney(a.montant)}</td>
                      <td className="r"><Delta value={variation(a.montant, a.montantPrec)} /></td>
                      <td className="r">{num(a.nombre) ? <Pill tone={rejet > SEUIL_REJET ? "warn" : "good"}>{pct(rejet)} %</Pill> : <span className="muted">—</span>}</td>
                      <td className="r">{totalAgences ? pct((num(a.montant) / totalAgences) * 100) : 0} %</td>
                    </tr>
                  );
                }) : <tr><td colSpan={6} className="empty">Aucune agence.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
};

export default DirecteurDashboard;
