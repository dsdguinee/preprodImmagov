import { getConnexion } from "./auth.service";

export async function getMinistereById(minstere_id) {
  const reponse = await getConnexion()
    .get(`/organisationTypes/${minstere_id}`)
  return reponse;
}

export function getAllMinistere() {
  const reponse = getConnexion()
    .get("/organisationTypes/search/findByLevel?level=LEVEL_1")
    .then((resp) => {
      return resp;
    })
    .catch((ex) => {
      return ex;
    });
  return reponse;
}

export const getServicesByMinistere = async (ministereID) => {
  const response = await getConnexion().get(`/organisationTypes/${ministereID}/children`)
  return response
}

export async function getOrganisationByLevel(level){
  const prorietaires = (await getAllProprietaire()).data._embedded.proprietaires
  return prorietaires.filter(p =>{
    return p.organisationType.level == level
  })

}
//recuperer tous les proprietaire
export  async function  getAllProprietaire()
{
    return await getConnexion().get('/proprietaires');
}
export function CreateImmatriculation() {}
