// Éléments partagés par les tableaux de bord administrateur, directeur et agent
import { formatStringNumber } from "./fonctions";

// Couleurs de src/styles/_colors.scss (Recharts attend des valeurs JS, pas des variables SCSS)
export const COLORS = {
  primary: "#ff8d13",
  green: "#019474",
  lightGreen: "#76c893",
  nightBlue: "#023e8a",
  yellow: "#e9c46a",
  darkGrey: "#8d99ae",
  darkerGrey: "#2b2d42",
  white: "#fff",
};

export const STATUTS = {
  0: { label: "Non validé", tone: "warn" },
  1: { label: "Validé", tone: "good" },
  2: { label: "Rejeté", tone: "crit" },
  3: { label: "À resoumettre", tone: "info" },
  4: { label: "Resoumis", tone: "neutral" },
};

const DOCUMENTS = {
  tous: "Tous documents",
  ordinaire: "Ordinaire",
  vignette: "Vignette",
  cartegrise: "Carte grise",
  autorisation: "Autorisation de transport",
  mutation: "Mutation",
  duplicata: "Duplicata",
  changementmodeexp: "Changement mode d'exploitation",
};

export const num = (v) => parseFloat(v) || 0;
export const fmt = (v) => formatStringNumber(Math.round(num(v)));
export const pct = (v) => num(v).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
export const fmtMoney = (v) => {
  const n = num(v);
  if (n >= 1e9) return pct(n / 1e9) + " Md";
  if (n >= 1e6) return pct(n / 1e6) + " M";
  return fmt(n);
};
export const docLabel = (d) => DOCUMENTS[d] || d || "Non renseigné";

export const Pill = ({ tone, children }) => <span className={`pill ${tone}`}>{children}</span>;

// Périodes des tableaux de bord administrateur et directeur
export const PERIODES = [
  { value: "jour", label: "Aujourd'hui", compare: "vs hier" },
  { value: "mois", label: "Ce mois", compare: "vs mois précédent" },
  { value: "annee", label: "Cette année", compare: "vs année précédente" },
  { value: "perso", label: "Personnalisée", compare: "vs période précédente de même durée" },
];

export const variation = (cur, prev) => (num(prev) > 0 ? (num(cur) - num(prev)) / num(prev) : null);

export const Delta = ({ value, goodWhenUp = true }) => {
  if (value === null) return <span className="delta muted">—</span>;
  const up = value >= 0;
  return (
    <span className={`delta ${up === goodWhenUp ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {pct(Math.abs(value * 100))} %
    </span>
  );
};

export const MoneyTooltip = ({ active, payload, label }) => {
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

export const CountTooltip = ({ active, payload, unit }) => {
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
export const Repartition = ({ rows }) => {
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
