import { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  getMinistereById,
  getDirectionByID,
} from "../../services/organisation.service";
import toast from "react-hot-toast";
import { createReforme } from "../../services/immatriculation.service";
import Erreurs from "../../components/erreurs/Erreurs";
import Viewer from "react-viewer";
import { BsFillFileEarmarkCheckFill } from 'react-icons/bs';
import Spinner from "../Spinner/Spinner";

const StepFour = ({
  handlePrevStep,
  proprietaireInfo,
  vehiculeInfo,
  immatriculationInfo,
  genre,
  typeVehicule,
  modele,
  marque,
  pays,
  affectation,
  status,
}) => {
  const [previews, setPreviews] = useState({ previews1: "", previews2: "" });
  const [muministere, setMuminstere] = useState("");
  const [mudirection, setMudirection] = useState("");
  const url = process.env.REACT_APP_URL + "/storage/";

  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const images = [
    { src: url + vehiculeInfo?.pieceJointe },
  ];
  if(vehiculeInfo?.pieceJointe?.slice(-3) !== 'jpg' && vehiculeInfo?.pieceJointe?.slice(-4) !== 'jpeg'){
    if(images.length > 0 ){
      images.splice(0);
    }
 }
  const handleImageClick = (index) => {
    setImageIndex(index);
    setIsVisible(true);
  };
 
  useEffect(() => {
    setPreviews({
      ...previews,
      previews1:
        proprietaireInfo?.piece != ""
          ? URL.createObjectURL(proprietaireInfo.piece)
          : "",
      previews2:
        proprietaireInfo?.paiement != ""
          ? URL.createObjectURL(proprietaireInfo.paiement)
          : "",
    });
    if (proprietaireInfo.ministere != 0) {
      getMinistereById(proprietaireInfo.ministere).then((resp) => {
        setMuminstere(resp);
      });
    }
    if (proprietaireInfo.direction != 0 && proprietaireInfo.direction != "") {
      getDirectionByID(proprietaireInfo.direction).then((resp) => {
        setMudirection(resp);
      });
    }
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createReforme(proprietaireInfo);
    setIsLoading(true);
    if (result.status === false) {
      setIsLoading(false);toast.error("Echec d'enregistrement!");
      setErreurs(result.messages);
    } else {
      setIsLoading(false);toast.success("Enregistrement effectué avec succès.");
      navigate("/reforme");
      
    }
  };
  return (
    <div className="step-four step-submit">
      {isLoading && <Spinner />}
      <div className="summary">
        <div className="vehicle-info-summary">
          <div className="info-group">
            <div>
              <span>Mode d'exploitation</span>
              <strong>{immatriculationInfo?.modeImmatriculation}</strong>
            </div>
            <div>
              <span>Affectation</span>
              <strong>{affectation}</strong>
            </div>
            <div>
              <span>Numero d'immatriculation</span>
              <strong>{immatriculationInfo?.immatriculation_number}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{status}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Provenance</span>
              <strong>{pays}</strong>
            </div>
            <div>
              <span>Genre de véhicule</span>
              <strong>{genre}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{typeVehicule}</strong>
            </div>
            <div>
              <span>Marque</span>
              <strong>{marque}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Modèle</span>
              <strong>{modele}</strong>
            </div>
            <div>
              <span>Année</span>
              <strong>{vehiculeInfo?.madeYear}</strong>
            </div>
            <div>
              <span>Carosserie</span>
              <strong>{vehiculeInfo?.carosserie}</strong>
            </div>
            <div>
              <span>Energie</span>
              <strong>{vehiculeInfo?.energy}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Numero de chassis</span>
              <strong>{vehiculeInfo?.numChassie}</strong>
            </div>
            <div>
              <span>Nombre de portes</span>
              <strong>{vehiculeInfo?.nbPorte}</strong>
            </div>
            <div>
              <span>Places assises</span>
              <strong>{vehiculeInfo?.placeNumberAssis}</strong>
            </div>
            <div>
              <span>Places debout</span>
              <strong>{vehiculeInfo?.placeNumberDebout}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Premiere mise en cirulation</span>
              <strong>
                {vehiculeInfo?.releaseYear
                  ? moment(vehiculeInfo?.releaseYear).format("DD-MMMM-YYYY")
                  : "Non Fournie"}
              </strong>
            </div>
            <div>
              <span>Ancien numero d'immatriculation</span>
              <strong>
                {immatriculationInfo?.ancienImmatriculation != ""
                  ? immatriculationInfo?.ancienImmatriculation
                  : "Non Fournie"}
              </strong>
            </div>
            <div>
              <span>Kilometrage</span>
              <strong>{vehiculeInfo?.kilometrage}</strong>
            </div>
            <div>
              <span>Cylindre</span>
              <strong>{vehiculeInfo?.cylinderNumber}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Valeur résiduelle</span>
              <strong>{proprietaireInfo?.valeurResiduelle}</strong>
            </div>
            <div>
              <span>Mode d'acquisition</span>
              <strong>{vehiculeInfo?.acquisition}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Fonds de Dossiers</span>
              {(vehiculeInfo?.pieceJointe.slice(-3) === 'jpg' || vehiculeInfo?.pieceJointe.slice(-4) === 'jpeg') &&
              <div className="image" onClick={() => handleImageClick(0)}>
                <img src={vehiculeInfo?.pieceJointe !== undefined  ? url + vehiculeInfo?.pieceJointe:""} alt="" />
              </div>}
              {(vehiculeInfo?.pieceJointe.slice(-3) !== 'jpg' && vehiculeInfo?.pieceJointe.slice(-4) !== 'jpeg') &&
                <div className='image' onClick={() => {if(vehiculeInfo?.pieceJointe.slice(-3) === 'pdf') window.open(`${url}${vehiculeInfo?.pieceJointe}`);}}>
                   <BsFillFileEarmarkCheckFill size={100} />
                </div>
              }  
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
            </div>
          </div>
        </div>
        <div className="owner-info-summary">
          <div className="info-group">
            <div>
              <span>Nom</span>
              <strong>{proprietaireInfo.nom}</strong>
            </div>
            <div>
              <span>Prenom</span>
              <strong>{proprietaireInfo.prenom}</strong>
            </div>
            <div>
              <span>Date de naissance</span>
              <strong>
                {moment(proprietaireInfo.date_naissance).format("DD/MM/YYYY")}
              </strong>
            </div>
            <div>
              <span>Fonction</span>
              <strong>{proprietaireInfo.fonction}</strong>
            </div>
          </div>
          <div className="info-group">
            <div>
              <span>Affectation</span>
              <strong>{muministere.length > 0 && muministere}</strong>
            </div>
            <div>
              <span>Direction</span>
              <strong>
                {mudirection != "" && mudirection.length != 0
                  ? mudirection
                  : "Non Fourni."}
              </strong>
            </div>
            <div></div>
            <div></div>
          </div>
          <div className="info-group">
            <div>
              <span>Pièce d'identité</span>
              <div className="image">
                <img
                  src={previews.previews1 ? previews.previews1 : ""}
                  alt="Pièce d'identité"
                />
              </div>
            </div>
            <div>
              <span>Réçu de Paiement</span>
              <div className="image">
                <img
                  src={previews.previews2 ? previews.previews2 : ""}
                  alt="Réçu de Paiement"
                />
              </div>
            </div>
            <div></div>
            <div></div>
          </div>
          <Erreurs validation={erreurs} />
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
        <button className="secondary" onClick={handlePrevStep}>
          Precedent
        </button>
        <button className="primary-brown" onClick={handleSubmit}>
          {" "}
          Soumettre{" "}
        </button>
      </div>
    </div>
  );
};

export default StepFour;
