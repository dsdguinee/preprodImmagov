import React, { useRef,useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { addNewDirection,getAllDirectionByID } from "../../services/organisation.service";
import Erreurs from "../erreurs/Erreurs";

const AjouterDirectionModal = ({ isOpen, setIsOpen,setDirections,ministere_id }) => {
  const modalRef = useRef();
  const [direction,setDirection] = useState('')  ;
  const[erreurs,setErreurs] = useState([]);
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  function allDirectionByMinistereID(ministere_id){
    getAllDirectionByID(ministere_id).then((resp) => {
      let ord = 0;
      console.log(resp.directions)
      if(resp.status !== 404 ){
       const allDir = resp.directions.map((data) => {
        ord = ord + 1;
        return{
          id:data.direction_id,
          ord:ord,
          directionID:data.direction_id,
          ministere_id:data.ministere_id,
          nom:data.nom
        }
      })
    //  console.log(allDir)
        setDirections(allDir);
      }
    })
  }
  const handleSubmit = async (e) =>{
    e.preventDefault();setErreurs([]);
    var formData = new FormData();
    formData.append('ministere_id',ministere_id);
    formData.append('nom',direction);
    const {success,messages} = await addNewDirection(formData);
    if(success){
      toast.success("Ajout effectué avec succès"); allDirectionByMinistereID(ministere_id);setIsOpen(false);
    }else{
          setErreurs(messages);
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
            <h4>Ajouter une nouvelle direction</h4>
            <form onSubmit={handleSubmit}>
              <label>Nom de la direction
                <input type="text" value={direction} placeholder="Nom de la direction" autoFocus onChange={(e) => {setDirection(e.target.value);setErreurs([]);}}/>
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

export default AjouterDirectionModal;
