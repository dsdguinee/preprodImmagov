import { useContext, useEffect, useRef, useState } from "react";
import { AiFillEye, AiFillEyeInvisible, AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import Api from "../../services/Api";
import { initialized, objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";
import { ElementContext, UserContext } from "../../services/Context/Context";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
const NewUserModal = ({ isOpen, setIsOpen }) => {
//   function uniq(a) {
//     var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

//     return a.filter(function(item) {
//         var type = typeof item;
//         if(type in prims)
//             return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
//         else
//             return objs.indexOf(item) >= 0 ? false : objs.push(item);
//     });
// }
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isAdmin,setIsAdmin] = useState(false);

 
  const [user,setUser] = useState({
    nom:'',
    prenom:'',
    telephone:'',
    email:'',
    role_id:'',
    password:'',
    prefecture_id: 0,
    commune_id:0,
    agence_id:0,
  }); 
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      user
    }
  });
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const [agences,setAgences] = useState([]);
  const[prefectures,setPrefectures] = useState([]);
  const[communes,setCommunes] = useState([]);
  const[selectedCommunes,setSelectedCommunes] = useState([]);
  const[selectedAgences,setSelectedAgences] = useState([]);
  const { elementsData } = useContext(ElementContext);
  const {decoupage} = useContext(UserContext);
  const api = new Api();
  const modalRef = useRef();

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  useEffect(() => {
      //setAgences(elementsData.agences);
      reset(user);
      if(elementsData?.agences && decoupage?.communes && decoupage?.prefectures){
        setAgences(elementsData.agences);
        setPrefectures(decoupage?.prefectures);
        setCommunes(decoupage?.prefectures);
      }

  
  },[decoupage]);

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
    if(e.target.name === 'role_id'){
       getRoleType(e.target.value);return;
    }
    setUser({...user,[e.target.name]:e.target.value})
  }
  const CreateUser = async () => {
     setIsLoading(true);
      var formData = objecttoFormData(user);
      setErreurs([]);
     const {status,messages} = await api.apiData('post','/user/add',formData);
      if(status !== 200)
        setErreurs(messages);
      else{ 
        toast.success("Utilisateur créé avec succès.");initialized(user);setIsOpen(false);
      }
    setIsLoading(false);   

  }

  const getRoleType = async (role_id) => {
    const {status,role} = await api.apiData('get',`roles/${role_id}`);
    setIsAdmin(false) 
    if(typeof role?.type !== 'undefined'){
       if(role.type === 3 || role.type === 2){
         setIsAdmin(true);
       }
    }
    setUser({...user,type_id:role.type,role_id:role_id})
  }
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef}>
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }}
            className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <AiOutlineClose id="close-icon" />
            </div>
            <h4>Ajouter un nouvel utilisateur</h4>
            <form onSubmit={handleSubmit(CreateUser)}>
           
              <div className="input-group">
                <label>Nom
                  <input type="text" name="nom" id="nom" placeholder="Nom"
                   {...register('nom', {
                    onChange: (e) => {
                        handleInput(e)
                   },
                   required:true,maxLength:150,minLength:2},
                   )}
                   value={user.nom}
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
                <input type="text" name="prenom" id="prenom" placeholder="Prenom"  value={user.prenom}
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
                  <input type="email" name="email" id="email" placeholder="Email"  value={user.email}
                      {...register("email", 
                      {  onChange: (e) => {
                        handleInput(e)
                     },
                    required:true,
                    pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ })}
                    />
                  {(errors.email && errors.email?.type === "required") && (
                    <span className="error-msg">Le Champ email est obligatoire.</span>
                  )}
                   {(errors.email  && !errors.email?.type === "required")  && (
                    <span className="error-msg">Mauvais format d'email.Exemple(example@exemple.com).</span>
                  )}
                </label>
                <label>Telephone
                 <input type="tel" name="telephone" 
                    id="telephone" 
                    placeholder="ex: 620000000" 
                    value={user.telephone}
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
                       value={user.role_id}
                      {...register('role_id', {
                        onChange: (e) => {
                          handleInput(e)
                        },
                         validate: (value) => value !=  0 
                         })
                       }
                      >
                      <option value="0">Selectionner le Rôle</option>  
                      {elementsData.roles && elementsData.roles.map((role) => {
                        return <option value={role.role_id} key={"role_id"+role.role_id}>{role.nom_role}</option>
                      })}
                 
                  </select>
                </label>
              </div>
              <div className="input-group">
                 <label>Préfecture/Commune
                     <select name="prefecture_id" id="prefecture_id" value={user.prefecture_id}
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
                     <select value={user.commune_id} name="commune_id" 
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
                 {!isAdmin &&
                 <label>Agence
                     <select value={user.agence_id} name="agence_id"
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
                 </label>}
              </div>  
               <label className="password">Mot de passe
                <div className="password-field">
                  <input type={passwordVisible ? "text" : "password"}
                    name="password" id="password" placeholder="Mot de passe"
                    {...register('password', {
                      onChange: (e) => {
                          handleInput(e)
                    },
                    required:true,maxLength:20,minLength:5,
                    // pattern:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
                  }
                  )} 

                  />
                  {errors.password && errors.password.type === "required" && (
                      <span role="alert" className="error-msg">
                        Le mot de passe est obligatoire.
                      </span>
                    )}
                  {errors.password && errors.password.type === "minLength" && (
                      <span role="alert" className="error-msg">
                        Le caractère minimum pour le mot de passe est cinq (5).
                      </span>
                    )}  
                    {errors.password && errors.password.type === "maxLength" && (
                      <span role="alert" className="error-msg">
                        Le caractère maximum pour le mot de passe est vingt (20).
                      </span>
                    )}   
                  {errors.password && errors.password.type === "pattern" && (
                      <span role="alert" className="error-msg">
                        Le mot de passe doit contenir aumoin une lettre miniscule,majuscule,chiffre et caractère special.
                      </span>
                    )}     
                  <div className="eye-icon" onClick={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </div>
                </div>
               </label>
               <Erreurs validation={erreurs} /> 
              <button>Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default NewUserModal;
