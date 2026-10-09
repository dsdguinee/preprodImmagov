import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Select from 'react-select'
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Erreurs from "../erreurs/Erreurs";
import Spinner from "../Spinner/Spinner";
import { UpdateRole } from "../../services/auth.service";
// import toast from "react-hot-toast";
// import Erreurs from "../erreurs/Erreurs";

const ModifierRoleModal = ({ isOpen, setIsOpen, selectedPrivileges,setSelectedPrivileges,privilegeOption,selectedRole,setSelectedRole }) => {
  const modalRef = useRef();
  const [direction,setDirection] = useState('');
  const [isLoading,setIsLoading] = useState(false);
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      role_id:'',
      status:false,
      role_name:'',
    
    }});
  const[privilegeError,setPrivilegeError] = useState();
  const[erreurs,setErreurs] = useState([]);
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  
  const handleInput = (e) => {
      if(e.target)
        setSelectedRole({...selectedRole,[e.target.name]:e.target.value});
      else
      setSelectedPrivileges({...selectedPrivileges,privileges:e})
  }
  useEffect(() => {
     reset(selectedRole);
  }, [isOpen]);

  const submitForm = async () => {
    setIsLoading(true);
    setPrivilegeError('');setErreurs([]);
    if(Array.isArray(selectedPrivileges.privileges) && selectedPrivileges.privileges.length == 0){
      setPrivilegeError('Ce Champ est obligatoire.');return;
    }
    var formData = new FormData();
    formData.append('role_id',selectedRole.role_id);
    formData.append('roleName',selectedRole.role_name);
    formData.append('status',selectedRole.status);
    selectedPrivileges.privileges.forEach(function(currentValue, index, arr){
      formData.append('privileges[]',currentValue.value);
    });
    const{success,status,messages} = await UpdateRole(formData);
    if(status === 200 || success ){
      toast.success("Modification Effectuée avec succès.");setIsOpen(false);
    }else{
       toast.error("Erreur dans la Modification");setErreurs(messages);
    }
    setIsLoading(false);
  }
 // console.log(selectedRole)
  //console.log(`privileges ${selectedPrivileges.privileges},role ${selectedRole}`);
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
            <form  onSubmit={handleSubmit(submitForm)}>
             {isLoading && <Spinner />}
              <label>Role
                <input type="text" value={selectedRole.role_name} placeholder="Role" name="role_name" 
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
              
              <label className="checkbox-label">Voir toutes les immatriculations, mutations et reformes
                     <input type='checkbox' name="status" className="checkbox-input" defaultChecked={selectedRole.status}
                        onChange={() => setSelectedRole({...selectedRole,status:!selectedRole.status})}/>
              </label>
              <label>Privileges
                <Select options={privilegeOption}  
                    onChange={(e) => handleInput(e)}
                    isMulti
                    name="colors"
                    placeholder= "Choisissez des privilèges pour ce rôle"
                    defaultValue={selectedPrivileges?.privileges}
                />
                {privilegeError && (
                  <span role="alert" className="error-msg">
                     Selectionnez les privilèges.
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

export default ModifierRoleModal;
