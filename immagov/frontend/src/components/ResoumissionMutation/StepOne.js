import { useState,useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import moment from "moment";
import "moment/locale/fr";
import { useForm } from "react-hook-form";
import Viewer from "react-viewer";
import Swal from "sweetalert2";

const StepOne = ({
  handleNextStep,
  setMutationInfo,
  mutationInfo,
  raisonRejet,
  status,
  pays,
}) => {
  const {
    handleSubmit,
    formState: { errors },
  } = useForm();
  const url = process.env.REACT_APP_URL + "/storage/";
  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = [
    { src: url + mutationInfo?.pieceJointe },
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

  return (
    <div className="step-one">
      <form onSubmit={handleSubmit(handleNextStep)}>
        <div className="infos">
          <div className="info-group">
            <div>
              <span>Mode d'Immatriculation</span>
              <strong>{mutationInfo?.modeImmatriculation}</strong>
            </div>
            <div>
              <span>Ancienne Affectation</span>
              <strong>{mutationInfo?.ancienMinistere}</strong>
            </div>
            <div>
              <span>Numero d'immatriculation</span>
              <strong>{mutationInfo?.immatriculation_number}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>
                {raisonRejet != ''?
                    <strong style={{color:'red',cursor:'pointer',textDecoration:'underline'}} onClick={handShowRaisonRejet}> {status} </strong> 
                    :
                    <strong> {status} </strong> 
                }
              </strong>
            </div>
          </div>
          <div className="info-group">
            <div>
              <span>Provenance</span>
              <strong>{pays}</strong>
            </div>
            <div>
              <span>Genre de véhicule</span>
              <strong>{mutationInfo.genre}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{mutationInfo.typeVehicule}</strong>
            </div>
            <div>
              <span>Marque</span>
              <strong>{mutationInfo.marque}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Modèle</span>
              <strong>{mutationInfo.model}</strong>
            </div>
            <div>
              <span>Année</span>
              <strong>{mutationInfo?.madeYear}</strong>
            </div>
            <div>
              <span>Carosserie</span>
              <strong>{mutationInfo?.carosserie}</strong>
            </div>
            <div>
              <span>Energie</span>
              <strong>{mutationInfo?.energy}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Numero de chassis</span>
              <strong>{mutationInfo?.numChassie}</strong>
            </div>
            <div>
              <span>Nombre de portes</span>
              <strong>{mutationInfo?.nbPorte}</strong>
            </div>
            <div>
              <span>Places assises</span>
              <strong>{mutationInfo?.placeNumberAssis}</strong>
            </div>
            <div>
              <span>Places debout</span>
              <strong>{mutationInfo?.placeNumberDebout}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Premiere mise en cirulation</span>
              <strong>
                {mutationInfo?.releaseYear
                  ? moment(mutationInfo?.releaseYear).format("DD-MMMM-YYYY")
                  : "Non Fournie"}
              </strong>
            </div>
            <div>
              <span>Ancien numero d'immatriculation</span>
              <strong>
                {mutationInfo?.ancienImmatriculation
                  ? mutationInfo?.ancienImmatriculation
                  : "Non Fournie"}
              </strong>
            </div>
            <div>
              <span>Kilometrage</span>
              <strong>{mutationInfo?.kilometrage}</strong>
            </div>
            <div>
              <span>Cylindre</span>
              <strong>{mutationInfo?.cylinderNumber}</strong>
            </div>
          </div>

          <div className="info-group">
            <div></div>
          </div>

          <div className="info-group">
            <div>
            <span>Fond de dossier</span>
              <div className="image" onClick={() => handleImageClick(0)}>
                <img
                  src={
                    mutationInfo?.pieceJointe !== undefined
                      ? url + mutationInfo?.pieceJointe
                      : ""
                  }
                  alt=""
                />
              </div>
            </div>
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
          </div>
        </div>
        <div className="buttons">
          <button className="secondary">
            <NavLink to="/mutation">Retour</NavLink>
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
