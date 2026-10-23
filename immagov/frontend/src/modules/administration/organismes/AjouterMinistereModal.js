import React, { useRef, useState, useEffect } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Erreurs from "../../../components/erreurs/Erreurs";
import { organismeDeMemeNom, organismesSimilaires } from "../../../utils/organismes";
import toast from "react-hot-toast";
import { organismesApi } from "../api";

// Catégories : tout organisme est un ministère / une institution ou une entreprise publique (type « Publique ») ;
// il n'y a plus d'organisme privé
export const CATEGORIES_ORGANISME = [
  { value: "Ministère", label: "Ministère / institution de l'État" },
  { value: "Entreprise Publique", label: "Entreprise publique" },
];
const EXEMPLES = { "Ministère": "Ex. MINISTÈRE DES TRANSPORTS", "Entreprise Publique": "Ex. ÉLECTRICITÉ DE GUINÉE (EDG)" };

/** Ajout d'un organisme dans la catégorie de l'onglet ouvert (modifiable), avec contrôle des doublons. */
const AjouterMinistereModal = ({ isOpen, setIsOpen, categorie: categorieOnglet = "Ministère", organismes = [], onSaved }) => {
  const modalRef = useRef();
  const [erreurs, setErreurs] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [ministere, setMinistere] = useState({ nom: "", categorie: categorieOnglet });

  useEffect(() => {
    if (!isOpen) return;
    setErreurs([]);
    setMinistere({ nom: "", categorie: categorieOnglet });
  }, [isOpen, categorieOnglet]);

  const maj = (champ) => (e) => setMinistere({ ...ministere, [champ]: champ === "nom" ? e.target.value.toUpperCase() : e.target.value });
  const closeModal = (e) => {
    if (modalRef.current === e.target) setIsOpen(false);
  };

  // Doublons : nom identique (accents et casse ignorés) ou proche d'un organisme existant
  const memeNom = organismeDeMemeNom(ministere.nom, organismes);
  const proches = !memeNom ? organismesSimilaires(ministere.nom, organismes) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreurs([]);
    if (memeNom) return setErreurs({ nom: [`« ${memeNom.nom} » existe déjà.`] });
    const formData = new FormData();
    formData.append("nom", ministere.nom.trim());
    formData.append("categorie", ministere.categorie);
    formData.append("typeOrganisme", "Publique");
    setEnvoi(true);
    const { success, messages } = await organismesApi.ajouter(formData);
    setEnvoi(false);
    if (success) {
      setIsOpen(false);
      toast.success(`« ${ministere.nom.trim()} » ajouté.`);
      onSaved && onSaved();
    } else setErreurs(messages || { erreur: ["Échec de l'ajout."] });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-component" onClick={closeModal} ref={modalRef}>
          <motion.div initial={{ opacity: 0, top: "30%" }} animate={{ opacity: 1, top: "50%" }} transition={{ duration: 0.2 }} exit={{ opacity: 0, top: "10%" }}
            className="modal">
            <div className="close" onClick={() => setIsOpen(false)}>
              <FaRegWindowClose id="close-icon" />
            </div>
            <h4>{ministere.categorie === "Entreprise Publique" ? "Nouvelle entreprise publique" : "Nouveau ministère / institution"}</h4>
            <form onSubmit={handleSubmit}>
              <label>Catégorie
                <select name="categorie" onChange={maj("categorie")} value={ministere.categorie}>
                  {CATEGORIES_ORGANISME.map((c) => <option key={c.label} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label>Nom
                <input type="text" name="nom" onChange={maj("nom")} placeholder={EXEMPLES[ministere.categorie]}
                  value={ministere.nom} maxLength={150} required autoFocus />
              </label>
              {memeNom && <p className="organisme-alerte">« {memeNom.nom} » existe déjà : inutile de le créer.</p>}
              {proches.length > 0 && (
                <p className="organisme-alerte organisme-alerte--info">Organismes proches déjà enregistrés : {proches.map((o) => o.nom).join(" · ")}. Vérifiez qu'il ne s'agit pas d'un doublon.</p>
              )}
              <Erreurs validation={erreurs} />
              <button type="submit" disabled={envoi || !ministere.nom.trim() || !!memeNom}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default AjouterMinistereModal;
