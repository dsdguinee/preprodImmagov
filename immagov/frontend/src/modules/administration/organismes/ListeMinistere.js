import { useState, useEffect, useContext } from "react";

import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../../components/DataGrid";
import { Link } from "react-router-dom";
import AjouterMinistereModal from "./AjouterMinistereModal";
import Erreurs from "../../../components/erreurs/Erreurs";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Spinner from "../../../components/Spinner/Spinner";
import { Helmet } from 'react-helmet-async';
import { ComboContext } from "../../../core/context/contexts";
import { organismesApi } from "../api";

// Onglets : ministères et institutions (client Gouvernement), entreprises publiques (il n'y a plus d'organisme privé)
export const ONGLETS_ORGANISMES = [
  { value: "Ministère", label: "Ministères et institutions", ajouter: "Nouveau ministère", filtre: (m) => m.categorie === "Ministère" },
  // Organisme sans catégorie (ancienne donnée) : compté avec les entreprises publiques
  { value: "Entreprise Publique", label: "Entreprises publiques", ajouter: "Nouvelle entreprise publique", filtre: (m) => m.categorie !== "Ministère" },
];

const ListeMinistere = () => {
  const [isAddModal, setIsAddModal] = useState(false);
  const [ministeres, setMinisteres] = useState([]);
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [onglet, setOnglet] = useState("Ministère");
  const { rechargerOrganisations } = useContext(ComboContext);
  const ongletActif = ONGLETS_ORGANISMES.find((o) => o.value === onglet);

  function getallministere() {
    setIsLoading(true);
    organismesApi.lister().then((resp) => {
      setMinisteres(resp || []);
      setIsLoading(false);
    });
  }
  // Après un ajout ou une suppression : liste de la page et listes de l'application (immatriculation) relues
  const onSaved = () => {
    getallministere();
    rechargerOrganisations && rechargerOrganisations();
  };

  useEffect(() => {
    getallministere();
  }, []);

  const handDeleteMinistere = (data) => {
    setErreurs([]);
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Supprimer « ${data.nom} » ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed && data) {
        var formData = new FormData();
        formData.append('ministere_id', data.id);
        organismesApi.supprimer(formData).then((resp) => {
          if (resp.success) {
            toast.success('Suppression effectuée avec succès.');
            onSaved();
          } else {
            toast.error("Suppression impossible.");
            setErreurs(resp.messages);
          }
        });
      }
    });
  };

  const options = (params) => (
    <div className="options">
      <Link to={`/modifier-ministere/${params.row.id}`}>
        <button>Modifier</button>
      </Link>
      <button className="delete-btn" onClick={() => handDeleteMinistere(params.row)}>Supprimer</button>
    </div>
  );

  const lignes = ministeres.filter(ongletActif.filtre)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
    .map((m, index) => ({ ord: index + 1, id: m.ministere_id, nom: m.nom }));

  const columnDefs = [
    { headerName: "N°", field: "ord", minWidth: 60, maxWidth: 70 },
    { headerName: "Nom", field: "nom", flex: 1, minWidth: 220 },
    { headerName: "Options", field: "options", minWidth: 220, sortable: false, filterable: false, disableExport: true, renderCell: options },
  ];

  return (
    <div className="liste-ministere page">
      <Helmet>
        <title>Ministères et organismes</title>
      </Helmet>
      {isLoading && <Spinner />}
      <AjouterMinistereModal isOpen={isAddModal} setIsOpen={setIsAddModal} categorie={onglet} organismes={ministeres} onSaved={onSaved} />
      <Erreurs validation={erreurs} />
      <div className="head">
        <h2>Ministères et organismes</h2>
        <button className="primary" onClick={() => setIsAddModal(true)}>+ {ongletActif.ajouter}</button>
      </div>
      <div className="organismes-onglets" role="tablist" aria-label="Catégorie d'organisme">
        {ONGLETS_ORGANISMES.map((o) => (
          <button key={o.label} type="button" role="tab" aria-selected={onglet === o.value}
            className={onglet === o.value ? "is-active" : ""} onClick={() => setOnglet(o.value)}>
            {o.label} <span>{ministeres.filter(o.filtre).length}</span>
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
            columns={columnDefs}
            autoPageSize
            pagination
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </div>
    </div>
  );
};

export default ListeMinistere;
