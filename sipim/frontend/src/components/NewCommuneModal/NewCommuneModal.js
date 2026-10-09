import { useEffect, useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";

const NewCommuneModal = ({ isOpen, setIsOpen, prefectures, onSaved }) => {
  const modalRef = useRef();
  const inputRef = useRef(null);
  const [erreurs, setErreurs] = useState([]);
  const [champErreurs, setChampErreurs] = useState({});
  const [commune, setCommune] = useState({ prefecture_id: 0, commune: "" });
  const [isLoading, setIsLoading] = useRecoilState(loadingState);
  const api = new Api();

  useEffect(() => {
    if (isOpen) {
      setCommune({ prefecture_id: 0, commune: "" });
      setErreurs([]);
      setChampErreurs({});
    }
  }, [isOpen]);

  const closeModal = (e) => {
    if (modalRef.current === e.target) setIsOpen(false);
  };

  const handleInput = (e) => {
    setChampErreurs({ ...champErreurs, [e.target.name]: "" });
    const value = e.target.name === "commune" ? e.target.value.toUpperCase() : e.target.value;
    setCommune({ ...commune, [e.target.name]: value });
    if (e.target.name === "prefecture_id") inputRef.current && inputRef.current.focus();
  };

  const createCommune = async (e) => {
    e.preventDefault();
    const nom = commune.commune.trim();
    const errs = {};
    if (Number(commune.prefecture_id) === 0) errs.prefecture_id = "Selectionner la préfecture.";
    if (nom.length === 0) errs.commune = "Le nom de la commune est obligatoire.";
    else if (nom.length < 3) errs.commune = "Le nombre minimum de caractères pour le nom de la commune est trois (3).";
    setChampErreurs(errs);
    if (Object.keys(errs).length > 0) return;

    setErreurs([]);
    setIsLoading(true);
    const { status, messages } = await api.apiData("post", "decoupage/commune/new", objecttoFormData({ ...commune, commune: nom }));
    if (status === 200) {
      toast.success("Nouvelle commune ajoutée avec succès.");
      onSaved && onSaved();
      setIsOpen(false);
    } else {
      setErreurs(messages);
    }
    setIsLoading(false);
  };

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
            <h4>Ajouter une commune</h4>
            <form onSubmit={createCommune}>
              <div className="input-group">
                <label>
                  Préfecture
                  <select name="prefecture_id" id="prefecture_id" value={commune.prefecture_id} onChange={handleInput}>
                    <option value={0}>Selectionner la préfecture</option>
                    {prefectures &&
                      prefectures.map((prefecture) => (
                        <option value={prefecture.prefecture_id} key={"p_" + prefecture.prefecture_id}>
                          {prefecture.nom}
                        </option>
                      ))}
                  </select>
                  {champErreurs.prefecture_id && <span className="error-msg">{champErreurs.prefecture_id}</span>}
                </label>
                <label>
                  Commune
                  <input
                    type="text"
                    name="commune"
                    id="commune"
                    placeholder="Nom de la commune"
                    ref={inputRef}
                    value={commune.commune}
                    onChange={handleInput}
                  />
                  {champErreurs.commune && (
                    <span role="alert" className="error-msg">
                      {champErreurs.commune}
                    </span>
                  )}
                </label>
              </div>
              <Erreurs validation={erreurs} />
              <button type="submit" disabled={isLoading}>Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default NewCommuneModal;
