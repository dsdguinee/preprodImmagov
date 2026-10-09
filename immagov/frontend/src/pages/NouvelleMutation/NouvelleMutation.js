import { useState, useContext, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import StepOne from "../../components/Mutation/StepOne";
import StepThree from "../../components/Mutation/StepThree";
import StepTwo from "../../components/Mutation/StepTwo";
import { ComboContext } from "../../services/Context/Contexts";
import { getImmatriculationById } from "../../services/immatriculation.service";
import { getPaysByID } from "../../utils/helper/functions";
import Spinner from "../../components/Spinner/Spinner";
import { Helmet } from 'react-helmet-async'

const NouvelleMutation = () => {
  const { id } = useParams();
  const url = process.env.REACT_APP_URL + "/storage/";
  const [vehiculeInfo, setVehiculeInfo] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [immatriculationInfo, setImmatriculationInfo] = useState();
  const [stepChk, setStepChk] = useState({step1:false,step2:false,step3:false});
  const [affectation, setAffectation] = useState("Non Affecte");
  const { genres, modeles, marques, typeVehicules, ministeres,directions } = useContext(ComboContext);
  const [genre, setGenre] = useState();
  const [status, setStatus] = useState(false);
  const [typeVehicule, setTypeVehicule] = useState();
  const [modele, setModele] = useState();
  const [marque, setMarque] = useState();
  const [pays, setPays] = useState();
  const [step, setStep] = useState(1);
  const [immaInfo, setImmaInfo] = useState({
    immatriculation_id: id,
    ministere: 0,
    direction: 0,
    motif: "",
    document1: "",
    document2: "",
    affectation_id: "",
    direction_id: "",
    fonction:"",
    immatriculationInfo2: {
      pays: "",
      modeImmatriculation: "",
      immatriculation_number: "",
      affectation: "",
      genre: "",
      status: "",
      type: "",
      marque: "",
      modele: "",
      annee: "",
      carosserie: "",
      energy: "",
      numChassie: "",
      nbPorte: "",
      placeNumberAssis: "",
      placeNumberDebout: "",
      releaseYear: "",
      ancienImmatriculation: "",
      kilometrage: "",
      cylinderNumber: "",
      pieceJointe: "",
    },
  });
   
  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };
  useMemo(() => {
    setIsLoading(true);
    if (immatriculationInfo) {
      setStepChk({...stepChk,step1:true});
      setPays(getPaysByID(vehiculeInfo?.provenance));
      if (immatriculationInfo.status === 0) setStatus("En attente");
      else if (immatriculationInfo.status === 1) setStatus("Validée");
      else if (immatriculationInfo.status === 2) {
        setStatus("Rejetée");
      } else if (immatriculationInfo.status === 4) {
        setStatus("Mutée");
      }

      if (Array.isArray(ministeres) && ministeres.length > 0) {
        if (immatriculationInfo.minister_id != 1000000) {
          setAffectation(
            ministeres.filter(
              (m) => m.ministere_id == immatriculationInfo.minister_id
            )[0].nom
          );
        } else setAffectation(immatriculationInfo.autreministere);
      }

      if (Array.isArray(genres) && genres.length != 0)
        setGenre(genres.filter((g) => g.genre_id == vehiculeInfo.genre)[0].nom);
      if (Array.isArray(typeVehicules) && typeVehicules.length != 0)
        setTypeVehicule(
          typeVehicules.filter((g) => g.type_id == vehiculeInfo.typeVehicule)[0]
            .nom
        );
      if (Array.isArray(modeles) && modeles.length != 0)
        setModele(
          modeles.filter((m) => m.id == vehiculeInfo.model_id)[0].title
        );
      if (Array.isArray(marques) && marques.length != 0)
        setMarque(
          marques.filter((m) => m.id == vehiculeInfo.marque_id)[0].title
        );
      setImmaInfo({
        ...immaInfo,
        affectation_id: immatriculationInfo.minister_id,
        direction_id: immatriculationInfo.direction_id,
        immatriculationInfo2: {
          pays: pays,
          modeImmatriculation: immatriculationInfo.modeImmatriculation,
          affectation: affectation,
          immatriculation_number: immatriculationInfo.immatriculation_number,
          status: status,
          genre: genre,
          type: typeVehicule,
          marque: marque,
          modele: modele,
          annee: vehiculeInfo.madeYear,
          carosserie: vehiculeInfo.carosserie,
          energy: vehiculeInfo.energy,
          numChassie: vehiculeInfo.numChassie,
          nbPorte: vehiculeInfo.nbPorte,
          placeNumberAssis: vehiculeInfo.placeNumberAssis,
          placeNumberDebout: vehiculeInfo.placeNumberDebout,
          releaseYear: vehiculeInfo.releaseYear,
          ancienImmatriculation: immatriculationInfo.ancienImmatriculation,
          kilometrage: vehiculeInfo.kilometrage,
          cylinderNumber: vehiculeInfo.cylinderNumber,
          pieceJointe: vehiculeInfo.pieceJointe,
        },
      });
    }
    setIsLoading(false);
  }, [immatriculationInfo, pays,modeles]);
  const getDetails = async (currentID) => {
    const { immatriculation, vehicule } = await getImmatriculationById(
      currentID
    );
    setImmatriculationInfo(immatriculation);
    setVehiculeInfo(vehicule);
  };
  useEffect(() => {
    getDetails(id);
  }, [id]);
  return (
    <div className="nouvelle-mutation-page page">
      <Helmet>
        <title>Nouvelle mutation</title>
      </Helmet>
      <h2>Nouvelle mutation</h2>
      <div className="stepper">
        <div
          className={`step ${step === 1 && "step-active"}`}
          onClick={() =>   setStep(1)}
        >
          <div className="step-number">
            <span>1</span>
          </div>
          <div className="step-label">
            <p>Infos du vehicule</p>
          </div>
        </div>
        <div
          className={`step ${step === 2 && "step-active"}`}
          onClick={() =>  stepChk.step1 && setStep(2)}
        >
          <div className="step-number">
            <span>2</span>
          </div>
          <div className="step-label">
            <p>Infos du proprietaire</p>
          </div>
        </div>
        <div
          className={`step ${step === 3 && "step-active"}`}
          onClick={() => stepChk.step2 && setStep(3)}
        >
          <div className="step-number">
            <span>3</span>
          </div>
          <div className="step-label">
            <p>Soumission</p>
          </div>
        </div>
      </div>
      <div className="step-components">
        {step === 1 && (
          <StepOne
            handleNextStep={handleNextStep}
            immatriculationInfo={immatriculationInfo}
            affectation={affectation}
            status={status}
            pays={pays}
            genre={genre}
            vehiculeInfo={vehiculeInfo}
            typeVehicule={typeVehicule}
            marque={marque}
            modele={modele}
            setImmaInfo={setImmaInfo}
            immaInfo={immaInfo}
        
          />
        )}
        {step === 2 && (
          <StepTwo
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            immaInfo={immaInfo}
            setImmaInfo={setImmaInfo}
            ministeres={ministeres}
            directions={directions}
            setStepChk={setStepChk}
            stepChk={stepChk}
          />
        )}
        {step === 3 && (
          <StepThree
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            immaInfo={immaInfo}
          />
        )}
      </div>
    </div>
  );
};

export default NouvelleMutation;
