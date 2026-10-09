import { useState,useEffect,useContext } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { getAllMutation } from "../../services/immatriculation.service";
import { Link } from "react-router-dom";
import moment from "moment";
import 'moment/locale/fr';
import { Helmet } from 'react-helmet-async'
import { ComboContext } from "../../services/Context/Contexts";

import Spinner from "../../components/Spinner/Spinner";

const ListeMutation = () => {  
  const [immaData,setImmaData] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const {ministeres} = useContext(ComboContext); 

  async function getMutations(){
    setIsLoading(true);
      const {success,mutations} = await getAllMutation();
      let ord = 0;
      if(success){
        if(mutations && ministeres.length > 0)
            setImmaData(mutations.map((data) =>{ 
              var status = 'En attente';
                if(data.status == 1)
                  status = 'Validé';
                else if(data.status == 2)
                  status = 'Rejeté';  
                ord = ord + 1; 
                let ministere = '';
                if(data.status != 0) 
                  ministere = data.nomMinistere;
                else
                  ministere = ministeres.filter((m)=>m.ministere_id == data.ancienMinistereID)[0]?.nom ;
                    
                return{
                  'id': data.mutation_id,
                  "Ord": ord,
                  'date' : moment(data.updated_at).format('Do MMMM  YYYY'),
                  'modeImmatriculation':data.modeImmatriculation, 
                  'numImmatriculation':data.immatriculation_number,
                  'numChassis' : data.numChassie,
                  'marque': data.marque,
                  'modele':data.model,
                  'ministere':ministere,
                  'status': status,
                }
            }));
        }
   setIsLoading(false);      
   }

 useEffect(() => {
    getMutations();
 },[ministeres]);

 const options = (params) => {
  const id = params.row.id;
  return (
    <div className="options">
      <Link to={`/details-mutation/${id}`}>
        <button>
          voir détails
        </button>
      </Link>
    </div>
  );
};

 const [columnDefs] = useState([
    { headerName: "N°Ord.", field: "Ord", flex: 1 },
    { headerName: "Date", field: "date", flex: 1 },
    { headerName: "Mode Immat.", field: "modeImmatriculation", flex: 1 },
    { headerName: "Immatriculation", field: "numImmatriculation", flex: 1 },
    { headerName: "Numero de chassis", field: "numChassis", flex: 1 },
    { headerName: "Marque", field: "marque", flex: 1 },
    { headerName: "Modele", field: "modele", flex: 1 },
    { headerName: "Ministère", field: "ministere", flex: 1 },
    { headerName: "Status", field: "status", flex: 1 },
    { headerName: "Options", field: "options", renderCell: options, flex: 1 },
  ]);

  return (
    <div className="liste-mutation page">
      <Helmet>
        <title>Liste des mutations</title>
      </Helmet>
      {isLoading && <Spinner />}
      <h2>Liste des mutations</h2>
      <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={immaData}
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

export default ListeMutation;