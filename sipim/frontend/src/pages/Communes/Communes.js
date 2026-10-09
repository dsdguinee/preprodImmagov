import { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";

import NewCommuneModal from "../../components/NewCommuneModal/NewCommuneModal";
import EditCommuneModal from "../../components/EditCommuneModal/EditCommuneModal";
import Api from "../../services/Api";
import Erreurs from "../../components/Erreurs/Erreurs";
import { UserContext } from "../../services/Context/Context";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { useRecoilState } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";

const Communes = () => {
  const [isNewCommuneModalOpen, setIsNewCommuneModalOpen] = useState(false);
  const [isEditCommuneModalOpen, setIsEditCommuneModalOpen] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [communeData, setCommuneData] = useState([]);
  const [erreurs, setErreurs] = useState([]);
  const [reload, setReload] = useState(false);
  const [, setIsLoading] = useRecoilState(loadingState);

  const { decoupage, refreshDecoupage } = useContext(UserContext);
  const api = new Api();

  // Apres un ajout / une modification / une suppression : on recharge la liste
  // et le decoupage partage (listes deroulantes des agences, utilisateurs...)
  const onSaved = () => {
    setReload((r) => !r);
    refreshDecoupage && refreshDecoupage();
  };

  const handleDelete = (data) => {
    setErreurs([]);
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: `de supprimer la commune ${data.commune}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setIsLoading(true);
      const resp = await api.apiData("get", `/decoupage/commune/delete/${data.id}`);
      if (resp?.status === 200) {
        toast.success("Commune supprimée avec succès.");
        onSaved();
      } else setErreurs(resp?.messages);
      setIsLoading(false);
    });
  };

  const Columns = [
    { field: "num", headerName: "Numero", flex: 1, minWidth: 100 },
    { field: "region", headerName: "Region", flex: 1, minWidth: 150 },
    { field: "prefecture", headerName: "Prefecture", flex: 1, minWidth: 150 },
    { field: "commune", headerName: "Commune", flex: 1, minWidth: 150 },
    { field: "code", headerName: "Code", flex: 1, minWidth: 100 },
    {
      field: "options",
      headerName: "Options",
      sortable: false,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="options">
          <button onClick={() => { setSelectedCommune(params.row); setIsEditCommuneModalOpen(true); }}>Modifier</button>
          <button className="delete" onClick={() => handleDelete(params.row)}>Supprimer</button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const getCommunes = async () => {
      setErreurs([]);
      const { status, messages, communes } = await api.apiData("get", "decoupage/communes");
      if (status === 200) {
        setCommuneData(
          communes.map((c, index) => ({
            num: index + 1,
            id: c.commune_id,
            region: c.region,
            prefecture_id: c.prefecture_id,
            prefecture: c.prefecture,
            commune: c.commune,
            code: c.communeCD,
          }))
        );
      } else setErreurs(messages);
    };
    getCommunes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  return (
    <div className="payment-list page">
      <NewCommuneModal
        isOpen={isNewCommuneModalOpen}
        setIsOpen={setIsNewCommuneModalOpen}
        prefectures={decoupage?.prefectures}
        onSaved={onSaved}
      />
      <EditCommuneModal
        isOpen={isEditCommuneModalOpen}
        setIsOpen={setIsEditCommuneModalOpen}
        selectedCommune={selectedCommune}
        onSaved={onSaved}
      />
      <Erreurs validation={erreurs} />
      <div className="header space-between">
        <div>
          <h3>Liste des communes</h3>
          <p>{communeData.length} communes</p>
        </div>
        <button className="primary" onClick={() => setIsNewCommuneModalOpen(true)}>
          Nouvelle commune
        </button>
      </div>
      <div className="array">
        <Box sx={{ height: 579, width: "100%" }}>
          <DataGrid
            sx={{ borderRadius: 0 }}
            density="compact"
            components={{ Toolbar: GridToolbar }}
            rows={communeData}
            columns={Columns}
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

export default Communes;
