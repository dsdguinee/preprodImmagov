import React, { useEffect, useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence, m } from "framer-motion";
// import Select from "react-select";
// import Erreurs from "../Erreurs/Erreurs";
import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Erreurs from "../Erreurs/Erreurs";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import { BsFillArrowDownCircleFill } from 'react-icons/bs'
import logobank from '../../assets/images/logobank.jpeg';
const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => {htmlElRef.current &&  htmlElRef.current.focus()}

  return [ htmlElRef, setFocus ] 
}

const NewAgencyModal = ({ isOpen, setIsOpen,prefectures,communes }) => {
  const modalRef = useRef();
  const [erreurs, setErreurs] = useState([]);
  const[selectedCommunes,setSelectedCommunes] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [agenceErreur,setAgenceErreur] = useState({ 
    error:'',
  });
  const [inputRef, setInputFocus] = useFocus();
  const [agence,setAgence] = useState({
    prefecture_id:0,
    commune_id:0,
    agence:'',
    logo:'',
  });
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      agence
    }
  });
  const api = new Api();

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       role,
//     },
//   });

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  const handleInput = (e) => {
    if(e.target.name === 'prefecture_id'){
      setIsLoading(true);
        const comms = communes.filter(c => c.prefecture_id == e.target.value);
        setSelectedCommunes([]);
        if(Array.isArray(comms) && comms.length > 0){
          setSelectedCommunes(comms);
        }
      setIsLoading(false);   
    }
     if(e.target.name === "commune_id")
       setInputFocus();

    setAgence({...agence,[e.target.name]:e.target.value});
    if(agenceErreur.error.length !== 0)
      setAgenceErreur({...agenceErreur,error:""});
  }
  const createAgence = async () => {
    setErreurs([]);setIsLoading(true);
    if(agence.agence.length === 0){
       setAgenceErreur({...agenceErreur,error:"Le nom de l'agence est obligatoire."}); setIsLoading(false);setInputFocus();return;}
    else if(agence.agence.length < 3){
      setAgenceErreur({...agenceErreur,error:"Le caractère minimum pour le nom de l'agence est deux (2)."});setIsLoading(false); setInputFocus();return;}
    var formData = objecttoFormData(agence);
    const {status,messages} = await api.apiData('post','/agence/new',formData);
    if(status === 200){
      setAgence({...agence, prefecture_id:0,
        commune_id:0,
        agence:'',})
      toast.success("Agence créée avec succès.");setIsOpen(false);
    }else{
       setErreurs(messages); 
    }  
    setIsLoading(false);
  }  
  const onFileChange = (e) => {
    if(e.target.files[0])
      setAgence({...agence,[e.target.name]:e.target.files[0]});
  } 
  //console.log(agence.logo)

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef}>
          <motion.div
            initial={{ opacity: 0, top: "30%" }}
            animate={{ opacity: 1, top: "50%" }}
            transition={{ duration: 0.2 }}
            exit={{ opacity: 0, top: "10%" }}
            className="modal"
          >
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>Ajouter une nouvelle agence</h4>
            <form onSubmit={handleSubmit(createAgence)}>
            <div className="profile-image">
              {agence.logo !== '' ? <img src={URL.createObjectURL(agence.logo)} alt={agence.agence} />: <img src={logobank} alt={agence.agence}/> }
                <input type="file" name="profile" id="profile" placeholder="Choisissez une photo"/>
                <div className="file-upload-wrapper">
                  <div className="file-upload">
                   <input type="file" name='logo' onChange={onFileChange} accept="image/jpg, image/jpeg,image/png" />
                    <BsFillArrowDownCircleFill />
                  </div> 
                </div>
            </div>
              <div className="input-group">
                <label>
                  Prefectures
                  <select name="prefecture_id" id="prefecture_id" value={agence.prefecture_id}
                      {...register('prefecture_id', {
                        onChange: (e) => {
                          handleInput(e)
                        },
                        validate: (value) => value !=  0 
                        })
                      }
                      >
                    <option value="0">Selectionner la prefecture</option>
                    {prefectures && prefectures.map((prefecture) => {
                      return (<option value={prefecture.prefecture_id} key={Math.random()+"_"+prefecture.prefecture_id}>{prefecture.nom}</option>)
                    })}
                  </select>
                  {errors.prefecture_id && (
                      <span className="error-msg">Selectionner la Prefecture ou Commune de l'agence.</span>
                     )}
                </label>
                <label>
                  Commune
                  <select value={agence.commune_id} name="commune_id" 
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
                <label>
                  Agence
                  <input
                    type="text"
                    name="agence"
                    id="agence"
                    placeholder="Agence"
                    value={agence.agence}
                    ref={inputRef}
                   onChange={handleInput}
                  />
                 {agenceErreur?.error.length > 0 &&(
                    <span role="alert" className="error-msg">
                      {agenceErreur.error}
                    </span>
                  )}
                 
                
                </label>
              </div>
              <Erreurs validation = {erreurs} />
              <button type="submit">Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default NewAgencyModal;
