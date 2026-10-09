// Éléments partagés par les tableaux de bord administrateur et agent
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
