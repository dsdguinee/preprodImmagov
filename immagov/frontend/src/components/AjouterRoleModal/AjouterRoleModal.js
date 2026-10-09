import React, { useRef,useState,useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Select from 'react-select'
import { fakePrivileges } from "../../utils/data/fakeData";
import { getRoles } from "@testing-library/react";
import { getAllPrivileges, newRole } from "../../services/auth.service";
import Spinner from "../Spinner/Spinner";
import Erreurs from "../erreurs/Erreurs";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
// import toast from "react-hot-toast";
// import Erreurs from "../erreurs/Erreurs";

const AjouterRoleModal = ({ isOpen, setIsOpen }) => {
  const modalRef = useRef();
  const [role,setRole] = useState({
    roleName:'',
    status: false,
    privileges:[],
  });
  const [privilegeOption,setPrivilegeOption] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const[privilegeError,setPrivilegeError] = useState();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [erreurs,setErreurs] = useState([]);
//   const[erreurs,setErreurs] = useState([]);

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  async function fngetAllPrivileges(){
    const{success,status,privileges} = await getAllPrivileges();
    if(status === 200)
    setPrivilegeOption(privileges.map((privilege) => {
       return {
         value:privilege.privilege_id,
         label:privilege.nom
       }
     }));
  }
  useEffect(() => {
    setIsLoading(true);
    fngetAllPrivileges()
    setIsLoading(false);
  }, [])
 const handleChange = (e) => {

  if(e.target)
     setRole({...role,[e.target.name]:e.target.value});
   else {
       setPrivilegeError('');
       setRole({...role,privileges:e})
   }  
 }
 const submitPermission = async () => {
    setPrivilegeError('');
    if(Array.isArray(role.privileges) && role.privileges.length == 0){
      setPrivilegeError('Ce Champ est obligatoire.');return;
    }
    var formData = new FormData();
    formData.append('roleName',role.roleName);
    role.privileges.forEach(function(currentValue, index, arr){
      formData.append('privileges[]',currentValue.value);
    });
    formData.append('status',role.status);
    setIsLoading(true);
    const{success,status,messages} = await newRole(formData);
    setErreurs([]);
    if(status === 200 || success){  
      setIsLoading(false);setIsOpen(false);
      setRole({...role, 
          roleName:'',
          privileges:[],
          status:false,
        });toast.success("Rôle ajouté avec succès.");
    }else{
      setIsLoading(false);
      setErreurs(messages);
    } 
 }
 //console.log(role)
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
            {isLoading && <Spinner />} 
            <form onSubmit={handleSubmit(submitPermission)}>
              <label>Role
                <input type="text" value={role.roleName} name='roleName' placeholder="Role" autoFocus
                  autoComplete='false'
                  {...register("roleName", {
                    onChange: (e) => {
                      handleChange(e);
                    },
                    required: true,
                    minLength: 3,
                })}
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
              <div className="input-group">
                 <div>
                  <label className="checkbox-label">Voir toutes les immatriculations, mutations et reformes
                     <input type='checkbox' name="status" className="checkbox-input" defaultChecked={role.status}
                        onChange={() => setRole({...role,status:!role.status})}/>
                  </label>
                 </div>
                 <div></div>
                 <div></div>
              </div>
               
              <label>Privileges
                <Select options={privilegeOption}  value={role.privileges} 
                    onChange={(e) => handleChange(e)}
                    isMulti
                    name="privileges"
                    className="privileges basic-multi-select"
                    placeholder= "Choisissez des privilèges pour ce rôle"
                />
                {privilegeError && (
                  <span role="alert" className="error-msg">
                    Selectionner les Privilèges.
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

export default AjouterRoleModal;
