// Résumé du dossier en cours (colonne de droite)
const DossierPanel = ({ reference, chassis, plaque, organisme, genre }) => {
  const lignes = [
    { label: "Référence", value: reference, mono: true },
    { label: "Châssis", value: chassis, mono: true },
    { label: "Genre", value: genre },
  ].filter((l) => l.value);

  return (
    <aside className="immat-dossier">
      <div className="immat-card immat-dossier__card">
        <span className="immat-overline">Dossier en cours</span>
        {lignes.length === 0 && <p className="immat-muted">Saisissez la référence de paiement pour commencer.</p>}
        {lignes.map((l) => (
          <div key={l.label} className="immat-dossier__row">
            <span className="immat-dossier__label">{l.label}</span>
            <span className={l.mono ? "immat-mono" : ""}>{l.value}</span>
          </div>
        ))}
        {(plaque || organisme) && (
          <div className="immat-badges">
            {plaque && <span className="immat-badge immat-badge--green">Plaque {plaque}</span>}
            {organisme && <span className="immat-badge immat-badge--blue">{organisme}</span>}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DossierPanel;
