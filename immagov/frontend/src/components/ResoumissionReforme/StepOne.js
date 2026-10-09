import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import Viewer from "react-viewer";
import Swal from "sweetalert2";
import moment from "moment";
import "moment/locale/fr";

const StepOne = ({
  handleNextStep,
  immatriculationInfo,
  setImmatriculationInfo,
  raisonRejet
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const url = process.env.REACT_APP_URL + "/storage/";

  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = [
    { src: url + immatriculationInfo?.pieceJointe },
  ];
  const handleImageClick = (index) => {
    setImageIndex(index);
    setIsVisible(true);
  };
  const handShowRaisonRejet = ()=>{
    Swal.fire({
      title: 'Motif de Rejet',
      text: raisonRejet,
      icon: 'info',
    })
  }
  const handleInput = (e) => {
    setImmatriculationInfo({
      ...immatriculationInfo,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div className="step-one">
      <form onSubmit={handleSubmit(handleNextStep)}>
        <div className="infos">
          <div className="info-group">
            <div>
              <span>Mode d'Immatriculation</span>
              <strong>{immatriculationInfo?.modeImmatriculation}</strong>
            </div>
            <div>
              <span>Affectation</span>
              <strong>{immatriculationInfo.NouveauMinistere}</strong>
            </div>
            <div>
              <span>Numero d'immatriculation</span>
              <strong>{immatriculationInfo?.immatriculation_number}</strong>
            </div>
            <div>
              <span>Status</span>
              {raisonRejet != ''?
                  <strong style={{color:'red',cursor:'pointer',textDecoration:'underline'}} onClick={handShowRaisonRejet}> {immatriculationInfo.statusReforme} </strong> 
                  :
                  <strong> { immatriculationInfo.statusReforme} </strong> 
               }
                
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Provenance</span>
              <strong>{immatriculationInfo.pays}</strong>
            </div>
            <div>
              <span>Genre de véhicule</span>
              <strong>{immatriculationInfo.genre}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{immatriculationInfo.typeVehicule}</strong>
            </div>
            <div>
              <span>Marque</span>
              <strong>{immatriculationInfo.marque}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Modèle</span>
              <strong>{immatriculationInfo.model}</strong>
            </div>
            <div>
              <span>Année</span>
              <strong>{immatriculationInfo.madeYear}</strong>
            </div>
            <div>
              <span>Carosserie</span>
              <strong>{immatriculationInfo.carosserie}</strong>
            </div>
            <div>
              <span>Energie</span>
              <strong>{immatriculationInfo?.energy}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Numero de chassis</span>
              <strong>{immatriculationInfo?.numChassie}</strong>
            </div>
            <div>
              <span>Nombre de portes</span>
              <strong>{immatriculationInfo?.nbPorte}</strong>
            </div>
            <div>
              <span>Places assises</span>
              <strong>{immatriculationInfo?.placeNumberAssis}</strong>
            </div>
            <div>
              <span>Places debout</span>
              <strong>{immatriculationInfo?.placeNumberDebout}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Premiere mise en cirulation</span>
              <strong>
                {immatriculationInfo.releaseYear}
              </strong>
            </div>
            <div>
              <span>Ancien numero d'immatriculation</span>
              <strong>
                {immatriculationInfo?.ancienImmatriculation
                  ? immatriculationInfo?.ancienImmatriculation
                  : "Non Fournie"}
              </strong>
            </div>
            <div>
              <span>Kilometrage</span>
              <strong>{immatriculationInfo?.kilometrage}</strong>
            </div>
            <div>
              <span>Cylindre</span>
              <strong>{immatriculationInfo?.cylinderNumber}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <label>
                {" "}
                Valeur résiduelle
                <input
                  type="number"
                  name="valeurResiduelle"
                  {...register("valeurResiduelle", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    validate: (value) => value >= 50000,
                  })}
                  defaultValue={immatriculationInfo.valeurResiduelle}
                />
                {errors.valeurResiduelle && (
                  <span className="error-msg" style={{ color: "red" }}>
                    La valeur Minimale est de cinquante mille francs
                    guinéen(50000 GNF).
                  </span>
                )}
              </label>
            </div>
            <div>
               <span>Puissance Administrative en CV</span>
               <strong style={{marginTop:'11px'}}>{immatriculationInfo.pa}</strong>
            </div>
            <div></div>
            <div></div>
          </div>

          <div className="info-group">
            <div>
              <span>Fond de Dossiers</span>
              <div className="image" onClick={() => handleImageClick(0)}>
                <img
                  src={
                    immatriculationInfo?.pieceJointe !== undefined
                      ? url + immatriculationInfo?.pieceJointe
                      : ""
                  }
                  alt=""
                />
              </div>
            </div>
            <div>
              <div className="image-viewer">
                <Viewer
                  visible={isVisible}
                  onClose={() => {
                    setIsVisible(false);
                  }}
                  images={images}
                  activeIndex={imageIndex}
                />
              </div>
              {/* <span>Numero de chassis</span>
              <div className="image">
                <img src="" alt="" />
              </div> */}
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="secondary">
            <NavLink to="/reforme">Retour</NavLink>
          </button>
          <button className="primary" type="submit">
            Suivant
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepOne;
