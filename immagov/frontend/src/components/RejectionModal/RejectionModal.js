import React, { useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { getConnexion } from "../../services/auth.service";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
const RejectionModal = ({ isOpen, setIsOpen,id,type }) => {
  const [motif, setMotif] = useState("Motif 1");
  const [nouveaumotif, setNouveaumotif] = useState('');
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const modalRef = useRef();

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const navigate = useNavigate();
  const submitMotif = (e)=>{
     //e.preventDefault();
     setIsLoading(true);
      var formData = new FormData();
      formData.append('motif',motif);
      formData.append('autremotif',nouveaumotif);
      formData.append("id",id);

        if(type === 'immatriculation'){
          getConnexion().post('/immatriculation/rejet',formData).then((resp) =>{
                if(resp.data.status){
                  setIsOpen(false);  setIsLoading(false);
                  toast.success("Rejet effectué avec succès.");
                  navigate('/liste-immatriculation');
                }else{
                  setErreurs(resp.data.messages);  setIsLoading(false);
                  toast.error("Rejet Non effectué .");
                }
              });
           
        }else if(type === 'reforme'){
          getConnexion().post('/reforme/rejet',formData).then((resp) => {
            if(resp.data.status){
              setIsOpen(false);setIsLoading(false);
              toast.success("Rejet effectué avec succès.");
              navigate('/liste-reforme');
            }else{
              setErreurs(resp.data.messages);setIsLoading(false);
              toast.error("Rejet Non effectué .");
            }
          });
        }else if(type === 'mutation'){
          getConnexion().post('/mutation/rejet',formData).then((resp) => {
          
            if(resp.data.status){
              setIsOpen(false);
              toast.success("Rejet effectué avec succès.");setIsLoading(false);
              navigate('/liste-mutation');
            }else{
              setErreurs(resp.data.messages);
              toast.error("Rejet Non effectué .");setIsLoading(false);
            }
          });
        }
      
  }
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="rejection-modal modal-component" onClick={closeModal} ref={modalRef}>
          {isLoading && <Spinner />}
          <motion.div
            initial={{ opacity: 0, top: "30%" }}
            animate={{ opacity: 1, top: "50%" }}
            transition={{ duration: 0.2 }}
            exit={{ opacity: 0, top: "10%" }}
            className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Motif de rejet</h4>
            <form onSubmit={handleSubmit(submitMotif)}>
            <Erreurs validation = {erreurs} />
              <div>
                <label>
                  Choisissez le motif de rejet
                  <select name="motif" value={motif} 
                 {...register('motif', {
                    onChange: (e) => {
                      setMotif(e.target.value);setNouveaumotif('');
                    },
                    validate: (value) => value != 0 || value == ''
                  },
                  )}
                 
                  >
                    <option value={0}>Choisissez le motif de rejet</option>
                    <option value="Numéro de chassis incorrect.">Numéro de chassis incorrect.</option>
                    <option value="Fond de dossier Incomplet.">Fond de dossier Incomplet.</option>
                    <option value="Image de l'engin flou.">Image de l'engin flou.</option>
                    <option value="">Autre</option>
                  </select>
                  {errors.motif && (
                             <span className="error-msg">Veuillez choisir le motif.</span>
                          )}
                </label>
              </div>
              {motif === "" && (
                <div>
                  <label>
                    Ou saisissez un nouveau motif de rejet
                    <textarea onChange={(e) => setNouveaumotif(e.target.value)}
                      name="nouveaumotif"
                      id="nouveaumotif"
                      cols="30"
                      rows="10"
                      placeholder= {motif === "" ? "Saissisez le motif":''}
                      disabled={motif !== ""}
                      autoFocus={motif !== ""}
                      value={nouveaumotif}
                    />
                  </label>
                </div>
                )
              }
              <div className="buttons">
                <button className="reject-btn">Rejeter</button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default RejectionModal;
