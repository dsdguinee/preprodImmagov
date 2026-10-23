import administration from "../modules/administration";

/**
 * Registre des modules fonctionnels. Ajouter un module = l'importer ici :
 * ses routes et ses liens de menu sont alors pris en compte sans toucher à App ni à la Navbar.
 */
export const modules = [administration];

export const routesDesModules = modules.flatMap((m) => m.routes);

/**
 * Liens de menu autorisés pour le rôle connecté (menusRole : menus renvoyés par le backend).
 * Un groupe n'est gardé que s'il lui reste au moins un lien autorisé.
 */
export const menuAutorise = (menusRole) =>
  modules.flatMap((m) => m.menu || []).reduce((liste, entree) => {
    if (entree.groupe) {
      const liens = entree.liens.filter((l) => l.autorise(menusRole));
      return liens.length ? [...liste, { ...entree, liens }] : liste;
    }
    return entree.autorise(menusRole) ? [...liste, entree] : liste;
  }, []);
