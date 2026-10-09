import { useState,useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';

import { DeleteMarque, getAllmarques } from "../../services/vehicule.service";
import AjouterMarqueModal from "../../components/AjouterMarqueModal/AjouterMarqueModal";
import Spinner from "../../components/Spinner/Spinner";
import Erreurs from "../../components/erreurs/Erreurs";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const ListeMarques = () => {  
    const [isAddModal, setIsAddModal] = useState(false);
    const [isLoading,setIsLoading] = useState(false);
    const [marques,setMarques] = useState([]);
    const[erreurs,setErreurs] = useState([]);
    const [isMarqueDelete,setIsMarqueDelete] = useState();
 
  const options = (params) => {
    const id = params.row.id;
    return (
      <div className="options">
        <Link to={`/modifier-marque/${id}`}  state={{ marque: params.row.name }}>
          <button>
              Modifier
          </button>
        </Link>
        <button className="delete-btn" onClick={() => handleDelete(id)}>Supprimer</button>
      </div>
    );
  };
  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Voulez-Vous Supprimé cette marque de vehicule?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, Supprimer!",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        setErreurs([]);
        setIsLoading(true);
         var formdata = new FormData();
         formdata.append('marque_id',id);
         DeleteMarque(formdata).then((resp) => {
           if(resp.success){
            setIsMarqueDelete(id);toast.success("Suppression de Marque effectuée avec succès");
           }else{
             toast.error("Suppression de marque non effectuée.");
             setErreurs(resp.messages);
           }
         })
       setIsLoading(false);  
       
      }
    });
  }
  async function getElements(){
    setIsLoading(true);
     const{success,status,marques} = await getAllmarques();
     if(success || status == 200){
       let ord = 0;
       setMarques(marques.map((marque) => {
         ord = ord + 1;
         return{
           id:marque.id,
           ord:ord,
           name:marque.title
         }
       }));
     }
     setIsLoading(false); 
  }
  useEffect(() => {
      getElements();
  }, [isAddModal,isMarqueDelete]);
 
  const [columnDefs] = useState([
    {
      headerName: "N°Ord",
      field: "ord",
      flex: 1, minWidth: 80
    },
    {
      headerName: "Nom",
      field: "name",
      flex: 1,   minWidth: 150
    },
 
    { headerName: "Options", field: "options", renderCell: options,minWidth: 250 },

  ]);

  return (
    <div className="liste-ministere page">
      <Helmet>
        <title>Liste des marques</title>
      </Helmet>
      {isLoading && <Spinner />}
      <AjouterMarqueModal isOpen={isAddModal} setIsOpen={setIsAddModal} />
      {/* <Erreurs validation = {erreurs} /> */}
      <div className="head">
        <h2>Liste des marques</h2>
        <Erreurs validation = {erreurs} />
        <button className="primary" onClick={() => setIsAddModal(true)}> + Nouvelle marque</button>
      </div>
      
      {marques.length > 0 ?
       <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={marques}
              columns={columnDefs}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>: <p>Aucune marque trouvée.</p>}
    </div>
  );
};

export default ListeMarques;