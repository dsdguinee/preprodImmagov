import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Link,useLocation } from 'react-router-dom';
import moment from "moment";
import "moment/locale/fr";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import AjouterUtilisateurModal from "../../components/AjouterUtilisateurModal/AjouterUtilisateurModal";
import ModifierUtilisateurModal from "../../components/ModifierUtilisateurModal/ModifierUtilisateurModal";
import Spinner from "../../components/Spinner/Spinner";
import Erreurs from "../../components/erreurs/Erreurs";
import { deleteUser, getAllUsers } from "../../services/auth.service";

const ListeUtilisateurs = () => {
  const [isAddModal, setIsAddModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [isDelete, setisDelete] = useState(false);
  const handleEditUser = (data) => {
    setIsEditModal(true);
    setSelectedUser(data);
  };

  const options = (params) => {
    const id = params.row.id;
    return (
      <div className="options">
        <button
          onClick={() => {
            handleEditUser(params.row);
          }}
        >
          Modifier
        </button>
        {parseInt(params.row.status) === 1 ?
            <button className='delete' onClick={() => { deleteHandle(params.row)}}>
               Desactiver
            </button>
           :<button className='activate' onClick={() => { deleteHandle(params.row)}}>
               Activer
            </button>
        }
       
      </div>
    );
  };

  const deleteHandle = (data) => {
    setErreurs([]);
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: `${parseInt(data.status) === 1 ?'Voulez-Vous Desactivé cet utilisateur?':'Voulez-Vous Activé cet utilisateur?'}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Oui, ${parseInt(data.status) === 1 ? 'desactiver!':'activer!'}`,
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        var formData = new FormData();
        formData.append("user_id", data.id);
        formData.append("status", data.status);
        setIsLoading(true);
        deleteUser(formData).then((resp) => {
          if (resp.status == 200) {
             getallusers();
            if(parseInt(data.status) === 1)
               toast.success("Compte desactivé avec succès");
            else toast.success("Compte activé avec succès"); 

          
          } else {
            toast.error("Vous aviez fait des erreurs.");
            setErreurs(resp.messages);
          }
          // setisDelete(!isDelete);
        });
        setIsLoading(false);
      }
    });
  };

  async function getallusers() {
    setIsLoading(true);
    const { status, users, messages } = await getAllUsers();
  
    setUserData([]);
    if (status === 200) {
      setIsLoading(false);
      let ord = 0;
      setUserData(
        users.map((user) => {
          ord = ord + 1;
          return {
            id: user.user_id,
            ord: ord,
            nom: user.nom,
            prenom: user.prenom,
            telephone: user.telephone,
            email: user.email,
            role_id: user.role_id,
            role: user.nom_role,
            status:user.statusCnx,
            typecompte:user.isAdmin === 0?'Ordinaire':'Admin',
            isAdmin:user.isAdmin,
            updated_at: moment(user.updated_at, "YYYYMMDD HH:mm:ss").fromNow(),
          };
        })
      );
    } else {
      setIsLoading(false);
      setErreurs(messages);
    }
  }

  useEffect(() => {
    getallusers();
  }, [isEditModal,isAddModal]);

  const [columnDefs] = useState([
    {
      headerName: "N°Ord",
      field: "ord",
      flex:1,
      minWidth: 80 
    },
    {
      headerName: "Nom",
      field: "nom",
      flex : 1,
      minWidth:120
    },
    {
      headerName: "Prenom",
      field: "prenom",
      flex:1,
      minWidth:150
    },
    {
      headerName: "Email",
      field: "email",
      flex:1,
      minWidth:180
    },
    {
      headerName: "Téléphone",
      field: "telephone",
      flex:1,
      minWidth:120
    },
    {
      headerName: "Role",
      field: "role",
      flex:1,
      minWidth:110
    },
    {
      headerName: "T.Compte",
      field: "typecompte",
      flex:1,
      minWidth:110
    },
    {
      headerName: "Dernière Cnx.",
      field: "updated_at",
      flex:1,
      minWidth:120
    },
    { headerName: "Options", field:'options', minWidth:220,renderCell: options },

  ]);

  return (
    <div className="liste-utilisateurs page">
      <Helmet>
        <title>Liste des utilisateurs</title>
      </Helmet>
      {isLoading && <Spinner />}
      <AjouterUtilisateurModal isOpen={isAddModal} setIsOpen={setIsAddModal} />
      <ModifierUtilisateurModal
        isOpen={isEditModal}
        setIsOpen={setIsEditModal}
        selectedUser={selectedUser}
      />
      <Erreurs validation={erreurs} />
      <div className="head">
        <h2>Liste des utilisateurs</h2>

        <button className="primary" onClick={() => setIsAddModal(true)}>
          + Nouvel utilisateur
        </button>
      </div>
      
      {userData.length > 0 ?
  
        <div className="array">
              <br />
          <Box sx={{ height: 579, width: "100%" }}>
          <DataGrid
            sx={{ borderRadius: 0 }}
            density="compact"
            components={{ Toolbar: GridToolbar}}
            rows={userData}
            columns={columnDefs}
            autoPageSize
            pagination
            disableSelectionOnClick
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
        </Box>
      </div>: <p>Aucun utilisateur trouvé.</p>}
    </div>
  );
};

export default ListeUtilisateurs;
