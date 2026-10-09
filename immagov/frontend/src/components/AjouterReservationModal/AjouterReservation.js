import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Erreurs from "../erreurs/Erreurs";
import { createNewMinistere } from "../../services/organisation.service";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { getborne, ReserverInterval } from "../../services/immatriculation.service";
import { objecttoFormData } from "../../utils/helper/functions";

const AjouterReservation = ({ isOpen, setIsOpen ,utilisateurs,setIsLoading,setIsUpdate,isUpdate}) => {
  const modalRef = useRef();
  const [erreurs,setErreurs] = useState([]);
  
  const [reservationInfo,setReservationInfo] = useState({
     nom:'',
     initial: 0,
     final:'',
     modeImmatriculation:'',
     utilisateur:''
  });
  const { register, handleSubmit, reset,formState: { errors } } = useForm({defaultValues:{reservationInfo}});
  const handleInput = (e) => {
    if(e.target.name === 'initial' || e.target.name === 'final'){
      const re = /^[0-9\b]+$/;
      if(re.test(e.target.value) || e.target.value === '')
        setReservationInfo({...reservationInfo,[e.target.name]:e.target.value});
    }
    if(e.target.name === 'modeImmatriculation'){
       getbornes(e.target.value);
     
    }
    else 
      setReservationInfo({...reservationInfo,[e.target.name]:e.target.value});
  }
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const getbornes = async (modeImm) => {
    setIsLoading(true);
      const {status,borne} = await getborne(modeImm);
    setIsLoading(false);
    if(status === 200){
       setReservationInfo({...reservationInfo,initial:borne,modeImmatriculation:modeImm});
      }
  }
  useEffect(() => {
    setErreurs([]);
    reset(reservationInfo)
  },[]);

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
    setIsLoading(true);setErreurs([]);
     var data = objecttoFormData(reservationInfo);
    
    const{status,messages} = await ReserverInterval(data);
    setIsLoading(false);
    if(status === 200){
      toast.success("Reservation de plage effectuée avec succès.");
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
            <h4>Ajouter une Reservation</h4>
            <form onSubmit={handleSubmit(Reserver)}>

            <div className="input-group">
                <label>Mode d'imatriculation
                 <select name="modeImmatriculation" onChange={handleInput} value={reservationInfo.typeOrganisme}
                 {...register('modeImmatriculation', {
                  onChange: (e) => {
                      handleInput(e)
                  },
                  validate: (value) => value !== ''
                  },
                  )}
                 >
                     <option value="">Selectionnez le mode d'immatriculation</option>
                     <option value="VA">VA</option>
                     <option value="EP">EP</option>
                 </select>
                {(errors.modeImmatriculation) && (
                  <span className="error-msg">Veuillez selectionner le mode d'immatriculation</span>
                )} 
               </label>
               <label>Utilisateur Conserné
                  <select name="utilisateur" placeholder="Utilisateur Concerné"
                    {...register('utilisateur', {
                      onChange: (e) => {
                          handleInput(e)
                      },
                      validate: (value) => value !== ''
                      },
                      )}
                    >
                     <option value="">Selectionnez l'utilisateur</option>
                     {utilisateurs?.length > 0 && utilisateurs.map((user) => (<option value={user.user_id} key={user.user_id}>
                       {user.prenom} {user.nom}
                     </option>))}
                  </select>
                  {(errors.utilisateur) && (
                    <span className="error-msg">Veuillez choisir l'utilisateur</span>
                  )} 
               </label>
              </div>

              <div className="input-group">
                <label>Nom Reservation
                  <input type="text" name="nom"  placeholder="Nom de la reservation" 
                  value={reservationInfo.nom}
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
                <label>Initial
                <input type="text" name="initial" 
                value={reservationInfo?.initial}
                readOnly
                placeholder="Numéro Initial" 
                {...register('initial', {
                    onChange: (e) => {
                         handleInput(e)
                    },
                 required:true,min:0
             
                },
                )}
               />
             {errors.initial && errors.initial?.type === "required" && (
                 <span className="error-msg">Ce champ est obligatoire.</span>
               )}
                {errors.initial && errors.initial?.type === "minLength" && (
                    <span className="error-msg">
                        ce champ ne peut pas être inférieur à 0.
                   </span>
                )}
            </label>
             
                <label>Final
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

export default AjouterReservation;
