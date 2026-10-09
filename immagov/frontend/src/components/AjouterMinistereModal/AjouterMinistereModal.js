import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Erreurs from "../erreurs/Erreurs";
import { createNewMinistere } from "../../services/organisation.service";
import toast from "react-hot-toast";

const AjouterMinistereModal = ({ isOpen, setIsOpen }) => {
  const modalRef = useRef();
  const [erreurs,setErreurs] = useState([]);
  const [ministere,setMinistere] = useState({
    nom:'',
    typeOrganisme:''
  });
  const handleInput = (e) => {
      setMinistere({...ministere,[e.target.name]:e.target.value});
  }
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    setErreurs([]);
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();setErreurs([]);
    //console.log(ministere)
    var formData = new FormData();
    formData.append('nom',ministere.nom);
    formData.append('typeOrganisme',ministere.typeOrganisme)
    const {success,messages} =  await createNewMinistere(formData);
    if(success)
      {setIsOpen(false);toast.success("Ajout Effectué avec succès");}
     else setErreurs(messages);
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
            <h4>Ajouter un nouveau ministères/organismes</h4>
            <form onSubmit={handleSubmit}>
              <label>Nom
                <input type="text" name="nom" onChange={handleInput} placeholder="Nom du ministères/organismes" 
                 value={ministere.nom}
                autoFocus/>
              </label>
              <label>Type d'organisme
                 <select name="typeOrganisme" onChange={handleInput} value={ministere.typeOrganisme}>
                     <option value="">Selectionnez le type d'organisme</option>
                     <option value="Publique">Publique</option>
                     <option value="Privé">Privé</option>
                 </select>
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

export default AjouterMinistereModal;
