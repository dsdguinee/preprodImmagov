import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import NewUserModal from "../../components/NewUserModal/NewUserModal";
import EditUserModal from "../../components/EditUserModal/EditUserModal";
import Api from "../../services/Api";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import Swal from "sweetalert2";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Erreurs from "../../components/Erreurs/Erreurs";

const UsersList = () => {
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userData,setUserData] = useState([]);
  const [selectedUser,setSelectedUser] = useState({});
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const [userstatus,setUserstatus] = useState(false);
  const url = process.env.REACT_APP_URL.replace('api/','') + 'storage/';
  const api = new Api();

  useEffect(() => {
    setIsLoading(true);
     api.apiData('get','/user/getAll').then((resp) => {
      
       if(resp.status === 200){
         setUserData(resp.users.map((user) => {
          let agence = '';
          if(user.nom_agence !== 'DSD')
            agence = user.nom_agence;
          return{
            id:user.id,
            photo:url+user.photo,
            nom:user.nom,
            email:user.email,
            prenom:user.prenom,
            telephone:user.telephone,
            role:user.nom_role ,
            role_id:user.role_id,
            agence:agence,
            agence_id:user.agence_id,
            commune_id:user.commune_id,
            isActive:user.isActive
          }
         }));
       }
       setIsLoading(false);    
    });
  },[isEditUserModalOpen,isNewUserModalOpen,userstatus]);

  const setUserStatus = (user) => {
     const message = `Voulez-vous ${user.isActive === 1 ? 'desactiver':'activer'} cet utilisateur?`
      Swal.fire({
        title: 'Êtes-vous sûr?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Oui, ${user.isActive === 1 ? 'Desactiver':'Activer'} !`,
        cancelButtonText: "Annuler"
      }).then((result) => {
        if(result.isConfirmed){
          setIsLoading(true);setErreurs([]);setUserstatus(!userstatus)
            api.apiData('get',`/user/status/${user.id}`).then((resp) => {
            if(resp?.status !== 200)
                setErreurs(resp?.messages);
            })
          setIsLoading(false);
        }
      });
    
  }

  const UsersColumns = [
    {
      field: "photo",
      headerName: "Photo",
      sortable: false,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        return (
          <div className="photo">
            <img src={params.row.photo} alt={`${params.row.prenom} ${params.row.nom}`} />
          </div>
        );
      },
    },
    {
      field: "nom",
      headerName: "Nom",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "prenom",
      headerName: "Prenom",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "telephone",
      headerName: "Telephone",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "agence",
      headerName: "Agence",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 80,
    },
    {
      field: "options",
      headerName: "Options",
      sortable: false,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        return (
          <div className="options">
            <button onClick={() => {setSelectedUser(params.row);setIsEditUserModalOpen(true);}}>
              Modifier
            </button>
           { <button onClick={() => setUserStatus(params.row)} className={`${params.row.isActive == 1?'delete':'activate'}`}>{`${params.row.isActive == 1?'Desactiver':'Activer'}`}</button>}
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="users-list page">
      <DocumentTitle title="Liste des utilisateurs" />
      <NewUserModal
        isOpen={isNewUserModalOpen}
        setIsOpen={setIsNewUserModalOpen}
      />
      <EditUserModal
        isOpen={isEditUserModalOpen}
        setIsOpen={setIsEditUserModalOpen}
        selectedUser ={selectedUser}
        setSelectedUser={setSelectedUser}
      />
      <div className="header space-between">
        <div>
          <h3>Utilisateurs</h3>
          <p>{userData.length} Utilisateurs</p>
        </div>
        <button className="primary" onClick={() => setIsNewUserModalOpen(true)}>
          Nouvel utilisateur
        </button>
      </div>
      <Erreurs validation={erreurs} /> 
      {userData.length > 0 ? (
        <div className="array">
          <Box sx={{ height: 689, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar }}
              rows={userData}
              columns={UsersColumns}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
          </Box>
        </div>
      ) : <p>Aucun utilisateur enregistré.</p>}
    </div>
  );
};

export default UsersList;
