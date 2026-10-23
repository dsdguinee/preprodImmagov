import { getConnexion } from "../services/auth.service";
import { organismesApi } from "../modules/administration/api";

// Partagés avec l'immatriculation et les réservations : délèguent au module Administration
export const getministeres = () => organismesApi.lister();
export const createNewMinistere = (data) => organismesApi.ajouter(data);
export const deleteMinistere = (data) => organismesApi.supprimer(data);

export async function getdirectionsByMinistere(ministere_id){
    const result =  await getConnexion().get(`/organisation/getdirectionsByMinistere/${ministere_id}`).then((resp) => {
        return resp.data.directions;
    });
    return result;
}
export async function getMinistereById(ministere_id){
    const result =  await getConnexion().get(`/organisation/ministere/${ministere_id}`).then((resp) => {
        if( resp.data.status === 404 )
            return 404;
        else return resp.data.ministere.nom;
    });
    return result;
}
export async function getDirectionByID(directionID){
    const result =  await getConnexion().get(`/organisation/direction/${directionID}`).then((resp) => {
        if( resp.data.status === 404 )
            return resp.data.message;
        else return resp.data.direction.nom;
    });
    return result;
}
export async function getAllDirections(){
    try{
    const result =  await getConnexion().get('organisation/directions').then((resp) => {
        return resp.data;
    });
    return result;
  }
  catch(e){
    localStorage.removeItem('token');
  }
}
export async function getMinistereByName(ministereName){
    const result = await getConnexion().get(`/organisation/getministereByName/${ministereName}`).then((resp) =>{
        return resp.data.success;
    }
 )
 return result;
}

export async function createNewMinistereandDirectionValided(data){
    const result = await getConnexion().post('/organisation/create/New/Ministere/directions/validedation',data).then((resp) => {
        return resp.data;
    });
    return result;
}
