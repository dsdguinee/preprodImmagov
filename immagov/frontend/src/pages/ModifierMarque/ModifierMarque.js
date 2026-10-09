import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
// import Swal from "sweetalert2";
// import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

import AjouterModeleModal from "../../components/AjouterModeleModal/AjouterModeleModal";
import ModifierModeleModal from "../../components/ModifierModeleModal/ModifierModeleModal";
// import Erreurs from "../../components/erreurs/Erreurs";
import Spinner from "../../components/Spinner/Spinner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DeleteModele, getmarqueByID,getModeleByMarqueID, UpdateMarque } from "../../services/vehicule.service";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Erreurs from "../../components/erreurs/Erreurs";
import Swal from "sweetalert2";

const ModifierMarque = () => {
  const [isEditModal, setIsEditModal] = useState(false);
  const [isAddModal, setIsAddModal] = useState(false);
 
  const [isLoading, setIsLoading] = useState(false);
  const [marque,setMarque] = useState({id:'',nom:'',});
  const [modeles,setModeles] = useState([]);
  const [deletestat,setDeletestat] = useState();
  const [selectedModele,setSelectedModele] = useState({
    marque_id:'',
    modele_id: '',
    nom:''
  });
  const [newModele,setNewModele] = useState({
    marque_id:'',
    nom:'',
  })
  const[erreurs,setErreurs] = useState([]);
  const navigate = useNavigate();
  const { register, handleSubmit,reset, formState: { errors } } = useForm({
    defaultValues:{
      marque,
    }});
  const {id} = useParams();
  const handleEditModel = (data) => {
    setSelectedModele({...selectedModele,modele_id:data.id,nom:data.name}); 
    setIsEditModal(true);
  };

  const options = (params) => {
    return (
      <div className="options">
        <button onClick={() => handleEditModel(params.row)}>Modifier</button>
        <button className="delete-btn" onClick={() => handleDelete(params.row.id) }>Supprimer</button>
      </div>
    );
  };
  const handleDelete =  (id) =>{
  setErreurs([]); 
  Swal.fire({
    title: "Êtes-vous sûr?",
    text: "Voulez-Vous Supprimé ce modele?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui, Supprimer!",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      
       setIsLoading(true);
  
        var formData = new FormData();
        formData.append('modele_id',id);
          DeleteModele(formData).then((resp) => {
              if(resp.success){
                setDeletestat(id);toast.success('Suppression effectuée avec succès.');
              }else{
                toast.error('Suppression Non effectuée .');setErreurs(resp.messages);
              }
          });
       setIsLoading(false);
    }
   })
  }
  const handleChange = (e) => {
    setMarque({...marque,[e.target.name]:e.target.value});
    
  }
  const location = useLocation();
  async function getELements(id){
     const{success,status,models} = await getModeleByMarqueID(id);
     if(success || status === 200){
       let ord = 0;
       setModeles(models.map((modele) => {
        ord = ord + 1;
        return{
          ord:ord,
          id:modele.id,
          name:modele.title,
        }
      }));
   }
 }
  useEffect(() => {
    setIsLoading(true);
  
    if(location.state && location.state.marque)
       setMarque({...marque,id:id,nom:location.state.marque});
    else{
      getmarqueByID(id).then((resp) => {
        if(resp.success){
          setMarque({...marque,nom:resp.marque.title});
        }
      });
    }
    reset(marque);
    getELements(id);
    setSelectedModele({...selectedModele,marque_id:id});
    setNewModele({...newModele,marque_id:id});
    setIsLoading(false);    
  }, [id,isEditModal,isAddModal,deletestat]); 
 // console.log(selectedModeles);
  const submitForm = async () => {
     setIsLoading(true);setErreurs([]);
     var formData = new FormData();
     formData.append('marque_id',marque.id);
     formData.append('nom',marque.nom);
     const {success,messages} = await UpdateMarque(formData);
     if(success){
      navigate('/liste-marques');
      toast.success("Modification de marque Effectuée avec succès"); 
     }else{
         setErreurs(messages);   
     }
     setIsLoading(false);
  }
  const [columnDefs] = useState([
    {
      headerName: "N°Ord",
      field: "ord",
      minWidth:80
    },
    {
      headerName: "Nom",
      field: "name",
      sortable: true,
      flex:1,
      minWidth:250
    },
    { headerName: "Options",field:'options',flex:1,renderCell: options },

  ]);

  return (
    <div className="modifier-ministere page">
      <Helmet>
        <title>Modifier une marque</title>
      </Helmet>
      {isLoading && <Spinner />}
    
      <ModifierModeleModal isOpen={isEditModal} setIsOpen={setIsEditModal} selectedModele={selectedModele} setSelectedModele={setSelectedModele}/>
      <AjouterModeleModal isOpen={isAddModal} setIsOpen={setIsAddModal} newModele ={newModele} setNewModele={setNewModele} />
      <div className="ministeres">
        <h2>Modifier Marque</h2>
        <div className="ministere">
          <form onSubmit={handleSubmit(submitForm)}>
            <label>
              Nom de la marque
              <input type="text" name="nom" value={marque.nom} 
                  autoFocus
                  {...register("nom", {
                    onChange: (e) => {
                      handleChange(e);
                    },
                  required: true,
                  minLength: 3,
                  })}
                 />
               {errors.nom && errors.nom.type === "required" && (
                  <span role="alert" className="error-msg">
                    Champ obligatoire.
                  </span>
                )}
                {errors.nom && errors.nom.type === "minLength" && (
                  <span role="alert" className="error-msg">
                    Le nombre minimum de caractères est trois (3).
                  </span>
                )}
               <Erreurs validation = {erreurs} />
            </label>
            <button type="submit">Enregistrer</button>
          </form>
        </div>
      </div>
      <div className="directions">
        <div className="head">
          <h2>Liste des modèles</h2>
          <button className="primary" onClick={() => setIsAddModal(true)}>
            + Nouveau modèle
          </button>
        </div>
      
       {modeles.length > 0 ?
        <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={modeles}
              columns={columnDefs}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>: <p>Aucune modele trouvé.</p>}
      </div>
    </div>
  );
};

export default ModifierMarque;
