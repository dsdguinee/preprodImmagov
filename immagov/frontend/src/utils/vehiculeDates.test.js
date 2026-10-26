import { anneeCirculation, anneeFabricationValide } from "./vehiculeDates";

test("année de la 1re mise en circulation", () => {
  expect(anneeCirculation("2019-05-12")).toBe(2019);
  expect(anneeCirculation("")).toBeNull();
  expect(anneeCirculation(undefined)).toBeNull();
});

test("l'année de fabrication ne dépasse pas celle de la 1re mise en circulation", () => {
  expect(anneeFabricationValide("2018", "2019-05-12")).toBe(true);
  expect(anneeFabricationValide("2019", "2019-05-12")).toBe(true);
  expect(anneeFabricationValide("2020", "2019-05-12")).toBe(false);
  // Date non saisie : rien à comparer
  expect(anneeFabricationValide("2020", "")).toBe(true);
});
