import { http } from '../core/http/httpClient';
import { tokenStore } from '../core/auth/tokenStore';
import { utilisateursApi, rolesApi } from '../modules/administration/api';

// Instances axios fournies par le client HTTP du core (jeton, URL, suivi du spinner)
export function getConnexion(){
  return http.instance();
}

export function getConnexionFormData(){
  return http.instance({ multipart: true });
}

export function responseFormat(data, status){
    return{ data: data, status}
}

export function createConnexion(token){
    setToken(token);
}

export const getTokent = tokenStore.get;
export const removeToken = tokenStore.clear;
export const setToken = tokenStore.set;

export function login(credential){
  return getConnexion().post("/login",{
    login:credential.login ,
    password: credential.password 
  })
}
export async function logout(){
    tokenStore.clear();
}
export const getCurrentUser = async()=> {
  if(tokenStore.get() !== null){
    const reponse =  await getConnexion().get('user').then((resp) => {
          return resp.data;
    }).catch((ex) => { tokenStore.clear();});
    return reponse;
  }
  return null;
}
export const getUserRole =  async() => {
  if(tokenStore.get() !== null){
    
    const reponse = await getConnexion().get('/utilisateur/user-role/getrole').then((resp) => {
   
       return resp.data.nom_role;
    }).catch(ex => {tokenStore.clear();});
  return reponse;
 }
 return null;
}
//get User role and privilege
export const getUserRolePrivilegeByUserID = async(userID) => {
  const reponse = await getConnexion().get(`/utilisateur/user-role/getUserRolePrivilege/${userID}`).then((resp) => {
    return resp.data;
 });
return reponse;
}
//getUser Role and Privilege
export const getUserRolePrivilege = async() => {
  const response = await getConnexion().get('/utilisateur/user-role/getUserRolePrivilege').then((resp) => {
      return resp.data;
  });
  return response;
} 
export const userByID = async (user_id) => {
  const reponse = await getConnexion().get(`/user/${user_id}`).then((resp) => {
    return resp.data;
 }).catch(ex => { tokenStore.clear();});
return reponse;
}
export const change_password = async (data) => {
  const response = await getConnexion().post('/utilisateur/change-password',data).then((resp) => {
    return resp.data;
  })
  return response;
}

// Partagés avec d'autres écrans (réservations, tableau de bord) : délèguent au module Administration
export const getAllUsers = () => utilisateursApi.lister();
export const getAllRoles = () => rolesApi.lister();
