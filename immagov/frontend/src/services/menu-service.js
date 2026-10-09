import { getConnexion } from "./auth.service";

export async function getMenus (){
  const result = await getConnexion().get('/menu/getmenus').then((resp) => {
        return resp.data;
    }).catch((ex) => {
        return [{'success':false,'messages':ex.messages()}]
    });
 return result;   
}