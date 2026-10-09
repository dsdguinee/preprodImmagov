// Récapitulatif collant d'un paiement : informations, lignes chiffrées, total, points bloquants et actions
import { formatStringNumber } from "../../services/Helpers/fonctions";

const PaymentSummary = ({ titre, infos = [], lignes = [], total, note, aCompleter = [], onValider, onRecommencer, desactive, enCours, children }) => (
  <aside className="payment-summary" aria-label="Récapitulatif">
    <div className="ps-head">
      <span>Récapitulatif</span>
      <b>{titre}</b>
    </div>
    <div className="ps-body">
      <div className="ps-infos">
        {infos.map((i) => (
          <div className="ps-kv" key={i.label}>
            <span>{i.label}</span>
            <b className={i.mono ? "mono" : ""}>{i.value || "—"}</b>
          </div>
        ))}
      </div>
      <div className="ps-sep" />
      <div className="ps-lines">
        {lignes.length === 0 && <div className="ps-line empty">Aucun document sélectionné</div>}
        {lignes.map((l) => (
          <div className={`ps-line ${l.frais ? "fee" : ""}`} key={l.label}>
            <span>{l.label}</span>
            <span>{formatStringNumber(l.montant)}</span>
          </div>
        ))}
      </div>
      <div className="ps-total">
        <span>Total à payer</span>
        <b>{formatStringNumber(total)}<small>GNF</small></b>
      </div>
      {note && <p className="ps-note">{note}</p>}
      {children}
      {aCompleter.length > 0 && (
        <>
          <div className="ps-sep" />
          <ul className="ps-todo">
            {aCompleter.map((t) => (
              <li key={t.label} className={t.ok ? "ok" : ""}>{t.label}</li>
            ))}
          </ul>
        </>
      )}
      <div className="ps-actions">
        <button type="button" className="fk-btn primary" onClick={onValider} disabled={desactive || enCours}>
          {enCours ? "Enregistrement…" : "Valider le paiement"}
        </button>
        {onRecommencer && (
          <button type="button" className="fk-btn ghost" onClick={onRecommencer}>Recommencer</button>
        )}
      </div>
    </div>
  </aside>
);

export default PaymentSummary;
