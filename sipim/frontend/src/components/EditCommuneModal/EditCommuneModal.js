import { useEffect, useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";

// Seul le nom de la commune est modifiable : la prefecture determine le code commune.
const EditCommuneModal = ({ isOpen, setIsOpen, selectedCommune, onSaved }) => {
  const modalRef = useRef();
  const inputRef = useRef(null);
  const [erreurs, setErreurs] = useState([]);
  const [champErreur, setChampErreur] = useState("");
  const [nom, setNom] = useState("");
  const [isLoading, setIsLoading] = useRecoilState(loadingState);
  const api = new Api();

  useEffect(() => {
    if (isOpen && selectedCommune) {
      setNom(selectedCommune.commune);
      setErreurs([]);
      setChampErreur("");
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
  }, [isOpen, selectedCommune]);

  const closeModal = (e) => {
    if (modalRef.current === e.target) setIsOpen(false);
  };

  const saveCommune = async (e) => {
    e.preventDefault();
    const valeur = nom.trim();
    if (valeur.length === 0) return setChampErreur("Le nom de la commune est obligatoire.");
    if (valeur.length < 3) return setChampErreur("Le nombre minimum de caractères pour le nom de la commune est trois (3).");

    setErreurs([]);
    setIsLoading(true);
    const { status, messages } = await api.apiData("post", "decoupage/commune/update", objecttoFormData({ id: selectedCommune.id, commune: valeur }));
    if (status === 200) {
      toast.success("Commune modifiée avec succès.");
      onSaved && onSaved();
      setIsOpen(false);
    } else {
      setErreurs(messages);
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && selectedCommune ? (
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
            <h4>Modifier une commune</h4>
            <form onSubmit={saveCommune}>
              <div className="input-group">
                <label>
                  Préfecture
                  <input type="text" value={selectedCommune.prefecture} disabled />
                </label>
                <label>
                  Commune
                  <input
                    type="text"
                    name="commune"
                    id="commune"
                    placeholder="Nom de la commune"
                    ref={inputRef}
                    value={nom}
                    onChange={(e) => {
                      setChampErreur("");
                      setNom(e.target.value.toUpperCase());
                    }}
                  />
                  {champErreur && (
                    <span role="alert" className="error-msg">
                      {champErreur}
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

export default EditCommuneModal;
