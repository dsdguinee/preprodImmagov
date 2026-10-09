import { useState ,useEffect} from "react";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import { fakeRoles } from "../../utils/data/fakeData";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";

import AjouterRoleModal from "../../components/AjouterRoleModal/AjouterRoleModal";
import ModifierRoleModal from "../../components/ModifierRoleModal/ModifierRoleModal";
import { Helmet } from 'react-helmet-async';
import Spinner from "../../components/Spinner/Spinner";
import Erreurs from "../../components/erreurs/Erreurs";
import { getRolePrivilege, PrivilegeByRole_Id ,getAllPrivileges, ActiveDesactive} from "../../services/auth.service";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { isEmpty } from "../../utils/helper/functions";

const ListeRoles = () => { 
  const [isAddModal, setIsAddModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState({role_id:'',status:false,role_name:''});
  const[selectedPrivileges,setSelectedPrivileges] = useState();
  const [erreurs,setErreurs] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [rolesPrivileges,setRolePrivileges] = useState();
  const [privilegeOption,setPrivilegeOption] = useState([]);
  const [eventStatus,setEventStatus] = useState();
  const handleEditRole = (data) => {
    setSelectedRole({...selectedRole,role_id:data.id,role_name:data.role,status:data.operations == 1 ? true:false});
    PrivilegeByRole_Id(data.id).then((resp) => {
      setSelectedPrivileges({privileges:resp.rolesPrivileges.map((privilege) => {
        return {
              value:privilege.privilege_id,
              label:privilege.privilege  
        }
    })});
    setIsLoading(false);
    setIsEditModal(true); 
  });
  }

  async function fngetAllPrivileges(){
    const{success,status,privileges} = await getAllPrivileges();
    if(status === 200)
    setPrivilegeOption(privileges.map((privilege) => {
       return {
         value:privilege.privilege_id,
         label:privilege.nom
       }
     }));
  }

  async function getAllRolePrivilege(){
    setIsLoading(true);
    const{success,status,rolesPermissions} = await getRolePrivilege();
 
    let rolePermissionFormattedData = [];setRolePrivileges();
    if(status === 200){
      let ord = 0;
      let id,role,privileges,status1 = '';
      for (const [key, values1] of Object.entries(rolesPermissions)) {
        id = key;ord += 1; 
        Object.entries(values1).forEach(([key, values2]) =>{
             Object.entries(values2).forEach(([key, values3]) =>{
                  privileges = values3.slice(0,values3.length - 1);
             });
             //status1 = values2;
             if(key != 'status' && key!='operations' && key != 'systeme')
                role = key; 
              else if(key == 'status')
                 status1 = values2; 
               
        });
       rolePermissionFormattedData.push({ord:ord,id:id,role:role,status:status1,privileges:privileges,operations:values1.operations,systeme:!!values1.systeme});
     
      }
      setRolePrivileges({...rolesPrivileges,rolePermissionFormattedData})
    }
    fngetAllPrivileges();
    setIsLoading(false);
  } 
  //console.log(rolesPrivileges)
  useEffect(() => {
    setIsLoading(true);
      getAllRolePrivilege();
    setIsLoading(false);  
  }, [isEditModal,isAddModal,eventStatus])

  const handleDisableEnableRole = (data) => {
    if(data.status == 1 || data.status == 2){
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Voulez-Vous desactivé ce rôle?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, Desactiver!',
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        setIsLoading(true);setErreurs([]);
        var formData = new FormData();
        formData.append('role_id',data.id);
        formData.append('status',0);  
        setEventStatus(!data.status);
        ActiveDesactive(formData).then((resp) => {
         if(resp.status == 200){
             toast.success("Desactivation effectuée avec succès");
             setIsLoading(false);
         }else{
          toast.error("Vous aviez fait des erreurs.");
          setErreurs(resp.messages); setIsLoading(false);
         }
       });
   
      }
    });
   }else{
      Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Voulez-Vous Activer ce rôle?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, Desactiver!',
        cancelButtonText: "Annuler"
      }).then((result) => {
        if (result.isConfirmed) {
          setIsLoading(true);
          setEventStatus(!data.status);
          var formData = new FormData();
          formData.append('role_id',data.id);
          formData.append('status',!data.status?1:0);
          ActiveDesactive(formData).then((resp) => {
          if(resp.status == 200){
            setIsLoading(false);
            toast.success("Activation effectuée avec succès");
          }else{
            toast.error("Vous aviez fait des erreurs.");
            setErreurs(resp.messages);setIsLoading(false);
        }
        });
      }})
      };
      
     
  }

  const options = (params) => {
    const id = params.row.id;
    return (
      <div className="options">
         {/* Rôle de base : ni modifiable ni désactivable */}
         {params.row.systeme ? <span className="role-de-base" title="Rôle de base : son nom, ses droits et son statut ne peuvent pas être modifiés.">Rôle de base</span> : <>
         {params.row.status === 0 ? '':<button onClick={() => handleEditRole(params.row)}>Modifier</button>} 
         {params.row.status === 1  ? <button onClick={() => handleDisableEnableRole(params.row)} className="delete-btn">
           Desactiver
        </button>
           :<button className="activate-btn" onClick={() => handleDisableEnableRole(params.row)}>Activer</button>}
         </>}
      </div>
    );
  };


  const columnDefs = [
    {
      headerName: "N°Ord.",
      field: "ord",

      minWidth:80
    },
    {
      headerName: "Role",
      field: "role",
      minWidth:120
    },
    {
      headerName: "Privileges",
      field: "privileges",
      flex:1,
      minWidth:300
    },
    { headerName: "Options", field :"options", minWidth:180,renderCell: options},

  ];
  //console.log(isEmpty(rolesPrivileges))
  return (
    <div className="liste-utilisateurs page">
      <Helmet>
        <title>Liste des roles</title>
      </Helmet>
      <AjouterRoleModal isOpen={isAddModal} setIsOpen={setIsAddModal} />
      <ModifierRoleModal isOpen={isEditModal} setIsOpen={setIsEditModal} privilegeOption={privilegeOption} 
       selectedPrivileges = {selectedPrivileges} setSelectedPrivileges={setSelectedPrivileges}
       selectedRole={selectedRole}  
       setSelectedRole={setSelectedRole}/>
      {isLoading && <Spinner />}
      <div className="head">
        <h2>Liste des roles</h2>
        <button className="primary" onClick={() => setIsAddModal(true)}> + Nouveau role</button>
      </div>
      <Erreurs validation = {erreurs} />
  
      {rolesPrivileges ?
         <div className="array">
          <br />
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              // components={{ Toolbar: GridToolbar}}
              rows={rolesPrivileges?.rolePermissionFormattedData?rolesPrivileges?.rolePermissionFormattedData:[]}
              columns={columnDefs}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>: <p>Aucun rôle trouvé.</p>
      }
    </div>
  );
};

export default ListeRoles;