import { render, screen, within, fireEvent } from "@testing-library/react";
import { DataGrid, GridToolbar, frFR } from ".";

const rows = [
  { id: 1, nom: "Diallo", montant: "1 250 000" },
  { id: 2, nom: "Barry", montant: "950 000" },
  { id: 3, nom: "Camara", montant: "12 000 000" },
];
const columns = [
  { field: "nom", headerName: "Nom", flex: 1 },
  { field: "montant", headerName: "Montant", flex: 1 },
  { field: "action", headerName: "Action", sortable: false, renderCell: (params) => <button>Voir {params.id}</button> },
  { field: "secret", headerName: "Secret", hide: true },
];

const bodyNames = () =>
  screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);

const renderGrid = (props = {}) =>
  render(
    <DataGrid
      rows={rows}
      columns={columns}
      components={{ Toolbar: GridToolbar }}
      localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
      {...props}
    />
  );

describe("DataGrid local", () => {
  it("affiche les lignes, renderCell et masque les colonnes hide", () => {
    renderGrid();
    expect(bodyNames()).toEqual(["Diallo", "Barry", "Camara"]);
    expect(screen.getByRole("button", { name: "Voir 2" })).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("trie les montants formates comme des nombres (asc puis desc)", () => {
    renderGrid();
    const sortBtn = screen.getByRole("button", { name: "Trier par Montant" });
    fireEvent.click(sortBtn);
    expect(bodyNames()).toEqual(["Barry", "Diallo", "Camara"]);
    fireEvent.click(sortBtn);
    expect(bodyNames()).toEqual(["Camara", "Diallo", "Barry"]);
  });

  it("filtre sans tenir compte des accents ni de la casse", () => {
    renderGrid();
    fireEvent.click(screen.getByRole("button", { name: /Filtres/ }));
    fireEvent.change(screen.getByPlaceholderText("Rechercher…"), { target: { value: "BÁRRY" } });
    expect(bodyNames()).toEqual(["Barry"]);
  });

  it("pagine avec pageSize et change de page", () => {
    renderGrid({ pagination: true, pageSize: 2 });
    expect(bodyNames()).toEqual(["Diallo", "Barry"]);
    expect(screen.getByText("1–2 sur 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(bodyNames()).toEqual(["Camara"]);
  });

  it("affiche le message vide", () => {
    renderGrid({ rows: [] });
    expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
  });
});
