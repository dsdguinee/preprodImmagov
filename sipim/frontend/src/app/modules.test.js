import { modules, routesDesModules, menuDeSection } from "./modules";

jest.mock("../modules/administration/utilisateurs/UsersList", () => () => null);
jest.mock("../modules/administration/roles/RolesList", () => () => null);
jest.mock("../modules/administration/agences/Agencies", () => () => null);
jest.mock("../modules/administration/communes/Communes", () => () => null);
jest.mock("../modules/administration/organismes/Ministeres", () => () => null);

test("le registre expose les routes et le menu déclarés par les modules", () => {
  expect(modules.map((m) => m.nom)).toContain("administration");
  expect(routesDesModules.map((r) => r.path)).toEqual(
    expect.arrayContaining(["users/list", "users/roles/list", "agencies/list", "communes/list", "ministeres/list"])
  );
  // Adresses de pages inchangées par la refonte, une seule déclaration par route
  expect(new Set(routesDesModules.map((r) => r.path)).size).toBe(routesDesModules.length);
});

test("menu Administration : une entrée par écran, avec son privilège, dans l'ordre d'affichage", () => {
  expect(menuDeSection("administration").map((e) => [e.label, e.privilege])).toEqual([
    ["Utilisateurs", "Utilisateur"],
    ["Rôles et Privilèges", "Role&Privilege"],
    ["Agences", "Agence"],
    ["Communes", "Commune"],
    ["Ministères & entreprises publiques", "Ministère"],
  ]);
  expect(menuDeSection("inconnue")).toEqual([]);
});
