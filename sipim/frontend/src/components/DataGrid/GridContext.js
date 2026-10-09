import { createContext } from "react";

// Partage l'etat de la grille avec la barre d'outils (colonnes, filtre, densite, export)
export const GridContext = createContext(null);
