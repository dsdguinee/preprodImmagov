import React, { useEffect, useRef,useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence} from "framer-motion";
import Select from 'react-select';
import Erreurs from "../Erreurs/Erreurs";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Api from "../../services/Api";
import { initialized, objecttoFormData } from "../../services/Helpers/fonctions";

const NewRoleModal = ({ isOpen, setIsOpen,privilegeOption }) => {
  const modalRef = useRef();
  const[privilegeError,setPrivilegeError] = useState();
  const [erreurs,setErreurs] = useState([]);
  const api  = new Api();
  const [role,setRole] = useState({
    roleName:'',
    privileges:[],
    type:0,
  });
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      role
    }});

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };


 const handleInput = (e) => {
    if(e.target)
      setRole({...role,[e.target.name]:e.target.value});
    else {
      setPrivilegeError('');
      setRole({...role,privileges:e});
    }  
 } 

const Createrole =  async () => {
  setPrivilegeError('');setErreurs([]);
  if(Array.isArray(role.privileges) && role.privileges.length == 0){
    setPrivilegeError('Ce Champ est obligatoire.');return;
  }else if(role.privileges.length < 2){
     setPrivilegeError('selectionner au moin deux privilèges.');return;
  }
  
  var formData = new FormData();
  formData.append('roleName',role.roleName);
  formData.append('type',role.type);
  role.privileges.forEach(function(currentValue, index, arr){
    formData.append('privileges[]',currentValue.value);
  });
  const{status,messages} = await api.apiData('post','roles/add',formData);
  
  if(status != 200)
    setErreurs(messages);
  else {
      setRole({...role, 
      roleName:'',
      privileges:[],});
      toast.success('Rôle créé avec succès.');setIsOpen(false);
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
            <h4>Ajouter un nouveau role</h4>
            <form onSubmit={handleSubmit(Createrole)}>
              <label>Role
                <input type="text" value={role.roleName} name='roleName' placeholder="Role" autoFocus
                  autoComplete='false'
                  {...register('roleName', {
                    onChange: (e) => {
                        handleInput(e)
                    },
                    required:true,minLength:3},
                  )}
                />
                {errors.roleName && errors.roleName.type === "required" && (
                    <span role="alert" className="error-msg">
                      Champ obligatoire.
                    </span>
                  )}
                  {errors.roleName && errors.roleName.type === "minLength" && (
                    <span role="alert" className="error-msg">
                      Le nombre minimum de caractères est trois (3).
                    </span>
                  )}
              </label>
              <label>Privileges
                <Select options={privilegeOption}  value={role.privileges} 
                    isMulti
                    name="privileges"
                    className="privileges basic-multi-select"
                    placeholder= "Choisissez des privilèges pour ce rôle"
                    onChange={(e) => handleInput(e)}
                />
                {privilegeError && (
                  <span role="alert" className="error-msg">
                    {privilegeError}
                  </span>
                )}
              </label>
              <label>Type de Compte
                 <select value={role.type} name="type" id="type"
                  {...register('type', {
                    onChange: (e) => {
                      handleInput(e)
                    },
                    validate: (value) => value !=  0 
                    })
                  }
                 >
                 <option value={0}>Selection le type de compte</option>
                 <option value={3}>Admin</option>
                 <option value={2}>Contrôleur</option>
                 <option value={1}>Ordinaire</option>
                 </select>
                 {errors.type && (
                      <span className="error-msg">Selectionner le type de compte.</span>
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

export default NewRoleModal;
