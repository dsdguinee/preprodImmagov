import React, { useRef, useState } from "react";
import { AiFillEye, AiFillEyeInvisible, AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import profileImage from "../../assets/images/profile.jpg";

const UserSettingsModal = ({ isOpen, setIsOpen }) => {
  const modalRef = useRef();

  const closeModal = (e) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };

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
            <div className="profile-image">
                <img src={profileImage} alt="" />
            </div>
            <form>
              <div className="input-group">
                <label>Nom
                  <input type="text" name="lastName" id="lastName" placeholder="Nom"/>
                </label>
                <label>Prenom
                  <input type="text" name="firstName" id="firstName" placeholder="Prenom"/>
                </label>
              </div>
              <div className="input-group">
              <label className="password">Nouveau mot de passe
                <div className="password-field">
                    <input name="password" id="password" placeholder="Mot de passe"/>
                </div>
              </label>
              <label className="password">Confirmer mot de passe
                <div className="password-field">
                    <input name="password" id="password" placeholder="Mot de passe"/>
                </div>
              </label>
              </div>
              <button>Enregistrer</button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default UserSettingsModal;
