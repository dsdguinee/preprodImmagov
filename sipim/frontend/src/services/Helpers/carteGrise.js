// Tranches de carte grise (table type_cgs) : libellé lisible et correspondance avec la capacité saisie

const nombre = (v) => String(v).replace(".", ",");

// Ex. « Jusqu'à 7 CV », « Plus de 7 et jusqu'à 12 CV », « PTAC plus de 19 T », « Tracteur routier »
export function libelleTranche(cg) {
  const prefixe = [cg.libellepoids, cg.nomType && cg.nomType.charAt(0) + cg.nomType.slice(1).toLowerCase()]
    .filter(Boolean)
    .join(" ");
  if (!cg.signe) return prefixe || "Tranche unique";
  const unite = cg.unite === "P" ? "places" : cg.unite || "";
  const [a, b] = String(cg.capacite).split(",").map(nombre);
  const textes = {
    "<": `moins de ${a}`,
    "<=": `jusqu'à ${a}`,
    ">": `plus de ${a}`,
    ">=": `${a} et plus`,
    "!": `entre ${a} et ${b}`,
    ">,<=": `plus de ${a} et jusqu'à ${b}`,
    ">=,<": `de ${a} à moins de ${b}`,
  };
  const bornes = cg.signe === "!" ? " (bornes exclues)" : "";
  const texte = `${textes[cg.signe] || `${cg.signe} ${cg.capacite}`} ${unite}`.trim() + bornes;
  const libelle = prefixe ? `${prefixe} ${texte}` : texte;
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

// Même règle que TypeCartegrise::CtrInputPuissance côté serveur ; `entier` reproduit intval()
export function trancheCorrespond(cg, valeur, entier = true) {
  if (!cg.signe) return null; // pas de capacité : correspondance non déterminable
  const conv = (v) => (entier ? parseInt(v, 10) : parseFloat(v));
  const v = conv(valeur);
  if (Number.isNaN(v)) return false;
  const [a, b] = String(cg.capacite).split(",").map(conv);
  switch (cg.signe) {
    case "<": return v < a;
    case "<=": return v <= a;
    case ">": return v > a;
    case ">=": return v >= a;
    case "!": return v > a && v < b;
    case ">,<=": return v > a && v <= b;
    case ">=,<": return v >= a && v < b;
    default: return false;
  }
}

// Saisie attendue par catégorie (categories.categorie_id)
export const MESURES = {
  1: { champ: "pf", label: "Cylindrée (CC)", placeholder: "Ex. 125", controleServeur: true },
  2: { champ: "pf", label: "Puissance fiscale (CV)", placeholder: "Ex. 9", controleServeur: true },
  3: { champ: "nbrePlace", label: "Nombre de places assises", placeholder: "Ex. 18", controleServeur: true },
  4: { champ: "ptac", label: "Poids total autorisé en charge (T)", poids: true },
  5: { champ: "ptac", label: "Poids total autorisé en charge (T)", poids: true },
  6: { champ: "ptac", label: "Poids total autorisé en charge (T)", poids: true },
};
