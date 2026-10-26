// Année de la date de 1re mise en circulation (AAAA-MM-JJ) ; null si la date est absente ou invalide
export const anneeCirculation = (dateP) => {
  const annee = parseInt(String(dateP || "").slice(0, 4), 10);
  return Number.isNaN(annee) ? null : annee;
};

// Le véhicule est fabriqué avant (ou la même année que) sa 1re mise en circulation
export const anneeFabricationValide = (annee, dateP) => {
  const circulation = anneeCirculation(dateP);
  return circulation === null || !annee || parseInt(annee, 10) <= circulation;
};
