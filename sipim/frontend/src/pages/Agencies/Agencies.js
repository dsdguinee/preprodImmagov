import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import NewAgencyModal from "../../components/NewAgencyModal/NewAgencyModal";
import EditAgencyModal from "../../components/EditAgencyModal/EditAgencyModal";
import Api from "../../services/Api";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";

import Erreurs from "../../components/Erreurs/Erreurs";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle"


let num = 0;
const Agencies = () => {
  const [isNewAgencyModalOpen, setIsNewAgencyModalOpen] = useState(false);
  const [isEditAgencyModalOpen, setIsEditAgencyModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isLoading, setIsLoading] = useRecoilState(loadingState);
  const [agencesData, setAgencesData] = useState([]);
  const [erreurs, setErreurs] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);
  const api = new Api();

  // ? Agencies data
  const Columns = [
    {
      field: "numordre",
      headerName: "Ordre",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "nom_agence",
      headerName: "Agence",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "prefecture",
      headerName: "Prefecture",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "commune",
      headerName: "Commune",
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
            <button
              onClick={() => {
                setSelectedAgency(params.row);
                setIsEditAgencyModalOpen(true);
              }}
            >
              Modifier
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const getAgences = async () => {
      const { status, agences, messages } = await api.apiData(
        "get",
        "/agence/getAll"
      );
      num = 0;
      setErreurs([]);
   
      if (status === 200)
        setAgencesData(
          agences.map((agence) => {
            num += 1;
            return {
              numordre: num,
              id: agence.agenceCommune_id,
              nom_agence: agence.nom_agence,
              prefecture: agence.nom_prefecture,
              commune: agence.nom_commune,
              commune_id: agence.commune_id,
              agence_id:agence.agence_id,
              logo:agence.logo
            };
          })
        );
      else setErreurs(messages);
    };
    const decoupages = async () => {
      const { status, prefectures, communes, messages } =
        await api.apiData("get", "/decoupage/getAll");
      setPrefectures([]);
      setCommunes([]);
      setErreurs([]);
      if (status === 200) {
        setPrefectures(prefectures);
        setCommunes(communes);
      } else setErreurs(messages);
    };
    setIsLoading(true);
      getAgences();
      decoupages();
    setIsLoading(false);
  }, [isNewAgencyModalOpen, isEditAgencyModalOpen]);

  return (
    <div className="payment-list page">
      <NewAgencyModal
        isOpen={isNewAgencyModalOpen}
        setIsOpen={setIsNewAgencyModalOpen}
        prefectures={prefectures}
        communes={communes}
      />
      <EditAgencyModal
        isOpen={isEditAgencyModalOpen}
        setIsOpen={setIsEditAgencyModalOpen}
        prefectures={prefectures}
        communes={communes}
        selectedAgency={selectedAgency}
      />
      <div className="header space-between">
        <DocumentTitle title="Liste des agences" />
        <div>
          <h3>Liste des agences</h3>
          <p>{num} agences</p>
        </div>
        <button className="primary" onClick={() => setIsNewAgencyModalOpen(true)}>
          Nouvelle agence
        </button>
      </div>
      <Erreurs validation={erreurs} />
      {agencesData.length > 0 ? (
        <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar }}
              rows={agencesData}
              columns={Columns}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
          </Box>
        </div>
      ) : (<p>Aucune agence enregistrée.</p>)}
    </div>
  );
};

export default Agencies;
