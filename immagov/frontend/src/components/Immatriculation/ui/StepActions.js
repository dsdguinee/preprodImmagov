// Pied de l'étape : Précédent / rappel des champs obligatoires / action principale
const StepActions = ({ onPrev, prevLabel = "Précédent", nextLabel = "Continuer", nextType = "submit", onNext, nextDisabled = false }) => (
  <div className="immat-actions">
    {onPrev ? (
      <button type="button" className="immat-btn immat-btn--secondary" onClick={onPrev}>
        {prevLabel}
      </button>
    ) : (
      <span />
    )}
    <span className="immat-actions__hint">
      Les champs marqués <span className="immat-req">*</span> sont obligatoires
    </span>
    <button type={nextType} className="immat-btn immat-btn--primary" onClick={onNext} disabled={nextDisabled}>
      {nextLabel}
    </button>
  </div>
);

export default StepActions;
