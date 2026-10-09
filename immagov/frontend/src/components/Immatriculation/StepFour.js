import {useEffect,useMemo,useState} from 'react';
import StepActions from "./ui/StepActions";

// Seule la pièce jointe est demandee : PDF, JPEG ou PNG
export const LETTRE_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const isLettreValide = (file) => !!file && /\.(pdf|jpe?g|png)$/i.test(file.name || '');
export const LETTRE_MAX_MO = 10;
// Message d'erreur pour la pièce jointe choisie, ou '' si elle est acceptable
export const erreurLettre = (file) => {
  if(!isLettreValide(file)) return "La pièce jointe doit être au format PDF, JPEG ou PNG.";
  if(file.size > LETTRE_MAX_MO * 1024 * 1024) return `La pièce jointe est trop volumineuse (${(file.size / 1048576).toFixed(1)} Mo). Taille maximale : ${LETTRE_MAX_MO} Mo.`;
  return '';
};
const tailleMo = (file) => (file.size / 1048576).toFixed(1).replace('.', ',') + " Mo";

const StepFour = ({ handleNextStep, handlePrevStep,immatriculation,setImmatriculation,stepChk,setStepChk }) => {
  const [erreur,setErreur] = useState('');
  const lettre = immatriculation.image4;
  const isstepValid = useMemo(() => {
    return lettre != '' && !!lettre
  },[lettre]);
  useEffect(() => {
   setStepChk({...stepChk,step4:isstepValid});
  },[immatriculation]);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if(!file) return;
    const message = erreurLettre(file);
    setErreur(message);
    if(!message) setImmatriculation({...immatriculation,image4:file});
  }
  const retirer = () => { setErreur(''); setImmatriculation({...immatriculation,image4:''}); }
  const ouvrir = () => window.open(URL.createObjectURL(lettre));
  const estPdf = lettre && /\.pdf$/i.test(lettre.name || '');

  return (
    <div>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Pièce jointe <span className="immat-req">*</span></h2>
          <p className="immat-section__desc">Un seul document : PDF, JPEG ou PNG, {LETTRE_MAX_MO} Mo maximum.</p>
        </div>

        {!lettre ? (
          <label className="immat-dropzone">
            <input type="file" name="image4" accept={LETTRE_ACCEPT} onChange={onFileChange} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#017A60" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
            <span className="immat-dropzone__title">Déposez la pièce jointe ici ou cliquez pour choisir</span>
            <span className="immat-muted">PDF · JPEG · PNG — {LETTRE_MAX_MO} Mo max.</span>
          </label>
        ) : (
          <div className="immat-file">
            <div className={`immat-file__icon${estPdf ? '' : ' immat-file__icon--img'}`}>{estPdf ? 'PDF' : 'IMG'}</div>
            <div className="immat-file__info">
              <span>{lettre.name}</span>
              <span className="immat-muted">{tailleMo(lettre)} · prêt à l'envoi</span>
            </div>
            <button type="button" className="immat-btn immat-btn--link" onClick={ouvrir}>Ouvrir</button>
            <label className="immat-btn immat-btn--secondary" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5D1', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#14201C' }}>
              Remplacer
              <input type="file" name="image4" accept={LETTRE_ACCEPT} onChange={onFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
            </label>
            <button type="button" className="immat-btn immat-btn--link" onClick={retirer} aria-label="Retirer la pièce jointe">Retirer</button>
          </div>
        )}

        {erreur && <div className="immat-alert immat-alert--error" role="alert">{erreur}</div>}
      </div>
      <StepActions onPrev={handlePrevStep} nextType="button" onNext={handleNextStep} nextDisabled={!isstepValid} />
    </div>
  );
};

export default StepFour;
