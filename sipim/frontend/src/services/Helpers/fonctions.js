import { memoirecode } from "../../utils/memoires";

export function isEmpty(obj) {
    // for(var prop in obj) {
    //   if(Object.prototype.hasOwnProperty.call(obj, prop)) {
    //     return false;
    //   }
    // }
  
    // return JSON.stringify(obj) === JSON.stringify({});
    // console.log(obj)
    if(obj == undefined || !obj) return true;
    return Object.keys(obj).length === 0 
  }
export function objecttoFormData(elements){
  var formData = new FormData(); 
  Object.keys(elements).forEach(key => formData.append(key, elements[key]));
  return formData;
} 
export function commission(categorie_id){
  let montant = 0;
  if(categorie_id == 4)
    montant = 30000;
  else if(categorie_id== 3 || categorie_id== 2)
    montant = 20000;
  else if(categorie_id == 1)  
    montant = 10000;

  return montant;   
} 
// Mutation et réforme d'un véhicule déjà immatriculé : pas de plaque, frais de service selon la catégorie
export const OPERATIONS_VEHICULE = ['mutation', 'reforme'];
export const MONTANT_MIN_REFORME = 500000;
export const LIBELLES_OPERATION = { mutation: 'Mutation', reforme: 'Réforme' };
export function estOperationVehicule(paiement){
  return OPERATIONS_VEHICULE.includes(paiement?.type_document ?? paiement?.document);
}
// Libellé de l'opération (Mutation / Réforme), sinon le libellé par défaut (Immatriculation...)
export function libelleOperation(paiement, defaut){
  return LIBELLES_OPERATION[paiement?.type_document ?? paiement?.document] || defaut;
}
// Frais de service d'un paiement enregistré : commission selon la catégorie, pour tous les paiements
export function fraisService(paiement){
  return commission(paiement?.categorie_id);
}
// Montant saisi de l'opération (réforme)
export function montantOperation(paiement){
  return parseFloat(paiement?.montant_operation) || 0;
}
// Prix de la plaque d'après paiements.type_plaque (ou type_document en secours) : IT 300 000, EP/VA 350 000 GNF
export function montantPlaque(paiement){
  const plaque = paiement?.type_plaque || paiement?.type_document;
  if(plaque === 'IT') return 300000;
  if(plaque === 'EP' || plaque === 'VA') return 350000;
  return 0;
}
export function expression(cartegrise){
  if(cartegrise.signe){
      var expression = '';
      const memoire = memoirecode.filter(m => m.signe == cartegrise.signe);
      const doublesigne = cartegrise.signe.split(",");
      if(Array.isArray(doublesigne) && doublesigne.length === 1){ 
      if( cartegrise.signe == "!" ){
        const capacites = cartegrise.capacite.split(',');
        expression = memoire[0]?.signification + " " + capacites[0] + " et "+ capacites[1] + " " + cartegrise.unite;
      }else if(cartegrise.signe == ">" || cartegrise.signe == "<" || cartegrise.signe == ">=" || cartegrise.signe == "<="){
        const nomtype = cartegrise?.nomType !== null ? cartegrise?.nomType + " ":'';
        expression = nomtype + memoire[0]?.signification + " à " + cartegrise.capacite + " "+cartegrise.unite;
      }else if(cartegrise.signe !== "" || cartegrise.signe !== null){
        expression = cartegrise?.nomType !== null ? cartegrise?.nomType + " ":'';
        return {
          id:cartegrise.typecg_id,
          expression:expression,
          isVignettre:cartegrise.isVignette
        }
      } 
    
      return {
          id:cartegrise.typecg_id,
          expression:expression,
          isVignettre:cartegrise.isVignette
      }
    }else if(Array.isArray(doublesigne) && doublesigne.length === 2){
          const expression1 = memoirecode.filter(m => m.signe == doublesigne[0])[0];
          const expression2 = memoirecode.filter(m => m.signe == doublesigne[1])[0];
          const capacites = cartegrise.capacite.split(',');
          expression = expression1?.signification + " à "+ capacites[0] + " et " + expression2?.signification + " à "+capacites[1] + " "+cartegrise.unite; 

      return {
        id:cartegrise.typecg_id,
        expression:expression,
        isVignettre:cartegrise.isVignette
    }
    }
  }else{
    return {
      id:cartegrise.typecg_id,
      expression:cartegrise.nomType,
      isVignettre:cartegrise.isVignette
  }
  }
}

export function formatStringNumber(x) {
  return isNaN(x)?"":parseInt(Math.round(x)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
 }
 //initialiser l'objet
 export function initialized(element){
    Object.keys(element).forEach((key) => {
      if(!isNaN(element[key]))
        element[key] = 0;
      else  
        element[key] = ''
    });
} 
export const FirstUpperCase = (caracteres) => {
   if(caracteres.length === 0)
      return caracteres.toUpperCase();
   else {
    var splitStr = caracteres.toLowerCase().split(' ') ;
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(' '); 
   }     
}
export const UpperCaseAfterSpace = (chaine) => {
  if(chaine.length > 1){
    if(chaine[chaine.length - 2] === ' '){
      var majuscule = chaine[chaine.length - 1].toUpperCase();
      var chaine2 = chaine.substring(chaine.length - 1,'');
      return chaine2 + majuscule;
    }else{
      return chaine;
    }
   
  }else{
     return chaine.toUpperCase();
  }
  
}