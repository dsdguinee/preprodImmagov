import { useState, useEffect, useContext } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { Link,useLocation } from 'react-router-dom';
import moment from "moment";
import 'moment/locale/fr';
import { getAllImmatriuculation,searchImmatriculation,getReformeStatus,getMutationStatus } from "../../services/immatriculation.service";
import {ComboContext} from "../../services/Context/Contexts";
import Spinner from "../../components/Spinner/Spinner";
import { getMinistereById } from "../../services/organisation.service";
import { Helmet } from 'react-helmet-async';

const ListeImmatriculation = () => {

    const [immaData,setImmaData] = useState([]);
    const [isLoading,setIsLoading] = useState(false);
    const {ministeres} = useContext(ComboContext); 
    const[selectMode,setSelectMode] = useState('');
    const [isselectedclicked,setIsselectedclicked] = useState(false);
    const[status1,setStatus1] = useState();

    moment.locale('fr');

    const options = (params) => {
        const id = params.row.id;
        return (
            <div className="options">
                <Link to={`/details-immatriculation/${id}`}>
                    <button>Voir Détails</button>                
                </Link>               
            </div>
        );
    }

 const mutationStatus = async (immatriculation_id) => {
    const {success,mutation} = (await getMutationStatus(immatriculation_id));
    setStatus1(mutation.status);
    if(success)
      return mutation.status;
     else return null;
  } 

  async function getImmatriculationSearch(option,optionValue){
    setIsLoading(true);
     const result = (await searchImmatriculation(option,optionValue));
  
     if( Array.isArray(result) && result.length > 0 ){
         let ord = 0;
        setImmaData(result.map((data) => {
          let status = 'En attente';
          if(data.status === 1) {
            status = "Validé";
          }else if(data.status === 2){
            status = "Rejeté";
          }else if(data.status === 3){
            status = "Reforme";
        
          }else if(data.status === 4){
            status = "Mutation";
          }

  
          const ministere = parseInt(data.minister_id) !== 1000000 && data.minister_id !== null ? ministeres.filter((m)=>m.ministere_id === data.minister_id)[0]?.nom:data.autreministere;
          ord = parseInt(ord) + 1;
         
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
            'status': status,
          }
        }));
     }else setImmaData([]);
     setIsLoading(false);
  }  
  async function getImmatriculations(){
    setIsLoading(true);
      if( Array.isArray(ministeres) && ministeres.length > 0 ){
        getAllImmatriuculation().then((resp) => {
          let ord = 0;  
          setImmaData(resp.map((data) => {
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
            'status': status,
          }
        }));
        }) ;
      }
    setIsLoading(false);
  } 
  const location = useLocation();
  useEffect(() => {
    if(location.state && !isselectedclicked){
      const { title,filter_id } = location.state;
      setSelectMode(filter_id);
      getImmatriculationSearch(title,filter_id)
    } else{
      getImmatriculations();
    }

  }, [ministeres,location?.state]);

  const handleChange = (e) =>{
    if(location.state)
      location.state.filter_id = e.target.value;
      
    setSelectMode(e.target.value);
    getImmatriculationSearch(e.target.selectedOptions[0].text,e.target.value); 
    if(!setIsselectedclicked)
       setIsselectedclicked(true);
  }

  const columnDefs = [
    { headerName: "N°Ord.", field: "Ord", minWidth: 80 },
    { headerName: "Date", field: "date",  minWidth: 150 , flex: 1, },
    { headerName: "Mode Immat.", field: "modeImmatriculation",flex: 1,   minWidth: 150 },
    { headerName: "Immatriculation", field: "numImmatriculation", },
    { headerName: "Numero de chassis", field: "numChassis", flex: 1},
    { headerName: "Marque", field: "marque",  flex: 1 },
    { headerName: "Modele", field: "modele",  flex: 1 },
    { headerName: "Affectation", field: "ministere",  flex: 1 },
    { headerName: "Status", field: "status",   minWidth: 120,  flex: 1 },
    { headerName: "Options", field: "options", renderCell: options },
    
  ];

  return (
    <div className="liste-immatriculation page">
     {isLoading && <Spinner />}
      <Helmet>
         <title>Liste des immatriculations</title>
      </Helmet>
      <h2>Liste des immatriculations</h2>
      <div className="filter-and-search">
          <div className="filter">
              <label> Filtrer par status
                  <select onChange={handleChange} value={selectMode}>
                      <option value="-1">Tout</option>
                      <option value={0}>En attente</option>
                      <option value={1}>Validé</option>
                      <option value={2}>Rejeté</option>
                      <option value="3">Reforme</option>
                      <option value="4">Mutation</option>
                  </select>
              </label>
          </div>
          {/* <div className="search">
              <input type="text" placeholder="Chercher" />
          </div> */}
      </div>
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
        </div>: <p>Aucune immatriculation trouvée.</p>}
    </div>
  );
};

export default ListeImmatriculation;
