// Liste verticale des étapes ; une étape n'est cliquable que si canGo(numéro) le permet
const ImmatStepper = ({ steps, current, canGo, onGo }) => (
  <nav className="immat-stepper" aria-label="Étapes">
    {steps.map((s, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      const enabled = active || canGo(n);
      return (
        <button
          key={s.label}
          type="button"
          className={`immat-stepper__item${active ? " is-active" : ""}${done ? " is-done" : ""}`}
          aria-current={active ? "step" : undefined}
          disabled={!enabled}
          onClick={() => enabled && onGo(n)}
        >
          <span className="immat-stepper__dot">{done ? "✓" : n}</span>
          <span className="immat-stepper__text">
            <span className="immat-stepper__label">{s.label}</span>
            <span className="immat-stepper__hint">{s.hint}</span>
          </span>
        </button>
      );
    })}
  </nav>
);

export default ImmatStepper;
