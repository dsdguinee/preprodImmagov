import { useState,useContext,useEffect } from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import 'moment/locale/fr';
import Viewer from 'react-viewer';
import { mutation } from '../../services/immatriculation.service';
import toast from 'react-hot-toast';
import Erreurs from '../erreurs/Erreurs';
import { ComboContext } from "../../services/Context/Contexts";
import { getDirectionByID } from '../../services/organisation.service';
import Spinner from '../Spinner/Spinner';
const StepThree = ({ handlePrevStep,immaInfo }) => {
   const navigate = useNavigate();  
   const [erreurs,setErreurs] = useState([]);
   const url = process.env.REACT_APP_URL + '/storage/';
  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [nouveauministere,setNouveauministere] = useState('');
  const [nouvelledirection,setNouvelledirection] = useState('');
  const {ministeres} = useContext(ComboContext);
  const images = [
    {src: url + immaInfo.immatriculationInfo2?.pieceJointe},
    {src: immaInfo.document1 !== '' && immaInfo.document1 ? URL.createObjectURL(immaInfo.document1):''},
    {src: immaInfo.document2 !== '' && immaInfo.document2  ? URL.createObjectURL(immaInfo.document2):''},

  ]
  const [isLoading,setIsLoading] = useState(false);
  useEffect(() => {
   setNouveauministere(ministeres.filter(m => m.ministere_id == immaInfo.ministere)[0].nom);
   if(immaInfo.direction != 0)
   {
     getDirectionByID(immaInfo.direction).then((resp) => {
       if(!resp.status)
        setNouvelledirection(resp); 
     })
   }
  }, [ministeres])
  const handleImageClick = (index) => {
    setImageIndex(index)
    setIsVisible(true)
  }

  const handleSoumettre = async (e) => {
    e.preventDefault();setErreurs([]);
    setIsLoading(true);
    var formData = new FormData();
    formData.append('immatriculation_id',immaInfo.immatriculation_id);
    formData.append('ministere',immaInfo.ministere);
    formData.append('direction',immaInfo.direction);
    formData.append('motif',immaInfo.motif);
    formData.append('document1',immaInfo.document1);
    formData.append('document2',immaInfo.document2);
    formData.append('affectation_id',immaInfo.affectation_id);
    formData.append('affecation_direction_id',immaInfo.direction_id);
    formData.append('fonction',immaInfo.fonction);
    const result = await mutation(formData);
    if(result.success){
      setIsLoading(false);navigate('/mutation');toast.success('Mutation Effectée avec succès');
    }else{
      setIsLoading(false); toast.error("Echec de Mutation!");setErreurs(result.messages);
    }

  }
    return (
      <div className="step-three step-submit">
          <form>
          {isLoading && <Spinner />}
            <div className="summary">
              <div className="vehicle-info-summary">
                <div className="info-group">
                  <div>
                    <span>Mode d'exploitation</span>
                    <strong>{immaInfo.immatriculationInfo2?.modeImmatriculation}</strong>
                  </div>
                  <div>
                    <span>Ancienne Affectation</span>
                    <strong>{immaInfo.immatriculationInfo2?.affectation}</strong>
                  </div>
                  <div>
                    <span>Numero d'immatriculation</span>
                    <strong>{immaInfo.immatriculationInfo2?.immatriculation_number}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{immaInfo.immatriculationInfo2?.status}</strong>
                  </div>
                </div>
      
                <div className="info-group">
                  <div>
                    <span>Provenance</span>
                    <strong>{immaInfo.immatriculationInfo2?.pays}</strong>
                  </div>
                  <div>
                    <span>Genre de véhicule</span>
                    <strong>{immaInfo.immatriculationInfo2?.genre}</strong>
                  </div>
                  <div>
                    <span>Type</span>
                    <strong>{immaInfo.immatriculationInfo2?.type}</strong>
                  </div>
                  <div>
                    <span>Marque</span>
                    <strong>{immaInfo.immatriculationInfo2?.marque}</strong>
                  </div>
                </div>
      
                <div className="info-group">
                  <div>
                    <span>Modèle</span>
                    <strong>{immaInfo.immatriculationInfo2?.modele}</strong>
                  </div>
                  <div>
                    <span>Année</span>
                    <strong>{immaInfo.immatriculationInfo2?.annee}</strong>
                  </div>
                  <div>
                    <span>Carosserie</span>
                    <strong>{immaInfo.immatriculationInfo2?.carosserie}</strong>
                  </div>
                  <div>
                    <span>Energie</span>
                    <strong>{immaInfo.immatriculationInfo2?.energy}</strong>
                  </div>
                </div>
      
                <div className="info-group">
                  <div>
                    <span>Numero de chassis</span>
                    <strong>{immaInfo.immatriculationInfo2?.numChassie}</strong>
                  </div>
                  <div>
                    <span>Nombre de portes</span>
                    <strong>{immaInfo.immatriculationInfo2?.nbPorte}</strong>
                  </div>
                  <div>
                    <span>Places assises</span>
                    <strong>{immaInfo.immatriculationInfo2?.placeNumberAssis}</strong>
                  </div>
                  <div>
                    <span>Places debout</span>
                    <strong>{immaInfo.immatriculationInfo2?.placeNumberDebout}</strong>
                  </div>
                </div>
      
                <div className="info-group">
                  <div>
                    <span>Premiere mise en cirulation</span>
                    <strong>{immaInfo.immatriculationInfo2?.releaseYear ? moment(immaInfo.immatriculationInfo2?.releaseYear).format("DD-MMMM-YYYY"):'Non Fournie'}</strong>
                  </div>
                  <div>
                    <span>Ancien numero d'immatriculation</span>
                    <strong>{immaInfo.immatriculationInfo2?.ancienImmatriculation?immaInfo.immatriculationInfo2?.ancienImmatriculation:'Non Fournie'}</strong>
                  </div>
                  <div>
                    <span>Kilometrage</span>
                    <strong>{immaInfo.immatriculationInfo2?.kilometrage?immaInfo.immatriculationInfo2?.kilometrage:'Non Fournie'}</strong>
                  </div>
                  <div>
                    <span>Cylindre</span>
                    <strong>{immaInfo.immatriculationInfo2?.kilometrage?immaInfo.immatriculationInfo2?.cylinderNumber:'Non Fournie'}</strong>
                  </div>
                </div>
      
      
                <div className="info-group">
                  <div>
                    <span>Fonds de dossier</span>
                    <div className="image"onClick={() => handleImageClick(0)}>
                      <img src={immaInfo.immatriculationInfo2?.pieceJointe !== undefined ? url + immaInfo.immatriculationInfo2?.pieceJointe:''} alt="" />
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
              <div className="owner-info-summary">
                <div className="info-group">
                  <div>
                    <span>Nouvelle Affectation</span>
                    <strong>{nouveauministere}</strong>
                  </div>
                  <div>
                    <span>Direction</span>
                    <strong>{nouvelledirection?nouvelledirection:'Non Fournie'}</strong>
                  </div>
                  <div>
                    <span>Motif</span>
                    <strong>{immaInfo.motif}</strong>
                  </div>
                  <div></div>
                </div>
                <div className="info-group">
                { immaInfo.document1 &&
                  <div>
                    <span>Document 1</span>
                    <div className="image" onClick={() => handleImageClick(4)}>
                      <img src={immaInfo.document1 !== '' && immaInfo.document1 ? URL.createObjectURL(immaInfo.document1):''} alt="" />
                    </div>
                  </div>}
                  {immaInfo.document2 &&
                  <div>
                    <span>Document 2</span>
                    <div className="image" onClick={() => handleImageClick(5)}>
                      <img src={immaInfo.document2 !== '' && immaInfo.document2 ? URL.createObjectURL(immaInfo.document2):''} alt="" />
                    </div>
                  </div>}
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
            <Erreurs validation = {erreurs} />
            <div className="buttons">
              <button className="secondary" onClick={handlePrevStep}>
                Precedent
              </button>
              <button className="primary-yellow" onClick={handleSoumettre}> Soumettre </button>
            </div>
        </form>
      </div>
    );
  };
  
  export default StepThree;
  