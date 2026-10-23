import { useEffect } from "react";
import { getCurrentUser } from "../../services/auth.service";
import { tokenStore } from "./tokenStore";

// Route réservée aux utilisateurs connectés : jeton absent ou refusé par le backend → retour à la connexion
const LoginProtected = ({ children, redirectPath = "/" }) => {
  const token = tokenStore.get();
  useEffect(() => {
    getCurrentUser().then((resp) => {
      if (!resp?.id) {
        tokenStore.clear();
        window.location.href = redirectPath;
      }
    });
  }, [redirectPath]);
  if (token) return children;

  tokenStore.clear();
  window.location.href = redirectPath;
  return null;
};

export default LoginProtected;
