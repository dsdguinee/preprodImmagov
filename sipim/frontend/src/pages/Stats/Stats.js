import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { useContext, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import Erreurs from "../../components/Erreurs/Erreurs";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import Api from "../../services/Api";
import { ElementContext, UserContext } from "../../services/Context/Context";
import { expression, objecttoFormData } from "../../services/Helpers/fonctions";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import EtatRecettes from "./EtatRecettes";


const Stats = () => {
  const api = new Api();
  const [erreurs,setErreurs] = useState();
  const [isLoading,setIsLoading] = useRecoilState(loadingState);
  const [paiementData,setPaiementData] = useState([]);
  const {elementsData} = useContext(ElementContext);
  const {decoupage} = useContext(UserContext);
  const[loadedAgences,setLoadedAgences] = useState([]);
  const [onglet,setOnglet] = useState('recettes');
  
  const[search,setSearch] = useState({
    region_id:0,
    prefecture_id: 0,
    prefectures:[],
    agence_id:0,
    agences:[],
    startDate:'',
    endDate:'',
  })
  const Columns = [
    {
      field: "region",
      headerName: "Region",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "pref",
      headerName: "Prefecture",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "comm",
      headerName: "Commune",
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
      field: "vignette",
      headerName: "Vignette",
      flex: 1,
      minWidth: 380,
    },
    {
      field: "montantvg",
      headerName: "Montant(GNF)",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "cg",
      headerName: "Carte grise",
      flex: 1,
      minWidth: 350,
    },
    {
      field: "montantcg",
      headerName: "Montant(GNF)",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "autorisation",
      headerName: "Autorisation de Transport",
      flex: 1,
      minWidth: 350,
    },
    {
      field: "montantau",
      headerName: "Montant(GNF)",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "document",
      headerName: "Type Operation",
      flex: 1,
      minWidth: 150,
    },
  
    {
      field: "total",
      headerName: "Total(GNF)",
      flex: 1,
      minWidth: 150,
    },
  
  ];
  const formateData = (data) => {
    const paiemData = data &&
    data.map((prefAgence,index) => {
      let cg = "----"
      if(elementsData?.typeCarteGrise){
        const carte = elementsData.typeCarteGrise.filter((c) => c.typecg_id === parseInt(prefAgence.typeCg !== 'null' && prefAgence?.typeCg?prefAgence.typeCg:0));
        if(carte.length > 0){
            cg = expression(carte[0]).expression;
          
        }
      }
      let montant = parseFloat(prefAgence?.totalvg !== 'null' && prefAgence?.totalvg?prefAgence.totalvg:0)+parseFloat(prefAgence?.totalcg!=='null' && prefAgence?.totalcg?prefAgence.totalcg:0)
      + parseFloat(prefAgence?.totalau!=='null' && prefAgence?.totalau?prefAgence.totalau:0)
      + (parseFloat(prefAgence?.montant_operation) || 0);

      let document = 'Non Fournie';
      if(prefAgence.type_document === 'tous')
        document = 'Tous';
      else if(prefAgence.type_document === 'vignette')  
          document = 'Vignette';
      else if(prefAgence.type_document === 'autorisation')       
         document = 'Autorisation de Transport';
      else if(prefAgence.type_document === 'mutation')       
        document = 'Mutation';    
      else if(prefAgence.type_document === 'reforme')
        document = 'Réforme';
     else if(prefAgence.type_document === 'cartegrise')       
        document = 'Carte Grise';     
    else if(prefAgence.type_document === 'duplicata')       
        document = 'Duplicata';       
    else if(prefAgence.type_document === 'changementmodeexp')       
        document = 'Changement Mode Exploitation'; 
      return{
        id:index,
        region_id:prefAgence.region_id,
        region:prefAgence.region,
        pref:prefAgence.prefecture,
        prefecture_id:prefAgence.prefecture_id,
        commune_id:prefAgence.commune_id,
        comm:prefAgence.commune,
        agence:prefAgence.nom_agence,
        vignette:prefAgence?.vignette?prefAgence.vignette:'-----',
        cg:cg,
        montantvg:prefAgence?.totalvg?prefAgence?.totalvg:0,
        montantcg:prefAgence?.totalcg?prefAgence?.totalcg:0,
        montantau:prefAgence?.totalau?prefAgence?.totalau:0,
        autorisation:prefAgence.nomAutorisation?prefAgence.nomAutorisation:'------',
        document:document,
        total:montant 
      }
     });
     setPaiementData(paiemData);
  }
  useEffect(() => {
    const  getData = async () => {
      setIsLoading(true);setErreurs([]);
        const {status,messages,PrefectureAgences} = await api.apiData('get','/paiement/statistiques');  
     
        if(status === 200){
              formateData(PrefectureAgences);
             setIsLoading(false);
             
        }else{
          setErreurs(messages);
          setIsLoading(false);
        }
    }   
    getData() ;
    
  },[elementsData]); 
  const handleInput = async (e) => {
     if(e.target.name === 'region_id'){
        const prefectures = decoupage.prefectures.filter((p) => p.region_id === parseInt(e.target.value));
        setSearch({...search,[e.target.name]:e.target.value,prefectures:prefectures,agences:[]});
     }else if(e.target.name === 'prefecture_id'){
            setErreurs([]);
            const id = e.target.value;
            if(e.target.value !== ''){
              setIsLoading(true);
              const {status,messages,AgencesPref} = await api.apiData('get',`/agence/agenceprefecture/${e.target.value}`);  
              setIsLoading(false);  
              if(status === 200){
                    setSearch({...search,prefecture_id:id,agences:AgencesPref});return;
                  }
              else 
                  setErreurs(messages);  
            }else{
           
              setSearch({...search,[e.target.name]:e.target.value});
            }     
     }else {
         setSearch({...search,[e.target.name]:e.target.value});
     }
  }
  const submitSearch = async (e) => {
    e.preventDefault();
    setErreurs([]);setIsLoading(true);
    var formeData = objecttoFormData(search)
    const{status,PrefectureAgences,messages} = await api.apiData('post','/paiement/statistiques',formeData);
    setIsLoading(false);
    if(status === 200)
      formateData(PrefectureAgences)
     else
      setErreurs(messages);
     
  }
  return (
    <div className="page stats">
      <DocumentTitle title="Statistiques" />
      <div className="header">
        <h3>Statistiques</h3>
        <div className="onglets" role="tablist" aria-label="Statistiques">
          <button type="button" role="tab" aria-selected={onglet === 'recettes'} onClick={() => setOnglet('recettes')}>État des recettes</button>
          <button type="button" role="tab" aria-selected={onglet === 'detail'} onClick={() => setOnglet('detail')}>Tableau détaillé</button>
        </div>
      </div>
      {onglet === 'recettes' && <EtatRecettes />}
      {onglet === 'detail' && (<>
       <Erreurs validation = {erreurs} />
      <div className="filters">
        <form onSubmit={submitSearch}>
          <h4>Filtres</h4>
          <div className="input-group">
            <label>
              Region
              <select name="region_id" id="region" placeholder="Region"
                onChange={handleInput} value={search.region_id}
              >
                <option value=''>Region</option>
                 {decoupage?.regions && decoupage.regions.map((region) => {
                  return <option value={region.region_id} key={"region"+region.region_id}>{region.nom}</option>
                 })}
              </select>
            </label>
            <label>
              Prefecture
              <select name="prefecture_id" id="prefecture_id" placeholder="Prefecture"
                  onChange={handleInput} value={search.prefecture_id}
                  >
                <option value=''>Prefecture</option>
                {search?.prefectures && search?.prefectures.map((prefect) => {
                  return <option value={prefect.prefecture_id} key={"prefecture"+prefect.prefecture_id}>{prefect.nom}</option>
                })}
              </select>
            </label>
            <label>
              Agence
              <select name="agence_id" id="agence_id" placeholder="Agence" onChange={handleInput}>
                <option value=''>Agence</option>
                {search.agences.length > 0 && search.agences.map((agence) => {
                  return <option value={agence.agence_id} key={"agence"+agence.agence_id}>{agence.commune+"/"+agence.nom_agence}</option>
                })}
              </select>
            </label>
            <label>
              Date début
              <input
                type="date"
                name="startDate"
                id="startDate"
                placeholder="Date de début"
                onChange={handleInput}
                value={search.startDate}
              />
            </label>
            <label>
              Date fin
              <input
                type="date"
                name="endDate"
                id="endDate"
                placeholder="Date de fin"
                onChange={handleInput}
                value={search.endDate}
              />
            </label>
          </div>
          <button type="submit">Rechercher</button>
        </form>
      </div>
      <div className="array">
        <Box sx={{ height: 579, width: "100%" }}>
          <DataGrid
            sx={{ borderRadius: 0 }}
            density="compact"
            components={{ Toolbar: GridToolbar }}
            rows={paiementData}
            columns={Columns}
            autoPageSize
            pagination
            disableSelectionOnClick
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            disableColumnResize={true}
          />
        </Box>
      </div>
      </>)}
    </div>
  );
};

export default Stats;
