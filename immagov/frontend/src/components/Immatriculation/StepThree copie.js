import {useMemo,useEffect,useState} from 'react';
import {getAllMinistere, getAllProprietaire, getOrganisationByLevel, getServicesByMinistere} from '../../services/ministere.service';
import { useForm } from "react-hook-form";
import { getProprietaire } from '../../services/vehicule.service';
import { getConnexion } from '../../services/auth.service';
//import {getCarInformation} from '../../services/vehicule.service';
const StepThree = ({ handleNextStep, handlePrevStep,immatriculation,setImmatriculation,stepChk,setStepChk }) => {
  const handleInput = (e) => {
    setImmatriculation({...immatriculation,[e.target.name]:e.target.value})
  }
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const[ministeres,setMinisteres] = useState([]);
  const [proprietaires, setProprietaires] = useState({})
  const [level2, setLevel2] = useState([])
  const [directions,setDirections] = useState([]);
  const isstepValid = useMemo(() => {
     return immatriculation.ministere != 0 ;
  },[immatriculation]);

  useEffect(()=>{
    setStepChk({...stepChk,step4:isstepValid});
    // getAllMinistere().then(res => {setMinisteres(res.data._embedded.organisationTypes);});
    // getServicesByMinistere("LEVEL_1").then(resp => console.log("@@@@ ", resp))
    
   
     getAllProprietaire().then(res =>{
       console.log("######### => ", res)
       const proprietaires = res.data._embedded.proprietaires
       const l1 = []
       const l2 = []

       proprietaires.forEach(p =>{
         if(p.organisationType!=null){
          //  if(p.organisationType.level =="LEVEL_1"){
             setProprietaires({
               
               [p.organisationType.name] :[...proprietaires, ],
             })
           }
            l1.push(p)
            console.log("ORG ID ", p.organisationType.organisationId)
            getConnexion().get(`/organisationTypes/${p.organisationType.organisationId}/children`).then(res =>{
              console.log("*************", res.data._embedded.organisationTypes)
            })  

         }
         
       
       })
       
     })
      

    getOrganisationByLevel("LEVEL_1").then(res => {
      console.log("+++++++++++++++= ", res)
      setProprietaires(res)

      


    });
    getOrganisationByLevel("LEVEL_2").then(res => {
      console.log("+++++++++++++++= ", res)
    
    });  
    //getCarInformation('JN1FCAN15U0004510');
   
    // if (immatriculation.ministere !== 0 &&  immatriculation.ministere !=='autre' ) 
      //  getServicesByMinistere(immatriculation.ministere).then((resp) =>{ setDirections(resp.data._embedded.organisationTypes)});
},[isstepValid, immatriculation.ministere]);

//console.log(newministere.direction);
//console.log(ministeres);
//console.log(errors);
console.log("$$$$$$$$$$$ PROPRIETAIRES",proprietaires)
  return (
    <div className="step-one">
      <form onSubmit={handleSubmit(handleNextStep)}>
     
        <div className="input-group">
        <label>
          A quel ministère voulez-vous affecter ce véhicule ?
          <select id="ministere" name="level1"
            value={immatriculation.ministere} 
            {...register('ministere', {
              onChange: (e) => {
                  handleInput(e)

                  // setSelectedMinistere(e.target)
              },
               validate: (value) => value != 0 },
             )}
            >
            <option value={0}>Selectionner le Ministère</option>
            {
              // ministeres.length > 0 && ministeres.map((ministere,index) => {
              //   return (<option key={ministere.organisationId} value={ministere.organisationId}>{ministere.name}</option>);
              // }) 

              proprietaires.length > 0 && proprietaires.map((proprietaire,index) => {
                return (<option key={index} value={proprietaire.proprietaireId}>{proprietaire.organisationType.name}</option>);
              }) 

            }
           <option value="autre">Autre</option>
          </select>
          {errors.ministere && (
                 <span className="error-msg"> Selectionnez le ministères!</span>
              )} 
        </label>
       
        <label>
             Direction ou Service
             {/*  <input type="text" 
                  defaultValue={immatriculation.direction} 
                  name="direction"  
                  placeholder="Nom de la direction"
                  {...register('direction', {
                  onChange: (e) => {
                      handleInput(e)
                  },
                  required:true},
                  )}
                />  */}
                  <select id="direction" name="level2"
                     value={immatriculation.direction}
                     {...register('direction', {
                       onChange: (e) => {
                           handleInput(e)

                       },
                        validate: (value) => value !== 0 },
                      )}
                     >
                    <option value={0}>Selectionner la Direction ou Service</option> 
                    {
                      directions.length > 0 && directions.map((direction) => {return (<option key={direction.organisationId} value={direction.organisationId}>{direction.name}</option>)})
                    }  
                 </select> 
                 <input type="hidden" name="proprietaire"/>
              {errors.direction && errors.direction?.type == "required" && (
                  <span className="error-msg">Veuillez Indiquer le nom de la direction du Departement.</span>
              )}    
          </label>
         
        </div>
        {immatriculation.ministere === 'autre' &&  
            <div className="input-group">
              <label> 
                    Observation
                      <input type="text"  
                        name="observation" 
                        placeholder="observation"
                        {...register('observation', {
                          onChange: (e) => {
                              handleInput(e)
                          },
                           required:true },
                         )}
                        />  
                  {errors.observation && errors.observation?.type == "required" && (
                     <span className="error-msg">Veuillez renseigner ce champ .</span>
                  )}      
                </label>
            </div>
           }        
        <div className="buttons">
          <button className="secondary" onClick={handlePrevStep}>Precedent</button>
          <button type='submit'>Suivant</button>
        </div>
      </form>
    </div>
  );
};

export default StepThree;
