import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, frFR } from "../../components/DataGrid";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

import AjouterDirectionModal from "../../components/AjouterDirectionModal/AjouterDirectionModal";
import ModifierDirectionModal from "../../components/ModifierDirectionModal/ModifierDirectionModal";
import { getMinistereById, deleteDirection } from "../../services/organisation.service";
import { updateMinistere, getAllDirectionByID } from "../../services/organisation.service";
import Erreurs from "../../components/erreurs/Erreurs";
import Spinner from "../../components/Spinner/Spinner";

const ModifierMinistere = () => {
  const [ministere, setMinistere] = useState("");
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState({});
  const [selecteDirectionID, setselectedDirectionID] = useState();
  const [selectedMinistereID, setSelectedMinistereID] = useState();
  const [isEditModal, setIsEditModal] = useState(false);
  const [isAddModal, setIsAddModal] = useState(false);
  const [erreurs, setErreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();

  const handleEditDirection = (data) => {
    setIsEditModal(true);
    if (data) {
      setSelectedDirection(data.nom);
      setselectedDirectionID(data.directionID);
      setSelectedMinistereID(data.ministere_id);
    }
  };

  function allDirectionByMinistereID(ministere_id) {
    setIsLoading(true);
    getAllDirectionByID(ministere_id).then((resp) => {
      let ord = 0;
      if (resp.status !== 404) {
        setDirections(
          resp.directions.map((data) => {
            ord = ord + 1;
            return {
              id:data.direction_id,
              ord: ord,
              directionID: data.direction_id,
              ministere_id: data.ministere_id,
              nom: data.nom,
            };
          })
        );
        setIsLoading(false);
      }
    });
  }

  useEffect(() => {
    setIsLoading(true);
    getMinistereById(id).then((resp) => {
      setMinistere(resp);
      setIsLoading(false);
    });
    allDirectionByMinistereID(id);
  }, [id]);

  const handleEditMinistere = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    setErreurs([]);
    var formData = new FormData();
    formData.append("ministere_id", id);
    formData.append("nom", ministere);
    const { success, messages } = await updateMinistere(formData);
    if (success) {
      toast.success("Mise à jour effectuée avec succès");
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setErreurs(messages);
    }
  };

  const handDeleteDirection = (data) => {
    setErreurs([]);
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Voulez-Vous Supprimé cette direction?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, Supprimer!",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        if (data) {
          setIsLoading(true);
          var formData = new FormData();
          formData.append("direction_id", data.directionID);
          deleteDirection(formData).then((resp) => {
            if (resp.success) {
              setIsLoading(false);
              toast.success("Suppression Effectuée avec succès");
              allDirectionByMinistereID(data.ministere_id);
            } else {
              setIsLoading(false);
              toast.error("Erreur");
              setErreurs(resp.messages);
            }
          });
        }
      }
    });
  };

  const options = (params) => {
    return (
      <div className="options">
        <button onClick={() => handleEditDirection(params.row)}>
          Modifier
        </button>
        <button className="delete-btn" onClick={() => handDeleteDirection(params.row)}>
          Supprimer
        </button>
      </div>
    );
  };

  const [columnDefs] = useState([
    {
      headerName: "N°Ord",
      field: "ord",
    },
    {
      headerName: "Nom",
      field: "nom",
    },
    { headerName: "Options", field: "options",minWidth: 250,renderCell: options },
  ]);

  return (
    <div className="modifier-ministere page">
      <Helmet>
        <title>Modifier un ministère</title>
      </Helmet>
      {isLoading && <Spinner />}
      <ModifierDirectionModal
        isOpen={isEditModal}
        setIsOpen={setIsEditModal}
        setSelectedDirection={setSelectedDirection}
        selectedDirection={selectedDirection}
        selectedMinistereID={selectedMinistereID}
        selecteDirectionID={selecteDirectionID}
      />
      <AjouterDirectionModal
        isOpen={isAddModal}
        setIsOpen={setIsAddModal}
        setDirections={setDirections}
        setMinistere={setMinistere}
        ministere_id={id}
      />
      <div className="ministeres">
        <h2>Modifier Ministere</h2>
        <div className="ministere">
          <form onSubmit={handleEditMinistere}>
            <label>
              Nom du ministere
              <input
                type="text"
                name=""
                value={ministere}
                onChange={(e) => {
                  setMinistere(e.target.value);
                  setErreurs([]);
                }}
              />
            </label>
            <Erreurs validation={erreurs} />
            <button type="submit">Enregistrer</button>
          </form>
        </div>
      </div>
      <div className="directions">
        <div className="head">
          <h2>Liste des directions</h2>
          <button className="primary" onClick={() => setIsAddModal(true)}>
            + Nouvelle direction
          </button>
        </div>
        <div className="array">
          <Box sx={{ height: 579, width: "100%" }}>
            <DataGrid
              sx={{ borderRadius: 0 }}
              density="compact"
              components={{ Toolbar: GridToolbar}}
              rows={directions}
              columns={columnDefs}
              autoPageSize
              pagination
              disableSelectionOnClick
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              />
          </Box>
        </div>
      </div>
    </div>
  );
};

export default ModifierMinistere;
