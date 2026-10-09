import { useState,useContext,useEffect } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Link } from 'react-router-dom';
import {Helmet} from "react-helmet-async";
import { getAllImmatriculationValiderforImpression, getReformeStatus } from "../../services/immatriculation.service";
import { ComboContext } from "../../services/Context/Contexts";
import { getMinistereById } from "../../services/organisation.service";
import moment from "moment";
import 'moment/locale/fr';

import Spinner from "../../components/Spinner/Spinner";

const CartesGrises = () => {
   const [immaData,setImmaData] = useState([]);
   const {ministeres} = useContext(ComboContext); 
   const [isLoading,setIsLoading] =useState(false);

    useEffect(() => {
      getImmatriculations();
    },[ministeres]);

    function getImmatriculations(){
      setIsLoading(true);
        if( Array.isArray(ministeres) && ministeres.length > 0 ){
          getAllImmatriculationValiderforImpression().then((resp) => {
           if(resp.status){
              let ord = 0;  
              setImmaData(resp.immatriculations.map((data) => {
                var status = 'En attente';
                if(data.status === 1) {
                  status = "Validé";
                }else if(data.status === 2){
                  status = "Rejeté";
                }else if(data.status == 3){
                  getReformeStatus(data.immatriculation_id).then((resp) => {
                    if(resp.success){
                      if(resp.reforme.status === 0){
                        status = "Ref. En Attente";
                      }else if(resp.reforme.status === 1){
                        status = "Ref. Valideé";
                      }else if(resp.reforme.status === 2){
                        status = "Ref. Rejetée";
                      }
                    }
                  });
                }else if(data.status === 4){
                  status = "Muté";
                }
            const minis = ministeres.filter(m => m.ministere_id == data.minister_id)[0]?.nom;
            let ministere = '';
              if(data.minister_id != 1000000 &&  data.minister_id != null) {
                    const minis = ministeres.filter((m)=>m.ministere_id === data.minister_id)[0]?.nom;
                    if(minis)
                        ministere = minis;
                    else {
                      getMinistereById(data.minister_id).then((resp) => {
                          ministere = resp
                      })
                    }
                  }
                  else{
                    ministere = data.autreministere;
                  }
            
              ord = ord + 1;
              
              return {
                'id': data.immatriculation_id,
                "Ord": ord,
                'date' : moment(data.updated_at).format('Do MMMM  YYYY'),
                'modeImmatriculation':data.modeImmatriculation, 
                'numImmatriculation':data.immatriculation_number,
                'numChassis' : data.numChassie,
                'marque': data.marque,
                'modele':data.model,
                'ministere':ministere,
                'status1': status,
                'status':data.imprimer === 0 ? "Non Imprimée": "Imprimée",
                'nbreImpr':data.nbreImpr
              }
              }));
            }
          }) ;
        }
      setIsLoading(false);
    } 
  
   
  const options = (params) => {
    const id = params.row.id;
    return (
        <div className="options">
            <Link to={`/carte-grise/${id}`}>
                <button>Voir Carte Grise</button>                
            </Link>               
        </div>
    );
  }

  const [columnDefs] = useState([
    { headerName: "N°Ord.", field: "Ord", flex: 1},
    { headerName: "Date", field: "date", flex: 1},
    { headerName: "Mode Immat.", field: "modeImmatriculation", flex: 1},
    { headerName: "Immatriculation", field: "numImmatriculation", flex: 1},
    { headerName: "Numero de chassis", field: "numChassis", flex: 1},
    { headerName: "Marque", field: "marque", flex: 1},
    { headerName: "Modele", field: "modele", flex: 1 },
    { headerName: "Ministère", field: "ministere", flex: 1 },
    { headerName: "Status", field: "status", flex: 1 },
    { headerName: "Imp.(Nb fois)", field: "nbreImpr", flex: 1},
    { headerName: "Options", field: "options", renderCell: options, minWidth: 180 },
  ]);

  return (
    <div className="liste-immatriculation page">
      <Helmet>
        <title>Liste des cartes grises</title>
      </Helmet>
      {isLoading && <Spinner/>}
      <h2>Cartes grises</h2>
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

export default CartesGrises;
