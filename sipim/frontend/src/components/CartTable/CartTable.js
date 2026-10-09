import {formatStringNumber, isEmpty} from "../../services/Helpers/fonctions";
const CartTable = ({ paiementInfo ,paiement}) => {
 // console.log(paiement)

 const spanNum = () => {

    if((paiement?.autorisation_id !== 0 && paiement?.typeCg !== 0 && paiement?.typeVignette !== 0 && (paiementInfo?.document === 'IT' 
      || paiementInfo?.document === 'EP')))
       return 4;
      else if(paiement?.autorisation_id !== 0 && paiement?.typeCg !== 0 && paiement?.typeVignette !== 0)
        return 3;
      else{
         return 2;   
      }
 
 }
 
  const contenuCartegrise = () => {
    if(paiementInfo.document === 'vignette' || paiementInfo.document === 'autorisation' || paiementInfo.document === 'mutation'
      || paiementInfo.document === 'cartegrise' || paiementInfo.document === 'duplicata' || paiementInfo.document === 'changementmodeexp' 
      || paiementInfo.document === 'IT' || paiementInfo.document === 'EP'){
  
      return (<td rowSpan={spanNum()}>{paiementInfo?.categorie}</td>);
    }else{
      return (
          <td rowSpan={spanNum()}>{paiementInfo?.categorie}</td>
      )
    }
  }
  // console.log(paiementInfo);
  //console.log(paiementInfo)
  return (
    <div className="cart-table">
      {paiementInfo &&
        <table>
          <thead className="table-header">
            <tr key={Math.random()}>
              <th>Document</th>
              <th>Categorie</th>
              <th>Capacité</th>

              <th>Prix (en fg)</th>
            </tr>
          </thead>
          <tbody>
            {paiementInfo?.cartegrise   && (
                  <tr key={paiementInfo.cartegrise.typecg_id}>
                      <td>Carte Grise</td>
                     {contenuCartegrise()}
                    <td>{paiementInfo.expressionCg}</td>
                
                    <td style={{textAlign:"right"}}>{formatStringNumber(paiementInfo.cartegrise.montant)}</td>
                </tr>
              )
            }
        
            {paiementInfo?.vignette ? 
              <tr key={Math.random()+paiementInfo.vignette.typecg_id}>
                <td>Vignette</td>
                {(paiementInfo.cartegrise === "" || typeof paiementInfo.cartegrise === 'undefined') && 
                  <td>{paiementInfo.nomCategorie?paiementInfo.nomCategorie:paiementInfo.categorie}</td>}
             
                {/* {(paiementInfo?.document != 'tous' && paiementInfo?.document)&& */}
                   <td>{paiementInfo.vignette.nomType}</td>
                {/* } */}
           {/*     <td>{paiementInfo?.categorie? paiementInfo?.categorie:paiementInfo.nomCategorie}</td>
                 :  <td>{paiementInfo.vignette.nomType}</td>
                
                 
               {(paiementInfo?.document !='tous' && paiementInfo?.document)&&
                 <td>{paiementInfo.vignette.nomType}</td>
                } */}
                <td style={{textAlign:"right"}}>{formatStringNumber(paiementInfo.vignette.montant)}</td>
              </tr>
              :''
            }
            {paiementInfo.autorisation ? 
              <tr key={Math.random()+paiementInfo.autorisation.autorisation_id}>
                <td>Autorisation de Transport</td> 
                {(paiementInfo.cartegrise === "" || typeof paiementInfo.cartegrise === 'undefined')?
                 <>
                   <td>{paiementInfo?.categorie?paiementInfo?.categorie:paiementInfo?.nomCategorie}</td>
                   <td>{paiementInfo.autorisation.nomAutorisation}</td>
                 </>:<td>{paiementInfo.autorisation.nomAutorisation}</td>
                     
                  }        
                 
                
               {/*  <td>{paiementInfo?.nomCategorie}</td> 
                   :<td>{paiementInfo.autorisation.nomAutorisation}</td> 
                }
                {(paiementInfo?.document !='tous' && paiementInfo?.document)&&
                 <td>{paiementInfo.autorisation.nomAutorisation}</td>
                } */}
                {/* <td>{paiementInfo?.categorie}</td>  */}
          
                
                <td style={{textAlign:"right"}}>{formatStringNumber(paiementInfo.autorisation.montant)}</td> 
              </tr>
              :''
            }
            {(paiementInfo.document === "IT" || paiementInfo.type_plaque === 'IT') && 
             <tr key="IT">
                <td>Plaque IT</td>
                <td>------------</td> 
                <td style={{textAlign:"right"}} colSpan={2}>300 000 </td>
      
             </tr>
             }
            {(paiementInfo.document === "EP" || paiementInfo.document === "VA" 
             || paiementInfo.type_plaque === 'EP' || paiementInfo.type_plaque === 'VA') && 
             <tr key="EP">
                <td>{paiementInfo.type_plaque?"Plaque "+paiementInfo.type_plaque:"Plaque " + paiementInfo.document}</td>
                <td>------------</td> 
                <td style={{textAlign:"right"}} colSpan={2}>350 000 </td>
      
             </tr>
             }
         
            {paiementInfo?.commission !== 0 && 
              <tr key="commission">
                <td>Commission</td> 
                <td colSpan={3} style={{textAlign:"right"}}>{formatStringNumber(paiementInfo.commission)}</td> 
              </tr>
            }
        
          </tbody>
        </table>
      }
    </div>
  );
};
export default CartTable;
