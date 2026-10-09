import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import SuccessCheck from "../SuccessCheck/SuccessCheck";

const StepThree = ({paiementInfo}) => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      //navigate('/payment/invoice',{state:{paiementInfo:paiementInfo,paiement:paiement}})

      navigate(`/payment/invoice/${paiementInfo.paiement_id}`)
    }, 5000);
  },[])

  return (
    <div className="step-component step-three">
      <h4>Votre paiement a été effectué avec succès.</h4>
      <div className="success-animation">
        <SuccessCheck />
      </div>
      <p>Vous allez être redirigé vers votre reçu dans 5 secondes.</p>
    </div>
  );
};

export default StepThree;
