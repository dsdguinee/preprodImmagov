// Textes francais par defaut de la grille.
// Meme forme que frFR de MUI pour que localeText={frFR.components.MuiDataGrid.defaultProps.localeText} reste valable.
export const defaultLocaleText = {
  noRowsLabel: "Aucun résultat",
  noResultsLabel: "Aucun résultat trouvé.",
  loadingLabel: "Chargement…",
  toolbarColumns: "Colonnes",
  toolbarFilters: "Filtres",
  toolbarDensity: "Densité",
  toolbarDensityCompact: "Compacte",
  toolbarDensityStandard: "Standard",
  toolbarDensityComfortable: "Confortable",
  toolbarExport: "Exporter",
  toolbarExportCSV: "Télécharger en CSV",
  toolbarExportExcel: "Télécharger pour Excel",
  toolbarExportPrint: "Imprimer",
  columnsPanelShowAll: "Tout afficher",
  columnsPanelHideAll: "Tout masquer",
  filterPanelColumns: "Colonne",
  filterPanelAllColumns: "Toutes les colonnes",
  filterPanelInputLabel: "Valeur",
  filterPanelInputPlaceholder: "Rechercher…",
  filterPanelClear: "Effacer",
  paginationOf: "sur",
  paginationPrevious: "Page précédente",
  paginationNext: "Page suivante",
  rowsPerPage: "Lignes par page",
  totalRows: "Total des lignes :",
};

export const frFR = {
  components: {
    MuiDataGrid: {
      defaultProps: {
        localeText: defaultLocaleText,
      },
    },
  },
};
