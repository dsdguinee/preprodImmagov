// Groupe de boutons à choix unique (remplace un <select> de 2 à 4 options)
// options : [{ value, label }]
const SegmentedControl = ({ label, required = false, value, options, onChange, error }) => (
  <div className="immat-field">
    <span className="immat-field__label">
      {label}
      {required && <span className="immat-req"> *</span>}
    </span>
    <div className="immat-segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = String(value).toLowerCase() === String(option.value).toLowerCase();
        return (
          <button
            key={option.value}
            type="button"
            className={`immat-segmented__btn${selected ? " is-selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
    {error && <span className="immat-field__error" role="alert">{error}</span>}
  </div>
);

export default SegmentedControl;
