import {useState} from 'react';
import { NavLink } from "react-router-dom";
import moment from 'moment';
import 'moment/locale/fr';
import { useForm } from "react-hook-form";
import Viewer from 'react-viewer';
const StepOne = ({ handleNextStep,immatriculationInfo,affectation,status,pays,genre,vehiculeInfo,typeVehicule,marque,modele,setImmaInfo,immaInfo }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const url = process.env.REACT_APP_URL + '/storage/';
  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

   const handleInput = (e) => {
    setImmaInfo({...immaInfo,[e.target.name]:e.target.value})
   }
   const images = [
    {src: url + vehiculeInfo?.pieceJointe},
  ]
  const handleImageClick = (index) => {
    setImageIndex(index)
    setIsVisible(true)
  }
    return (
      <div className="step-one">
       <form  onSubmit={handleSubmit(handleNextStep)}>
          <div className="infos">
            <div className="info-group">
              <div>
                <span>Mode d'Immatriculation</span>
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
                <strong>{vehiculeInfo?.releaseYear ? moment(vehiculeInfo?.releaseYear).format("DD-MMMM-YYYY"):'Non Fournie'}</strong>
              </div>
              <div>
                <span>Ancien numero d'immatriculation</span>
                <strong>{immatriculationInfo?.ancienImmatriculation?immatriculationInfo?.ancienImmatriculation:"Non Fournie"}</strong>
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
                <span>Fonds de dossier</span>
                <div className="image" onClick={() => handleImageClick(0)}>
                  <img src={vehiculeInfo?.pieceJointe !== undefined  ? url + vehiculeInfo?.pieceJointe:""} alt="" />
                </div>
              </div>
              <div className="image-viewer">
                <Viewer
                  visible={isVisible}
                  onClose={() => { setIsVisible(false); } }
                  images={images}
                  activeIndex={imageIndex}
                />
            </div>
            </div>
          </div>
          <div className="buttons">
            <button  className="secondary">
              <NavLink  to="/mutation">
                  Retour
                </NavLink>  
            </button>   
            <button className="primary" type="submit">Suivant</button>
          </div>
        </form>
      </div>
    );
  };
  
  export default StepOne;
  