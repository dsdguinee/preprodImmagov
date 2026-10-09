import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Erreurs from "../erreurs/Erreurs";
import { createNewMinistere } from "../../services/organisation.service";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { getborne, ReserverInterval, ReserverUpdate } from "../../services/immatriculation.service";
import { objecttoFormData } from "../../utils/helper/functions";

const UpdateReservation = ({ isOpen, setIsOpen ,selectedData,setIsLoading,setIsUpdate,isUpdate}) => {
  const modalRef = useRef();
  const [erreurs,setErreurs] = useState([]);
  
  const [reservationInfo1,setReservationInfo1] = useState({
     reservation_id:selectedData?.id,
     nom:selectedData?.nomReservation,
  });

  const { register, handleSubmit, reset,formState: { errors } } = useForm({defaultValues:{reservationInfo1}});
  const handleInput = (e) => { 
      setReservationInfo1({...reservationInfo1,[e.target.name]:e.target.value});
  }
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
 
  useEffect(() => {
    setErreurs([]);
    setReservationInfo1({...setReservationInfo1,
      reservation_id:selectedData?.id,
      nom:selectedData?.nomReservation,})
    reset(reservationInfo1);
  
  },[selectedData]);
  // const handleSubmit = async (e) => {
  //   e.preventDefault();setErreurs([]);
  //   //console.log(ministere)
  //   var formData = new FormData();
  //   formData.append('nom',ministere.nom);
  //   formData.append('typeOrganisme',ministere.typeOrganisme)
  //   const {success,messages} =  await createNewMinistere(formData);
  //   if(success)
  //     {setIsOpen(false);toast.success("Ajout Effectué avec succès");}
  //    else setErreurs(messages);
  // }
  const Reserver = async ()=>{
    setIsLoading(true); setErreurs([]);
     var data = objecttoFormData(reservationInfo1);
    const{status,messages} = await ReserverUpdate(data);
    setIsLoading(false);
    if(status === 200){
      toast.success("Reservation mise à jour avec succès.");
      setIsOpen(false);setIsUpdate(!isUpdate)
    }else setErreurs(messages);
 }   
 
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef}>
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }}
            className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Mettre à jour</h4>
            <form onSubmit={handleSubmit(Reserver)}>

              <div className="input-group">
                <label>Nom Reservation
                  <input type="text" name="nom"  placeholder="Nom de la reservation" 
                  value={reservationInfo1?.nom?reservationInfo1?.nom:''}
                  {...register('nom', {
                    onChange: (e) => {
                         handleInput(e)
                    },
                    required:true,min:0
                  },
                )}
                  />
              {errors.nom && errors.nom?.type === "required" && (
                 <span className="error-msg">Ce champ est obligatoire.</span>
               )}
                </label>
           
              </div>
             
              <Erreurs validation = {erreurs} />
              <div className="input-group">
                 <div>
                    <button type="submit" className="success">Enregistrer</button>
                 </div>
                 <div></div>
                 <div></div>
              </div>
              
            </form>
          </motion.div>
      
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default UpdateReservation;
