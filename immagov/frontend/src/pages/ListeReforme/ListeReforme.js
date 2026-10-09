import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import { getAllReformes } from "../../services/immatriculation.service";
import Spinner from "../../components/Spinner/Spinner";
import { Link } from "react-router-dom";
import moment from "moment";
import 'moment/locale/fr';
import { Helmet } from 'react-helmet-async'

const STATUTS = { 0: "En attente", 1: "Validée", 2: "Rejetée" };

// Ligne du tableau à partir de GET /reforme/getAllReformes
export const ligneReforme = (data, index) => ({
  id: data.reforme_id,
  Ord: index + 1,
  date: moment(data.created_at).format("DD/MM/YYYY"),
  numImmatriculation: data.immatriculation_number,
  numChassis: data.numChassie,
  vehicule: [data.marque, data.model].filter(Boolean).join(" "),
  cedant: data.organismeCedant || "—",
  // Réforme SIPIM : particulier ; ancienne réforme : bénéficiaire et son organisme
  proprietaire: [data.proprietaire, data.nouvelOrganisme].filter(Boolean).join(" · ") || "—",
  telephone: data.telephone || "",
  status: STATUTS[data.status] || "En attente",
});

const ListeReforme = () => {
  const options = (params) => (
    <div className="options">
      <Link to={`/details-reforme/${params.row.id}`}>
        <button>voir détails</button>
      </Link>
    </div>
  );
  const [immaData, setImmaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getAllReformes()
      .then((reformes) => setImmaData(Array.isArray(reformes) ? reformes.map(ligneReforme) : []))
      .catch(() => setImmaData([]))
      .finally(() => setIsLoading(false));
  }, []);

  const [columnDefs] = useState([
    { headerName: "N°Ord.", field: "Ord", flex: 1, minWidth: 70 },
    { headerName: "Demandée le", field: "date", flex: 1, minWidth: 110 },
    { headerName: "Immatriculation", field: "numImmatriculation", flex: 1, minWidth: 130 },
    { headerName: "Numéro de châssis", field: "numChassis", flex: 1, minWidth: 170 },
    { headerName: "Véhicule", field: "vehicule", flex: 1, minWidth: 140 },
    { headerName: "Organisme cédant", field: "cedant", flex: 1, minWidth: 180 },
    { headerName: "Nouveau propriétaire", field: "proprietaire", flex: 1, minWidth: 190 },
    { headerName: "Téléphone", field: "telephone", flex: 1, minWidth: 120 },
    { headerName: "Statut", field: "status", flex: 1, minWidth: 110 },
    { headerName: "Options", field: "options", minWidth: 150, renderCell: options },
  ]);

  return (
    <div className="liste-reforme page">
      <Helmet>
        <title>Liste des reformes</title>
      </Helmet>
      {isLoading && <Spinner />}
      <h2>Liste des réformes</h2>
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
        </div> : !isLoading && <p>Aucune réforme trouvée.</p>}
    </div>
  );
};

export default ListeReforme;
