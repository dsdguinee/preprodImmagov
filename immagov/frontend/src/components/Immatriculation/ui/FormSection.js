// Bloc titré du formulaire ; les enfants sont disposés en grille responsive
const FormSection = ({ title, description, children, min = 200 }) => (
  <section className="immat-section">
    {(title || description) && (
      <div className="immat-section__head">
        {title && <h2 className="immat-section__title">{title}</h2>}
        {description && <p className="immat-section__desc">{description}</p>}
      </div>
    )}
    <div className="immat-grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  </section>
);

export default FormSection;
