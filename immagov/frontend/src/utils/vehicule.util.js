
import { getConnexion } from "../services/auth.service";
import BRANDS from "./cardBrand";
export function getAllModels(){
    return BRANDS
}

export function getAllBrands(){
    //console.log(BRANDS)
    return BRANDS;
}
export function getModelsByBrand(brands){
    // BRANDS.filter(b => b.brand == brands)
    //return BRANDS.filter(b => b.brand == brands)[0].models

}
//region mes fonctions
export function getAllMarques(){
   const results = getConnexion().get('/vehicule/marques').then((resp) =>{
      return resp.data.marques;
    })
    return results;
}
export async function getModelByMarqueID(marque_id)
{
    const results = await getConnexion().get(`/vehicule/models/${marque_id}`).then(resp => {
        return resp.data.models;
        //return resp.data.models
    });
    return results;
}
export async function getAllmodel()
{
    const results = await getConnexion().get("/vehicule/models").then(resp => {
        return resp.data.models;
        //return resp.data.models
    });
    return results;  
}
export  function getAllGenre(){
    const result =  getConnexion().get('/vehicule/genres').then((resp) => {
         return resp.data.genres;
    });
    return result;
}
export function getAlltype(){
    const result =  getConnexion().get('/vehicule/types').then((resp) => {
        return resp.data.types;
   });
   return result;
}
export function getTypeByGenre(genreID)
{
    const result = getConnexion().get(`/vehicule/type/${genreID}`).then((resp) => {
        return resp.data.types;
    });
    return result;
}

//endregion



