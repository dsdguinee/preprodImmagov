import {useMemo,useEffect,useState} from 'react';
import { useForm } from "react-hook-form";
import Field from "../Immatriculation/ui/Field";
import StepActions from "../Immatriculation/ui/StepActions";
import Input from "../ui/Input/Input";
import SearchSelect from "../ui/Select/SearchSelect";
import { organismesSimilaires, organismeDeMemeNom } from "../../utils/organismes";

const AUTRE_MINISTERE = "1000000";

// Directions chargées : tableau, ou objet { directions: [...] } renvoyé par l'API
const toutesDirections = (immatriculation) => {
  const liste = immatriculation?.organisations?.allDirections;
  return Array.isArray(liste) ? liste : (liste?.directions || []);
};

// Étape 3 : affectation du véhicule (organisme et direction)
const StepThree = ({ handleNextStep, handlePrevStep,immatriculation,setImmatriculation,stepChk,setStepChk }) => {
  const handleInput = (e) => {
    setImmatriculation({...immatriculation,[e.target.name]:e.target.value})
  }
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues:{
      immatriculation
    }
  });
  const [directions,setDirections] = useState([]);

  const isstepValid = useMemo(() => {
     return immatriculation.ministere != 0 ;
  },[immatriculation]);

  // Organismes du type du dossier (Publique / Privé)
  const ministeres = useMemo(() => (immatriculation.organisations.allMinisteres || []).filter(
    (m) => m.typeorganisme?.toLowerCase() === immatriculation?.typeOrganisme?.toLowerCase()
  ), [immatriculation.organisations.allMinisteres, immatriculation.typeOrganisme]);

  useEffect(()=>{
    setStepChk({...stepChk,step4:isstepValid});
    reset(immatriculation);
    setDirections(toutesDirections(immatriculation).filter(m => m.ministere_id == immatriculation.ministere));
  },[isstepValid]);

  const handleMinistere = (e) =>{
    setImmatriculation({...immatriculation,ministere:e.target.value,direction:0});
    setDirections(e.target.value != 0 ? toutesDirections(immatriculation).filter(m => m.ministere_id == e.target.value) : []);
  }

  const autre = String(immatriculation.ministere) === AUTRE_MINISTERE;
  // Nom identique à un organisme existant : le dossier lui sera rattaché automatiquement à l'enregistrement
  const memeNom = autre ? organismeDeMemeNom(immatriculation.autreministere, immatriculation.organisations.allMinisteres) : null;
  const similaires = autre && !memeNom ? organismesSimilaires(immatriculation.autreministere, ministeres) : [];
  const choisirExistant = (org) => {
    setImmatriculation({...immatriculation, ministere: String(org.ministere_id), direction: 0, autreministere: '', autredirection: ''});
    setValue('ministere', String(org.ministere_id));
    setDirections(toutesDirections(immatriculation).filter(m => m.ministere_id == org.ministere_id));
  }

  return (
    <form onSubmit={handleSubmit(handleNextStep)}>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Affectation du véhicule</h2>
          <p className="immat-section__desc">Les organismes proposés dépendent du type d'organisme du dossier.</p>
        </div>
        {immatriculation.typeOrganisme
          ? <span className="immat-pill">Organisme : {immatriculation.typeOrganisme}</span>
          : <div className="immat-alert immat-alert--warning">Le type d'organisme du dossier est inconnu : seule l'option « Organisme introuvable ? Le proposer » est disponible.</div>}

        <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label="Ministère ou organisme" required error={errors.ministere && "Sélectionnez le ministère ou l'organisme."}>
            <SearchSelect id="ministere" value={immatriculation.ministere}
              placeholder="Sélectionner le ministère ou l'organisme" searchPlaceholder="Rechercher un ministère ou un organisme…"
              noResultText="Aucun organisme trouvé : choisissez « Organisme introuvable ? Le proposer »"
              options={[
                ...ministeres.map((m) => ({ value: String(m.ministere_id), label: m.nom })),
                { value: AUTRE_MINISTERE, label: "Organisme introuvable ? Le proposer" },
              ]}
              {...register('ministere', { onChange: (e) => handleMinistere(e), validate: (value) => !!value && value != 0 })}
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
            <p className="immat-muted">Il sera ajouté après validation par le Directeur. Vérifiez d'abord qu'il n'existe pas déjà.</p>
            <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <Field label="Nom du ministère ou de l'organisme" required error={errors.autreministere && "Veuillez renseigner ce champ."}>
                <Input invalid={!!errors.autreministere} defaultValue={immatriculation.autreministere} name="autreministere" placeholder="Saisir le ministère"
                  {...register('autreministere', { onChange: (e) => handleInput(e), required:true })} />
              </Field>
              <Field label="Direction" error={errors.autredirection?.type === "minLength" && "Le nombre minimum de caractères est deux (2)."}>
                <Input invalid={!!errors.autredirection} defaultValue={immatriculation.autredirection} name="autredirection" placeholder="Saisir la direction"
                  {...register('autredirection', { onChange: (e) => handleInput(e), minLength:2 })} />
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
