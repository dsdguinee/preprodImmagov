// Seul endroit qui connaît l'emplacement du jeton JWT (localStorage « token »)
const CLE = "token";

export const tokenStore = {
  get: () => localStorage.getItem(CLE),
  set: (token) => localStorage.setItem(CLE, token),
  clear: () => localStorage.removeItem(CLE),
};
