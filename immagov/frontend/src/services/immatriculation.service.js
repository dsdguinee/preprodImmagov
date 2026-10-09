
import { getConnexion, getConnexionFormData } from "./auth.service";

export const getImmatriculationById = async (id) => {
  const result = await getConnexionFormData().get(`immatriculation/getImmatriculationByID/${id}`).then((resp) => {
    return resp.data
  })
  return result;
}

export async function getAllImmatriuculation() {
  
  const result = getConnexion().get('/immatriculation/getAllImmatriculation').then((resp) => {
       return resp.data.immatriculations;
   });
  return result;
 
}
export async function getAllImmatriculationValidee(){
  try{
   const result = getConnexion().get('/immatriculation/getAllImmatriculationValidee').then((resp)=>{
     return resp.data.immatriculations;
   });
   return result;
  }
  catch(ex){
       return null;
  }
}
export async function getAllImmatriculationToMutation(){
  try{
   const result = getConnexion().get('/mutation/immatriculationtionmutations').then((resp)=>{
     return resp.data.immatriculations;
   });
   return result;
  }
  catch(ex){
       return null;
  }
}
export async function isStatusAttente(immatriculation_id){
  try{
   const result = getConnexion().get(`/mutation/immatriculationtionmutations/${immatriculation_id}`).then((resp)=>{
     return resp.data.immatriculations;
   });
   return result;
  }
  catch(ex){
       return null;
  }
}
export async function getAllImmatriculationToReforme(){
  try{
   const result = getConnexion().get('/reforme/immatriculationtoreforme').then((resp)=>{
     return resp.data.immatriculations;
   });
   return result;
  }
  catch(ex){
       return null;
  }
}
export async function validedImmatriculation(immID)
{
  var formData = new FormData();
  formData.append('id',immID);
   const reponse = await getConnexion().post("immatriculation/validerImmatriculation",formData).then((resp) => {
     return resp.data;
    });
  // console.log(reponse);
   return reponse;
}
// Erreur HTTP (413 fichier trop volumineux...) -> meme forme qu'une erreur de validation : { success:false, messages }
// En local, PHP peut prefixer le JSON d'un avertissement HTML : on extrait le JSON de la reponse.
export const erreurServeur = (ex) => {
  let data = ex?.response?.data;
  if (typeof data === 'string' && data.indexOf('{') !== -1) {
    try { data = JSON.parse(data.slice(data.indexOf('{'))); } catch (e) { data = null; }
  }
  if (data && data.messages) return { ...data, success: false };
  if (ex?.response?.status === 413)
    return { success: false, status: 413, messages: { pieceJointe: ['Le fichier est trop volumineux.'] } };
  return { success: false, messages: { erreur: ["Le serveur est indisponible. Réessayez plus tard."] } };
};
// Mutation payée dans SIPIM : dossier IMMAGOV du châssis (véhicule, numéro, affectation actuelle, mutable ou non)
// operation : 'mutation' (par défaut) ou 'reforme', pour les messages de refus
export const dossierParChassis = (chassis, operation = 'mutation') => {
  return getConnexion().get('/mutation/dossierParChassis', { params: { chassis, operation } })
    .then((resp) => resp.data).catch(erreurServeur);
}
// Mutation payée dans SIPIM : création de la mutation (nouvel organisme + lettre) et consommation de la référence
export const mutationDepuisPaiement = (data) => {
  const formData = new FormData();
  formData.append('immatriculation_id', data.mutation.dossier.immatriculation_id);
  formData.append('paiementReference', data.paiementReference);
  formData.append('affectation_id', data.mutation.dossier.minister_id || '');
  formData.append('affectation_direction_id', data.mutation.dossier.direction_id || '');
  formData.append('ministere', data.ministere);
  formData.append('direction', data.direction && data.direction != 0 ? data.direction : '');
  formData.append('pieceJointe', data.image4);
  return getConnexionFormData().post('/mutation/depuisPaiement', formData).then((resp) => resp.data).catch(erreurServeur);
}
// Réforme payée dans SIPIM : véhicule cédé à un particulier (coordonnées + photo de sa pièce d'identité), référence consommée
export const reformeDepuisPaiement = (data) => {
  const p = data.reforme.proprietaire;
  const formData = new FormData();
  formData.append('immatriculation_id', data.reforme.dossier.immatriculation_id);
  formData.append('paiementReference', data.paiementReference);
  formData.append('prenom', p.prenom);
  formData.append('nom', p.nom);
  formData.append('telephone', p.telephone);
  formData.append('email', p.email || '');
  formData.append('adresse', p.adresse);
  formData.append('piece', data.image4);
  return getConnexionFormData().post('/reforme/depuisPaiement', formData).then((resp) => resp.data).catch(erreurServeur);
}
// Reprise d'une réforme SIPIM rejetée : même référence ; la photo n'est envoyée que si elle a été remplacée
export const resoumettreReforme = (data) => {
  const p = data.reforme.proprietaire;
  const formData = new FormData();
  formData.append('reforme_id', data.reforme.reforme_id);
  formData.append('prenom', p.prenom);
  formData.append('nom', p.nom);
  formData.append('telephone', p.telephone);
  formData.append('email', p.email || '');
  formData.append('adresse', p.adresse);
  if (data.image4 instanceof File) formData.append('piece', data.image4);
  return getConnexionFormData().post('/reforme/resoumettreDepuisPaiement', formData).then((resp) => resp.data).catch(erreurServeur);
}
export const nouvelleImmatriculation = async (data) => {
  var formData =  new FormData();
  formData.append('modeImmatriculation',data.modeImmatriculation);
  formData.append('reservation_id',data.reservation_id);
  formData.append('marque_id',data.marque);
  formData.append('model_id',data.model);
  formData.append('numChassie',data.numChassie);
  formData.append('carrosserie',data.carrosserie);
  formData.append('nbPlaceAssise',data.nbPlaceAssise);
  formData.append('nbPlaceDebout',data.nbPlaceDebout);
  formData.append('nbPorte',data.nbPorte);
  formData.append('kilometrage',data.kilometrage);
  formData.append('cylindre',data.cylindre);
  formData.append('annee',data.annee);
  formData.append('dateP',data.dateP);
  formData.append('energie',data.energie);
  formData.append('idpays',data.idpays);
  formData.append('genre',data.genre);
  formData.append('typeVehicule',data.type);
  formData.append('couleur',data.couleur);
  formData.append('acquisition',data.acquisition);
  formData.append('transmission',data.transmission);
  formData.append('ancienImmatriculation',data.ancienNumMat);
  formData.append('ministere',data.ministere);
  formData.append('direction',data.direction);
  formData.append('autreministere',data.autreministere);
  formData.append('pieceJointe',data.image4);
  formData.append('nbreEssuie',data.nbreEssuie);
  formData.append('pv',data.pv);
  formData.append('cu',data.cu);
  formData.append('pa',data.pa);
  formData.append('typeOrganisme',data.typeOrganisme || '');
  formData.append('paiementReference',data.paiementReference);
  formData.append('autredirection',data.autredirection);
  const result = await getConnexionFormData().post(`/immatriculation/new`,formData).then((resp) => {return resp.data }).catch(erreurServeur);
  return result;  
};
export const InitialiseImmatriculation = (immatriculation) =>{
  immatriculation.reservation_id = '';
  immatriculation.modeImmatriculation = '';
  immatriculation.idpays =  '';
  immatriculation.marque = 0;
  immatriculation.model = 0;
  immatriculation.carrosserie = '';
  immatriculation.genre = 0;
  immatriculation.type = 0;
  immatriculation.annee = '';
  immatriculation.energie = "Essence";
  immatriculation.numChassie = '';
  immatriculation.nbPorte = '';
  immatriculation.acquisition = 'Achat';
  immatriculation.transmission = 'Manuelle';
  immatriculation.nbPlaceAssise = 0;
  immatriculation.nbPlaceDebout = 0;
  immatriculation.dateP = '';
  immatriculation.ancienNumMat = '';
  immatriculation.cylindre = 0;
  immatriculation.kilometrage = '';
  immatriculation.couleur = '';
  immatriculation.ministere = 0;
  immatriculation.direction = 0;
  immatriculation.autreministere = '';
  immatriculation.image4 = '';
  immatriculation.nbreEssuie = '';
  immatriculation.ptc = 0;
  immatriculation.pv = 0;
  immatriculation.cu = 0;
  immatriculation.pa = 0;
  immatriculation.typeOrganisme = 0;
  immatriculation.paiementReference = '';
}
export const searchImmatriculation = (option,optionValue) => {
  const result = getConnexion().get(`/immatriculation/searchImmatriculation/${option}/${optionValue}`).then((resp) => {
       return resp.data.immatriculations;
  });
  return result;
}
export const resoumission = async (data) => {
  // console.log(data);
  var formData =  new FormData();
  formData.append('immatriculation_id',data.immatriculation_id);
  formData.append('vehicule_id',data.vehiculeID);
  formData.append('pa',data.pa);
  formData.append('modeImmatriculation',data.modeImmatriculation);
  formData.append('marque_id',data.marque);
  formData.append('model_id',data.model);
  formData.append('numChassie',data.numChassie);
  formData.append('carrosserie',data.carrosserie);
  formData.append('nbPlaceAssise',data.nbPlaceAssise);
  formData.append('nbPlaceDebout',data.nbPlaceDebout);
  formData.append('nbPorte',data.nbPorte);
  formData.append('kilometrage',data.kilometrage);
  formData.append('cylindre',data.cylindre);
  formData.append('annee',data.annee);
  formData.append('dateP',data.dateP);
  formData.append('energie',data.energie);
  formData.append('idpays',data.idpays);
  formData.append('genre',data.genre);
  formData.append('typeVehicule',data.type);
  formData.append('couleur',data.couleur);
  formData.append('acquisition',data.acquisition);
  formData.append('transmission',data.transmission);
  formData.append('ancienImmatriculation',data.ancienNumMat != null ? data.ancienNumMat:'');
  formData.append('ministere',data.ministere);
  formData.append('direction',data.direction);
  formData.append('autreministere',data.autreministere);
  formData.append('pieceJointe',typeof data.image4 === 'string' || data.image4 instanceof String  ?'':data.image4);
  formData.append('nbreEssuie',data.nbreEssuie);
  formData.append('pv',data.pv);
  formData.append('cu',data.cu);
  formData.append('created_by',data.created_by);
  formData.append('autredirection',data.autredirection);
  formData.append('typeOrganisme',data.typeOrganisme || '')
  
  const result =  getConnexion().post('/immatriculation/resoumission',formData).then((resp) => {
    return resp.data;
  }).catch(erreurServeur);
  return result;
}
export const dashboardStat =()=>{

  const result = getConnexion().get(`/immatriculation/dashboardStat`).then((resp) => {
        return resp.data; 
  });
  return result;
}
// Tableau de bord du rôle Agent (ses propres dossiers) ; isAgent indique s'il faut l'afficher
export const dashboardAgent = () => {
  const result = getConnexion().get(`/immatriculation/dashboardAgent`).then((resp) => {
    return resp.data;
  }).catch(() => ({ success: false }));
  return result;
}
// Tableau de bord de l'administrateur (comptes, rôles, organismes, réservations, activité)
export const dashboardAdmin = () => {
  return getConnexion().get(`/immatriculation/dashboardAdmin`)
    .then((resp) => resp.data)
    .catch((ex) => ex?.response?.data || { success: false });
}
// Tableau de bord du Directeur pour la période [du, au] (dates AAAA-MM-JJ)
export const dashboardDirecteur = (du, au) => {
  const result = getConnexion().get(`/immatriculation/dashboardDirecteur`, { params: { du, au } }).then((resp) => {
    return resp.data;
  }).catch((ex) => ex?.response?.data || { success: false });
  return result;
}
export const dashboardStatGraph1 = (mois = '')=>{
  const result = getConnexion().get(`/immatriculation/dashboardStat/graph1/${mois}`).then((resp) => {
      if(resp.data.success)
         return resp.data.stats
       else return [];   
  });
  return result;
}
export const dashboardStatGraph2 = ()=>{
  const result = getConnexion().get('/immatriculation/dashboardStat/graph2').then((resp) => {
      //console.log(resp.data)
      if(resp.data.success)
         return resp.data.stats
       else return [];   
  });
  return result;
}
export function createReforme(data) {
  var formData = new FormData();
  formData.append('immatriculation_id',data.immatriculation_id);
  formData.append('nom',data.nom);
  formData.append('prenom',data.prenom);
  formData.append('date_naissance',data.date_naissance);
  formData.append('fonction',data.fonction);
  formData.append('ministere_id',data.ministere);
  formData.append('direction_id',data.ministere);
  formData.append('piece',data.piece);
  formData.append('paiement',data.paiement);
  formData.append('valeurResiduelle',data.valeurResiduelle);
  const result = getConnexion().post('/reforme/new',formData).then((resp) => {
       return resp.data 
  });
  return result;
}
export function InitializedReforme(proprietaireInfo){
  proprietaireInfo.immatriculation_id= '';
  proprietaireInfo.valeurResiduelle=50000;
  proprietaireInfo.nom='KOUROUMA';
  proprietaireInfo.prenom='LANSANA';
  proprietaireInfo.date_naissance='1980-10-22';
  proprietaireInfo.fonction='Chef de Division';
  proprietaireInfo.ministere=2;
  proprietaireInfo.direction='';
  proprietaireInfo.piece= '';
  proprietaireInfo.paiement='';
  proprietaireInfo.oldministere_id='';
}
export function ImmatriculationforNewMinistere(data){
   const result = getConnexion().post('/immatriculation/ImmatriculationforNewMinistere',data).then((resp) => {
      return resp.data;
   });
   return result;
}
// Rejet de l'organisme proposé par l'agent : le dossier passe en « Rejeté » (motif : clé de la liste, commentaire facultatif sauf « autre »)
export const rejeterPropositionOrganisme = (immatriculation_id, motif, commentaire) => {
  return getConnexion().post('/immatriculation/rejetOrganisme', { immatriculation_id, motif, commentaire })
    .then((resp) => resp.data)
    .catch((ex) => ex?.response?.data || { success: false, messages: { erreur: ["Le serveur est indisponible."] } });
}
// Historique d'utilisation d'un véhicule (périodes d'affectation et demandes en attente / rejetées)
export const historiqueVehicule = (immatriculation_id) => {
  return getConnexion().get(`/immatriculation/historique/${immatriculation_id}`)
    .then((resp) => resp.data).catch(() => ({ success: false }));
}
export function ImmatriculationRejeter(immatriculation_id){
  const result = getConnexion().get(`/immatriculation/rejet/${immatriculation_id}`).then((resp) => {
    return resp.data.rejet
  });
  return result;
}
export function mutation(data){
  const result = getConnexion().post('/mutation/new',data).then((resp) => {
      return resp.data
    });
  return result;
}
export function getAllReformes(){
  const result = getConnexion().get('/reforme/getAllReformes').then((resp) => {
      return resp.data.reformes;
  });
  return result;
}
export function getReformeByID(reforme_id)
{
  const result = getConnexion().get(`/reforme/reforme/${reforme_id}`).then((resp) => {
    return resp.data;
  }).catch(() => ({ success: false }));
  return result;
}
// Paiement SIPIM via le backend immagov (la cle API SIPIM reste cote serveur)
export async function getPaiementSipim(reference){
  const result = await getConnexion().get('paiement/sipim',{params:{reference}}).then((resp) => {
    return resp.data;
  }).catch(() => ({success:false,messages:"Service de paiement indisponible."}));
  return result;
}

export function ValiderReforme(data){
  const result =  getConnexion().post('reforme/valider',data).then((resp)=>{
    return resp.data;
  });
  return result;
}
export function ReserverInterval(data){
  const result =  getConnexion().post('/reservation/Reserver',data).then((resp)=>{
    return resp.data;
  });
  return result;
}
export function ReserverUpdate(data){
  const result =  getConnexion().post('/reservation/update',data).then((resp)=>{
    return resp.data;
  });
  return result;
}
export function getReservations(){
  const result =  getConnexion().get('/reservation/getReservations').then((resp)=>{
    return resp.data;
  });
  return result;
}
export function getReservationList(){
  const result =  getConnexion().get('/reservation/getvalistList').then((resp)=>{
    return resp.data;
  });
  return result;
}
export async function ResoumissionReforme(data){
  const result = await getConnexion().post('/reforme/resoumission',data).then((resp)=>{
    return resp.data;
  });
  return result;
}
export async function getborne(modeImm){
  const result = await getConnexion().get(`/reservation/getBorne/${modeImm}`).then((resp)=>{
    return resp.data;
  });
  return result;
}
export async function ResoumissionMutation(data){
  const result = await getConnexion().post('/mutation/resoumission',data).then((resp)=>{
    return resp.data;
  });
  return result;
}
export function getAllMutation(){
  const result = getConnexion().get('/mutation/mutations').then((resp) => {
     return resp.data
  });
  return result;
}
export function getMutationById(mutation_id){
  const result = getConnexion().get(`/mutation/getmutationBy/${mutation_id}`).then((resp) => {
    return resp.data;
  });
  return result;
}
export function statistique(){
  const result = getConnexion().get('/immatriculation/statistique/global').then((resp) => {
    return resp.data;
  });
  return result;
}
export function mutationValided(data){
  const result = getConnexion().post('mutation/valider',data).then((resp) =>{
    return resp.data;
  });
  return result;
}
export async function getReformeStatus(immatriculation_id){
  const result =  await getConnexion().get(`reforme/status/${immatriculation_id}`).then((resp) =>{
    return resp.data;
  });
  return result;
}
export async function getMutationStatus(immatriculation_id){
  const result =  await getConnexion().get(`mutation/status/${immatriculation_id}`).then((resp) =>{
    return resp.data;
  });
  return result;
}
//impression
export async function getAllImmatriculationValiderforImpression(){
  const result =  await getConnexion().get('/impression/getAllImmatriculationValidee').then((resp) =>{
    return resp.data;
  });
  return result;
}
export async function is_printed(immatriculation_id){
  const result =  await getConnexion().post(`/impression/printed/${immatriculation_id}`).then((resp) =>{
    return resp.data;
  });
  return result;
}