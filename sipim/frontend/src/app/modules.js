import administration from "../modules/administration";

/**
 * Registre des modules fonctionnels. Ajouter un module = l'ajouter à cette liste :
 * ses routes et ses entrées de menu apparaissent sans modifier App.js, la Navbar ni le SideMenu.
 * Les écrans pas encore migrés sont toujours déclarés directement dans App.js.
 */
export const modules = [administration];

export const routesDesModules = modules.flatMap((m) => m.routes);

// Entrées de menu d'une section (ex. « administration »), dans l'ordre de déclaration des modules
export const menuDeSection = (section) => modules.flatMap((m) => m.menu || []).filter((e) => e.section === section);
