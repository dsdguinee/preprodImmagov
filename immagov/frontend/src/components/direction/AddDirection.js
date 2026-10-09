import React,{ useState } from "react";
import toast from "react-hot-toast";
import { createNewMinistereandDirection } from "../../services/organisation.service";
import Erreurs from "../erreurs/Erreurs";
const AddDirection = ({ministere,setIsautreministerecreated}) => {

    const [formValues, setFormValues] = useState([{}]);
    const [erreurs,setErreurs] = useState([]);
    
    //console.log(ministere);
    let handleChange = (i, e) => {
        let newFormValues = [...formValues];
        newFormValues[i][e.target.name] = e.target.value;
       
          setErreurs([]);

        setFormValues(newFormValues);
    }
     
    
    let addFormFields = () => {
        setFormValues([...formValues, { direction: ""}])
      }
    
    let removeFormFields = (i) => {
        let newFormValues = [...formValues];
        newFormValues.splice(i, 1);
        setFormValues(newFormValues)
    }
    
    let handleSubmit = async (event) => {
        event.preventDefault();
        //setIsvalided(true);
        var directions = [];
        Object.keys(formValues).map((key) => {
              directions.push(formValues[key].direction);
         });
       // console.log(result);
        var formData = new FormData();
        formData.append('ministere',ministere);
        formData.append('directions',directions);
         const{success,messages} = await createNewMinistereandDirection(formData);
          if(!success)
            setErreurs(messages)
          else{
              toast.success('Ministère ajouté avec succès');
              setIsautreministerecreated(true);
          }
         //console.log(success);
    }

    return (
        <form  onSubmit={handleSubmit}>
           <label>Direction</label>
          {formValues.map((element, index) => (
            <div className="form-inline" key={index}>
              <input type="text" name="direction" value={element.direction || ""} onChange={e => handleChange(index, e)}/>
            
              {
                index ? 
                  <button type="button"  className="button remove" style={{marginTop:'12px'}} onClick={() => removeFormFields(index)}>-</button> 
                : null
              }
            </div>
          ))}
          <div style={{margin:'12px'}}>
             <Erreurs validation = {erreurs} />
          </div>
          <div className="button-section" style={{marginTop:'12px'}}>
              <button className="button add" type="button" onClick={() => addFormFields()} style={{marginRight:'12px'}}>+</button>
              <button className="button submit" type="submit">Valider</button>
          </div>
       
      </form>
    )

}
export default AddDirection;