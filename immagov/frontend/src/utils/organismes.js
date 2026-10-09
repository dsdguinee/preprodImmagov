// Recherche d'organismes existants proches d'un nom saisi (évite les doublons de ministères)

// Comparaison de noms d'organismes : sans accents ni casse, sans les mots génériques
const MOTS_IGNORES = new Set(["ministere", "ministre", "de", "du", "des", "la", "le", "les", "l", "d", "et", "en", "a", "au", "aux", "pour"]);
const motsCles = (nom) => (nom || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().split(/[^a-z0-9]+/)
  .filter((mot) => mot.length > 1 && !MOTS_IGNORES.has(mot));

// Nom identique à un organisme existant (majuscules, accents et espaces ignorés, comme en base) : un seul organisme par nom
const nomComparable = (nom) => (nom || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export const organismeDeMemeNom = (saisie, organismes) => {
  const cible = nomComparable(saisie);
  return cible ? (organismes || []).find((org) => nomComparable(org.nom) === cible) || null : null;
};

// Organismes existants qui ressemblent au nom saisi (3 au plus, les plus proches d'abord)
export const organismesSimilaires = (saisie, organismes) => {
  const cles = motsCles(saisie);
  const brut = cles.join(" ");
  if (brut.length < 3) return [];
  return organismes
    .map((org) => {
      const clesOrg = motsCles(org.nom);
      const communs = cles.filter((mot) => clesOrg.some((m) => m === mot || (mot.length >= 4 && m.startsWith(mot)) || (m.length >= 4 && mot.startsWith(m))));
      const contient = clesOrg.join(" ").includes(brut) || brut.includes(clesOrg.join(" "));
      const score = contient ? 1 : communs.length / Math.max(1, Math.min(cles.length, clesOrg.length));
      return { org, score };
    })
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.org);
};
