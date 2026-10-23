// Requêtes en cours vers le backend : permet d'afficher le spinner de page tant que les données ne sont pas arrivées
let enCours = 0;
const abonnes = new Set();

const notifier = () => abonnes.forEach((fn) => fn(enCours));

export function requetesEnCours() {
  return enCours;
}

// fn(nombre) est appelée à chaque début / fin de requête ; renvoie la fonction de désabonnement
export function abonnerRequetes(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

// Compte les requêtes d'une instance axios (succès comme erreur)
export function suivreRequetes(instance) {
  if (!instance) return instance;
  const terminer = () => { enCours = Math.max(0, enCours - 1); notifier(); };
  instance.interceptors.request.use((config) => { enCours += 1; notifier(); return config; });
  instance.interceptors.response.use(
    (reponse) => { terminer(); return reponse; },
    (erreur) => { terminer(); return Promise.reject(erreur); }
  );
  return instance;
}
