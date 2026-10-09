import React, { useEffect, useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// import Select from "react-select";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import Erreurs from "../Erreurs/Erreurs";

import { BsFillArrowDownCircleFill } from 'react-icons/bs'


const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => {htmlElRef.current &&  htmlElRef.current.focus()}
  return [ htmlElRef, setFocus ] 
}
const EditAgencyModal = ({ isOpen, setIsOpen,prefectures,communes,selectedAgency }) => {
  const modalRef = useRef();
  const [erreurs, setErreurs] = useState([]);
  const[selectedCommunes,setSelectedCommunes] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [inputRef, setInputFocus] = useFocus();
  const [agenceErreur,setAgenceErreur] = useState({ 
    error:'',
  });
  const url = process.env.REACT_APP_URL.replace('api/','') + 'storage/';
  const [agenceUpdate,setAgenceUpdate] = useState({
    prefecture_id:0,
    commune_id:0,
    agence:'',
    agence_id:0,
    agenceCommune_id:0,
    logo:'',
  });
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
      agenceUpdate
    }
  });
const api = new Api();



  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };
  useEffect(() => {
    async function getAgence(selectedAgency){
        const {status,agence,messages} = await api.apiData('get',`/agence/agencebyid/${selectedAgency.id}`);
   
        if(status === 200 && agence?.commune_id){
           // L'agence est rattachee a une commune : on preselectionne sa prefecture et sa commune
           setSelectedCommunes(communes.filter(c => c.prefecture_id == agence.prefecture_id));
           setAgenceUpdate({
             prefecture_id:agence.prefecture_id,
             commune_id:agence.commune_id,
             agence:agence.nom_agence,
             agence_id:selectedAgency.agence_id,
             agenceCommune_id:selectedAgency.id
           });
           setInputFocus();
        }
       
    }
     if(selectedAgency?.id){
        setIsLoading(true);
          getAgence(selectedAgency);
          if(agenceErreur.error.length !== 0)
            setAgenceErreur({...agenceErreur,error:""});
            reset(agenceUpdate)
      setIsLoading(false);   
      }
  },[isOpen,selectedAgency]);

  const handleInput = (e) => {
    if(e.target.name === 'prefecture_id'){
      setIsLoading(true);
        const comms = communes.filter(c => c.prefecture_id == e.target.value);
        setSelectedCommunes([]);
        if(Array.isArray(comms) && comms.length > 0)
          setSelectedCommunes(comms);
      setIsLoading(false);
      setAgenceUpdate({...agenceUpdate,prefecture_id:e.target.value,commune_id:0});
    }
    else {
      if(e.target.name === "commune_id")
        setInputFocus();
      setAgenceUpdate({...agenceUpdate,[e.target.name]:e.target.value});
    }
    if(agenceErreur.error.length !== 0)
      setAgenceErreur({...agenceErreur,error:""});
  }
  const onFileChange = (e) => {
    if(e.target.files[0])
      setAgenceUpdate({...agenceUpdate,[e.target.name]:e.target.files[0]});
  }
  const updateAgence = async () => {
    setErreurs([]);setIsLoading(true);
  
    if(agenceUpdate.agence.length === 0){
       setAgenceErreur({...agenceErreur,error:"Le nom de l'agence est obligatoire."}); setIsLoading(false);setInputFocus();return;}
    else if(agenceUpdate.agence.length < 3){
      setAgenceErreur({...agenceErreur,error:"Le nombre minimum de caractères pour le nom de l'agence est deux (2)."});setIsLoading(false); setInputFocus();return;}
    var formData = objecttoFormData(agenceUpdate);
    const {status,messages} = await api.apiData('post','/agence/update',formData);
    if(status === 200){
      setAgenceUpdate({...agenceUpdate, prefecture_id:0,
        commune_id:0,
        agence:'',
        agence_id:0,
        agenceCommune_id:0
      })
      toast.success("Agence modifiée avec succès.");setIsOpen(false);
    }else{
       setErreurs(messages); 
    }  
    setIsLoading(false);
  }   
  
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
            <h4>Modifier une agence</h4>
            <form onSubmit={handleSubmit(updateAgence)}>
            <div className="profile-image">
              {typeof agenceUpdate.logo === 'undefined'?
                <img src={selectedAgency?.logo?url+selectedAgency.logo:''} alt={selectedAgency.nom_agence} />
                : <img src={agenceUpdate?.logo? URL.createObjectURL(agenceUpdate.logo):''} alt={agenceUpdate.agence} />
             }
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
                  <select name="prefecture_id" id="prefecture_id" value={agenceUpdate.prefecture_id}
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
                  <select value={agenceUpdate.commune_id} name="commune_id" 
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
                      value={agenceUpdate.agence}
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

export default EditAgencyModal;
