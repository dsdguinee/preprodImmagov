import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Erreurs from "../erreurs/Erreurs";
import { useForm } from "react-hook-form";
import { AddMarque } from "../../services/vehicule.service";
import Spinner from "../Spinner/Spinner";
import toast from "react-hot-toast";
// import toast from "react-hot-toast";

const AjouterMarqueModal = ({ isOpen, setIsOpen }) => {
  const modalRef = useRef();
  
  const [marque,setMarque] = useState('');
  const [erreurs,setErreurs] =useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const { register, handleSubmit, formState: { errors } } = useForm();
  const submitForm = async () => {
    setIsLoading(true);
      var formData = new FormData();setErreurs([]);
      formData.append('nom',marque);
      const {success,messages} = await AddMarque(formData);
      if(success){
        setIsOpen(false);toast.success("Ajout de Marque de Vehicule effectué avec succès.");
      }else{
        setErreurs(messages);toast.error("Ajout de Marque de Vehicule non effecté."); 
      }
   setIsLoading(false)   
    
  }
  const handleChange = (e) => {
    setMarque(e.target.value);
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
            <h4>Ajouter une nouvelle marque</h4>

            <form onSubmit={handleSubmit(submitForm)}>
            {isLoading && <Spinner />}
              <label>Nom de la marque
                <input type="text" name="nom" value={marque}
                 placeholder="Nom de la marque" autoFocus
                 {...register("nom", {
                  onChange: (e) => {
                    handleChange(e);
                  },
                  required: true,
                  minLength: 3,
                })}
                />
                 {errors.nom && errors.nom.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
                {errors.nom && errors.nom.type === "minLength" && (
                  <span role="alert" className="error-msg">
                    Le nombre minimum de caractères est trois (3).
                  </span>
                )}
              </label>
              <Erreurs validation = {erreurs} /> 
              <button type="submit">Enregistrer</button>
            </form>
          </motion.div>
      
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default AjouterMarqueModal;
