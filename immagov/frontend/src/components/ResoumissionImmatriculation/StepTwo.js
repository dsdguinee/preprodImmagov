import { useState ,useEffect,useMemo} from "react";
import { useForm } from "react-hook-form";
import { colors } from "../../utils/colors";
import { getPays ,isEmpty, isDateValid,checkValid} from '../../utils/helper/functions';
import { carosseries } from "../../services/utils/carosserie";
import Field from "../Immatriculation/ui/Field";
import FormSection from "../Immatriculation/ui/FormSection";
import SegmentedControl from "../Immatriculation/ui/SegmentedControl";
import StepActions from "../Immatriculation/ui/StepActions";
import Input from "../ui/Input/Input";
import SearchSelect from "../ui/Select/SearchSelect";

const ENERGIES = [
    { value: "Essence", label: "Essence" },
    { value: "Diesel", label: "Diesel" },
    { value: "Electrique", label: "Électrique" },
    { value: "Hybride", label: "Hybride" },
];
const TRANSMISSIONS = [
    { value: "Manuelle", label: "Manuelle" },
    { value: "Automatic", label: "Automatique" },
];
const ACQUISITIONS = [
    { value: "achat", label: "Achat" },
    { value: "don", label: "Don" },
    { value: "privé", label: "Privé" },
];

// Étape 2 : caractéristiques du véhicule. Pour une plaque EP, le châssis et le genre viennent du paiement : non modifiables.
const StepTwo = ({ handleNextStep, handlePrevStep,immatriculation,setImmatriculation,stepChk,setStepChk }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues:{
        immatriculation
    }
  });
  const [currentYear,setCurrentYear] = useState('');
  const [modeles,setModeles] = useState([]);
  const [types,setTypes] = useState([]);
  const [energieManquante,setEnergieManquante] = useState(false);
  const isstepValid = useMemo(() => {
      return checkValid(immatriculation);
  },[immatriculation]);
  const verrouille = immatriculation.modeImmatriculation === "EP";

    useEffect(()=>{
        setStepChk({...stepChk,step3:isstepValid});
        setCurrentYear(new Date().getFullYear());
        if(immatriculation.genre != 0){
            const seletedTypes  = immatriculation.categories.AllTypes? immatriculation.categories.AllTypes.filter(g => g.genre_id == immatriculation.genre):[];
            setTypes(seletedTypes);
        }
        if(immatriculation.marque != 0){
            const modeleSelected = immatriculation.brands.allModeles? immatriculation.brands.allModeles.filter(g => g.marque_id == immatriculation.marque):[];
            setModeles(modeleSelected);
        }
        reset(immatriculation)
    },[isstepValid]);

  const pays = getPays();

  const handleInput = (e) => {
    if(e.target.type != 'select-one')
       setImmatriculation({...immatriculation,[e.target.name]:e.target.value.toUpperCase()});
    else setImmatriculation({...immatriculation,[e.target.name]:e.target.value});
   }
  const setChoix = (name) => (value) => {
      if(name === 'energie') setEnergieManquante(false);
      setImmatriculation({...immatriculation,[name]:value});
  }
  const handleModel = (e) =>{
      setModeles([]);
      setImmatriculation({...immatriculation,marque:e.target.value,model:0});
      if(e.target.value != 0 ){
        const modeleSelected = immatriculation.brands.allModeles? immatriculation.brands.allModeles.filter(g => g.marque_id == e.target.value):[];
        setModeles(modeleSelected);
    }
   }
   const handleGenre = (e) => {
    setImmatriculation({...immatriculation,genre:e.target.value});
    setTypes([]);
    if(e.target.value != 0 ){
      const seletedTypes  = immatriculation.categories.AllTypes? immatriculation.categories.AllTypes.filter(g => g.genre_id == e.target.value):[];
      setTypes(seletedTypes);
    }
   }
   // L'énergie est un choix par boutons : contrôlée avant de passer à l'étape suivante
   const energieOk = () => !!immatriculation.energie && immatriculation.energie != 0;
   const onValid = () => {
       if(!energieOk()){ setEnergieManquante(true); return; }
       handleNextStep();
   }
   const ptac = (parseInt(immatriculation.pv) || 0) + (parseInt(immatriculation.cu) || 0);

    return (
        <form onSubmit={handleSubmit(onValid, () => { if(!energieOk()) setEnergieManquante(true); })}>
            <div className="immat-body">
                <FormSection title="Identification">
                    <Field label="Numéro de châssis" required error={
                        errors.numChassie?.type === "required" ? "Le numéro de châssis est obligatoire."
                        : errors.numChassie?.type === "minLength" ? "Le nombre minimum de caractères est quatre (4)."
                        : errors.numChassie?.type === "maxLength" ? "Le nombre maximum de caractères est dix-sept (17)." : ""}>
                        {verrouille
                            ? <Input mono value={immatriculation.numChassie} readOnly />
                            : <Input mono invalid={!!errors.numChassie} value={immatriculation.numChassie} type="text" name="numChassie"
                                {...register('numChassie', { onChange: (e) => handleInput(e), required:true,maxLength:17,minLength:4 })} />}
                    </Field>
                    <Field label="Marque" required error={errors.marque && "La marque du véhicule est obligatoire."}>
                        <SearchSelect id="marque" value={immatriculation.marque}
                            placeholder="Sélectionner la marque" searchPlaceholder="Rechercher une marque…"
                            options={(immatriculation.brands.allMarques || []).map((m) => ({ value: m.id, label: m.title }))}
                            {...register('marque', { onChange: (e) => handleModel(e), validate: (value) => value != 0 })}
                        />
                    </Field>
                    <Field label="Modèle" required error={errors.model && "Le modèle du véhicule est obligatoire."}>
                        <SearchSelect id="model" value={immatriculation.model}
                            placeholder={modeles.length ? "Sélectionner le modèle" : "Choisissez d'abord la marque"}
                            searchPlaceholder="Rechercher un modèle…" disabled={modeles.length === 0}
                            options={modeles.map((m) => ({ value: m.id, label: m.title }))}
                            {...register('model', { onChange: (e) => handleInput(e), validate: (value) => !!value && value != 0 })}
                        />
                    </Field>
                    <Field label="Genre" required error={errors.genre && "Le genre du véhicule est obligatoire."}>
                        <select name="genre" value={immatriculation.genre} id="genre" disabled={verrouille}
                            {...register('genre', { onChange: (e) => handleGenre(e), validate: (value) => value != 0 })}>
                            <option value={0}>Genre de véhicule</option>
                            {immatriculation.categories.AllGenres.map((genre) => <option key={genre.genre_id} value={genre.genre_id}>{genre.nom}</option>)}
                        </select>
                    </Field>
                    <Field label="Type" required error={errors.type && "Le type de véhicule est obligatoire."}>
                        <select name="type" value={immatriculation.type} id="type"
                            {...register('type', { onChange: (e) => handleInput(e), validate: (value) => value != 0 })}>
                            <option value={0}>Type de véhicule</option>
                            {types.map((type) => <option key={type.type_id} value={type.type_id}>{type.nom}</option>)}
                        </select>
                    </Field>
                    <Field label="Carrosserie" required error={errors.carrosserie && "La carrosserie du véhicule est obligatoire."}>
                        <select name="carrosserie" id="carrosserie" value={immatriculation.carrosserie}
                            {...register('carrosserie', { onChange: (e) => handleInput(e), validate: (value) => value != 0 })}>
                            <option value={0}>Sélectionner la carrosserie</option>
                            {carosseries.map((carosserie) => <option key={carosserie.id} value={carosserie.id}>{carosserie.nom}</option>)}
                        </select>
                    </Field>
                    <Field label="Couleur" required error={errors.couleur && "Veuillez choisir la couleur."}>
                        <select name="couleur" id="colors" value={immatriculation.couleur}
                            {...register('couleur', { onChange: (e) => handleInput(e), validate: (value) => value != '' })}>
                            <option value=''>Sélectionner la couleur</option>
                            {colors.map((element) => <option value={element.name} key={element.id}>{element.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Année de fabrication" required error={
                        errors.annee?.type === "required" ? "L'année est obligatoire."
                        : errors.annee?.type === "min" ? "L'année minimale est 1900."
                        : errors.annee?.type === "max" ? `L'année maximale est ${currentYear}.` : ""}>
                        <Input invalid={!!errors.annee} value={immatriculation.annee} type="number" name="annee" id="annee" placeholder="Année"
                            {...register('annee', { onChange: (e) => handleInput(e), required:true,min:1900,max:currentYear })} />
                    </Field>
                    <Field label="1re mise en circulation" required error={errors.dateP && "La date choisie n'est pas valide."}>
                        <Input invalid={!!errors.dateP} type="date" name='dateP' value={immatriculation.dateP}
                            {...register('dateP', { onChange: (e) => handleInput(e), validate: (value) => isDateValid(value) })} />
                    </Field>
                    <Field label="Ancien numéro d'immatriculation" error={errors.ancienNumMat?.message}>
                        <Input mono invalid={!!errors.ancienNumMat} type="text" value={immatriculation.ancienNumMat || ''} name="ancienNumMat" placeholder="ex : RC-1234-A"
                            {...register('ancienNumMat', { onChange: (e) => handleInput(e),
                                pattern:{ value: /[A-Z]{2,3}-[0-9]{4}-[A-Z]{1,2}/, message:"Respectez le format d'immatriculation (ex : RC-1234-A)." } })} />
                    </Field>
                </FormSection>

                <div className="immat-divider" />

                <section className="immat-section">
                    <div className="immat-section__head"><h2 className="immat-section__title">Motorisation</h2></div>
                    <SegmentedControl label="Énergie" required value={immatriculation.energie} options={ENERGIES}
                        onChange={setChoix('energie')} error={energieManquante && "La source d'énergie est obligatoire."} />
                    <SegmentedControl label="Transmission" required value={immatriculation.transmission} options={TRANSMISSIONS}
                        onChange={setChoix('transmission')} />
                    <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                        <Field label="Cylindres" required error={
                            errors.cylindre?.type === "required" ? "Le nombre de cylindres est obligatoire."
                            : errors.cylindre?.type === "min" ? "Le nombre minimum de cylindres est un (1)."
                            : errors.cylindre?.type === "max" ? "Le nombre maximum de cylindres est vingt (20)." : ""}>
                            <Input invalid={!!errors.cylindre} min="0" max="20" type="number" value={immatriculation.cylindre} name="cylindre"
                                {...register('cylindre', { onChange: (e) => handleInput(e), required:true,min:1,max:20 })} />
                        </Field>
                        <Field label="Puissance administrative" required error={
                            errors.pa?.type === "required" ? "La puissance administrative est obligatoire."
                            : errors.pa?.type === "min" ? "La puissance administrative minimum est un (1)." : ""}>
                            <Input suffix="CV" type='number' name='pa' value={immatriculation.pa} readOnly
                                {...register('pa', { onChange: (e) => handleInput(e), required:true,min:1 })} />
                        </Field>
                        <Field label="Kilométrage" error={errors.kilometrage?.type === "min" && "Le minimum est 0."}>
                            <Input suffix="km" invalid={!!errors.kilometrage} min="0" type="number" value={immatriculation.kilometrage} name="kilometrage"
                                {...register('kilometrage', { onChange: (e) => handleInput(e), min:0 })} />
                        </Field>
                    </div>
                </section>

                <div className="immat-divider" />

                <FormSection title="Capacité et poids" min={160}>
                    <Field label="Places assises" required error={
                        errors.nbPlaceAssise?.type === "required" ? "Le nombre de places assises est obligatoire."
                        : errors.nbPlaceAssise?.type === "min" ? "Le nombre minimum de places assises est un (1)." : ""}>
                        <Input invalid={!!errors.nbPlaceAssise} min="1" type="number" value={immatriculation.nbPlaceAssise || 0} name="nbPlaceAssise"
                            {...register('nbPlaceAssise', { onChange: (e) => handleInput(e), required:true,min:1 })} />
                    </Field>
                    <Field label="Places debout" required error={
                        errors.nbPlaceDebout?.type === "required" ? "Le nombre de places debout est obligatoire."
                        : errors.nbPlaceDebout?.type === "min" ? "Le nombre minimum de places debout est zéro (0)." : ""}>
                        <Input invalid={!!errors.nbPlaceDebout} min="0" type="number" value={immatriculation.nbPlaceDebout || 0} name="nbPlaceDebout"
                            {...register('nbPlaceDebout', { onChange: (e) => handleInput(e), required:true,min:0 })} />
                    </Field>
                    <Field label="Portes" required error={
                        errors.nbPorte?.type === "required" ? "Le nombre de portes est obligatoire."
                        : errors.nbPorte?.type === "min" ? "Le nombre minimum de portes est zéro (0)." : ""}>
                        <Input invalid={!!errors.nbPorte} type="number" value={immatriculation.nbPorte || 0} min="0" name="nbPorte"
                            {...register('nbPorte', { onChange: (e) => handleInput(e), required:true,min:0 })} />
                    </Field>
                    <Field label="Essieux" required error={errors.nbreEssuie?.type === "min" && "Le nombre minimum d'essieux est zéro (0)."}>
                        <Input invalid={!!errors.nbreEssuie} type='number' name="nbreEssuie" min='0' value={immatriculation.nbreEssuie}
                            {...register('nbreEssuie', { onChange: (e) => handleInput(e), required:true,min:0 })} />
                    </Field>
                    <Field label="Poids à vide" required error={
                        errors.pv?.type === "required" ? "Le poids à vide est obligatoire."
                        : errors.pv?.type === "min" ? "Le poids à vide minimum est un (1)." : ""}>
                        <Input suffix="kg" invalid={!!errors.pv} type='number' name="pv" min='0' value={immatriculation.pv}
                            {...register('pv', { onChange: (e) => handleInput(e), required:true,min:1 })} />
                    </Field>
                    <Field label="Charge utile" required error={
                        errors.cu?.type === "required" ? "La charge utile est obligatoire."
                        : errors.cu?.type === "min" ? "La charge utile minimum est un (1)." : ""}>
                        <Input suffix="kg" invalid={!!errors.cu} type='number' name="cu" min='0' value={immatriculation.cu}
                            {...register('cu', { onChange: (e) => handleInput(e), required:true,min:1 })} />
                    </Field>
                    <div className="immat-field">
                        <span className="immat-field__label">Poids total autorisé en charge</span>
                        <span className="immat-field__static">{ptac} kg</span>
                    </div>
                </FormSection>

                <div className="immat-divider" />

                <section className="immat-section">
                    <div className="immat-section__head"><h2 className="immat-section__title">Origine</h2></div>
                    <div className="immat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "end" }}>
                        <Field label="Provenance" required error={errors.idpays && "Le pays d'origine est obligatoire."}>
                            <SearchSelect id="provenance" value={immatriculation.idpays}
                                placeholder="Sélectionner la provenance" searchPlaceholder="Rechercher un pays…"
                                options={isEmpty(pays) ? [] : Object.keys(pays).map((code) => ({ value: code, label: pays[code] }))}
                                {...register('idpays', { onChange: (e) => handleInput(e), validate: (value) => value != 0 })}
                            />
                        </Field>
                        <SegmentedControl label="Mode d'acquisition" value={immatriculation.acquisition} options={ACQUISITIONS}
                            onChange={setChoix('acquisition')} />
                    </div>
                </section>
            </div>
            <StepActions onPrev={handlePrevStep} />
        </form>
    );
}

export default StepTwo;
