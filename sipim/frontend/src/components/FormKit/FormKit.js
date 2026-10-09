// Composants de formulaire réutilisables (design du formulaire « Nouveau paiement »)
import { useEffect, useRef } from "react";

// Section numérotée ; devient verte quand `complete` est vrai
export const FormSection = ({ numero, titre, complete, etat, children }) => (
  <section className={`fk-section ${complete ? "complete" : ""}`}>
    <header className="fk-section-head">
      <span className="fk-num">{numero}</span>
      <h2>{titre}</h2>
      <span className="fk-state">{complete ? "Complet" : etat || "À compléter"}</span>
    </header>
    {children}
  </section>
);

// Champ : libellé, contenu (input/select), indication et message d'erreur
export const Field = ({ label, htmlFor, hint, erreur, full, children }) => (
  <div className={`fk-field ${full ? "full" : ""}`}>
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && !erreur && <span className="fk-hint">{hint}</span>}
    {erreur && <span className="fk-error" role="alert">{erreur}</span>}
  </div>
);

// Numéro guinéen : 9 chiffres, affiché « 620 00 00 00 » une fois complet ; `value` et `onChange` ne portent que les chiffres
export const TELEPHONE_CHIFFRES = 9;
export const formaterTelephone = (chiffres) =>
  chiffres.length === TELEPHONE_CHIFFRES ? chiffres.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4") : chiffres;

export const PhoneInput = ({ value = "", onChange, ...props }) => (
  <input
    {...props}
    type="tel"
    inputMode="numeric"
    autoComplete="tel"
    placeholder="620 00 00 00"
    value={formaterTelephone(value)}
    // Au-delà de 9 chiffres la saisie est ignorée : le champ reste bloqué sur le numéro complet
    onChange={(e) => {
      const chiffres = e.target.value.replace(/\D/g, "");
      if (chiffres.length <= TELEPHONE_CHIFFRES) onChange(chiffres);
    }}
  />
);

// Choix exclusif présenté en tuiles ; options : [{ value, label, hint, disabled }]
export const ChoiceTiles = ({ name, options, value, onChange, label }) => (
  <div className="fk-tiles" role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <label key={o.value} className={`fk-tile ${o.disabled ? "disabled" : ""}`}>
        <input
          type="radio"
          name={name}
          value={o.value}
          checked={String(value) === String(o.value)}
          disabled={o.disabled}
          onChange={() => onChange(o.value)}
        />
        <span>
          {o.label}
          {o.hint && <small>{o.hint}</small>}
        </span>
      </label>
    ))}
  </div>
);

// Choix exclusif compact (2 à 4 options courtes)
export const SegmentedControl = ({ name, options, value, onChange, label }) => (
  <div className="fk-seg-wrap">
    {label && <span className="fk-label">{label}</span>}
    <div className="fk-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={String(value) === String(o.value)}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// Carte activable par un interrupteur, avec montant à droite et contenu affiché si active
export const ToggleCard = ({ id, titre, description, montant, checked, disabled, onChange, children }) => (
  <div className={`fk-toggle ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}>
    <div className="fk-toggle-top">
      {onChange && (
        <span className="fk-switch">
          <input id={id} type="checkbox" checked={checked} disabled={disabled}
            onChange={(e) => onChange(e.target.checked)} aria-label={titre} />
          <i aria-hidden="true" />
        </span>
      )}
      <label htmlFor={id} className="fk-toggle-text">
        <b>{titre}</b>
        {description && <span>{description}</span>}
      </label>
      <span className={`fk-amount ${checked ? "" : "off"}`}>{checked && montant !== undefined ? montant : "—"}</span>
    </div>
    {checked && children && <div className="fk-toggle-body">{children}</div>}
  </div>
);

// Boîte de confirmation modale (Échap ou « Modifier » pour fermer)
export const ConfirmDialog = ({ open, titre, children, confirmer = "Confirmer", annuler = "Modifier", onConfirm, onCancel }) => {
  const boutonRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    boutonRef.current?.focus();
    const fermer = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", fermer);
    return () => document.removeEventListener("keydown", fermer);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fk-dialog" role="dialog" aria-modal="true" aria-labelledby="fk-dialog-title">
      <div className="fk-dialog-box">
        <h3 id="fk-dialog-title">{titre}</h3>
        <div className="fk-dialog-body">{children}</div>
        <div className="fk-dialog-actions">
          <button type="button" className="fk-btn ghost" onClick={onCancel}>{annuler}</button>
          <button type="button" className="fk-btn primary" ref={boutonRef} onClick={onConfirm}>{confirmer}</button>
        </div>
      </div>
    </div>
  );
};
