import { useState,useEffect } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Link } from "react-router-dom";
import { getministeres,deleteMinistere } from "../../services/organisation.service";
import AjouterMinistereModal from "../../components/AjouterMinistereModal/AjouterMinistereModal";
import Erreurs from "../../components/erreurs/Erreurs";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner/Spinner";
import { Helmet } from 'react-helmet-async';

const ListeMinistere = () => {  
  const [isAddModal, setIsAddModal] = useState(false);
  const [ministeres,setMinisteres] = useState([]);
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  function getallministere(){
    setIsLoading(true)
    getministeres().then((resp) => {
      let ord = 0
      setMinisteres(resp.map((data) => {
        ord = ord + 1;
         return {
           'ord':ord,
           'id':data.ministere_id,
           'nom':data.nom
         }
      })
      );
    });
    setIsLoading(false)
  }

  useEffect(() => {
    getallministere();      
      }, []);
  const handDeleteMinistere = (data)=>{
    setErreurs([]);
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Voulez-Vous Supprimé ce ministère?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, Supprimer!',
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
          if(data){
            var formData = new FormData();
            formData.append('ministere_id',data.id);
            deleteMinistere(formData).then((resp) => {
              //console.log(resp);
               if(resp.success){
                 toast.success('Suppression effectuée avec succès.');getallministere();   
               }else{
                 toast.error("Erreur");setErreurs(resp.messages);
               }
            })
          }
      }
    });
  }  
  const options = (params) => {
    const id = params.row.id;
    return (
      <div className="options">
        <Link to={`/modifier-ministere/${id}`}>
          <button>
              Modifier
          </button>
        </Link>
        <button className="delete-btn" onClick={() => handDeleteMinistere(params.row)}>Supprimer</button>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "N°Ord",
      field: "ord",
      flex: 1,
      minWidth:80,
    },
    {
      headerName: "Nom",
      field: "nom",
      flex: 1,
      minWidth:150
    },
    { headerName: "Options", field: "options", minWidth:250, renderCell: options},
  ];

  return (
    <div className="liste-ministere page">
      <Helmet>
        <title>Liste des ministères / organismes</title>
      </Helmet>
      {isLoading && <Spinner />}
      <AjouterMinistereModal isOpen={isAddModal} setIsOpen={setIsAddModal} />
      <Erreurs validation = {erreurs} />
      <div className="head">
        <h2>Liste des ministères/organismes</h2>
        <button className="primary" onClick={() => setIsAddModal(true)}> + Nouveau ministère</button>
      </div>
       <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={ministeres}
              columns={columnDefs}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>
    </div>
  );
};

export default ListeMinistere;