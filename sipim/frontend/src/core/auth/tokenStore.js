// Jeton d'authentification : seul endroit qui connaît son stockage (localStorage)
const CLE = "token";

export const tokenStore = {
  get: () => localStorage.getItem(CLE),
  set: (token) => localStorage.setItem(CLE, token),
  clear: () => localStorage.removeItem(CLE),
};
