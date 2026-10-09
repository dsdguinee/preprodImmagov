import React, { useContext, useEffect, useRef, useState } from "react";
import { AiFillEye, AiFillEyeInvisible, AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";
import { ElementContext, UserContext } from "../../services/Context/Context";

const EditUserModal = ({ isOpen, setIsOpen ,selectedUser,setSelectedUser}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const[prefectures,setPrefectures] = useState([]);
  const[communes,setCommunes] = useState([]);
  const [agences,setAgences] = useState([]);
  const {decoupage} = useContext(UserContext);
  const { elementsData } = useContext(ElementContext);
  const[selectedCommunes,setSelectedCommunes] = useState([]);
  const[selectedAgences,setSelectedAgences] = useState([]);
  const [isAdmin,setIsAdmin] = useState(false);
  const api = new Api();
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      selectedUser
    }
  });
  const isValidEmail = (email) =>
  // eslint-disable-next-line no-useless-escape
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  );
  // const handleEmailValidation = email => {
  //   console.log("ValidateEmail was called with", email);

  //   const isValid = isValidEmail(email);

  //   const validityChanged =
  //     (errors.email && isValid) || (!errors.email && !isValid);
  //   if (validityChanged) {
  //     console.log("Fire tracker with", isValid ? "Valid" : "Invalid");
  //   }

  //   return isValid;
  // };

  const modalRef = useRef();
 
  useEffect(()=> {
   
  
    if(elementsData?.agences && decoupage?.communes && decoupage?.prefectures){
      // L'utilisateur est rattache a une commune : on retrouve sa prefecture et les agences de la commune
      const commune = decoupage?.communes.filter(c => c.commune_id == selectedUser.commune_id);
      if(Array.isArray(commune) && commune.length > 0){
         const prefecture = decoupage?.prefectures.filter(p=>p.prefecture_id == commune[0]?.prefecture_id) 
         setSelectedUser({...selectedUser,prefecture_id:prefecture[0]?.prefecture_id,commune_id:commune[0]?.commune_id});
         const communes = decoupage?.communes.filter(c => c.prefecture_id == prefecture[0]?.prefecture_id);
         setSelectedCommunes(communes);
         const agences = elementsData?.agences.filter(a => a.commune_id == commune[0]?.commune_id);
         setSelectedAgences(agences);
      }
      setPrefectures(decoupage?.prefectures);
      setCommunes(decoupage?.prefectures);
      reset(selectedUser);

       setIsAdmin(false);
       getRoleType(selectedUser.role_id);
  
    }

  
  },[isOpen]);
 
  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const handleInput = (e) => {
    if(e.target.name === 'prefecture_id'){
      setIsLoading(true);
        const communes = decoupage.communes.filter(c => c.prefecture_id == e.target.value);
        setSelectedCommunes([]);setSelectedAgences([]);
        if(Array.isArray(communes) && communes.length > 0){
          setSelectedCommunes(communes);
        }
      setIsLoading(false);   
    }
    // Les agences sont rattachees a la commune
    if(e.target.name === 'commune_id'){
      setIsLoading(true);
        const agces = elementsData?.agences.filter(c => c.commune_id == e.target.value);
        setSelectedAgences([]);
        if(Array.isArray(agces) && agces.length > 0){
          setSelectedAgences(agces);
        }
      setIsLoading(false);   
    }
   
    setSelectedUser({...selectedUser,[e.target.name]:e.target.value});
  }
  const getRoleType = async (role_id) => {
    const {status,role} = await api.apiData('get',`roles/${role_id}`);
    if(typeof role?.type !== 'undefined'){
       if(role.type === 3 || role.type === 2)
         setIsAdmin(true);
    }
  }
  const SavingChange = async () =>{
    setIsLoading(true);
      var formData = objecttoFormData(selectedUser);
       setErreurs([]);
       const {status,messages} =  await api.apiData('post','/user/update',formData);
       if(status !== 200)
         setErreurs(messages);
       else {
        toast.success("Utilisateur modifié avec succès."); setIsOpen(false);  
       }  
    setIsLoading(false);
  }
 // console.log(selectedUser.role_id)
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef}>
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }}
            className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <AiOutlineClose id="close-icon" />
            </div>
            <h4>Modifier un utilisateur</h4>
            {(selectedUser.prefecture_id) &&
              <form onSubmit={handleSubmit(SavingChange)}>
                <Erreurs validation={erreurs} /> 
                <div className="input-group">
                  <label>Nom
                    <input type="text" name="nom" id="nom" placeholder="Nom"  value={selectedUser.lastName}
                    {...register('nom', {
                        onChange: (e) => {
                            handleInput(e)
                    },
                      required:true,maxLength:150,minLength:2},
                    )}
                    />
                {errors.nom && errors.nom?.type === "required" && (
                    <span className="error-msg">Le Nom de famille est obligatoire.</span>
                )}
                {errors.nom && errors.nom?.type === "minLength" && (
                  <span className="error-msg">Le caractère minimum est deux (2).</span>
                )}
                {errors.nom && errors.nom?.type === "maxLength" && (
                  <span className="error-msg">Le caractère maximum est cent cinquante (150).</span>
                )}
                  </label>
                  <label>Prenom
                    <input type="text" name="prenom" id="prenom" placeholder="Prenom"  value={selectedUser.prenom}
                    {...register('prenom', {
                        onChange: (e) => {
                            handleInput(e)
                      },
                      required:true,maxLength:150,minLength:2},
                    )}
                    />
                {errors.prenom && errors.prenom?.type === "required" && (
                    <span className="error-msg">Le Prenom est obligatoire.</span>
                )}
                {errors.prenom && errors.prenom?.type === "minLength" && (
                  <span className="error-msg">Le caractère minimum est deux (2).</span>
                )}
                {errors.prenom && errors.prenom?.type === "maxLength" && (
                  <span className="error-msg">Le caractère maximum est cent cinquante (150).</span>
                )}
                  </label>
                </div>
                <div className="input-group">
                  
                  <label>Email
                    <input type="email" name="email" id="email" placeholder="Email"  value={selectedUser.email}
                      {...register("email", {  onChange: (e) => {
                        handleInput(e)
                  },pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ })}
                    />
                  {errors.email && (
                    <span className="error-msg">Mauvais format d'email.Exemple(example@exemple.com).</span>
                  )}
                  </label>
                  <label>Telephone
                    <input type="tel" name="telephone" 
                      id="telephone" 
                      placeholder="ex: 620000000" 
                      value={selectedUser.telephone}
                      {...register('telephone', {
                        onChange: (e) => {
                          handleInput(e)
                        },
                        required:true,maxLength:100,minLength:2,pattern: /6[0-9]{8}$/g},
                      )}
                    />
                {errors.telephone && errors.telephone?.type === "required" && (
                  <span className="error-msg">Le Numéro de téléphone est obligatoire.</span>
                )}
                {errors.telephone && errors.telephone?.type === "minLength" && (
                  <span className="error-msg">Le caractère minimum est deux (2).</span>
                )}
                {errors.telephone && errors.telephone?.type === "maxLength" && (
                  <span className="error-msg">Le caractère maximum est cent (100).</span>
                )}
                {errors.telephone && errors.telephone.type === "pattern" && (
                  <span role="alert" className="error-msg">
                    Format invalide.Exemple(62000000).
                  </span>
                 )}
                 </label>
                </div>
                <div className="input-group">
                  <label>Role
                    <select name="role_id" id="role_id" 
                        value={selectedUser.role_id}
                        {...register('role_id', {
                          onChange: (e) => {
                            handleInput(e)
                          },
                          validate: (value) => value !=  0 
                          })
                        }
                        disabled={true}
                        >
                        <option value="0" >Selectionner le Rôle</option>  
                        {elementsData.roles && elementsData.roles.map((role) => {
                          return <option value={role.role_id} key={role.role_id}>{role.nom_role}</option>
                        })}
      
                    </select>
                    {errors.role_id && (
                      <span className="error-msg">Selectionner le Type d'Agent.</span>
                    )}
                  </label>
                </div>
                <div className="input-group">
                  <label>Préfecture/Commune
                      <select name="prefecture_id" id="prefecture_id" value={selectedUser.prefecture_id}
                        {...register('prefecture_id', {
                          onChange: (e) => {
                            handleInput(e)
                          },
                          validate: (value) => value !=  0 
                          })
                        }
                      >
                          <option value={0}>Selectionner la préfecture ou commune</option>
                          {prefectures.map((prefecture) => {
                            return (<option key={"p_"+Math.random()+prefecture.prefecture_id} value={prefecture.prefecture_id}>{prefecture.nom}</option>)
                          })}
                      </select>
                      {errors.prefecture_id && (
                        <span className="error-msg">Selectionner la Prefecture ou Commune de l'agence.</span>
                      )}
                  </label> 
                  <label>Commune
                      <select value={selectedUser.commune_id} name="commune_id" 
                          {...register('commune_id', {
                            onChange: (e) => {
                              handleInput(e)
                            },
                            validate: (value) => value !=  0 
                            })
                          }
                        >
                          <option value={0}>Selectionner la Commune</option>
                          {selectedCommunes.map((commune) => {
                            return (<option key={"c_"+Math.random()+commune.commune_id} value={commune.commune_id}>{commune.nom}</option>)
                          })}
                      </select>
                      {errors.commune_id && (
                        <span className="error-msg">Selectionner la commune.</span>
                      )}
                  </label> 
                </div>
                <div className="input-group">
                  {!isAdmin ?
                   <label>Agence
                      <select value={selectedUser.agence_id} name="agence_id"
                          {...register('agence_id', {
                            onChange: (e) => {
                              handleInput(e)
                            },
                            validate: (value) => value !=  0 
                            })
                          }
                        >
                        <option value={0}>Selectionner l'agence</option>
                        {selectedAgences.map((agence) => {
                          return (<option value={agence.agence_id} key={"q_"+Math.random()+agence.agence_id}>{agence.agence_id + "-"+agence.nom_agence}</option>)
                        })}
                      </select>
                      {errors.agence_id && (
                        <span className="error-msg">Selectionner une Agence.</span>
                      )}
                   </label>:<div></div>
                  }
                </div>
                <label className="password">Mot de passe
                <div className="password-field">
                  <input type={passwordVisible ? "text" : "password"}
                   name="password" onChange={handleInput} value={typeof selectedUser.password !== 'undefined' ? selectedUser.password:''} 
                   id="password" placeholder="Mot de passe"/>
                  <div className="eye-icon" onClick={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </div>
                </div>
                </label>
                <button type="submit">Enregistrer</button>
              </form>
            }
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default EditUserModal;
