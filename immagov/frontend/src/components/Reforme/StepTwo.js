import { useEffect,useState,useMemo } from "react";
import { useForm } from "react-hook-form";
import Spinner from "../Spinner/Spinner";
const StepTwo = ({ ministeres,directions,handleNextStep, handlePrevStep ,setProprietaireInfo,proprietaireInfo,setStepChk,stepChk}) => {
  const { register, handleSubmit, watch,formState: { errors } } = useForm();
  const [selecteddirections,setSelectedDirections] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  
  const isValide = useMemo(() => {
   
    return proprietaireInfo.nom.length > 2 && proprietaireInfo.prenom.length > 2 
           && proprietaireInfo.date_naissance!="" && proprietaireInfo.fonction.length > 0
           && proprietaireInfo.ministere != 0;
}, [proprietaireInfo]);
 
  useEffect(() => {
    setIsLoading(true);
    const dirs = directions.filter(m => m.ministere_id == proprietaireInfo.ministere);
    if(Array.isArray(dirs) && dirs.length > 0)
        setSelectedDirections(dirs);
    setIsLoading(false); 
  setStepChk({...stepChk,step3:false,step2:isValide});   

  }, [isValide]);
  const handleInput = (e) => {
    setProprietaireInfo({...proprietaireInfo,[e.target.name]:e.target.value});
  };

  const handleMinistere = (e) =>{
    setSelectedDirections([]);
    setProprietaireInfo({...proprietaireInfo,ministere:e.target.value,direction:0}); 
    if(e.target.value != 0 ){
      setIsLoading(true);
        const dirs = directions.filter(m => m.ministere_id == e.target.value);
       // console.log(dirs);
        if(Array.isArray(dirs) && dirs.length > 0)
            setSelectedDirections(dirs);
        setIsLoading(false);    
  }
};

  return (
    <div className="step-two">
       {isLoading && <Spinner />}
      <form onSubmit={handleSubmit(handleNextStep)}>
          <div className="input-group">
              <label>Nom <span className="obligatoire">*</span>
                  <input type="text" name="nom" placeholder="Nom"  defaultValue={proprietaireInfo.nom} 
                    {...register('nom', {
                      onChange: (e) => {
                        handleInput(e)
                      },
                     required:true,maxLength:40,minLength:2},
                    )}
                  />
                  {errors.nom && errors.nom?.type === "required" && (
                     <span className="error-msg">Le Nom du propriétaire est obligatoire.</span>
                  )}
                  {errors.nom && errors.nom?.type === "minLength" && (
                          <span className="error-msg">Le caractère minimum est deux (2).</span>
                      )}
                        {errors.nom && errors.nom?.type === "maxLength" && (
                          <span className="error-msg">Le caractère maximum est quarante (40).</span>
                  )}
              </label>
              <label>Prenom <span className="obligatoire">*</span>
                  <input type="text" name="prenom" placeholder="Prenom"  defaultValue={proprietaireInfo.prenom}
                     {...register('prenom', {
                      onChange: (e) => {
                        handleInput(e)
                      },
                     required:true,maxLength:75,minLength:2},
                    )}
               />
                 {errors.prenom && errors.prenom?.type === "required" && (
                      <span className="error-msg">Le Prenom du propriétaire est obligatoire.</span>
                  )}
                  {errors.prenom && errors.prenom?.type === "minLength" && (
                       <span className="error-msg">Le caractère minimum pour le propriétaire est deux (2).</span>
                   )}
                  {errors.prenom && errors.prenom?.type === "maxLength" && (
                      <span className="error-msg">Le caractère maximum est Soixante quize (75).</span>
                  )}
              </label>
              <label>Date de naissance <span className="obligatoire">*</span>
                  <input type="date" name="date_naissance" 
                      id="date_naissance" value={proprietaireInfo.date_naissance!=0 && proprietaireInfo.date_naissance}
                      {...register('date_naissance', {
                        onChange: (e) => {
                          handleInput(e)
                        },
                        required:true,},
                      )}
                  />
                  {errors.date_naissance && errors.date_naissance?.type === "required" && (
                      <span className="error-msg">La date de naissance est obligatoire.</span>
                  )}
              </label>
          </div>
          <div className="input-group">
              <label>Fonction <span className="obligatoire">*</span>
                  <input type="text" name="fonction" id="fonction" placeholder="Fonction" defaultValue={proprietaireInfo.fonction}
                   {...register('fonction', {
                    onChange: (e) => {
                      handleInput(e)
                    },
                   required:true,maxLength:40,minLength:2},
                  )}
                  />
                  {errors.fonction && errors.fonction?.type === "required" && (
                     <span className="error-msg">La fonction est obligatoire.</span>
                  )}
                  {errors.nom && errors.nom?.type === "minLength" && (
                          <span className="error-msg">Le caractère minimum est deux (2).</span>
                      )}
                        {errors.nom && errors.nom?.type === "maxLength" && (
                          <span className="error-msg">Le caractère maximum est quarante (40).</span>
                  )}
              </label>
              <label>Ministere <span className="obligatoire">*</span>
                  <select name="ministere" id="ministere" value={proprietaireInfo.ministere}
                   {...register('ministere', {
                    onChange: (e) => {
                      handleMinistere(e)
                    },
                    validate: (value) => value != 0 
                    },
                  )}
                  >
                     <option value={0}>Selectionnez du Ministère</option>
                     {
                        Array.isArray(ministeres) && ministeres.length > 0 && ministeres.map((ministere) => {
                               return (<option key={ministere.ministere_id} value={ministere.ministere_id}>{ministere.nom}</option>);
                         }) 
                       }
                  </select>
                  {errors.ministere && (
                    <span className="error-msg">Selectionnez un Ministère.</span>
                  )}
              </label>
              <label>Direction ou Service
                <select id="direction" name="direction"
                    value={proprietaireInfo.direction}
                    onChange={handleInput}
                    >
                    <option value={0}>Selectionner la Direction ou Service</option> 
                    {
                      Array.isArray(selecteddirections) && selecteddirections.length  > 0 && selecteddirections.map((direction) => {return (<option key={direction.direction_id} value={direction.direction_id}>{direction.nom}</option>)})
                    }  
              </select> 
               
          </label>
          </div>
        <div className="buttons">
          <button className="secondary" onClick={handlePrevStep}>
            Precedent
          </button>
          <button type="submit">Suivant</button>
        </div>
      </form>
    </div>
  );
};

export default StepTwo;
