import React, { useRef,useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { updateDirection } from "../../services/organisation.service";
import Erreurs from "../../components/erreurs/Erreurs";
import toast from "react-hot-toast";
import { getAllDirectionByID } from "../../services/organisation.service";
const ModifierDirectionModal = ({ isOpen, setIsOpen, setDirections,selectedDirection,setSelectedDirection,selecteDirectionID,selectedMinistereID }) => {
  const modalRef = useRef();
  const [erreurs,setErreurs] = useState([]);
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    var formdata = new FormData();
    setErreurs([]);
    formdata.append('ministere_id',selectedMinistereID);
    formdata.append('direction_id',selecteDirectionID);
    formdata.append('nom',selectedDirection);
    const {success,messages} = await updateDirection(formdata);
    //console.log(success);
    if(!success){
      setErreurs(messages);
    }else{
      toast.success("Modification de la direction effectuée avec succès");
      setIsOpen(false);
      getAllDirectionByID(selectedMinistereID).then((resp) => {
        let ord = 0;
        if(resp.status !== 404 ){
          setDirections(resp.directions.map((data) => {
            ord = ord + 1;
            return{
              'ord':ord,
              'directionID':data.direction_id,
              'ministere_id':data.ministere_id,
              'nom':data.nom
            }
          }));
        }
      });
    }
  }
  //console.log(selectedDirection);
  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="modal-component"
          onClick={closeModal}
          ref={modalRef}
        >
          <motion.div
            initial={{ opacity: 0, top: "30%" }}
            animate={{ opacity: 1, top: "50%" }}
            transition={{ duration: 0.2 }}
            exit={{ opacity: 0, top: "10%" }}
            className="modal"
          >
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Modifier une direction</h4>
            <form onSubmit={handleSubmit}>
              <label>Nom de la direction
                <input type="text" onChange={(e) =>{setSelectedDirection(e.target.value);setErreurs([]);}} autoFocus value={selectedDirection}/>
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

export default ModifierDirectionModal;
