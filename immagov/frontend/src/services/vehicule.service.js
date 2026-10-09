import { getConnexion } from "./auth.service";
import axios from "axios";
export async function createVehicule(vehicule){
    //console.log(vehicule)
    return await getConnexion().post("/vehicules", JSON.stringify(vehicule));
}

//Creer une proprietaire 
export async function createProprietaire(data)
{
  return await getConnexion().post('/proprietaires',JSON.stringify(data)) ; 
}
export async function affacter_vehicule_proprietaire(vehiculeID,propritaireID)
{
    return await getConnexion().put(`/affecter/vehicule/${vehiculeID}/proprietaire/${propritaireID}`);
}
//recuperer le propriete existant a partir des ministers ou directions
export async function getProprietaire(organisationID,ogranisationType)
{
    
     if( ogranisationType == "MINISTERE" )
        return await getConnexion().get(`/organisationTypes/${organisationID}`);
    else return await getConnexion().get(`/organisationTypes/${organisationID}/children`);    
    //return await getConnexion().get(`/proprietaires`).then((resp) =>{ console.log(resp.data._embedded.proprietaires)} );
  
}
export async function getAllVehicules(){

    return getConnexion().get("/vehicules")
}

export function updateVehicule(vehicule_id, data){
    return getConnexion().put(`vehicules/${vehicule_id}`, data)
}

export function removeVehicule(vehicule_id){
    getConnexion().delete(`/vehicules/${vehicule_id}`)
}

export  function getVehiculeModels(vehiculeId){
    let vehicules = []
      return  getAllVehicules().then(res => {
         vehicules = res.data._embedded.vehicules
            .filter(v => v.mark == "Audi")
        console.log("Audi => ", vehicules )
        return vehicules
    })
   
    return  []
}
export async function getAllmarques(){
    const reponse = getConnexion().get('vehicule/marques').then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function getmarqueByID(marque_id){
    const reponse = getConnexion().get(`vehicule/marque/${marque_id}`).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function UpdateMarque(formdata){
    const reponse = getConnexion().post('vehicule/marque/update',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function UpdateModele(formdata){
    const reponse = getConnexion().post('vehicule/modele/update',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function AddModele(formdata){
    const reponse = getConnexion().post('vehicule/modele/add',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function DeleteModele(formdata){
    const reponse = getConnexion().post('vehicule/modele/delete',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}

export async function DeleteMarque(formdata){
    const reponse = getConnexion().post('vehicule/marque/delete',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function AddMarque(formdata){
    const reponse = getConnexion().post('vehicule/marque/add',formdata).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse;
}
export async function getModeleByMarqueID(marqueID){
    const reponse = getConnexion().get(`vehicule/models/${marqueID}`).then((resp) => {
        return resp.data
    }).catch(ex => { return ex;});
    return reponse; 
}
export function getvehiculeById(vehicule_id){
    const reponse = getConnexion().get(`vehicules/${vehicule_id}`).then(resp => {return resp ;}).catch(ex => { return ex;});
    return reponse;
}
export async function vehiculeProprietaireById(vehicule_id){
   //console.log('por')
   let reponse = "Non Affecte";
   if(vehicule_id)
        reponse = await getConnexion().get(`vehicules/${vehicule_id}/proprietaires`).then((resp) => {return resp.data._embedded.proprietaires[0].name;});
    return reponse;
}

export function getCarInformation(vin)
{
    //4F2YU09161KM33122
    const options = {
        method: 'GET',
        url: 'https://vindecoder.p.rapidapi.com/v2.0/decode_vin',
        params: {vin: 'JNKCA31A61T027494'},
        headers: {
          'X-RapidAPI-Host': 'vindecoder.p.rapidapi.com',
          'X-RapidAPI-Key': '6c3901a46amsh92ba2a3fcafc80ap1c9470jsnc4064a91a7d9'
        }
      };
      
    const reponse =  axios.request(options).then(function (response) {
          if( response.data.success )
          {
            const data = response.data.specification;  
            return data;
          }
          return null
         // setImmatriculation({'model':});response.data;
      }).catch(function (error) {
          console.error(error);
      });
    return reponse;
}
export async function getGenreByID(genreID){
    const result = await getConnexion().get(`/vehicule/genre/${genreID}`).then((resp) => {
        if( resp.data.status === 404 )
            return resp.data.message;
        else return resp.data?.genre?.nom || '';
    });
    return result;
}
export async function getTypeByID(typeID){
    const result = await getConnexion().get(`/vehicule/gettype/${typeID}`).then((resp) => {
        if( resp.data.status === 404 )
            return resp.data.message;
        else return resp.data?.type?.nom || '';
    });
    return result;
}