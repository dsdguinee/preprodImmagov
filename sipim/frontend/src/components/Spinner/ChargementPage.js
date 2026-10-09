import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { abonnerRequetes, requetesEnCours } from "../../services/chargement";

const DELAI_STABLE = 150; // ms sans requête en cours avant d'afficher la page (requêtes enchaînées)
const DELAI_MAX = 20000; // la page s'affiche quoi qu'il arrive au-delà

// À chaque changement de page : spinner et contenu masqué jusqu'à la réponse du backend.
// Les requêtes lancées ensuite (paiement, recherche...) ne masquent plus la page.
const ChargementPage = ({ children }) => {
  const { pathname } = useLocation();
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setPret(false);
    let stable;
    const verifier = (nombre) => {
      clearTimeout(stable);
      if (nombre === 0) stable = setTimeout(() => setPret(true), DELAI_STABLE);
    };
    const desabonner = abonnerRequetes(verifier);
    verifier(requetesEnCours());
    const max = setTimeout(() => setPret(true), DELAI_MAX);
    return () => { desabonner(); clearTimeout(stable); clearTimeout(max); };
  }, [pathname]);

  // Le contenu reste monté (ses appels partent) mais invisible tant que la page n'est pas prête
  return (
    <>
      {!pret && (
        <div className="spinner-wrapper" role="status" aria-label="Chargement">
          <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>
      )}
      <div className={`chargement-page${pret ? "" : " chargement-page--masque"}`} aria-busy={!pret}>
        {children}
      </div>
    </>
  );
};

export default ChargementPage;
