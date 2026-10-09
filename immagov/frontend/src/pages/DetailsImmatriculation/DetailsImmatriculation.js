import { useState, useEffect ,useMemo,useContext} from "react";
import { useParams,useNavigate, Link } from "react-router-dom";
import LicensePlate from "../../components/LicensePlate/LicensePlate";
import { getImmatriculationById,validedImmatriculation,ImmatriculationRejeter,getReformeStatus,getMutationStatus } from "../../services/immatriculation.service";
import { getPaysByID, isEmpty } from '../../utils/helper/functions';
import moment from 'moment';
import Swal from "sweetalert2"
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import {ComboContext,UserContext} from "../../services/Context/Contexts";
import { getUserRole,userByID,getCurrentUser } from "../../services/auth.service";
import { getMinistereById } from "../../services/organisation.service";
import { Helmet } from 'react-helmet-async'
import 'moment/locale/fr';
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner/Spinner";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { GiSandsOfTime } from 'react-icons/gi';
import Plaque, { PLAQUE_TYPES } from "../../components/ui/Plaque/Plaque";
import HistoriqueVehicule from "../../components/Immatriculation/HistoriqueVehicule";

const DetailsImmatriculation = () => {
  moment.locale('fr');
  const url = process.env.REACT_APP_URL + '/storage/';
  const { id } = useParams();
  const [immatriculationInfo, setImmatriculationInfo] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [role,setRole] = useState();
 
  const [vehiculeInfo, setVehiculeInfo] = useState();
  const [affectation, setAffectation] = useState("Non Affecte");
  const {genres,modeles,marques,typeVehicules,ministeres,directions} = useContext(ComboContext);
  const {currentUserPrivilege} = useContext(UserContext);

  const [genre,setGenre] = useState();
  const [status,setStatus] = useState(false);
  const[typeVehicule,setTypeVehicule] = useState();
  const[modele,setModeles] = useState();
  const[marque,setMarque] = useState();
  const[isautreministere,setIsautreministere] = useState(false);
  const [raisonRejet,setRaisonRejet] = useState(''); 
  const [typeRejet,setTypeRejet] = useState('');
  const [currentUser,setCurrentUser] = useState('');
  const [udpateDay,setUpdateDay] = useState('');
  const[validedUser,setValidedUser] = useState('');
  const[isvalidedPrivilege,setIsvalidedPrivilege] = useState(false);
  const [userID,setUserID] = useState('');
  const [isAgent,setisAgent] = useState(false);
  const [isLoading,setIsLoading] = useState(false);
  const [pays,setPays] = useState();
  const getDetails = async (currentID) => {
    const {immatriculation,vehicule} = await getImmatriculationById(currentID)
    // console.log(data)
    setImmatriculationInfo(immatriculation) 
    setUpdateDay(moment(vehicule.updated_at).fromNow());
    setVehiculeInfo(vehicule);
   
  }
  //console.log(validedUser);
  const navigate = useNavigate();
   useMemo(() => {
    setIsLoading(true);
    if(immatriculationInfo){
      setPays(getPaysByID(vehiculeInfo?.provenance));
      if(immatriculationInfo.status === 0)
        setStatus('En attente');
      else if(immatriculationInfo.status === 1){
        setStatus('Validé');
        userByID(immatriculationInfo.valided_by).then((resp) => {
          if(resp.success){
            setValidedUser(resp.user);
          }
        });
      }
      else if(immatriculationInfo.status === 2){
        setStatus('Rejeté');
        // Dernier rejet : libellé du motif et précision (les anciens rejets n'ont que la précision)
        ImmatriculationRejeter(immatriculationInfo.immatriculation_id).then((resp) => {
          setRaisonRejet([resp?.raison, resp?.autreraison].filter((t) => t && String(t).trim()).join(' — '));
          setTypeRejet(resp?.typeRejet || '');
        });
      }
     else if(immatriculationInfo.status === 3){
      getReformeStatus(immatriculationInfo.immatriculation_id).then((resp) => {
        if(resp.success){
          if(resp.reforme.status == 0){
            setStatus("En Attente");
          }else if(resp.reforme.status == 1){
            setStatus("Valideé");
          }else if(resp.reforme.status == 2){
            setStatus("Rejetée");
          }
        }
        });
      }
     else if(immatriculationInfo.status === 4){   
        
        getMutationStatus(immatriculationInfo.immatriculation_id).then((resp) => {
          //console.log(resp)
          if(resp.success){
            if(resp.mutation.status == 0){
              setStatus("En Attente");
            }else if(resp.mutation.status == 1){
              setStatus("Validée");
            }else if(resp.mutation.status == 2){
              setStatus("Rejetée");
            }
          }
        });
      } 
     if (Array.isArray(ministeres) && ministeres.length > 0) {
       if(!immatriculationInfo.minister_id){
         // Organisme proposé rejeté : l'agent doit en choisir un autre
         setAffectation('Non affecté');
         setIsautreministere(false);
       }
       else if(immatriculationInfo.minister_id != 1000000){
         const minis = ministeres.filter(m => m.ministere_id == immatriculationInfo.minister_id)[0]?.nom;
         if(minis)
            setAffectation(ministeres.filter(m => m.ministere_id == immatriculationInfo.minister_id)[0]?.nom);
         else {
          getMinistereById(immatriculationInfo.minister_id).then((resp) => {
            setAffectation(resp)
          })
         }   
       }
        else {
               setAffectation(immatriculationInfo.autreministere);  
               setIsautreministere(true);  
        }
       
      }
 
     if (Array.isArray(genres) && genres.length != 0) setGenre(genres.find(g=>g.genre_id == vehiculeInfo?.genre)?.nom);
     if (Array.isArray(typeVehicules) && typeVehicules.length != 0) setTypeVehicule(typeVehicules.find(g=>g.type_id == vehiculeInfo?.typeVehicule)?.nom);
     if (Array.isArray(modeles) && modeles.length != 0) setModeles(modeles.find(m=>m.id == vehiculeInfo?.model_id)?.title);
     if (Array.isArray(marques) && marques.length != 0) setMarque(marques.find(m=>m.id == vehiculeInfo?.marque_id)?.title);

    
      getCurrentUser().then((resp)=>{
        setUserID(resp.id); 
      });
      userByID(immatriculationInfo.created_by).then((resp) => {
        if(resp.success){
          const nomComplet = resp.user?.prenom && resp.user?.nom ? 
              resp.user?.prenom.charAt(0).toUpperCase() +resp.user?.prenom.slice(1)+" "+resp.user?.nom.charAt(0).toUpperCase() +resp.user?.nom.slice(1):'';
          setCurrentUser(nomComplet);
        }
      }); 
      if(Array.isArray(currentUserPrivilege) && currentUserPrivilege.length > 0){
        const result  = currentUserPrivilege.filter(p => p.privilege == "Nouvelle immatriculation");
        if(Array.isArray(result) && result.length > 0)
            if(immatriculationInfo.created_by == result[0].user_id)
                setisAgent(true)
        }    
    }
    setIsLoading(false);
   },[immatriculationInfo,ministeres]);
  useEffect(() => {
    setIsLoading(true);
      getDetails(id);
      getUserRole().then(resp=> setRole(resp));
      if(Array.isArray(currentUserPrivilege) && currentUserPrivilege.length > 0){
        const result  = currentUserPrivilege.filter(p => p.privilege == "Validation");
        if(Array.isArray(result) && result.length > 0)
          setIsvalidedPrivilege(true)
      }  
    setIsLoading(false); 
  }, [currentUserPrivilege]);
  const openFile = (url) => {
    window.open(url);
  }
  const handValided =  (e)=>{
    e.preventDefault();
 
    Swal.fire({
      title: 'Voulez-vous valider cette immatriculation ?',
      text: "Vous ne pourrez plus revenir en arrière",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2a9d8f',
      cancelButtonColor: '#e63946',
      confirmButtonText: 'Valider',
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        validedImmatriculation(id).then((resp) => { 
          if(resp.success){
            setIsLoading(false); toast.success('Immatriculation Validée avec succès.');
              navigate('/liste-immatriculation');  
          }else if(resp.success == false) 
            if(resp.message){
            setIsLoading(false);toast.error(resp.message);
          }
           else  {setIsLoading(false);toast.error("Echec de l'immatriculation.");} 
        });
      }
    })
  }

  // Libellés et valeurs dérivées pour l'affichage
  const mode = String(immatriculationInfo?.modeImmatriculation || '').toUpperCase();
  const statutClasse = { 'En attente': 'attente', 'En Attente': 'attente', 'Validé': 'valide', 'Valideé': 'valide', 'Validée': 'valide', 'Rejeté': 'rejete', 'Rejetée': 'rejete' }[status] || 'neutre';
  const StatutIcone = statutClasse === 'valide' ? AiOutlineCheckCircle : statutClasse === 'rejete' ? AiOutlineCloseCircle : GiSandsOfTime;
  const typeOperation = immatriculationInfo?.status === 3 ? 'Réforme' : immatriculationInfo?.status === 4 ? 'Mutation' : '';
  // Sigle sous le numéro : nom d'affectation court (ex. CBG, EDG), sinon rien
  const sigle = affectation && affectation.trim().length <= 8 && !/\s/.test(affectation.trim()) ? affectation.trim().toUpperCase() : '';
  const direction = immatriculationInfo?.direction_id
    ? directions?.find((d) => d.direction_id == immatriculationInfo.direction_id)?.nom
    : immatriculationInfo?.autredirection;
  const nomPersonne = (u) => u?.prenom ? `${u.prenom.charAt(0).toUpperCase()}${u.prenom.slice(1)} ${u.nom?.toUpperCase() || ''}`.trim() : '';
  const ptac = (parseInt(vehiculeInfo?.cu) || 0) + (parseInt(vehiculeInfo?.pv) || 0);
  const lettre = vehiculeInfo?.pieceJointe;
  const lettreEstPdf = /\.pdf$/i.test(lettre || '');
  const ou = (v, defaut = '—') => (v === null || v === undefined || v === '' ? defaut : v);

  const identification = [
    ['Numéro de châssis', vehiculeInfo?.numChassie, true],
    ['Marque', marque], ['Modèle', modele],
    ['Genre', genre], ['Type', typeVehicule],
    ['Carrosserie', vehiculeInfo?.carosserie], ['Couleur', vehiculeInfo?.colorVehicule],
    ['Année de fabrication', vehiculeInfo?.madeYear],
    ['1re mise en circulation', vehiculeInfo?.releaseYear ? moment(vehiculeInfo.releaseYear).format('DD/MM/YYYY') : ''],
    ['Ancien numéro', immatriculationInfo?.ancienImmatriculation, true],
    ['Provenance', pays], ["Mode d'acquisition", vehiculeInfo?.acquisition],
  ];
  const technique = [
    ['Énergie', vehiculeInfo?.energy], ['Transmission', vehiculeInfo?.transmission === 'Automatic' ? 'Automatique' : vehiculeInfo?.transmission],
    ['Cylindres', vehiculeInfo?.cylinderNumber], ['Puissance', vehiculeInfo?.pa ? `${vehiculeInfo.pa} CV` : ''],
    ['Kilométrage', vehiculeInfo?.kilometrage !== undefined && vehiculeInfo?.kilometrage !== null ? `${vehiculeInfo.kilometrage} km` : ''],
    ['Places assises', vehiculeInfo?.placeNumberAssis], ['Places debout', vehiculeInfo?.placeNumberDebout],
    ['Portes', vehiculeInfo?.nbPorte], ['Essieux', vehiculeInfo?.nbreEssuie || 0],
    ['Poids à vide', `${vehiculeInfo?.pv || 0} kg`], ['Charge utile', `${vehiculeInfo?.cu || 0} kg`],
    ['Poids total autorisé en charge', `${ptac} kg`],
  ];
  const peutValider = isvalidedPrivilege && immatriculationInfo?.status === 0;
  const peutResoumettre = immatriculationInfo?.status === 2 && isAgent;

  return (
    <div className="fiche">
      <Helmet>
        <title>Détails de l'immatriculation</title>
      </Helmet>
      <RejectionModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} id={id} type="immatriculation"/>
      {isLoading && <Spinner />}

      {/* En-tête : numéro, statut, actions */}
      <div className="fiche__head">
        <div className="fiche__titre">
          <Link to="/liste-immatriculation" className="fiche__retour">← Immatriculations</Link>
          <div className="fiche__titre-ligne">
            <h1 className="fiche__numero">{ou(immatriculationInfo?.immatriculation_number, '…')}</h1>
            {status && (
              <span className={`fiche-badge fiche-badge--${statutClasse}`}>
                <StatutIcone aria-hidden="true" /> {typeOperation ? `${typeOperation} · ` : ''}{status}
              </span>
            )}
          </div>
          <p className="fiche__sous-titre">
            {currentUser ? `Soumis par ${currentUser}` : 'Soumis'}{immatriculationInfo?.created_at ? ` le ${moment(immatriculationInfo.created_at).format('DD/MM/YYYY [à] HH:mm')}` : ''}
            {udpateDay ? ` · mis à jour ${udpateDay}` : ''}
          </p>
        </div>
        <div className="fiche__actions">
          {peutValider && (
            <>
              <button type="button" className="fiche-btn fiche-btn--danger" onClick={() => setIsModalOpen(true)} disabled={isautreministere}>Rejeter</button>
              <button type="button" className="fiche-btn fiche-btn--primary" onClick={handValided} disabled={isautreministere}>Valider l'immatriculation</button>
            </>
          )}
          {peutResoumettre && (
            <Link to={`/resoumission/${immatriculationInfo?.immatriculation_id}`} state={typeRejet === 'organisme' ? { etape: 3 } : undefined} className="fiche-btn fiche-btn--primary">
              {typeRejet === 'organisme' ? "Choisir un autre organisme" : "Corriger et resoumettre"}
            </Link>
          )}
        </div>
      </div>

      {/* Motif de rejet et nouveau ministère à approuver */}
      {raisonRejet !== '' && raisonRejet && (
        <div className="fiche-alerte fiche-alerte--rejet" role="status">
          <AiOutlineCloseCircle aria-hidden="true" />
          <div><strong>{typeRejet === 'organisme' ? "Organisme proposé rejeté :" : "Motif du rejet :"}</strong> {raisonRejet}</div>
        </div>
      )}
      {isautreministere && immatriculationInfo?.status === 0 && isvalidedPrivilege && (
        <div className="fiche-alerte fiche-alerte--attention" role="status">
          <GiSandsOfTime aria-hidden="true" />
          <div>
            L'agent a proposé un nouvel organisme (<strong>{affectation}</strong>) : approuvez-le avant de valider ou de rejeter ce dossier.{' '}
            <Link to={`/organisation/ministere/create/${immatriculationInfo.immatriculation_id}`}>Approuver l'organisme →</Link>
          </div>
        </div>
      )}

      {/* Plaque */}
      <section className="fiche-carte fiche-plaque">
        {PLAQUE_TYPES[mode] ? (
          <Plaque type={mode} numero={immatriculationInfo?.immatriculation_number} sigle={sigle}
            qrcode={immatriculationInfo?.qrcode ? url + immatriculationInfo.qrcode : null} />
        ) : (
          <LicensePlate numImmatriculation={immatriculationInfo?.immatriculation_number} modeImmatriculation={immatriculationInfo?.modeImmatriculation} />
        )}
      </section>

      <div className="fiche__layout">
        <div className="fiche__main">
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Identification du véhicule</h2>
            <dl className="fiche-kv">
              {identification.map(([label, valeur, mono]) => (
                <div key={label}><dt>{label}</dt><dd className={mono ? 'fiche-mono' : ''}>{ou(valeur)}</dd></div>
              ))}
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Historique d'utilisation</h2>
            <HistoriqueVehicule immatriculationId={immatriculationInfo?.immatriculation_id} />
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Caractéristiques techniques</h2>
            <dl className="fiche-kv">
              {technique.map(([label, valeur]) => (
                <div key={label}><dt>{label}</dt><dd>{ou(valeur)}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="fiche__side">
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Affectation</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Ministère ou organisme</dt><dd>{ou(affectation)}{isautreministere && <span className="fiche-badge fiche-badge--attente fiche-badge--petit">Nouvel organisme</span>}</dd></div>
              <div><dt>Direction ou service</dt><dd>{ou(direction)}</dd></div>
              <div><dt>Type d'organisme</dt><dd>{ou(immatriculationInfo?.typeOrganisme)}</dd></div>
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Paiement</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Référence SIPIM</dt><dd className="fiche-mono">{ou(immatriculationInfo?.paiementReference)}</dd></div>
              <div><dt>Type de plaque</dt><dd>{mode ? `${mode}${PLAQUE_TYPES[mode] ? ` · ${PLAQUE_TYPES[mode].toLowerCase()}` : ''}` : '—'}</dd></div>
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Suivi</h2>
            <dl className="fiche-kv fiche-kv--colonne">
              <div><dt>Initiateur</dt><dd>{ou(currentUser)}</dd></div>
              {!isEmpty(validedUser) && validedUser && <div><dt>Validé par</dt><dd>{nomPersonne(validedUser)}</dd></div>}
              <div><dt>Dernière mise à jour</dt><dd>{ou(udpateDay)}</dd></div>
            </dl>
          </section>
          <section className="fiche-carte">
            <h2 className="fiche-carte__titre">Pièce jointe</h2>
            {lettre ? (
              <div className="fiche-fichier">
                <span className={`fiche-fichier__icone${lettreEstPdf ? '' : ' fiche-fichier__icone--img'}`}>{lettreEstPdf ? 'PDF' : 'IMG'}</span>
                <span className="fiche-fichier__nom">{lettre.split('/').pop()}</span>
                <button type="button" className="fiche-btn fiche-btn--lien" onClick={() => openFile(url + lettre)}>Ouvrir</button>
              </div>
            ) : <p className="fiche-muted">Aucune pièce jointe.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DetailsImmatriculation;
