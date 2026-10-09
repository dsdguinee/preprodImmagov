import { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  getMinistereById,
  getDirectionByID,
} from "../../services/organisation.service";
import toast from "react-hot-toast";
import { ResoumissionReforme } from "../../services/immatriculation.service";
import Erreurs from "../../components/erreurs/Erreurs";
import Viewer from "react-viewer";
import Spinner from "../Spinner/Spinner";

const StepFour = ({
  handlePrevStep,
  proprietaireInfo,
  immatriculationInfo,
}) => {
  const [previews, setPreviews] = useState({ piece: "", paiement: "" });
  const [muministere, setMuminstere] = useState("");
  const [mudirection, setMudirection] = useState("");
  const url = process.env.REACT_APP_URL + "/storage/";

  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const images = [
    { src: url + immatriculationInfo?.pieceJointe },
    {
      src:
        typeof proprietaireInfo.piece === "string" ||
        proprietaireInfo.piece instanceof String
          ? url + proprietaireInfo.piece
          : URL.createObjectURL(proprietaireInfo.piece),
    },
    {
      src:
        typeof proprietaireInfo.paiement === "string" ||
        proprietaireInfo.paiement instanceof String
          ? url + proprietaireInfo.paiement
          : URL.createObjectURL(proprietaireInfo.paiement),
    },
  ];
  const handleImageClick = (index) => {
    setImageIndex(index);
    setIsVisible(true);
  };

  useEffect(() => {
    setPreviews({
      ...previews,
      piece:
        typeof proprietaireInfo.piece === "string" ||
        proprietaireInfo.piece instanceof String
          ? url + proprietaireInfo.piece
          : URL.createObjectURL(proprietaireInfo.piece),
      paiement:
        typeof proprietaireInfo.paiement === "string" ||
        proprietaireInfo.paiement instanceof String
          ? url + proprietaireInfo.paiement
          : URL.createObjectURL(proprietaireInfo.paiement),
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
    var formeData = new FormData();
    formeData.append("reforme_id", proprietaireInfo.reforme_id);
    formeData.append("nom", proprietaireInfo.nom);
    formeData.append("prenom", proprietaireInfo.prenom);
    formeData.append("date_naissance", proprietaireInfo.date_naissance);
    formeData.append("fonction", proprietaireInfo.fonction);
    formeData.append("ministere_id", proprietaireInfo.ministere);
    formeData.append(
      "direction_id",
      proprietaireInfo.direction ? proprietaireInfo.direction : 0
    );
    formeData.append("valeurResiduelle", immatriculationInfo.valeurResiduelle);
    formeData.append(
      "piece",
      typeof proprietaireInfo.piece === "string" ||
        proprietaireInfo.piece instanceof String
        ? ""
        : proprietaireInfo.piece
    );
    formeData.append(
      "piece",
      typeof proprietaireInfo.paiement === "string" ||
        proprietaireInfo.paiement instanceof String
        ? ""
        : proprietaireInfo.paiement
    );

    const { status, messages } = await ResoumissionReforme(formeData);
    setIsLoading(true);
    if (status != 200) {
      setIsLoading(false);
      toast.error("Echec d'enregistrement!");
      setErreurs(messages);
    } else {
      setIsLoading(false);
      toast.success("Resoumission effectuée avec succès.");
      navigate("/liste-reforme");
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
              <strong>{immatriculationInfo.ancienMinistere}</strong>
            </div>
            <div>
              <span>Numero d'immatriculation</span>
              <strong>{immatriculationInfo?.immatriculation_number}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{immatriculationInfo?.statusReforme}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Provenance</span>
              <strong>{immatriculationInfo?.pays}</strong>
            </div>
            <div>
              <span>Genre de véhicule</span>
              <strong>{immatriculationInfo?.genre}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{immatriculationInfo?.typeVehicule}</strong>
            </div>
            <div>
              <span>Marque</span>
              <strong>{immatriculationInfo?.marque}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Modèle</span>
              <strong>{immatriculationInfo?.model}</strong>
            </div>
            <div>
              <span>Année</span>
              <strong>{immatriculationInfo?.madeYear}</strong>
            </div>
            <div>
              <span>Carosserie</span>
              <strong>{immatriculationInfo?.carosserie}</strong>
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
              <strong>{immatriculationInfo?.releaseYear}</strong>
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
              <strong>{immatriculationInfo?.kilometrage}</strong>
            </div>
            <div>
              <span>Cylindre</span>
              <strong>{immatriculationInfo?.cylinderNumber}</strong>
            </div>
          </div>

          <div className="info-group">
            <div>
              <span>Valeur résiduelle</span>
              <strong>{immatriculationInfo?.valeurResiduelle}</strong>
            </div>
            <div>
              <span>Mode d'acquisition</span>
              <strong>{immatriculationInfo?.acquisition}</strong>
            </div>
            <div>
              <span>Puissance Administrative en CV</span>
              <strong>{immatriculationInfo.pa}</strong>
            </div>
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
              <div className="image" onClick={() => handleImageClick(4)}>
                <img src={previews.piece} alt="Pièce d'identité" />
              </div>
            </div>
            <div>
              <span>Réçu de Paiement</span>
              <div className="image" onClick={() => handleImageClick(5)}>
                <img src={previews.paiement} alt="Réçu de Paiement" />
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
          Resoumettre
        </button>
      </div>
    </div>
  );
};

export default StepFour;
