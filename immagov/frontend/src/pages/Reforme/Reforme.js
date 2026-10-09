import { useState, useContext, useEffect } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Link } from "react-router-dom";
import { getAllImmatriculationToReforme, getAllImmatriculationValidee } from "../../services/immatriculation.service";
import { ComboContext } from "../../services/Context/Contexts";
import Spinner from "../../components/Spinner/Spinner";
import moment from "moment";
import "moment/locale/fr";
import { Helmet } from 'react-helmet-async'

const Reforme = () => {
  moment.locale("fr");
  const [isLoading, setIsLoading] = useState(false);
  const [immaData, setImmaData] = useState([]);
  const { ministeres } = useContext(ComboContext);
  const options = (params) => {
    const id = params.row.id;
    return (
      <div className="options">
        <Link to={`/nouvellereforme/${id}`}>
          <button>Reformer</button>
        </Link>
      </div>
    );
  };

  async function getImmatriculations() {
    setIsLoading(true);setImmaData([]);
      if (Array.isArray(ministeres) && ministeres.length > 0) {
        getAllImmatriculationToReforme().then((resp) => {
        if(Array.isArray(resp) && resp.length > 0){ 
            let ord = 0;
            setImmaData(
              resp.map((data) => {
                /*  var status = 'En attente';
          if(data.status === 1) {
            status = "Validé";
          }else if(data.status === 2){
            status = "Rejeté";
          } */
                const ministere =
                  data.minister_id !== 1000000
                    ? ministeres.filter(
                        (m) => m.ministere_id === data.minister_id
                      )[0].nom
                    : data.autreministere;

                ord = ord + 1;
                return {
                  id: data.immatriculation_id,
                  Ord: ord,
                  date: moment(data.updated_at).format("Do MMMM  YYYY"),
                  modeImmatriculation: data.modeImmatriculation,
                  numImmatriculation: data.immatriculation_number,
                  numChassis: data.numChassie,
                  marque: data.marque,
                  modele: data.model,
                  ministere: ministere,
                  //'status': status,
                };
              })
            );
          }
        });
      }
    setIsLoading(false);
  }
  useEffect(() => {
    getImmatriculations();
  }, [ministeres]);
  //const [rowData] = useState(ImmatriculationsData);
  const [columnDefs] = useState([
    {
      headerName: "N°Ord.",
      field: "Ord",
      flex: 1, minWidth: 100
    },
    {
      headerName: "Mode Immat.",
      field: "modeImmatriculation",
      minWidth: 150 , flex: 1, 
    },
    {
      headerName: "Immatriculation",
      field: "numImmatriculation",
      flex:1,
      minWidth:150
    },
    {
      headerName: "Numero de chassis",
      field: "numChassis",
      flex:1,
      minWidth:150
    },
    { headerName: "Marque", field: "marque", sortable: true, filter: true },
    { headerName: "Modele", field: "modele", sortable: true, filter: true },
    {
      headerName: "Ministère",
      field: "ministere",
      flex:1,
      minWidth:150
    },
    { headerName: "Options", field:'options',flex:1,minWidth:150,renderCell: options },
   
  ]);

  return (
    <div className="mutation page">
      <Helmet>
        <title>Nouvelle reforme</title>
      </Helmet>
      {isLoading && <Spinner />}
      <h2>Nouvelle Reforme</h2>
   
      {immaData.length > 0 ?
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
       </div>: <p>Aucune immatriculation trouvée.</p>
      }
    </div>
  );
};

export default Reforme;
