import React, { useRef, useState,useEffect,useMemo} from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from 'react-hook-form';
import { isEmpty } from "../../utils/helper/functions";
import { getAllRoles, updateUser } from "../../services/auth.service";
import Spinner from "../Spinner/Spinner";
import Erreurs from "../erreurs/Erreurs";
import toast from "react-hot-toast";
const ModifierUtilisateurModal = ({ isOpen, setIsOpen, selectedUser }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const[roles,setRoles] = useState([]);
 
  const [user, setUser] = useState({
    user_id:'',
    lastName: "",
    firstName: "",
    password: "",
    email: "",
    tel: "",
    role: "",
    isAdmin:false
  });
  
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      user
    }
  });
  const modalRef = useRef();
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  async function getRoles(){
    setRoles([]);
    const{success,status,roles}= await getAllRoles();

    if(status === 200 || success ){
      setRoles(roles);
    }
  } 
 useMemo(() => {
    getRoles();
    reset(user)
   },[]) 
  useEffect(() => {
    setUser({...user,
        user_id:selectedUser.id,
        lastName: selectedUser?.nom,
        firstName: selectedUser?.prenom,
        password: '',
        email: selectedUser.email?selectedUser.email:"",
        tel: selectedUser?.telephone,
        role: selectedUser?.role_id,
        isAdmin:selectedUser.isAdmin
    });

    reset(user);

  }, [isOpen]);

  const handleInput =  (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const onUserEdit = async () => {
    var formData = new FormData();
    setErreurs([]);
    formData.append('user_id',user.user_id);
    formData.append('prenom',user.firstName);
    formData.append('nom',user.lastName);
    formData.append('password',user.password);
    formData.append('email',user.email);
    formData.append('telephone',user.tel);
    formData.append('role_id',user.role);
    formData.append('isAdmin',user.isAdmin);
    const {success,status,messages} = await updateUser(formData); 
    if(status === 200){
      toast.success("Modification  d'utilisateur effectuée avec succès");
      setIsOpen(false);
      setUser({
        lastName: "",
        firstName: "",
            password: "",
        email: "",
        tel: "",
        role: 0,
        isAdmin:false
      });
  }else{
    toast.error("Vous aviez fait des erreurs.");
     setErreurs(messages);
  }
  setIsLoading(false);
  };
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component gestion-utilisateur-modal" onClick={closeModal} ref={modalRef}>
        <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }} className="modal">
          <div className="close" onClick={() => setIsOpen(false)}>
            <FaRegWindowClose id="close-icon" />
          </div>
          {isLoading && <Spinner />}
          <h4>Modifier utilisateur</h4>
          {user &&
          <form onSubmit={handleSubmit(onUserEdit)}>
            
            <div className="input-group">
              <label>
                Nom  <span className="obligatoire">*</span>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  placeholder="Nom"
                  value={user.lastName?user.lastName:''}
                  {...register("lastName", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    required: true,
                  })}
                />
                {errors.lastName && errors.lastName.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
              </label>
              <label>
                Prenom  <span className="obligatoire">*</span>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  placeholder="Prenom"
                  value={user.firstName?user.firstName:''}
                  {...register("firstName", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    required: true,
                  })}
                />
                {errors.firstName && errors.firstName.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
              </label>
            </div> 
            <div className="input-group">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  value={user.email}
                  {...register("email", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    required: true,
                  })}
                />
                {errors.email && errors.email.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
              </label>
              <label>
                Telephone  <span className="obligatoire">*</span>
                <input
                  type="tel"
                  name="tel"
                  id="tel"
                  placeholder="ex: 620000000"
                  value={user.tel?user.tel:''}
                  {...register("tel", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    required: true,
                    pattern: /6[0-9]{8}$/g
                  })}
                />
                {errors.tel && errors.tel.type === "required" && (
                  <span tel="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
                {errors.tel && errors.tel.type === "pattern" && (
                  <span role="alert" className="error-msg">
                    Format invalide
                  </span>
                )}
              </label>
            </div>
            <div className="input-group">
              <label className="password">
                Mot de passe
                <div className="password-field">
                  <input
                    type={passwordVisible ? "text" : "password"} autoComplete='false'
                    name="password"
                    id="password"
                    placeholder="Mot de passe"
                    value={user.password?user.password:''}
                    onChange={handleInput}
                  />
                  <div className="eye-icon" onClick={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </div>
                </div>
                {errors.password && errors.password.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
                {errors.password && errors.password.type === "minLength" && (
                  <span role="alert" className="error-msg">
                    Le nombre minimum de caractères est 6.
                  </span>
                )}
              </label>
            <label>
              Role  <span className="obligatoire">*</span>
              <select
                name="role"
                id=""
                value={user.role}
                {...register("role", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  validate: (value) => value != 0 
                })}
              >
                  <option value={0}>Selectionner un Rôle</option>
                  {Array.isArray(roles) && 
                     roles.map((role) => {
                       return <option key={role.role_id} value={role.role_id}>{role.nom_role}</option>;
                     })
                  }
            
              </select>
              {errors.role && (
                <span role="alert" className="error-msg">
                  Champ obligatoire.
                </span>
              )}
            </label>
            </div>
              <div className="input-group">
               <label style={{display:'flex',flexDirection:'row-reverse',alignItems:'center',justifyContent:'flex-end',marginTop:'12px',height:'30px'}}>
                    <div>
                       Compte Admin
                    </div>
                    <div style={{padding:'8px'}}>
                     <input type='checkbox' name="isAdmin" className="checkbox-input" checked={user?.isAdmin?user?.isAdmin:false}
                     onChange={(e) => setUser({...user,isAdmin:!user.isAdmin}) }
                     />
                    </div>
               </label>
            </div>
           
            <Erreurs validation = {erreurs} />
            <button>Enregistrer</button>
          </form>
          }
        </motion.div>
      </div>
      ) : null}
    </AnimatePresence>
  );
};

export default ModifierUtilisateurModal;
