import { useState, useContext, useEffect } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import "moment/locale/fr";
import Viewer from "react-viewer";
import { ResoumissionMutation } from "../../services/immatriculation.service";
import toast from "react-hot-toast";
import Erreurs from "../erreurs/Erreurs";
import { getDirectionByID, getMinistereById } from "../../services/organisation.service";
import Spinner from "../Spinner/Spinner";

const StepThree = ({ handlePrevStep, setMutationInfo,mutationInfo,status,pays,ministeres }) => {
  const navigate = useNavigate();
  const [erreurs, setErreurs] = useState([]);
  const url = process.env.REACT_APP_URL + "/storage/";
  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [nouveauministere, setNouveauministere] = useState("");
  const [nouvelledirection, setNouvelledirection] = useState("");
  const [previews, setPreviews] = useState({ document1: "", document2: "" });
  const [isLoading, setIsLoading] = useState(false);
  const images = [
    { src: url + mutationInfo?.pieceJointe },
    { src: typeof mutationInfo.document1 === 'string' || mutationInfo.document1 instanceof String || mutationInfo.document1 == null
    ? url+ mutationInfo.document1:URL.createObjectURL(mutationInfo.document1) },
    { src: typeof mutationInfo.document2 === 'string' || mutationInfo.document2 instanceof String || mutationInfo.document2 == null
    ? url+ mutationInfo.document2:URL.createObjectURL(mutationInfo.document2) },
  ];

  useEffect(() => {
    if(mutationInfo.document1 != null || mutationInfo.document2 != null){
    setPreviews({
      ...previews,
      document1: typeof mutationInfo.document1 === 'string' || mutationInfo.document1 instanceof String || mutationInfo.document1 == null
          ? url+ mutationInfo.document1:URL.createObjectURL(mutationInfo.document1),
       document2: typeof mutationInfo.document2 === 'string' || mutationInfo.document2 instanceof String || mutationInfo.document2 == null
      ? url+ mutationInfo.document2:URL.createObjectURL(mutationInfo.document2),
       });
      }
     
    getDirectionByID(mutationInfo.nouveauDirection_id).then((resp) => {
       setNouvelledirection(resp);
    })
    getMinistereById(mutationInfo.nouveauMinistere_id).then((resp) => {
      setNouveauministere(resp);
    })
  }, [ministeres]);
  const handleImageClick = (index) => {
    setImageIndex(index);
    setIsVisible(true);
  };

  const handleSoumettre = async (e) => {
    e.preventDefault();
    var formData = new FormData();
    formData.append("immatriculation_id", mutationInfo.immatriculation_id);
    formData.append('mutation_id',mutationInfo.mutation_id);
    formData.append("fonction", mutationInfo.fonction);
    formData.append("ministere_id", mutationInfo.nouveauMinistere_id);
    formData.append("direction_id", mutationInfo.nouveauDirection_id);
    formData.append("motif", mutationInfo.motif);
    formData.append('ancienDirection_id',mutationInfo.ancienDirection_id);
    formData.append('ancienMinistere_id',mutationInfo.ancienMinistere_id);
    formData.append("document1", typeof mutationInfo.document1 === 'string' || mutationInfo.document1 != null instanceof String 
    ? '':mutationInfo.document1);
    formData.append("document2",typeof mutationInfo.document2 === 'string' || mutationInfo.document2 != null instanceof String 
    ? '':mutationInfo.document2);

    const {status,messages} = await ResoumissionMutation(formData);
    setIsLoading(true);
    if (status == 200) {
      navigate("/liste-mutation");
      setIsLoading(false);
      toast.success("Resoumission de la mutation Effectée avec succès");
    } else {
      setIsLoading(false);
      toast.error("Echec de Mutation!");
      setErreurs(messages);
    }
  };
  return (
    <div className="step-three step-submit">
      {isLoading && <Spinner />}
      <form>
        <div className="summary">
          <div className="vehicle-info-summary">
            <div className="info-group">
              <div>
                <span>Mode d'exploitation</span>
                <strong>
                  {mutationInfo?.modeImmatriculation}
                </strong>
              </div>
              <div>
                <span>Ancien Ministère d'Affectation</span>
                <strong>{mutationInfo?.ancienMinistere}</strong>
              </div>
              <div>
                <span>Numero d'immatriculation</span>
                <strong>
                  {mutationInfo?.immatriculation_number}
                </strong>
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
                <strong>{mutationInfo?.genre}</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{mutationInfo?.typeVehicule}</strong>
              </div>
              <div>
                <span>Marque</span>
                <strong>{mutationInfo?.marque}</strong>
              </div>
            </div>

            <div className="info-group">
              <div>
                <span>Modèle</span>
                <strong>{mutationInfo?.model}</strong>
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
                <strong>
                  {mutationInfo?.placeNumberAssis}
                </strong>
              </div>
              <div>
                <span>Places debout</span>
                <strong>
                  {mutationInfo?.placeNumberDebout}
                </strong>
              </div>
            </div>

            <div className="info-group">
              <div>
                <span>Premiere mise en cirulation</span>
                <strong>
                  {mutationInfo?.releaseYear
                    ? moment(mutationInfo?.releaseYear).format(
                        "DD-MMMM-YYYY"
                      )
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
                <strong>
                  {mutationInfo?.kilometrage
                    ? mutationInfo?.kilometrage
                    : "Non Fournie"}
                </strong>
              </div>
              <div>
                <span>Cylindre</span>
                <strong>
                  {mutationInfo?.kilometrage
                    ? mutationInfo?.cylinderNumber
                    : "Non Fournie"}
                </strong>
              </div>
            </div>

            <div className="info-group">
              <div>
                <span>Fond de Dossier</span>
                <div className="image" onClick={() => handleImageClick(0)}>
                  <img
                    src={
                      mutationInfo.pieceJointe !== undefined
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
          <div className="owner-info-summary">
            <div className="info-group">
              <div>
                <span>Affectation</span>
                <strong>{nouveauministere}</strong>
              </div>
              <div>
                <span>Direction</span>
                <strong>
                  {nouvelledirection ? nouvelledirection : "Non Fournie"}
                </strong>
              </div>
              <div>
                <span>Fonction</span>
                <strong>
                  {mutationInfo?.fonction
                    ? mutationInfo?.fonction
                    : "Non Fournie"}
                </strong>
              </div>
            </div>
            <div className="info-group">
              {mutationInfo.document1 && (
                <div>
                  <span>Document 1</span>
                  <div className="image" onClick={() => handleImageClick(4)}>
                    <img
                      src={previews.document1}
                      alt=""
                    />
                  </div>
                </div>
              )}
              {mutationInfo.document2 && (
                <div>
                  <span>Document 2</span>
                  <div className="image" onClick={() => handleImageClick(5)}>
                    <img
                      src={previews.document2}
                      alt=""
                    />
                  </div>
                </div>
              )}
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
        <Erreurs validation={erreurs} />
        <div className="buttons">
          <button className="secondary" onClick={handlePrevStep}>
            Precedent
          </button>
          <button className="primary-yellow" onClick={handleSoumettre}>
            Resoumettre
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepThree;
