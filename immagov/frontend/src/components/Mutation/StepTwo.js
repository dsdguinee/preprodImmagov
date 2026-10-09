import { useState,useEffect, useMemo } from 'react';
import { BiUpload } from 'react-icons/bi'
import { useForm } from "react-hook-form";
import Spinner from "../Spinner/Spinner";
const StepTwo = ({ handleNextStep, handlePrevStep ,immaInfo,setImmaInfo,ministeres,directions,setStepChk,stepChk}) => {
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      immaInfo
    }
});
  const [previews,setPreviews] = useState({previews1:'',previews2:''});
  const [selecteddirections,setSelectedDirection] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const checkValid = (immaInfo) => {
       return immaInfo.ministere != 0 &&  immaInfo.motif.length > 0 && immaInfo.fonction.length > 0 ;
  }
  const isvslide = useMemo(() => {
      return checkValid(immaInfo);
  },[immaInfo])
  useEffect(() =>{
    reset(immaInfo);
   // setSelectedDirection([]);
    const dirs = directions.filter(m => m.ministere_id == immaInfo.ministere);
    if(Array.isArray(dirs) && dirs.length > 0)
       setSelectedDirection(dirs);
    
    setStepChk({...stepChk,step2:isvslide});  
     
  },[isvslide]);
  const handleMinistere = (e) =>{
  
    if(e.target.name == 'ministere'){
      setImmaInfo({...immaInfo,ministere:e.target.value,direction:0}); 
      setSelectedDirection([]);
      if(e.target.value != 0 ){
        setIsLoading(true);
        const dirs = directions.filter(m => m.ministere_id == e.target.value);
        if(Array.isArray(dirs) && dirs.length > 0)
            setSelectedDirection(dirs);
        setIsLoading(false);   
    
      }
    }
  };
  const onFileChange = (event) => {
    if(event.target.files[0])
      setImmaInfo({...immaInfo,[event.target.name]:event.target.files[0]});
   
  }
  const handleInput = (e) => {
    setImmaInfo({...immaInfo,[e.target.name]:e.target.value});

  }
  
  //console.log(immaInfo);
  return (
    <div className="step-two">
      {isLoading && <Spinner />}
      <form onSubmit={handleSubmit(handleNextStep)}>
        <div className="input-group">
          <label>
            Ministere
            <select id="ministère" name="ministere"
            value={immaInfo.ministere} 
            {...register('ministere', {
              onChange: (e) => {
                  handleMinistere(e)
                  // setSelectedMinistere(e.target)
              },
               validate: (value) => value != 0 },
             )}
            >
            <option value={0}>Selectionner le Ministère</option>
            {
              ministeres.length > 0 && ministeres.map((ministere) => {
                return (<option key={ministere.ministere_id} value={ministere.ministere_id}>{ministere.nom}</option>);
              }) 
            }
          </select>
          
          {errors.ministere && (
                  <span className="error-msg">Veuillez selectionner le ministere .</span>
              )} 
          </label>
          <label>
            Direction ou service
             <select id="direction" name="direction"
                    value={immaInfo.direction}
                    onChange={handleInput}
                    >
                    <option value={0}>Selectionner la Direction ou Service</option> 
                    {
                      (Array.isArray(selecteddirections) && selecteddirections.length> 0) && selecteddirections.map((direction) => {return (<option key={direction.direction_id} value={direction.direction_id}>{direction.nom}</option>)})
                    }  
              </select> 
          </label>
        </div>
        <div className="input-group">
          <label>
            Motif
            <textarea name="motif" id="" cols="45" rows="5"  defaultValue={immaInfo.motif}
              {...register('motif', {
                onChange: (e) => {
                    handleInput(e)
                },
                required:true,minLength:4 },
              )}
            ></textarea>
             {errors.motif && errors.motif?.type == "required" && (
                  <span className="error-msg">Veuillez renseigner ce champ .</span>
              )}  
              {errors.motif && errors.motif?.type == "minLength" && (
                  <span className="error-msg">Le caractère minimum pour le Motif est quatre (4) .</span>
              )}  
          </label>
        </div>
        <div className="input-group">
          <div>
            <label>
              Quelle est la fonction du nouveau propriétaire?
              <span className="obligatoire">*</span>
            </label>
            <input
              defaultValue={immaInfo.fonction}
              name="fonction"
              type="text"
              {...register("fonction", {
                onChange: (e) => {
                  handleInput(e);
                },
                required: true,
                minLength: 3,
              })}
            />
            {errors.fonction && errors.fonction?.type == "required" && (
              <span className="error-msg">
                Veuillez fournir la fonction du nouveau propriétaire .
              </span>
            )}
            {errors.fonction && errors.fonction?.type == "minLength" && (
              <span className="error-msg">
                Le caractère minimum pour le Motif est trois (3) .
              </span>
            )}
          </div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="step-files">
          <div className="files">
            <div className="file-wrapper">
              <p>Document 1</p>
              <div className="image">
                <img src={immaInfo.document1 !== '' && immaInfo.document1 ? URL.createObjectURL(immaInfo.document1):''} alt="document1" />
              </div>
              <div className="upload-btn-wrapper">
                <button className="btn">
                  {" "}
                  <BiUpload /> Importer une photo
                </button>
                <input type="file" name="document1" onChange={onFileChange} accept="image/*"/>
              </div>
            </div>

            <div className="file-wrapper">
              <p>Document 2</p>
              <div className="image" >
                <img  src={immaInfo.document2 !== '' && immaInfo.document2 ? URL.createObjectURL(immaInfo.document2):''} alt='document2' />
              </div>
              <div className="upload-btn-wrapper">
                <button className="btn">
                  {" "}
                  <BiUpload /> Importer une photo
                </button>
                <input type="file" name="document2" onChange={onFileChange} accept="image/*"/>
              </div>
            </div>
          <div></div>
          <div></div>
          </div>
        </div>
        <div className="buttons" style={{ marginTop: "2em"}}>
          <button className="secondary" onClick={handlePrevStep}>
            Precedent
          </button>
          <button type='submit'>Suivant</button>
        </div>
      </form>
    </div>
  );
};

export default StepTwo;
