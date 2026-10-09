import { useState, useId, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import EditRoleModal from "../../components/EditRoleModal/EditRoleModal";
import NewRoleModal from "../../components/NewRoleModal/NewRoleModal";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";
import Swal from "sweetalert2";
import Erreurs from "../../components/Erreurs/Erreurs";
import { UserContext } from "../../services/Context/Context";


const RolesList = () => {
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState({});
  const [roleData,setRoleData] = useState([]);
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [privilegeOption,setPrivilegeOption] = useState([]);
  const [selectedPrivileges,setSelectedPrivileges] = useState([]);
  const[erreurs,setErreurs] = useState([]);
  const [rolestatus,setRolestatus] = useState(false);
  const [nbreRole,setNbreRole] = useState(0);
  const {changePrivilege,setChangePrivilege} = useContext(UserContext);
  const api = new Api();
  const rolesColumns = [
    {
      field: "num",
      headerName: "Num. ordre",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "role_name",
      headerName: "Role",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "typeCompte",
      headerName: "Type de Compte",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "privileges",
      headerName: "Privilèges",
      flex: 1,
      minWidth: 150,
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
            <button onClick={() => {editshowwindow(params.row)}}>
              Modifier
            </button>
           <button className={`${params.row.status == 1?'delete':'activate'}`} onClick={() => activeDesactive(params.row)} >{`${params.row.status == 1?'Desactiver':'Activer'}`}</button>
          </div>
        );
      },
    },
  ];
  const activeDesactive = (data) => {
    const message = `Voulez-vous ${data.status === 1 ? 'desactiver':'activer'} ce rôle?`
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Oui, ${data.status === 1 ? 'Desactiver':'Activer'} !`,
      cancelButtonText: "Annuler"
    }).then((result) => {
      if(result.isConfirmed){
        setIsLoading(true);setErreurs([]);setRolestatus(!rolestatus)
          api.apiData('get',`/roles/role-status/${data.id}`).then((resp) => {
          if(resp?.status !== 200)
              setErreurs(resp?.messages);
          })
        setIsLoading(false);
      }
    });
  }
  const editshowwindow = (data) => {
    setSelectedPrivileges([]);
    if(data?.id){
        api.apiData('get',`roles/privilege/role/${data.id}`).then((resp) => {
        
          if(resp?.status === 200){
            setSelectedRole({...selectedRole,id:data.id,role_name:data.role_name,type:data.type_id,privileges:resp.privileges.map((privilege) => {
              return{
                value:privilege.privilege_id,
                label:privilege.nom_privilege }
            })})
          }
        })
    }
    setIsEditRoleModalOpen(true);
  }
  useEffect(() => {
    setIsLoading(true);
      api.apiData('get','/roles/all').then((resp) => {
        setIsLoading(false);  
          if(resp?.status === 200){
            let numordre = 0;
              setRoleData(resp.roles.map((role) => {
                let typeCompte = 'Ordinaire';
                if(role.type === 1)
                  typeCompte="Ordinaire";
                else if(role.type === 2 ) 
                  typeCompte="Contrôleur";
               else if(role.type === 3)   
                  typeCompte="Admin";
          
                numordre+=1;
                return {
                  num:numordre,
                  id:role.role_id,
                  status:role.status,
                  role_name:role.role_name,
                  privileges:role.privileges,
                  typeCompte:typeCompte,
                  type_id:role.type,
                }
              }));
           setNbreRole(numordre)   
          }
      });
      api.apiData('get','/roles/privilege/all').then((resp) => {
        if(resp?.status === 200){
          setPrivilegeOption(resp.privileges.map((privilege) => {
            return{
              value:privilege.privilege_id,
              label:privilege.nom_privilege
            }
          }))
        }
      })
    
  },[isNewRoleModalOpen,isEditRoleModalOpen,rolestatus]);

  return (
    <div className="role-list page">
      <NewRoleModal
        isOpen={isNewRoleModalOpen}
        setIsOpen={setIsNewRoleModalOpen}
        privilegeOption={privilegeOption}
      />
      <EditRoleModal
        isOpen={isEditRoleModalOpen}
        setIsOpen={setIsEditRoleModalOpen}
        selectedRole ={selectedRole}
        setSelectedRole={setSelectedRole}
        privilegeOption={privilegeOption}
        changePrivilege={changePrivilege}
        setChangePrivilege={setChangePrivilege}
      
      />
      <div className="header space-between">
        <div>
          <h3>Roles</h3>
          <p>{nbreRole} Roles</p>
        </div>
        <button className="primary" onClick={() => setIsNewRoleModalOpen(true)}>
          Nouveau role
        </button>
      </div>
      <Erreurs validation={erreurs} /> 
      {roleData.length > 0 ? (
        <div className="array">
          <Box sx={{ height: 689, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar }}
              rows={roleData}
              columns={rolesColumns}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
          </Box>
        </div>
      ) : <p>Aucun role enregistré</p>}
    </div>
  );
};

export default RolesList;
