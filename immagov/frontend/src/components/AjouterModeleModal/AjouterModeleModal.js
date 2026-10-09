import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import Erreurs from "../erreurs/Erreurs";
import { useParams } from "react-router-dom";
import { AddModele } from "../../services/vehicule.service";
const AjouterModeleModal = ({ isOpen, setIsOpen,newModele,setNewModele }) => {
  const modalRef = useRef();
  const[erreurs,setErreurs] = useState([]);
  const{id} = useParams();
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      newModele,
    }});
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  useEffect(() => {
    setNewModele({...newModele,
      marque_id:id,
      nom:'',
    })
  }, [id]);
  const handleChange = (e) => {
    setNewModele({...newModele,[e.target.name]:e.target.value});
  }
  const submitForm = async (e) =>{
    var formData = new FormData();
    setErreurs([]);
    formData.append('marque_id',newModele.marque_id);
    formData.append('nom',newModele.nom);
    const{success,messages} = await AddModele(formData);
    if(success){
       toast.success("Ajout de modèle effectué avec succès");setIsOpen(false);
    }else{
      toast.error("Erreur dans l'ajout du nouveau modèle.");setErreurs(messages);
    }
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
            <h4>Ajouter un nouveau modele</h4>
            <form onSubmit={handleSubmit(submitForm)}>
              <label>Nom du modele
                <input type="text" name="nom" placeholder="Nom du modele"  value={newModele.nom}
                 autoFocus
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
               <Erreurs validation = {erreurs} />
              </label>
              <button type="submit">Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default AjouterModeleModal;
