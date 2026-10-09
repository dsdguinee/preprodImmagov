import React from "react";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const pathName = location.pathname;
  return (
    <>
      {pathName !== "/" && (
        <div className="footer">
          <p>DSD Guinée © 2022. Tous droits réservés. </p>
        </div>
      )}
    </>
  );
};

export default Footer;
