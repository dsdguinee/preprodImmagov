import {useEffect,useState,useMemo} from 'react';
import { BiUpload } from 'react-icons/bi'

const StepThree = ({ handleNextStep, handlePrevStep,setProprietaireInfo,proprietaireInfo,setStepChk,stepChk}) => {
  const [previews,setPreviews] = useState({previews1:'',previews2:''});

  const isstepValid = useMemo(() => {
    setPreviews({...previews,
      previews1: proprietaireInfo?.piece !='' && proprietaireInfo?.piece !='' ? URL.createObjectURL(proprietaireInfo.piece):'',
      previews2: proprietaireInfo?.paiement != '' && proprietaireInfo?.paiement ? URL.createObjectURL(proprietaireInfo.paiement):'',
    });
    return proprietaireInfo?.piece != '' && proprietaireInfo?.paiement != ''
  },[proprietaireInfo]);
  //console.log(isstepValid)
  useEffect(() => {
  
   setStepChk({...stepChk,step3:isstepValid});
  },[isstepValid]);

  const onFileChange = (event) => {
    if(event.target.files[0])
      setProprietaireInfo({...proprietaireInfo,[event.target.name]:event.target.files[0]}); 
  }
  return (
    <div className="step-three step-files">
      <div className="files">
        <div className="file-wrapper">
          <p>Pièce d'identité</p>
          <div className="image">
            <img src={previews.previews1?previews.previews1:""} alt="" />
          </div>
          <div className="upload-btn-wrapper">
            <button className="btn"> <BiUpload /> Importer une photo</button>
            <input type="file" name="piece" accept="image/*" onChange={onFileChange}/>
          </div>
        </div>

        <div className="file-wrapper">
          <p>Reçu de paiement</p>
          <div className="image">
            <img src={previews.previews2?previews.previews2:""} alt="" />
          </div>
          <div className="upload-btn-wrapper">
            <button className="btn"> <BiUpload /> Importer une photo</button>
            <input type="file" name="paiement" accept="image/*" onChange={onFileChange}/>
          </div>
        </div>
        <div></div>
        <div></div>
      </div>
      
      <div className="buttons">
        <button className="secondary" onClick={handlePrevStep}>
          Precedent
        </button>
        <button type='submit' onClick={handleNextStep} disabled={isstepValid?false:true}>Suivant</button>
      </div>
    </div>
  );
};

export default StepThree;
