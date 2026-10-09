import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
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

const JOURS_ACTIVITE = 14;

const aLePrivilege = (privileges, nom) => privileges?.some((p) => p.privilege === nom);

const ActiviteTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <b>{payload[0].payload.libelleLong}</b>
      <div className="tr"><span>Paiements saisis</span><span>{payload[0].value}</span></div>
    </div>
  );
};

const CopierTelephone = ({ tel }) => {
  const [copie, setCopie] = useState(false);
  const copier = () => {
    navigator.clipboard?.writeText(tel).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 1500);
    }).catch(() => {});
  };
  return <button type="button" className="copy" onClick={copier}>{copie ? "Copié" : "Copier"}</button>;
};

const AgentDashboard = () => {
  const api = new Api();
  const navigate = useNavigate();
  const { user, agence, privileges } = useContext(UserContext);
  const [, setIsLoading] = useRecoilState(loadingState);
  const [data, setData] = useState();
  const [erreurs, setErreurs] = useState();
  const [filtreJour, setFiltreJour] = useState("all");
  const [chassis, setChassis] = useState("");
  const [recherche, setRecherche] = useState();

  useEffect(() => {
    setIsLoading(true);
    api.apiData("get", "/agent/dashboard").then((resp) => {
      setIsLoading(false);
      if (resp?.status === 200) setData(resp);
      else setErreurs(resp?.messages);
    });
  }, []);

  // Jours ouvrés (lundi à samedi) jusqu'à aujourd'hui, y compris ceux sans saisie
  const activite = useMemo(() => {
    const parJour = {};
    (data?.activite || []).forEach((a) => (parJour[a.jour] = num(a.nombre)));
    const jours = [];
    for (let d = moment(); jours.length < JOURS_ACTIVITE; d.subtract(1, "day")) {
      if (d.isoWeekday() === 7) continue;
      const cle = d.format("YYYY-MM-DD");
      const auj = d.isSame(moment(), "day");
      jours.unshift({ cle, libelle: auj ? "Auj." : d.format("DD/MM"), libelleLong: auj ? "Aujourd'hui" : d.format("dddd D MMMM"), nombre: parJour[cle] || 0, auj });
    }
    return jours;
  }, [data]);

  const rechercher = async (e) => {
    e.preventDefault();
    const valeur = chassis.trim();
    if (!valeur) return setRecherche({ message: "Saisissez un numéro de châssis." });
    setIsLoading(true);
    const resp = await api.apiData("get", `/paiement/getpaiementByNumChassis/${encodeURIComponent(valeur)}`);
    setIsLoading(false);
    if (resp?.status !== 200) return setRecherche({ message: "La recherche a échoué. Réessayez." });
    if (!resp.payment?.length) return setRecherche({ message: `Aucun paiement trouvé pour le châssis ${valeur}.` });
    setRecherche({ paiement: resp.payment[resp.payment.length - 1], total: resp.payment.length });
  };

  if (!data) return <div className="agent-dashboard page"><Erreurs validation={erreurs} /></div>;

  const { jour, attente, rejetes, aResoumettre, paiementsJour, mois, agenceMois } = data;
  const validesJour = paiementsJour.filter((p) => p.status === 1);
  const moyenneActivite = activite.reduce((s, j) => s + j.nombre, 0) / activite.length;
  const tauxRejet = num(mois.nombre) ? (num(mois.rejetes) / num(mois.nombre)) * 100 : 0;
  const tauxRejetAgence = num(agenceMois.nombre) ? (num(agenceMois.rejetes) / num(agenceMois.nombre)) * 100 : 0;
  // Encaissements du mois : mêmes composantes et couleurs que le graphique de l'administrateur
  const composantes = [
    { key: "cartegrise", label: "Carte grise", color: COLORS.nightBlue },
    { key: "vignette", label: "Vignette", color: COLORS.primary },
    { key: "autorisation", label: "Autorisation", color: COLORS.green },
    { key: "plaque", label: "Plaque", color: COLORS.yellow },
    { key: "frais", label: "Frais de service", color: COLORS.darkGrey },
  ].map((c) => ({ ...c, montant: num(data.encaissements[c.key]) }));
  const totalMois = composantes.reduce((s, c) => s + c.montant, 0);
  const totalPrecedent = ["cartegrise", "vignette", "autorisation", "plaque", "frais"].reduce((s, k) => s + num(data.encaissementsPrecedents[k]), 0);
  const evolution = totalPrecedent > 0 ? (totalMois - totalPrecedent) / totalPrecedent : null;
  const filtres = [
    ["all", "Tous", paiementsJour.length],
    ["1", "Validés", validesJour.length],
    ["attente", "En attente", paiementsJour.filter((p) => p.status === 0 || p.status === 4).length],
    ["2", "Rejetés", paiementsJour.filter((p) => p.status === 2).length],
  ];
  const lignesJour = paiementsJour.filter((p) =>
    filtreJour === "all" ? true : filtreJour === "attente" ? p.status === 0 || p.status === 4 : String(p.status) === filtreJour
  );
  const expiration = (date) => (date ? moment(date).format("DD/MM/YYYY") : "—");

  // Du plus urgent au moins urgent
  const taches = [
    ...rejetes.map((p) => ({
      key: `r${p.paiement_id}`, tone: "crit", statut: "Rejeté",
      titre: `${p.reference || "Sans référence"} · ${p.fullName}`,
      detail: `${docLabel(p.type_document)} · rejeté ${moment(p.date).fromNow()}. En attente d'autorisation de resoumission.`,
      motif: p.motif, action: { to: "/payment/rejected/list", label: "Voir le détail" },
    })),
    ...aResoumettre.map((p) => ({
      key: `s${p.paiement_id}`, tone: "info", statut: "À resoumettre",
      titre: `${p.reference || "Sans référence"} · ${p.fullName}`,
      detail: `${docLabel(p.type_document)} · resoumission autorisée ${moment(p.date).fromNow()}`,
      action: { to: `/resubmission/new/${p.paiement_id}`, label: "Resoumettre", pri: true },
    })),
    ...(validesJour.length ? [{
      key: "imprimer", tone: "accent", statut: "Validés",
      titre: `${validesJour.length} paiement(s) validé(s) aujourd'hui`,
      detail: `Factures prêtes à imprimer : ${validesJour.slice(0, 4).map((p) => p.reference).join(", ")}${validesJour.length > 4 ? "…" : ""}`,
      action: { to: `/payment/invoice/${validesJour[0].paiement_id}`, label: "Imprimer", pri: true },
    }] : []),
    ...(num(attente.nombre) ? [{
      key: "attente", tone: "warn", statut: "En attente",
      titre: `${fmt(attente.nombre)} paiement(s) en attente de validation`,
      detail: `Le plus ancien attend depuis ${moment(attente.plusAncien).fromNow(true)}`,
      action: { to: "/payment/list", label: "Voir la liste" },
    }] : []),
  ];

  return (
    <div className="agent-dashboard page">
      <DocumentTitle title="Tableau de bord" />
      <Erreurs validation={erreurs} />

      <header className="head">
        <div>
          <span className="role">Agent{agence?.nom_agence ? ` · ${agence.nom_agence}` : ""}</span>
          <h2>
            {parseInt(moment().format("HH")) >= 12 ? "Bonsoir " : "Bonjour "}
            {!isEmpty(user) && user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1)}
          </h2>
          <p className="muted">{moment().format("dddd D MMMM YYYY")}. Votre activité du jour et ce qui vous attend.</p>
        </div>
        {aLePrivilege(privileges, "Nouveau Paiement") && (
          <button type="button" className="primary" onClick={() => navigate("/payment/new")}>+ Nouveau paiement</button>
        )}
      </header>

      <form className="search" onSubmit={rechercher} role="search">
        <input id="chassis" type="text" value={chassis} onChange={(e) => setChassis(e.target.value)}
          placeholder="Rechercher un véhicule par numéro de châssis" aria-label="Numéro de châssis" />
        <button type="submit">Rechercher</button>
      </form>
      {recherche && (
        <div className="search-result">
          {recherche.message ? <span className="muted">{recherche.message}</span> : (
            <>
              <Pill tone={STATUTS[recherche.paiement.status]?.tone}>{STATUTS[recherche.paiement.status]?.label}</Pill>
              <span>
                <b>{recherche.paiement.fullName}</b> · {recherche.paiement.chassis} · vignette jusqu'au {expiration(recherche.paiement.dateExpVg)},
                carte grise jusqu'au {expiration(recherche.paiement.dateExpCg)}
                {recherche.total > 1 ? ` · ${recherche.total} paiements pour ce véhicule` : ""}
              </span>
              <Link className="btn" to={`/payment/invoice/${recherche.paiement.paiement_id}`}>Ouvrir le dernier paiement</Link>
            </>
          )}
        </div>
      )}

      <section className="kpis">
        <div className="kpi hl">
          <span className="eyebrow">Encaissé aujourd'hui</span>
          <span className="v">{fmtMoney(jour.montant)}<small>GNF</small></span>
          <span className="muted">Paiements validés uniquement</span>
        </div>
        <div className="kpi">
          <span className="eyebrow">Paiements saisis</span>
          <span className="v">{fmt(jour.saisis)}</span>
          <span className="muted">{data.moyenne ? `Moyenne : ${pct(data.moyenne)} par jour travaillé` : "Aujourd'hui"}</span>
        </div>
        <div className="kpi attn warn">
          <span className="eyebrow">En attente de validation</span>
          <span className="v">{fmt(attente.nombre)}</span>
          <span className="muted">{attente.plusAncien ? `Le plus ancien : ${moment(attente.plusAncien).fromNow()}` : "Rien en attente"}</span>
        </div>
        <div className="kpi attn crit">
          <span className="eyebrow">À corriger</span>
          <span className="v">{fmt(rejetes.length + aResoumettre.length)}</span>
          {rejetes.length + aResoumettre.length > 0
            ? <a href="#a-faire">{rejetes.length} rejeté(s), {aResoumettre.length} à resoumettre</a>
            : <span className="muted">Aucun paiement à corriger</span>}
        </div>
        <div className="kpi attn good">
          <span className="eyebrow">Validés aujourd'hui</span>
          <span className="v">{fmt(validesJour.length)}</span>
          <span className="muted">Factures prêtes à imprimer</span>
        </div>
      </section>

      <div className="grid">
        <article className="panel c7" id="a-faire">
          <div className="ph"><div><h4>À faire maintenant</h4><p>Les plus urgents en premier</p></div></div>
          {taches.length ? (
            <ul className="todo">
              {taches.map((t) => (
                <li key={t.key}>
                  <Pill tone={t.tone}>{t.statut}</Pill>
                  <div className="what">
                    <b>{t.titre}</b>
                    <span>{t.detail}</span>
                    {t.motif && <div className="motif">Motif : {t.motif}</div>}
                  </div>
                  <Link className={`btn ${t.action.pri ? "pri" : ""}`} to={t.action.to}>{t.action.label}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="empty">Rien à traiter pour le moment.</p>}
        </article>
        <article className="panel c5">
          <div className="ph"><div><h4>Mon activité</h4><p>Paiements saisis par jour, {JOURS_ACTIVITE} derniers jours ouvrés</p></div></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activite} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COLORS.darkGrey} strokeOpacity={0.25} />
              <XAxis dataKey="libelle" tickLine={false} axisLine={false} interval={2} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11, fill: COLORS.darkGrey }} />
              <Tooltip content={<ActiviteTooltip />} cursor={{ fill: "rgba(141,153,174,.12)" }} />
              <ReferenceLine y={moyenneActivite} stroke={COLORS.darkerGrey} strokeDasharray="4 4"
                label={{ value: `moyenne ${pct(moyenneActivite)}`, position: "insideTopRight", fontSize: 11, fill: COLORS.darkerGrey }} />
              <Bar dataKey="nombre" radius={[4, 4, 0, 0]} maxBarSize={20}>
                {activite.map((j) => <Cell key={j.cle} fill={j.auj ? COLORS.primary : COLORS.darkGrey} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="stat-row">
            <div className="stat"><b>{fmt(mois.nombre)}</b><span>paiements ce mois</span></div>
            <div className="stat"><b>{pct(tauxRejet)} %</b><span>taux de rejet ce mois (agence : {pct(tauxRejetAgence)} %)</span></div>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="ph">
          <div><h4>Mes paiements du jour</h4><p>Saisis aujourd'hui, du plus récent au plus ancien</p></div>
          <div className="seg" role="group" aria-label="Filtrer par statut">
            {filtres.map(([v, l, n]) => (
              <button key={v} type="button" aria-pressed={filtreJour === v} onClick={() => setFiltreJour(v)}>{l} ({n})</button>
            ))}
          </div>
        </div>
        <div className="tw">
          <table className="wide">
            <thead><tr><th>Heure</th><th>Référence</th><th>Client</th><th>Châssis</th><th className="r">Montant (GNF)</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {lignesJour.length ? lignesJour.map((p) => (
                <tr key={p.paiement_id}>
                  <td className="muted nowrap">{moment(p.created_at).format("HH:mm")}</td>
                  <td className="mono">{p.reference || "—"}</td>
                  <td>{p.fullName}</td>
                  <td className="mono muted">{p.chassis}</td>
                  <td className="r">{fmt(p.montant)}</td>
                  <td><Pill tone={STATUTS[p.status]?.tone}>{STATUTS[p.status]?.label}</Pill></td>
                  <td className="r">
                    {p.status === 2
                      ? <Link className="btn" to="/payment/rejected/list">Voir le motif</Link>
                      : <Link className={`btn ${p.status === 1 ? "pri" : ""}`} to={`/payment/invoice/${p.paiement_id}`}>{p.status === 1 ? "Imprimer" : "Voir facture"}</Link>}
                  </td>
                </tr>
              )) : <tr><td colSpan={7} className="empty">{paiementsJour.length ? "Aucun paiement dans cette catégorie." : "Aucun paiement saisi aujourd'hui."}</td></tr>}
            </tbody>
          </table>
        </div>
      </article>

      <div className="grid">
        <article className="panel c8">
          <div className="ph"><div><h4>Renouvellements à venir</h4><p>Mes clients dont un document expire dans les 30 prochains jours</p></div></div>
          <div className="tw">
            <table>
              <thead><tr><th>Client</th><th>Téléphone</th><th>Châssis</th><th>Document</th><th>Expire le</th></tr></thead>
              <tbody>
                {data.renouvellements.length ? data.renouvellements.map((r) => {
                  const jours = moment(r.dateExp).startOf("day").diff(moment().startOf("day"), "days");
                  return (
                    <tr key={`${r.paiement_id}-${r.document}`}>
                      <td>{r.fullName}</td>
                      <td className="nowrap">{r.tel || "—"} {r.tel && <CopierTelephone tel={r.tel} />}</td>
                      <td className="mono muted">{r.chassis}</td>
                      <td>{r.document}</td>
                      <td><Pill tone={jours <= 7 ? "crit" : jours <= 15 ? "warn" : "neutral"}>{moment(r.dateExp).format("DD/MM/YYYY")} · J-{jours}</Pill></td>
                    </tr>
                  );
                }) : <tr><td colSpan={5} className="empty">Aucun document n'expire dans les 30 prochains jours.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
        <article className="panel c4">
          <div className="ph"><div><h4>Mes encaissements ce mois</h4><p>Paiements validés, du 1er à aujourd'hui</p></div></div>
          <div className="encaisse">
            <span className="v">{fmtMoney(totalMois)}<small>GNF</small></span>
            <span className="muted">
              {fmt(data.encaissements.nombre)} paiement(s) validé(s)
              {evolution !== null && (
                <> · <span className={`delta ${evolution >= 0 ? "up" : "down"}`}>{evolution >= 0 ? "▲" : "▼"} {pct(Math.abs(evolution * 100))} %</span> vs même période du mois dernier</>
              )}
            </span>
          </div>
          {totalMois > 0 ? (
            <>
              <div className="segbar" aria-hidden="true">
                {composantes.filter((c) => c.montant > 0).map((c) => (
                  <div key={c.key} style={{ flex: c.montant, background: c.color }} title={c.label} />
                ))}
              </div>
              <ul className="seglist">
                {composantes.filter((c) => c.montant > 0).map((c) => (
                  <li key={c.key}>
                    <i style={{ background: c.color }} />
                    <span>{c.label}</span>
                    <strong>{fmt(c.montant)}</strong>
                    <span className="muted">{pct((c.montant / totalMois) * 100)} %</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="empty">Aucun paiement validé ce mois.</p>}
        </article>
      </div>
    </div>
  );
};

export default AgentDashboard;
