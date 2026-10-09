import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { UpdateModele } from "../../services/vehicule.service";
import toast from "react-hot-toast";
import Spinner from "../Spinner/Spinner";
import Erreurs from "../erreurs/Erreurs";
// import Erreurs from "../../components/erreurs/Erreurs";
// import toast from "react-hot-toast";

const ModifierModeleModal = ({ isOpen, setIsOpen, selectedModele ,setSelectedModele}) => {
  const modalRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const[erreurs,setErreurs] = useState([]);
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      selectedModele,
    }});
   const {id} = useParams(); 
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };

 const handleInput = (e) => {
  setSelectedModele({...selectedModele,[e.target.name]:e.target.value});
 }
 useEffect(() => {
   setSelectedModele({...selectedModele,marque_id:id});
   reset(selectedModele);   
 }, [isOpen]);
 const submitForm = async () => {
  setIsLoading(true);setErreurs([]);
   var formData = new FormData();
   formData.append('marque_id',selectedModele.marque_id);
   formData.append('modele_id',selectedModele.modele_id);
   formData.append('nom',selectedModele.nom);
   const{success,messages} = await UpdateModele(formData);
   if(success){
     toast.success("Modèle modifié avec succès.");
     setIsOpen(false);
   }else{
     toast.error("Erreur dans la modification.");
     setErreurs(messages);
   }
   setIsLoading(false);
 }
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef} >
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }} className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Modifier un modele</h4>
            <form onSubmit={handleSubmit(submitForm)}>
             {isLoading && <Spinner />}
              <label>Nom du modele
                <input type="text" autoFocus name="nom" value={selectedModele.nom} 
                {...register("nom", {
                  onChange: (e) => {
                    handleInput(e);
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

export default ModifierModeleModal;
