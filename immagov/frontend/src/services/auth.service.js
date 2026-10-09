import axios from 'axios';
import { suivreRequetes } from './chargement';
export function getConnexion(){
  try{
    return suivreRequetes(getTokent() ?  axios.create({
        baseURL:`${process.env.REACT_APP_URL}/api/`,
        headers:{
          "Cache-Control":"no-Cache",
          "Access-Control-Allow-Origin":"*",
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${getTokent()}`
        }
      })
      :axios.create({
        baseURL:`${process.env.REACT_APP_URL}/api/`,
        headers:{
          "Cache-Control":"no-Cache",
          "Content-Type":"application/json",
        }
      }));
    }
    catch(ex){
      localStorage.removeItem('token');
    }
}

export function getConnexionFormData(){
  return suivreRequetes(getTokent() ?  axios.create({
      baseURL:`${process.env.REACT_APP_URL}/api/`,
      headers:{
        "Cache-Control":"no-Cache",
        "Access-Control-Allow-Origin":"*",
        // 'Content-Type': 'application/json',
        "Content-Type":"multipart/form-data",
        "Authorization": `Bearer ${getTokent()}`
      }
    })
    :axios.create({
      baseURL:`${process.env.REACT_APP_URL}/api/`,
      headers:{
        "Cache-Control":"no-Cache",
        "Content-Type":"application/json",
      }
    }))
}

export function responseFormat(data, status){
    return{ data: data, status}
}

export function createConnexion(token){
    setToken(token);
}

export function getTokent(){
    return localStorage.getItem("token");
}

export function removeToken(){
  localStorage.removeItem("token")
}

export function setToken(token){
    localStorage.setItem("token", token);
}

export function login(credential){
  return getConnexion().post("/login",{
    login:credential.login ,
    password: credential.password 
  })
}
export async function logout(){
    if(localStorage.getItem('token')){
      localStorage.removeItem('token');
    }
}
export const getCurrentUser = async()=> {
  if(localStorage.getItem('token') !== null){
    const reponse =  await getConnexion().get('user').then((resp) => {
          return resp.data;
    }).catch((ex) => { localStorage.removeItem('token');});
    return reponse;
  }
  return null;
}
export const getUserRole =  async() => {
  if(localStorage.getItem('token') !== null){
    
    const reponse = await getConnexion().get('/utilisateur/user-role/getrole').then((resp) => {
   
       return resp.data.nom_role;
    }).catch(ex => {localStorage.removeItem('token');});
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
//get all Privilege
export const getAllPrivileges = async() => {
  const response = await getConnexion().get('/role-privilege/privileges').then((resp) => {
      return resp.data;
  });
  return response;
} 
//add New Role
export const newRole = async(data) => {
  const response = await getConnexion().post('/role-privilege/new-role',data).then((resp) => {
      return resp.data;
  });
  return response;
} 
//get All role 
export const getAllRoles = async(data) => {
  const response = await getConnexion().get('/role-privilege/roles').then((resp) => {
      return resp.data;
  });
  return response;
} 
//get role et Permission
export const getRolePrivilege = async () => {
  const response = await getConnexion().get('/role-privilege/roles-privileges').then((resp) => {
    return resp.data;
});
return response;
}
//get Privilege by Role_id
export const PrivilegeByRole_Id = async (role_id) => {
  const response = await getConnexion().get(`/role-privilege/roles-privileges/${role_id}`).then((resp) => {
    return resp.data;
});
return response;
}
//enabled and disabled role
export const ActiveDesactive = async (data) => {
  const response = await getConnexion().post("/role-privilege/ActiveDesactive",data).then((resp) => {
    return resp.data;
});
return response;
}  
//Update Role
export const UpdateRole = async (data) => {
  const response = await getConnexion().post("/role-privilege/update",data).then((resp) => {
    return resp.data;
});
return response;
}

export const userByID = async (user_id) => {
  const reponse = await getConnexion().get(`/user/${user_id}`).then((resp) => {
    return resp.data;
 }).catch(ex => { localStorage.removeItem('token');});
return reponse;
}
//creation d'utilisateur
export const createUser = async (data) => {
   const response =  await getConnexion().post('/utilisateur/new',data).then((resp) => {
     return resp.data;
   }).catch((ex) => {localStorage.removeItem('token');});
   return response;
}
export const getAllUsers = async () => {
  const response = await getConnexion().get('/reservation/getAllUser').then((resp) => {
    return resp.data;
  })
  return response;
}
export const change_password = async (data) => {
  const response = await getConnexion().post('/utilisateur/change-password',data).then((resp) => {
    return resp.data;
  })
  return response;
}
export const updateUser = async (data) => {
  const response = await getConnexion().post('/utilisateur/update',data).then((resp) => {
    return resp.data;
  })
  return response;
}
export const deleteUser = async (data) => {
  const response = await getConnexion().post('/utilisateur/delete',data).then((resp) => {
    return resp.data;
  })
  return response;
}

