import pays from '../data/pays.json';
import { genreVehicules } from "../genresVehicule";

export function isEmpty(obj) {
    // for(var prop in obj) {
    //   if(Object.prototype.hasOwnProperty.call(obj, prop)) {
    //     return false;
    //   }
    // }
  
    // return JSON.stringify(obj) === JSON.stringify({});
    return Object.keys(obj).length === 0
  }

 export const getPays = () =>{
    return pays;
 }
 export const getPaysByID = (paysID) => {
   return pays[paysID];
 }


export const getAllGenres = () => {
  const allGenres = genreVehicules.map((element) => element.genre);
  return allGenres;
};

export const getAllTypesByGenre = (genre) => {
  const searchedGenre = genreVehicules.filter(
    (element) => element.genre === genre
  )[0].types;
  return searchedGenre;
};  

export const isDateValid = (selectedDate) => {
    const today = new Date();
    const toCompare = new Date(selectedDate);

    if (today.getTime() < toCompare.getTime())
        return false
    else if (today.getTime() > toCompare.getTime())
        return true
    else
        return true
}
//validation step 2
export function validateDate(date){
  var regex=new RegExp("([0-9]{4}[-](0[1-9]|1[0-2])[-]([0-2]{1}[0-9]{1}|3[0-1]{1})|([0-2]{1}[0-9]{1}|3[0-1]{1})[-](0[1-9]|1[0-2])[-][0-9]{4})");
  var dateOk=regex.test(date);
  if(dateOk){
      return true
  }else{
      return false;
  }
}
export function checkValid(fields)
  {
      return fields.idpays != 0 && fields.genre != 0
      && fields.type !== 0 && fields.marques != 0
      && fields.model != 0 && fields.carrosserie != 0
      && fields.annee >= 1900 && fields.energie != 0
      && fields.numChassie.length <= 17 && parseInt(fields.nbPorte) > 0 
      && parseInt(fields.nbPlaceAssise) > 0 && parseInt(fields.nbPlaceAssise) 
      && parseInt(fields.nbPlaceDebout) > 0 && validateDate(fields.dateP)
      && fields.cylindre !== 0 && fields.pa !== 0
      && parseInt(fields.kilometrage) >= 0 ;
  }
  export function objecttoFormData(elements){
    var formData = new FormData(); 
    Object.keys(elements).forEach(key => formData.append(key, elements[key]));
    return formData;
  }
  
  //fin validation step 2
