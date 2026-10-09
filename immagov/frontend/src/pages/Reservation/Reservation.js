import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";

const Reservation = () => {
    const [reservationInfo,setReservationInfo] = useState({
        initial:'',
        final:''
    });
    const { register, handleSubmit, reset,formState: { errors } } = useForm({defaultValues:{reservationInfo}});
    const handleInput = (e) => {
        const re = /^[0-9\b]+$/;
        if(re.test(e.target.value) || e.target.value === '')
          setReservationInfo({...reservationInfo,[e.target.name]:e.target.value})
    }
const Reserver = ()=>{
   console.log(reservationInfo);
}   
 return(
   <div className="mutation page">
       <Helmet>
         <title>Reservation</title>
      </Helmet>
      <h2>Reservation de Plage</h2>
      <form onSubmit={handleSubmit()}>
         <div className="input-group2">
            <label>Nombre Initial
               <input type="text" name="initial" 
                value={reservationInfo.initial}
                placeholder="Numéro Initial" 
                {...register('initial', {
                    onChange: (e) => {
                         handleInput(e)
                    },
                 required:true,min:0
             
                },
                )}
               />
          
            </label>
            {errors.initial && errors.initial?.type === "required" && (
                 <span className="error-msg">Ce champ est obligatoire.</span>
             )}
            {errors.initial && errors.initial?.type === "minLength" && (
                <span className="error-msg">
                    ce champ ne peut pas être inférieur à 0.
                </span>
             )}
            <label>Nombre Maximum
               <input type="text" name="final"  
                value={reservationInfo.final}
                placeholder="Numéro Max" 
                {...register('final', {
                onChange: (e) => {
                     handleInput(e)
                },
             required:true,min:0,
             validate: (value) => parseInt(value) > parseInt(reservationInfo.initial)
            },
            )}
               />
            {errors.final && errors.final?.type === "required" && (
                    <span className="error-msg">Ce champ est obligatoire.</span>
                )}
             {errors.final && errors.final?.type === "min" && (
                <span className="error-msg">
                    ce champ ne peut pas être inférieur à 0.
                </span>
               )}
            {(errors.final && errors.final?.type !== "required" && errors.final?.type !== "min") && (
                <span className="error-msg">La date Initiale doit être inférieur à la date finale</span>
            )} 
          </label>
         </div>
         <div className="input-group">
             <div><button className="button" type="submit">Valider</button></div>
             <div></div>
             <div></div>
         </div>
      </form>
    </div>);
}
export default Reservation;