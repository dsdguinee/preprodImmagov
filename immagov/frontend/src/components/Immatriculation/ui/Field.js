// Champ de formulaire : libellé (avec « * » si obligatoire), contrôle, message d'erreur
const Field = ({ label, required = false, error, children, className = "" }) => (
  <label className={`immat-field ${className}`}>
    <span className="immat-field__label">
      {label}
      {required && <span className="immat-req"> *</span>}
    </span>
    {children}
    {error && <span className="immat-field__error" role="alert">{error}</span>}
  </label>
);

export default Field;
