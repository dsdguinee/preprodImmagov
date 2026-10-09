import { useEffect, useState, useMemo } from "react";
import { BiUpload } from "react-icons/bi";

const StepThree = ({
  handleNextStep,
  handlePrevStep,
  setProprietaireInfo,
  proprietaireInfo,
  stepChk,
  setStepChk,
}) => {
  const [previews, setPreviews] = useState({ piece: "", paiement: "" });
  const url = process.env.REACT_APP_URL + "/storage/";
 
  const isstepValid = useMemo(() => {
    return proprietaireInfo?.piece != "" && proprietaireInfo?.paiement != "";
  }, [proprietaireInfo]);

  useEffect(() => {
    setPreviews({
      ...previews,
      piece: typeof proprietaireInfo.piece === 'string' || proprietaireInfo.piece instanceof String 
          ? url+ proprietaireInfo.piece:URL.createObjectURL(proprietaireInfo.piece),
      paiement: typeof proprietaireInfo.paiement === 'string' || proprietaireInfo.paiement instanceof String 
      ? url+ proprietaireInfo.paiement:URL.createObjectURL(proprietaireInfo.paiement),
    });
    setStepChk({...stepChk,step4:isstepValid})
  }, [proprietaireInfo,isstepValid]);
  const onFileChange = (event) => {
    setPreviews({...previews,[event.target.name]:URL.createObjectURL(event.target.files[0])});
    setProprietaireInfo({
      ...proprietaireInfo,
      [event.target.name]: event.target.files[0],
    });
  };
  return (
    <div className="step-three step-files">
      <div className="files">
        <div className="file-wrapper">
          <p>Pièce d'identité</p>
          <div className="image">
            <img src={previews.piece} alt="" />
          </div>
          <div className="upload-btn-wrapper">
            <button className="btn">
              {" "}
              <BiUpload /> Importer une photo
            </button>
            <input
              type="file"
              name="piece"
              accept="image/*"
              onChange={onFileChange}
            />
          </div>
        </div>

        <div className="file-wrapper">
          <p>Reçu de paiement</p>
          <div className="image">
            <img src={previews.paiement} alt="" />
          </div>
          <div className="upload-btn-wrapper">
            <button className="btn">
              {" "}
              <BiUpload /> Importer une photo
            </button>
            <input
              type="file"
              name="paiement"
              accept="image/*"
              onChange={onFileChange}
            />
          </div>
        </div>
        <div></div>
        <div></div>
      </div>

      <div className="buttons">
        <button className="secondary" onClick={handlePrevStep}>
          Precedent
        </button>
        <button
          type="submit"
          onClick={handleNextStep}
          disabled={isstepValid ? false : true}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default StepThree;
