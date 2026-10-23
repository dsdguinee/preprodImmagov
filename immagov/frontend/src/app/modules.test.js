import { modules, routesDesModules, menuAutorise } from "./modules";

jest.mock("../modules/administration", () => ({
  nom: "administration",
  routes: [{ path: "liste-ministere", element: null }, { path: "liste-roles", element: null }],
  menu: [
    { to: "/liste-ministere", label: "Ministères", autorise: (m) => m?.ministeres },
    {
      groupe: { label: "Utilisateurs", classe: "utilisateur" },
      liens: [
        { to: "/liste-utilisateurs", label: "Gestion des utilisateurs", autorise: (m) => m?.utilisateurs?.gestion_des_Utilisateurs },
        { to: "/liste-roles", label: "Gestion des roles", autorise: (m) => m?.utilisateurs?.gestion_des_Rôles },
      ],
    },
  ],
}));

test("les routes de tous les modules sont regroupées", () => {
  expect(modules.map((m) => m.nom)).toEqual(["administration"]);
  expect(routesDesModules.map((r) => r.path)).toEqual(["liste-ministere", "liste-roles"]);
});

test("menu : seuls les liens autorisés par les menus du rôle sont gardés", () => {
  const menu = menuAutorise({ ministeres: "x", utilisateurs: { gestion_des_Rôles: "y" } });
  expect(menu.map((e) => e.label || e.groupe.label)).toEqual(["Ministères", "Utilisateurs"]);
  expect(menu[1].liens.map((l) => l.to)).toEqual(["/liste-roles"]);
});

test("menu : un groupe sans lien autorisé disparaît", () => {
  expect(menuAutorise({ utilisateurs: {} })).toEqual([]);
  expect(menuAutorise(undefined)).toEqual([]);
});
