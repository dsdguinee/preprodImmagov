import { useEffect, useRef, useState } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Api from "../../services/Api";
import { loadingState, useAtomState } from "../../store/atoms";
import { objecttoFormData } from "../../services/Helpers/fonctions";
import toast from "react-hot-toast";
import Erreurs from "../Erreurs/Erreurs";

const CATEGORIES = ["Ministère", "Entreprise Publique"];

// Ajout (ministere absent, dans la catégorie de l'onglet) ou modification (ministere fourni) d'un ministère ou d'une entreprise publique
const MinistereModal = ({ isOpen, setIsOpen, ministere, categorie: categorieOnglet = "Ministère", onSaved }) => {
  const modalRef = useRef();
  const inputRef = useRef(null);
  const [erreurs, setErreurs] = useState([]);
  const [champErreur, setChampErreur] = useState("");
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState(categorieOnglet);
  const [isLoading, setIsLoading] = useAtomState(loadingState);
  const api = new Api();
  const modification = !!ministere;

  useEffect(() => {
    if (!isOpen) return;
    setNom(ministere ? ministere.nom : "");
    setCategorie(ministere ? ministere.categorie : categorieOnglet);
    setErreurs([]);
    setChampErreur("");
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  }, [isOpen, ministere, categorieOnglet]);

  const closeModal = (e) => {
    if (modalRef.current === e.target) setIsOpen(false);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    const valeur = nom.trim();
    if (valeur.length === 0) return setChampErreur("Le nom est obligatoire.");
    if (valeur.length < 3) return setChampErreur("Le nombre minimum de caractères est trois (3).");

    setErreurs([]);
    setIsLoading(true);
    const { status, messages } = modification
      ? await api.apiData("post", "ministere/update", objecttoFormData({ id: ministere.id, nom: valeur, categorie }))
      : await api.apiData("post", "ministere/new", objecttoFormData({ nom: valeur, categorie }));
    if (status === 200) {
      toast.success(modification ? "Modification enregistrée." : `${categorie === "Ministère" ? "Ministère ajouté" : "Entreprise publique ajoutée"} avec succès.`);
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
            <h4>{modification ? "Modifier" : categorie === "Ministère" ? "Nouveau ministère" : "Nouvelle entreprise publique"}</h4>
            <form onSubmit={enregistrer}>
              <div className="input-group">
                <label>
                  Catégorie
                  <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c === "Ministère" ? "Ministère / institution" : "Entreprise publique"}</option>)}
                  </select>
                </label>
                <label>
                  Nom
                  <input
                    type="text"
                    name="nom"
                    id="nom"
                    placeholder={categorie === "Ministère" ? "Ex. MINISTÈRE DES TRANSPORTS" : "Ex. ÉLECTRICITÉ DE GUINÉE (EDG)"}
                    ref={inputRef}
                    value={nom}
                    maxLength={191}
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
              {modification && ministere.nbrePaiements > 0 && (
                <p className="hint">Les {ministere.nbrePaiements} paiement(s) déjà enregistrés gardent l'ancien nom sur leur reçu.</p>
              )}
              <Erreurs validation={erreurs} />
              <button type="submit" disabled={isLoading}>Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default MinistereModal;
