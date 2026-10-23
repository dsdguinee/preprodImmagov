import { tokenStore } from "./tokenStore";

// Page de connexion : un utilisateur déjà connecté est envoyé au tableau de bord
const Connected = ({ children }) => {
  if (tokenStore.get()) {
    window.location.href = "/dashboard";
    return null;
  }
  return children;
};

export default Connected;
