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
import { getReservations } from "../../services/immatriculation.service";
import AjouterReservation from "../../components/AjouterReservationModal/AjouterReservation";
import { getAllUsers } from "../../services/auth.service";
import moment from "moment";
import UpdateReservation from "../../components/UpdateReservationModal/UpdateReservation";

const ListeReservation = () => {  
  const [isAddModal, setIsAddModal] = useState(false);
  const [isUpdateModal, setIsUpdateModal] = useState(false);
  const [ministeres,setMinisteres] = useState([]);
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [Reservations,setReservations] = useState([]);
  const [utilisateurs,setUtilisateurs] = useState([]);
  const [isUpdate,setIsUpdate] = useState(false);
  const [selectedData,setSelectedData] = useState(null);
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
  async function getUtilisateurs (){
    setIsLoading(true);
      const resp = await getAllUsers();
      if(resp.status === 200 && resp?.users?.length > 0){
         setUtilisateurs(resp.users);
      }
    setIsLoading(false);  
  }
 function getReservation(){
   setIsLoading(true);
      getReservations().then((resp) => {
        let ord = 0;
        if(resp.status === 200){
           setReservations(resp?.Reserations?.map((data) => {
          ord = ord + 1;
          return {
            ord: ord,
            id:data.reservation_id,
            nomReservation:data.nomReservation,
            initial:data.initial,
            final:data.final,
            modeImmatriculation:data.modeImmatriculation,
            status:data.status === 0 ? "Non Bouclé" : "Bouclé",
            email:data.email,
            telephone:data.telephone,
            nomComplet:data.nomComplet,
            nom_role:data.nom_role,
            created_at:moment(data.created_at).format("Do MMMM YYYY"),
            updated_at:data.updated_at,

          }
          }));
        }
      });
   setIsLoading(false);
 }
  useEffect(() => {
    getallministere();   
    getReservation();
    getUtilisateurs();
   }, [isUpdate]);
        
  const options = (params) => {
    const row = params.row;
    return (
      <div className="options">
          <button onClick={() => {setSelectedData(row);setIsUpdateModal(true);}}>
              Modifier
          </button>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "N°Ord",
      field: "ord",
      flex: 1,
      minWidth:60,
    },
    {
      headerName: "Nom Reservation",
      field: "nomReservation",
      flex: 1,
      minWidth:150
    },
    {
      headerName: "Initial",
      field: "initial",
      flex: 1,
      minWidth:50
    },
    {
      headerName: "Final",
      field: "final",
      flex: 1,
      minWidth:50
    },
    {
      headerName: "Mode Immat.",
      field: "modeImmatriculation",
      flex: 1,
      minWidth:80
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      minWidth:100
    },
    {
      headerName: "Nom Complet",
      field: "nomComplet",
      flex: 1,
      minWidth:150
    },
    {
      headerName: "Rôle",
      field: "nom_role",
      flex: 1,
      minWidth:85
    },
    {
      headerName: "Email",
      field: "email",
      flex: 1,
      minWidth:150
    },
    {
      headerName: "Telephone",
      field: "telephone",
      flex: 1,
      minWidth:120
    },
    {
      headerName: "Date",
      field: "created_at",
      flex: 1,
      minWidth:130
    },
    { headerName: "Options", field: "options", minWidth:80, renderCell: options},
  ];

  return (
    <div className="liste-ministere page">
      <Helmet>
        <title>Reservation</title>
      </Helmet>
      {isLoading && <Spinner />}
      <AjouterReservation 
        isOpen={isAddModal} 
        setIsOpen={setIsAddModal} 
        utilisateurs = {utilisateurs}
        setIsLoading = {setIsLoading}
        setIsUpdate={setIsUpdate}
        isUpdate={isUpdate}
        />
       <UpdateReservation 
        isOpen={isUpdateModal} 
        setIsOpen={setIsUpdateModal} 
        setIsLoading = {setIsLoading}
        selectedData={selectedData}
        setIsUpdate={setIsUpdate}
        isUpdate={isUpdate}
        />
      <Erreurs validation = {erreurs} />
      <div className="head">
        <h2>Reservation de Plage</h2>
        <button className="primary" onClick={() => setIsAddModal(true)}> + Nouvelle Reservation</button>
      </div>
       <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={Reservations}
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

export default ListeReservation;