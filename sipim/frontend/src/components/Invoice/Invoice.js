import React,{useEffect,useState,useMemo, useContext} from 'react';
import {useLocation} from 'react-router-dom';
import CartTable from '../CartTable/CartTable';
import {formatStringNumber, isEmpty} from "../../services/Helpers/fonctions";
import moment from "moment";
import 'moment/locale/fr';
import { ToWords } from 'to-words';
import { UserContext } from '../../services/Context/Context';

const Invoice = React.forwardRef((props, ref) => {
  const location = useLocation();
  const[paiementInfo,setPaiementInfo] = useState({});
  const [paiement,setPaiement] = useState({});
  const [modeImma,setModeImma] = useState();
  const {user,agence} = useContext(UserContext);
  const url = process.env.REACT_APP_URL.replace('api/','') + 'storage/';
  const toWords = new ToWords({
    localeCode: 'fr-FR',
    converterOptions: {
      currency: false,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
    }
  });
  const[sumMontant,setSumMontant] = useState(0);

  useEffect(() => {
    if(location.state){
      setPaiementInfo(location.state.paiementInfo);
      setPaiement(location.state.paiement);
    }
  }, [location]);

  useMemo(() => {
    //console.log(paiementInfo);
    if(!isEmpty(paiementInfo))
     setSumMontant(parseFloat(paiementInfo.cartegrise?.montant!=''? paiementInfo.cartegrise?.montant:0) + parseFloat(paiementInfo.vignette?.montant!=""?paiementInfo.vignette.montant:0) 
         + parseFloat(paiementInfo.autorisation != undefined?paiementInfo.autorisation?.montant:0) + parseFloat(paiementInfo?.commission));
    if(paiement.modeImma == 1)
      setModeImma("Immatriculation")
    else if(paiement.modeImma == 2)
      setModeImma("Reimmatriculation")      
  },[paiementInfo]);
  
  return (
    <div className="invoice" ref={ref}>
        <div className="head">
          <h1>Reçu de paiement</h1>
          <div className="logo">LOGO</div>
        </div>
        <div className="bill-details">
          <div className="from">
            <span className="subtitle">Par </span>
            <strong>DSD Guinée</strong>
            <p>Agence de {agence.nom_agence}</p>
            <p>{agence.localite}</p>
            <p>Agent#<strong>{ user.prenom } { user.nom }</strong></p>
          </div>
          <div className="to">
            <span className="subtitle">Client </span>
            <span>Type :<strong> {paiement.typeClient}</strong></span>
            <strong>{paiement.fullName}</strong>
            <p>{paiement.tel}</p>
          </div>
          <div className="details">
            <span className="subtitle">Détails </span>
            <div>
              <span>Num. Chassis  </span>
              <strong>{paiement.chassis}</strong>
            </div>
            <div>
               <span>Mode Immat.</span>
               <strong>{modeImma}</strong>
            </div>
            <div>
              <span>Num. Reference : </span>
              <strong>{paiementInfo.reference}</strong>
            </div>
            <div>
              <span>Date d'émission : </span>
              <strong>{moment().format('DD/MM/YYYY HH:mm')}</strong>
            </div>
          </div>
        </div>
        <div className="array">
          <CartTable paiementInfo={paiementInfo} />
        </div>
        { !isNaN(sumMontant) &&  (
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
          <div style={{paddingBottom:'10px'}}>
              <span>Total : <strong>{formatStringNumber(sumMontant)} </strong>fg</span>
          </div>
          <div><strong>{toWords.convert(sumMontant)}</strong> Francs Guinéens</div>
        </div>
         )
      }
       
        <div className="signature">
          <p>Signature de l'agent</p>
          <p>Signature du client</p>
          <p>QR Code
            {paiementInfo.qrcodepath != undefined &&
              <img src={url+paiementInfo.qrcodepath} style={{width:'50px'}}/>
            }
          </p>
        </div>
        <div className="invoice-footer">
          <p>
            Pour toute information complémentaire, appelez le 8163 ou consultez
            le portail internet de VPC-Guinée{" "}
            <a href="https://vignettesgn.ecash-guinee.com/client">
              https://vignettesgn.ecash-guinee.com/client
            </a>
          </p>
          <p>DSD vous remercie.</p>
        </div>
      </div>
  )
})

export default Invoice