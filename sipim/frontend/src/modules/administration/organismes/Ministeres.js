import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../../components/DataGrid";

import MinistereModal from "./MinistereModal";
import { organismesApi } from "../api";
import Erreurs from "../../../components/Erreurs/Erreurs";
import DocumentTitle from "../../../components/DocumentTitle/DocumentTitle";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { loadingState, useAtomState } from "../../../store/atoms";

const ONGLETS = [
  { value: "Ministère", label: "Ministères" },
  { value: "Entreprise Publique", label: "Entreprises publiques" },
];

// Ministères (client « Gouvernement ») et entreprises publiques (client « Entreprise Publique ») — privilège « Ministère »
const Ministeres = () => {
  const [onglet, setOnglet] = useState("Ministère");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [ministeres, setMinisteres] = useState([]);
  const [erreurs, setErreurs] = useState([]);
  const [reload, setReload] = useState(false);
  const [, setIsLoading] = useAtomState(loadingState);

  const onSaved = () => setReload((r) => !r);
  const lignes = ministeres.filter((m) => m.categorie === onglet).map((m, index) => ({ ...m, num: index + 1 }));

  const ouvrir = (ministere) => {
    setSelected(ministere);
    setIsModalOpen(true);
  };

  const handleDelete = (data) => {
    setErreurs([]);
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: `de supprimer ${data.nom}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setIsLoading(true);
      const resp = await organismesApi.supprimer(data.id);
      if (resp?.status === 200) {
        toast.success("Ministère supprimé avec succès.");
        onSaved();
      } else setErreurs(resp?.messages);
      setIsLoading(false);
    });
  };

  const Columns = [
    { field: "num", headerName: "N°", minWidth: 60, maxWidth: 70 },
    { field: "nom", headerName: onglet === "Ministère" ? "Ministère / institution" : "Entreprise publique", flex: 3, minWidth: 280 },
    { field: "nbrePaiements", headerName: "Paiements", flex: 1, minWidth: 100 },
    {
      field: "options",
      headerName: "Options",
      sortable: false,
      filterable: false,
      disableExport: true,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="options">
          <button onClick={() => ouvrir(params.row)}>Modifier</button>
          {/* Un ministère déjà utilisé par des paiements ne peut pas être supprimé */}
          {params.row.nbrePaiements === 0 && (
            <button className="delete" onClick={() => handleDelete(params.row)}>Supprimer</button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    const charger = async () => {
      setErreurs([]);
      const { status, messages, ministeres: liste } = await organismesApi.lister();
      if (status === 200) {
        setMinisteres(
          (liste || []).map((m) => ({
            id: m.ministere_id,
            nom: m.nom,
            // Sans catégorie (base pas encore migrée) : ministère
            categorie: m.categorie || "Ministère",
            nbrePaiements: Number(m.nbrePaiements) || 0,
          }))
        );
      } else setErreurs(messages);
    };
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  return (
    <div className="payment-list page">
      <DocumentTitle title="Ministères et entreprises publiques" />
      <MinistereModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} ministere={selected} categorie={onglet} onSaved={onSaved} />
      <Erreurs validation={erreurs} />
      <div className="header space-between">
        <div>
          <h3>Ministères et entreprises publiques</h3>
          <p>{lignes.length} {onglet === "Ministère" ? "ministères proposés pour les clients Gouvernement" : "entreprises publiques proposées pour les clients Entreprise Publique"}</p>
        </div>
        <button className="primary" onClick={() => ouvrir(null)}>
          {onglet === "Ministère" ? "Nouveau ministère" : "Nouvelle entreprise publique"}
        </button>
      </div>
      <div className="organismes-onglets" role="tablist" aria-label="Catégorie">
        {ONGLETS.map((o) => (
          <button key={o.value} type="button" role="tab" aria-selected={onglet === o.value}
            className={onglet === o.value ? "is-active" : ""} onClick={() => setOnglet(o.value)}>
            {o.label} <span>{ministeres.filter((m) => m.categorie === o.value).length}</span>
          </button>
        ))}
      </div>
      <div className="array">
        <Box sx={{ height: 579, width: "100%" }}>
          <DataGrid
            sx={{ borderRadius: 0 }}
            density="compact"
            components={{ Toolbar: GridToolbar }}
            rows={lignes}
            columns={Columns}
            autoPageSize
            pagination
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </div>
    </div>
  );
};

export default Ministeres;
