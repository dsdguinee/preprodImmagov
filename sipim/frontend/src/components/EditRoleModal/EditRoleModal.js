import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Select from 'react-select'
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";
import { isEmpty } from "../../services/Helpers/fonctions";
// import toast from "react-hot-toast";
// import Erreurs from "../Erreurs/Erreurs";

const EditRoleModal = ({ isOpen, setIsOpen,privilegeOption,selectedRole,setSelectedRole,changePrivilege,setChangePrivilege }) => {
  const modalRef = useRef();
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const api = new Api();
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      selectedRole
    }});
  const[privilegeError,setPrivilegeError] = useState();
  const[erreurs,setErreurs] = useState([]);

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const handleInput = (e) => {
    setErreurs([]);
    if(e.target)
      setSelectedRole({...selectedRole,[e.target.name]:e.target.value});
    else {
      setPrivilegeError('');
      setSelectedRole({...selectedRole,privileges:e});
    }  
 } 
 useEffect(()=> {
    reset(selectedRole);
  
 },[isOpen])
const updateRole = async () => {
  setIsLoading(true);
    setPrivilegeError('');setErreurs([]);
      if(Array.isArray(selectedRole.privileges) && selectedRole.privileges.length == 0){
        setPrivilegeError('Ce Champ est obligatoire.');return;
      }else if(selectedRole.privileges.length < 2){
        setPrivilegeError('selectionner au moin deux privilèges.');return;
      }
      
      var formData = new FormData();
      formData.append('role_id',selectedRole.id);
      formData.append('roleName',selectedRole.role_name);
      formData.append('type',selectedRole.type);
      selectedRole.privileges.forEach(function(currentValue, index, arr){
        formData.append('privileges[]',currentValue.value);
      });
      const{status,messages} = await api.apiData('post','/roles/update',formData);
      if(status !== 200)
        setErreurs(messages);
      else{
        setSelectedRole({});
          toast.success('Rôle modifié avec succès.');setIsOpen(false);
      }
      setChangePrivilege(!changePrivilege);
 setIsLoading(false);     
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
            <h4>Modifier un role</h4>
            {!isEmpty(selectedRole) &&
              <form onSubmit={handleSubmit(updateRole)}>
            
                <label>Role
                
                  <input type="text" value={selectedRole.role_name?selectedRole.role_name:''} placeholder="Role" name="role_name" 
                    autoFocus  
                    {...register("role_name", {
                    onChange: (e) => {
                      handleInput(e);
                      },
                    required: true,
                    minLength: 3,
                    })}
                    /> 
                {errors.role_name && errors.role_name.type === "required" && (
                    <span role="alert" className="error-msg">
                      Champ obligatoire.
                    </span>
                  )}
                  {errors.role_name && errors.role_name.type === "minLength" && (
                    <span role="alert" className="error-msg">
                      Le nombre minimum de caractères est trois (3).
                    </span>
                  )}
                </label>
                <label>Privileges
                  
                  <Select options={privilegeOption}  
                      onChange={(e) => handleInput(e)}
                      isMulti
                      name="priveleges"
                      placeholder= "Choisissez des privilèges pour ce rôle"
                      value={selectedRole.privileges}
                  />
                  {privilegeError && (
                    <span role="alert" className="error-msg">
                      {privilegeError}
                    </span>
                  )}
                </label>
                <label>Type de Compte
                 <select value={selectedRole.type} name="type" id="type"
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
              </form>}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default EditRoleModal;
