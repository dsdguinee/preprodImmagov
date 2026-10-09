import { useEffect, useState } from "react";
import armoiries from "../../../assets/armoiries.png";
import carte from "../../../assets/map.png";
import logoGuinee from "../../../assets/branding.png";
import logoSimandou from "../../../assets/simandou2040-recu.png";

// Modèles de plaque : VA (fond vert, texte blanc) et EP (fond blanc, texte noir)
export const PLAQUE_TYPES = {
  VA: "VÉHICULE ADMINISTRATIF",
  EP: "ENTREPRISE PUBLIQUE",
};

/**
 * Plaque d'immatriculation (VA / EP). Elle prend la largeur disponible, jusqu'à `largeur` px (480 par défaut), en gardant ses proportions.
 * - numero : ex. « EP-0203-A » ; sigle : affiché sous le numéro (ex. « EDG »), facultatif
 * - qrcode : URL de l'image du QR code ; securite : numéro de sécurité, affiché seulement s'il est fourni
 * Renvoie null pour un autre type : à l'appelant de prévoir un affichage de repli.
 */
const Plaque = ({ type, numero, sigle, qrcode, securite, largeur = 480 }) => {
  const code = String(type || "").toUpperCase();
  // QR introuvable (fichier absent, serveur injoignable) : case vide plutôt qu'une image cassée
  const [qrIndisponible, setQrIndisponible] = useState(false);
  useEffect(() => setQrIndisponible(false), [qrcode]);
  if (!PLAQUE_TYPES[code]) return null;

  return (
    <div className="plaque-wrap" style={{ maxWidth: largeur }}>
      <div className={`plaque plaque--${code.toLowerCase()}`} role="img" aria-label={`Plaque ${PLAQUE_TYPES[code].toLowerCase()} ${numero || ""}`}>
        <div className="plaque__band">
          <img src={armoiries} alt="" className="plaque__armoiries" />
          <span className="plaque__flag" aria-hidden="true"><span /><span /><span /></span>
          <span className="plaque__rg">RG</span>
        </div>
        <div className="plaque__center">
          <img src={carte} alt="" aria-hidden="true" className="plaque__map" />
          <span className="plaque__top">RÉPUBLIQUE DE GUINÉE · {PLAQUE_TYPES[code]}</span>
          <span className="plaque__numero">{numero || `${code}-····-·`}</span>
          <span className="plaque__sigle">{sigle || " "}</span>
          <span className="plaque__logos">
            <img src={logoGuinee} alt="" />
            <span className="plaque__sep" aria-hidden="true" />
            <img src={logoSimandou} alt="" />
          </span>
        </div>
        <div className="plaque__side">
          <span className="plaque__qr">{qrcode && !qrIndisponible ? <img src={qrcode} alt="" onError={() => setQrIndisponible(true)} /> : <span className="plaque__qr-vide">QR</span>}</span>
          {securite && <span className="plaque__sec">N° SÉC. {securite}</span>}
        </div>
      </div>
    </div>
  );
};

export default Plaque;
