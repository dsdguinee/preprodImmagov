import React from "react";
import { useLocation } from "react-router-dom";
const Footer = () => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      {location.pathname !== "/" && (
        <div className="footer">
          <p>DSD-GUINEE &copy;2022. Tous droits réservés</p>
        </div>
      )}
    </>
  );
};

export default Footer;
