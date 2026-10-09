import React, { useRef, useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import Erreurs from "../erreurs/Erreurs";
import { change_password, logout } from "../../services/auth.service";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Spinner from "../Spinner/Spinner";

const ChangerMdpModal = ({ isOpen, setIsOpen,user_id }) => {
  const modalRef = useRef();
  const navigate = useNavigate();
  const [user,setUser] = useState({
    user_id : user_id,
    password:'',
    confirm_password:'',
  });
  const [isLoading,setIsLoading] = useState(false);
  const [erreurs,setErreurs] = useState([]);
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
       defaultValues:{
        user
       }
  });
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const handleInput = (e) => {
      setErreurs([]);
      setUser({...user,
         [e.target.name]:e.target.value,
      })
  }
  const deconnect = () => {
    logout(); navigate('/');
     
  }
  const submitForm = async () =>{
     var formData = new FormData();
     setErreurs([]);
     formData.append('user_id',user_id);
     formData.append('password',user.password);
     formData.append('confirm_password',user.confirm_password);
     const {success,status,messages} = await change_password(formData);
     setIsLoading(true);
     if(status === 200 || success){
        setIsLoading(false);setIsOpen(false);localStorage.removeItem('token');
        toast.success("Veuillez-Vous Connecter avec votre nouveau mot de passe.");
        navigate('/'); 

     }else{
      setIsLoading(false);setErreurs(messages);
     }
  }
  useEffect(() => {
    reset(user);
  }, [])
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component"  ref={modalRef}>
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }}
            className="modal modal-small">
            {/* <div className="close" onClick={() => setIsOpen(false)}> */}
            <div className="close">  
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Changez votre mot de passe</h4>
            {isLoading && <Spinner />}
            <form  onSubmit={handleSubmit(submitForm)}>
              <label>Nouveau mot de passe
                <input type="password" name="password"
                value={user.password}
                 placeholder="Nouveau mot de passe" 
                {...register("password", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,minLength:5
                })}
                />
                {errors.password && errors.password.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
                {errors.password && errors.password.type === "minLength" && (
                  <span role="alert" className="error-msg">
                     Le Caractère Minimum pour le mot de passe est cinq (5).
                  </span>
                )}
              </label>
              <label>Confirmer mot de passe
                <input type="password" name="confirm_password"
                value={user.confirm_password}
                 placeholder="Confirmez votre mot de passe" 
                 {...register("confirm_password", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                   validate: (value) => value == user.password 
                  })}
                 />
               {errors.confirm_password && (
                <span role="alert" className="error-msg">
                   Les Deux mot de passe doivent être identiques.
                </span>
              )}
              </label>
               <div className="input-group" style={{display:'flex',flexDirection:'row'}}>
                    <label>
                        <Erreurs validation = {erreurs} />
                        { isLoading ?
                          <button disabled={true}>...Patientez</button>
                          :<button type="submit">Enregistrer</button>
                        }
                    </label>
                    <label style={{marginLeft:'5px'}}>
                        <button type="button" className="danger" onClick={deconnect}>Deconnecter</button>
                    </label>
                </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default ChangerMdpModal;
