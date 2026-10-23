import {useMemo,useEffect,useState} from 'react';
import { useForm } from "react-hook-form";
import Field from "./ui/Field";
import Input from "../ui/Input/Input";
import StepActions from "./ui/StepActions";
import SearchSelect from "../ui/Select/SearchSelect";
import { organismesSimilaires, organismeDeMemeNom, organismesPourClient } from "../../utils/organismes";
import PropositionDirection, { AUTRE_DIRECTION, erreurNouvelleDirection, optionsDirections } from "./ui/PropositionDirection";

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
  // et de la catégorie du client (ministères pour Gouvernement, entreprises publiques pour Entreprise Publique)
  const ministeres = useMemo(() => organismesPourClient(immatriculation.organisations.allMinisteres, immatriculation.typeOrganisme, immatriculation.typeClient),
    [immatriculation.organisations.allMinisteres, immatriculation.typeOrganisme, immatriculation.typeClient]);

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
  // Ministère ou entreprise publique indiqué par le paiement SIPIM : même nom (accents, casse, espaces ignorés) => sélectionné d'office ;
  // sinon organismes de nom proche proposés, ou création avec le nom SIPIM
  const nomSipim = (immatriculation.ministereSipim || '').trim();
  const correspondance = useMemo(() => nomSipim ? organismeDeMemeNom(nomSipim, ministeres) : null, [nomSipim, ministeres]);
  const prochesSipim = useMemo(() => nomSipim && !correspondance ? organismesSimilaires(nomSipim, ministeres) : [],
    [nomSipim, correspondance, ministeres]);
  useEffect(() => {
    if (correspondance && immatriculation.ministere == 0) choisirExistant(correspondance);
  }, [correspondance]);
  const proposerNomSipim = () => {
    setImmatriculation({...immatriculation, ministere: AUTRE_MINISTERE, direction: 0, autreministere: nomSipim, autredirection: ''});
    setStepChk({...stepChk, step3: true});
    setValue('ministere', AUTRE_MINISTERE);
    setValue('autreministere', nomSipim);
    setDirections([]);
  }
  const surCorrespondance = correspondance && String(immatriculation.ministere) === String(correspondance.ministere_id);

  const autre = String(immatriculation.ministere) === AUTRE_MINISTERE;
  // Nouvelle direction proposée pour un organisme existant
  const [erreurDirection, setErreurDirection] = useState("");
  const organismeChoisi = immatriculation.ministere != 0 && !autre;
  const propositionDirection = organismeChoisi && String(immatriculation.direction) === AUTRE_DIRECTION;
  const handleDirection = (e) => {
    setErreurDirection("");
    setImmatriculation({...immatriculation, direction: e.target.value, autredirection: e.target.value === AUTRE_DIRECTION ? immatriculation.autredirection : ''});
  }
  const choisirDirection = (d) => {
    setErreurDirection("");
    setImmatriculation({...immatriculation, direction: String(d.direction_id), autredirection: ''});
    setValue('direction', String(d.direction_id));
  }
  // Étape suivante : nom de la direction proposée obligatoire
  const suivant = (donnees) => {
    const erreur = organismeChoisi ? erreurNouvelleDirection(immatriculation) : "";
    setErreurDirection(erreur);
    if (!erreur) handleNextStep(donnees);
  }
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
    <form onSubmit={handleSubmit(suivant)}>
      <div className="immat-body">
        <div className="immat-section__head">
          <h2 className="immat-section__title" style={{ fontSize: 18 }}>Affectation du véhicule</h2>
          <p className="immat-section__desc">Les ministères proposés dépendent du type d'organisme indiqué par le paiement.</p>
        </div>
        {immatriculation.typeOrganisme && <span className="immat-pill">Organisme : {immatriculation.typeOrganisme}</span>}
        {!immatriculation.typeOrganisme && (
          <div className="immat-alert immat-alert--warning">Le type d'organisme n'a pas été fourni par le paiement : seule l'option « Autre ministère » est disponible.</div>
        )}

        {nomSipim && (
          surCorrespondance ? (
            <div className="immat-alert immat-alert--info" role="status">
              <span>Organisme présélectionné d'après le paiement SIPIM (<strong>{nomSipim}</strong>). Si ce n'est pas le bon, choisissez-en un autre dans la liste.</span>
            </div>
          ) : !correspondance && !autre && immatriculation.ministere == 0 ? (
            <div className="immat-suggest" role="status">
              <span className="immat-suggest__title">Le paiement SIPIM indique « {nomSipim} », introuvable tel quel dans immagov.{prochesSipim.length > 0 && " Correspond-il à :"}</span>
              {prochesSipim.map((org) => (
                <button key={org.ministere_id} type="button" className="immat-suggest__item" onClick={() => choisirExistant(org)}>
                  <span>{org.nom}</span>
                  <span className="immat-suggest__action">Choisir cet organisme</span>
                </button>
              ))}
              <button type="button" className="immat-suggest__item" onClick={proposerNomSipim}>
                <span>{nomSipim}</span>
                <span className="immat-suggest__action">Proposer cet organisme</span>
              </button>
            </div>
          ) : null
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
            <SearchSelect id="direction" value={immatriculation.direction} disabled={!organismeChoisi}
              placeholder={organismeChoisi ? (directions.length ? "Sélectionner la direction ou le service" : "Aucune direction : vous pouvez en proposer une") : "Choisissez d'abord l'organisme"}
              searchPlaceholder="Rechercher une direction…"
              noResultText="Direction introuvable : choisissez « Direction introuvable ? La proposer »"
              options={optionsDirections(directions, organismeChoisi)}
              {...register('direction', { onChange: handleDirection })}
            />
          </Field>
        </div>

        {propositionDirection && (
          <PropositionDirection nom={immatriculation.autredirection} directions={directions} erreur={erreurDirection}
            onChange={(nom) => { setErreurDirection(""); setImmatriculation({...immatriculation, autredirection: nom}); }}
            onChoisir={choisirDirection} />
        )}

        {autre && (
          <div className="immat-other immat-section">
          <div className="immat-other__head">
            <strong>Nouvel organisme</strong>
            <span className="immat-badge immat-badge--amber">En attente de validation</span>
          </div>
          <p className="immat-muted">Il sera ajouté après validation dans la gestion des ministères. Vérifiez d'abord qu'il n'existe pas déjà.</p>
          <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <Field label="Nom du ministère ou de l'organisme" required error={errors.autreministere && "Veuillez renseigner ce champ."}>
              <Input invalid={!!errors.autreministere} type="text" value={immatriculation.autreministere} name="autreministere" placeholder="Saisir le ministère"
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
