import React, { useContext, useEffect, useState, useMemo } from "react";
import CartTable from "../CartTable/CartTable";
import { ElementContext, UserContext } from "../../services/Context/Context";
import Erreurs from "../Erreurs/Erreurs";
import { ToWords } from "to-words";
import {
  formatStringNumber,
  objecttoFormData,
} from "../../services/Helpers/fonctions";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";

const StepTwo = ({
  prevStep,
  nextStep,
  paiement,
  setPaiement,
  setPaiementInfo,
  paiementInfo,
  setActiveStep,
  activeStep,
}) => {
  const [sumMontant, setSumMontant] = useState(0);
  const [modeImma, setModeImma] = useState();
  const { elementsData } = useContext(ElementContext);
  const{agence} = useContext(UserContext);
  const [erreurs, setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);

  const api = new Api();
  const toWords = new ToWords({
    localeCode: "fr-FR",
    converterOptions: {
      currency: false,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
    },
  });

  useEffect(() => {
    
    let montant = 0;
    if (paiement.categorieCg == 4) montant = 30000;
    else if (paiement.categorieCg == 3 || paiement.categorieCg == 2)
      montant = 20000;
    else if (paiement.categorieCg == 1) montant = 10000;


    const _categorie = elementsData.categories.filter(
      (c) => c.categorie_id == paiement.categorieCg
    );
    const _vignette = elementsData.typeVignette.filter(
      (c) => c.typevg_id == paiement.typeVignette
    );
    const _cartegrise = elementsData.typeCarteGrise.filter(
      (c) => c.typecg_id == paiement.typeCg
    );
    const _autorisation = elementsData.autorisations.filter(
      (c) => c.autorisation_id == paiement.autorisation_id
    );
    if (
      Array.isArray(_categorie) &&
      Array.isArray(_vignette) &&
      Array.isArray(_vignette) &&
      Array.isArray(_cartegrise)
    )
      setPaiementInfo({
        ...paiementInfo,
        categorie: _categorie[0].nomCategorie,
        vignette: _vignette[0],
        cartegrise: _cartegrise[0],
        categorie_id: _categorie[0].categorie_id,
        autorisation: _autorisation ? _autorisation[0] : [],
        expressionCg: paiement.expressionCg,
        commission: montant,
        document:(paiement.isIT || paiement.isEP || paiement.isVA)?paiement.document:'Ordinaire'
      });
      setPaiement({...paiement,agence_id:agence.agence_id,commune_id:agence.commune_id,
        document:!paiement.isIT && !paiement.isEP && !paiement.isVA ? 'Ordinaire':paiement.document});
    if (paiement.modeImma == 1) setModeImma("Immatriculation");
    else if (paiement.modeImma == 2) setModeImma("Reimmatriculation");
   

  }, [agence]);

  useMemo(() => {
    let montantplaque = 0;
    if(paiement.isIT)
      montantplaque = 300000.0;
    else if(paiement.isEP || paiement.isVA)  
     montantplaque = 350000.0;

    setSumMontant(
      parseFloat(typeof paiementInfo?.cartegrise?.montant !== 'undefined' ? paiementInfo.cartegrise.montant: 0) +
      parseFloat(typeof paiementInfo?.vignette?.montant !== 'undefined'? paiementInfo.vignette.montant: 0) +
      parseFloat( paiementInfo.autorisation != undefined? parseFloat(paiementInfo.autorisation.montant): 0) +
      parseFloat(paiementInfo?.commission ? paiementInfo.commission:0)+parseFloat(montantplaque)
    );
  
  }, [paiementInfo]);

  const payer = async () => {
    try{
    setIsLoading(true);  
    var formData = objecttoFormData(paiement);
    setErreurs([])
    const { status, messages, data } = await api.apiData("post","/paiement/new",formData);
  
    if (status != 200) {
      if (messages) setErreurs(messages);
    } else {
      setPaiementInfo({
        ...paiementInfo,
        qrcodepath: data.qrpath,
        reference: data.reference,
        paiement_id: data.paiement_id,
      });
      setActiveStep(activeStep + 1);
    }
  }catch(error){
    console.log(error);
  } finally{
    setIsLoading(false);
  }
}
  
  return (
    <div className="step-component step-two">
      <h4>Paiement d'une {modeImma}</h4>
      <div className="table">
        <CartTable paiementInfo={paiementInfo} paiement={paiement} key="table" />
      </div>
      {!isNaN(sumMontant) && (
        <div className="total">
          <span>Total</span>
          <strong>{formatStringNumber(sumMontant)} fg</strong>
          <strong>{toWords.convert(sumMontant)}</strong> Francs Guinéens.
        </div>
      )}
      <div className="input-group">
        <div>
          <Erreurs validation={erreurs} />
        </div>
      </div>
      <div className="buttons">
        <button className="secondary" onClick={prevStep}>
          Précedent
        </button>
        <button className="primary" onClick={payer}>
          Payer
        </button>
      </div>
    </div>
  );
};

export default StepTwo;
