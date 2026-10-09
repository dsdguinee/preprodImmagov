import { useState,useEffect } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Helmet } from "react-helmet-async";
import { statistique } from "../../services/immatriculation.service";

const Statistiques = () => {
  const [stats,setStats] = useState([]);

  async function Element(){
    const{success,statistiques,messages} = await statistique();
      setStats([{
             'id':1,
             'immatriculation':statistiques.valide,
            'reforme':statistiques.reforme,
            'mutation':statistiques.mutation,
            'rejete':statistiques.rejete,
            'ep':statistiques.EP,
            'va':statistiques.VA,}])
    } 

  useEffect(() => {
     Element()
  }, [])

  const columnDefs = [
    { headerName: "Validé", field: "immatriculation", flex: 1 },
    { headerName: "Reformé", field: "reforme", flex: 1 },
    { headerName: "Muté", field: "mutation", flex: 1 },
    { headerName: "Rejeté", field: "rejete", flex: 1 },
    { headerName: "EP", field: "ep", flex: 1 },
    { headerName: "VA", field: "va", flex: 1 },
  ];

  return (
    <div className="page">
      <Helmet>
        <title>Statistiques</title>
      </Helmet>
      <h2>Statistiques</h2>
      <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={stats}
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

export default Statistiques;
