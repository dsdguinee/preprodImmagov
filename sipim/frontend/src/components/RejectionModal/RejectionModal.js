import React, { useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Erreurs from "../Erreurs/Erreurs";
import Api from "../../services/Api";
const RejectionModal = ({ isOpen, setIsOpen,id }) => {

  const [motif, setMotif] = useState("Motif 1");
  const [nouveaumotif, setNouveaumotif] = useState('');
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const modalRef = useRef();

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const navigate = useNavigate();
  const api = new Api();
  const submitMotif = async (e)=>{
     //e.preventDefault();
     setIsLoading(true);
      var formData = new FormData();
      let motf = '';
      if(motif === "")
         motf = nouveaumotif;
      else
         motf = motif;  
      formData.append('motifs',motf);
      formData.append("id",id);
     const {status,messages} = await api.apiData('post','/paiement/annuler',formData);
     setIsLoading(false);
     if(status === 200){
         toast.success("Annulation effectuée avec succès.");setIsOpen(false);navigate('/payment/list');
     }else setErreurs(messages); 
       
  
      // setIsLoading(false);
      // if(status === 200)
      //   navigate('/payment/list');
      // else
      //   setErreurs(messages)     
      
  }
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="rejection-modal modal-component" onClick={closeModal} ref={modalRef}>
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
                    <option value={0}>Choisissez le motif de l'annulation</option>
                    <option value="Erreur sur le type de client.">Erreur sur le type de client</option>
                    <option value="Erreur sur le mode d'immatriculation.">Erreur sur le mode d'immatriculation</option>
                    <option value="Erreur sur le type de carte de grise et le type de vignette.">Erreur sur le type de carte de grise et le type de vignette</option>
                    <option value="Le type de paiement n'est pas correct.">Le type de paiement n'est pas correct</option>
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
                    Ou saisissez un nouveau motif de l'annulation
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