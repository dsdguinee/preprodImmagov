import {useMemo,useEffect,useState} from 'react';
import { useForm } from "react-hook-form";
import Field from "./ui/Field";
import Input from "../ui/Input/Input";
import StepActions from "./ui/StepActions";
import SearchSelect from "../ui/Select/SearchSelect";
import { organismesSimilaires, organismeDeMemeNom } from "../../utils/organismes";

const AUTRE_MINISTERE = "1000000";

const StepThree = ({ handleNextStep, handlePrevStep,immatriculation,setImmatriculation,stepChk,setStepChk }) => {
  const handleInput = (e) => {
    if(e.target.value === '')
      setStepChk({...stepChk,step3:false});
    else  setStepChk({...stepChk,step3:true});
    setImmatriculation({...immatriculation,[e.target.name]:e.target.value})
  }
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [directions,setDirections] = useState([]);

  const isstepValid = useMemo(() => {
     return immatriculation.ministere != 0 ;
  },[immatriculation]);

  // Ministères proposés : ceux du type d'organisme indiqué par le paiement (Publique / Privé)
  const ministeres = useMemo(() => immatriculation.organisations.allMinisteres.filter(
    (m) => m.typeorganisme?.toLowerCase() === immatriculation?.typeOrganisme?.toLowerCase()
  ), [immatriculation.organisations.allMinisteres, immatriculation.typeOrganisme]);

  useEffect(()=>{
    setStepChk({...stepChk,step4:isstepValid});
    setDirections([]);
    const directionsSelected = immatriculation.organisations.allDirections.filter(m => m.ministere_id == immatriculation.ministere);
    if(Array.isArray(directionsSelected) && directionsSelected.length > 0)
       setDirections(directionsSelected);
  },[isstepValid]);

  const handleMinistere = (e) =>{
    setDirections([]);
    setImmatriculation({...immatriculation,ministere:e.target.value,direction:0});
    if(e.target.value != 0 ){
      setStepChk({...stepChk,step3:true});
      const directionsSelected = immatriculation.organisations.allDirections.filter(m => m.ministere_id == e.target.value);
      if(Array.isArray(directionsSelected) && directionsSelected.length > 0)
         setDirections(directionsSelected);
     }else {
       setStepChk({...stepChk,step3:false});
     }
  }
  const autre = String(immatriculation.ministere) === AUTRE_MINISTERE;
  // Nom identique à un organisme existant (tous types) : le dossier lui sera rattaché automatiquement à l'enregistrement
  const memeNom = autre ? organismeDeMemeNom(immatriculation.autreministere, immatriculation.organisations.allMinisteres) : null;
  const similaires = autre && !memeNom ? organismesSimilaires(immatriculation.autreministere, ministeres) : [];

  // L'utilisateur reconnaît un organisme existant : on le sélectionne au lieu d'en créer un doublon
  const choisirExistant = (org) => {
    setImmatriculation({...immatriculation, ministere: String(org.ministere_id), direction: 0, autreministere: '', autredirection: ''});
    setStepChk({...stepChk, step3: true});
    setValue('ministere', String(org.ministere_id));
    const directionsSelected = immatriculation.organisations.allDirections.filter(m => m.ministere_id == org.ministere_id);
    setDirections(Array.isArray(directionsSelected) ? directionsSelected : []);
  }

  return (
    <form onSubmit={handleSubmit(handleNextStep)}>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Affectation du véhicule</h2>
          <p className="immat-section__desc">Les ministères proposés dépendent du type d'organisme indiqué par le paiement.</p>
        </div>
        {immatriculation.typeOrganisme && <span className="immat-pill">Organisme : {immatriculation.typeOrganisme}</span>}
        {!immatriculation.typeOrganisme && (
          <div className="immat-alert immat-alert--warning">Le type d'organisme n'a pas été fourni par le paiement : seule l'option « Autre ministère » est disponible.</div>
        )}

        <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Ministère ou organisme" required error={errors.ministere && "Sélectionnez le ministère ou l'organisme."}>
            <SearchSelect id="ministere" value={immatriculation.ministere}
              placeholder="Sélectionner le ministère ou l'organisme" searchPlaceholder="Rechercher un ministère ou un organisme…"
              noResultText="Aucun organisme trouvé : choisissez « Organisme introuvable ? Le proposer »"
              options={[
                ...ministeres.map((m) => ({ value: String(m.ministere_id), label: m.nom })),
                { value: AUTRE_MINISTERE, label: "Organisme introuvable ? Le proposer" },
              ]}
              {...register('ministere', { onChange: (e) => handleMinistere(e), validate: (value) => value != 0 })}
            />
          </Field>
          <Field label="Direction ou service">
            <SearchSelect id="direction" value={immatriculation.direction} disabled={autre || directions.length === 0}
              placeholder={directions.length || autre ? "Sélectionner la direction ou le service" : "Aucune direction pour cet organisme"}
              searchPlaceholder="Rechercher une direction…"
              options={directions.map((d) => ({ value: String(d.direction_id), label: d.nom }))}
              {...register('direction', { onChange: (e) => handleInput(e) })}
            />
          </Field>
        </div>

        {autre && (
          <div className="immat-other immat-section">
          <div className="immat-other__head">
            <strong>Nouvel organisme</strong>
            <span className="immat-badge immat-badge--amber">En attente de validation</span>
          </div>
          <p className="immat-muted">Il sera ajouté après validation dans la gestion des ministères. Vérifiez d'abord qu'il n'existe pas déjà.</p>
          <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <Field label="Nom du ministère ou de l'organisme" required error={errors.autreministere && "Veuillez renseigner ce champ."}>
              <Input invalid={!!errors.autreministere} type="text" defaultValue={immatriculation.autreministere} name="autreministere" placeholder="Saisir le ministère"
                {...register('autreministere', { onChange: (e) => handleInput(e), required:true })}
              />
            </Field>
            <Field label="Direction" error={errors.autredirection?.type === "minLength" && "Le nombre minimum de caractères est deux (2)."}>
              <Input invalid={!!errors.autredirection} type="text" defaultValue={immatriculation.autredirection} name="autredirection" placeholder="Saisir la direction"
                {...register('autredirection', { onChange: (e) => handleInput(e), minLength:2 })}
              />
            </Field>
          </div>
          {memeNom && (
            <div className="immat-alert immat-alert--warning" role="status">
              <span>Cet organisme existe déjà (<strong>{memeNom.nom}</strong>) : le dossier lui sera rattaché automatiquement, sans validation du Directeur.</span>
            </div>
          )}
          {similaires.length > 0 && (
            <div className="immat-suggest" role="status">
              <span className="immat-suggest__title">Vouliez-vous dire :</span>
              {similaires.map((org) => (
                <button key={org.ministere_id} type="button" className="immat-suggest__item" onClick={() => choisirExistant(org)}>
                  <span>{org.nom}</span>
                  <span className="immat-suggest__action">Choisir cet organisme</span>
                </button>
              ))}
            </div>
          )}
          </div>
        )}
      </div>
      <StepActions onPrev={handlePrevStep} />
    </form>
  );
};

export default StepThree;
