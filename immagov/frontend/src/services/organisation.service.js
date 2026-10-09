import { getConnexion } from "../services/auth.service";

export async function getministeres(){
   const result = await getConnexion().get('/organisation/ministeres').then((resp) => {
       return resp.data.ministeres;
   });
   return result;
}
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
export async function getAllDirectionByID(directionID){
    const result =  await getConnexion().get(`/organisation/getdirectionsByMinistere/${directionID}`).then((resp) => {
        return resp.data;
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
export async function createNewMinistere(data){
    const result = await getConnexion().post('/organisation/ministere/New',data).then((resp) => {
        return resp.data;
    })
    return result;
}
export async function updateMinistere(data){
    const result = await getConnexion().post('/organisation/ministere/update',data).then((resp) => {
        return resp.data;
    });
    return result;
}
export async function addNewDirection(data){
    const result = await getConnexion().post('/organisation/direction/New',data).then((resp) => {
        return resp.data;
    });
    return result;
}
export async function updateDirection(data){
    const result = await getConnexion().post('/organisation/direction/update',data).then((resp) => {
        //console.log(resp.data)
        return resp.data;
    });
    return result;
}
export async function deleteDirection(data){
    const result = await getConnexion().post('/organisation/direction/delete',data).then((resp) => {
        return resp.data;
    });
    return result;
}
export async function deleteMinistere(data){
    const result =  await getConnexion().post('organisation/ministere/delete',data).then((resp) => {
        return resp.data;
    });
    return result;
}