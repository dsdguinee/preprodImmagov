import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { GridContext } from "./GridContext";
import Pagination, { DEFAULT_PAGE_SIZE_OPTIONS } from "./Pagination";
import { defaultLocaleText } from "./localeText";
import { compareValues, exportCsv, exportExcel, getCellValue, getExportColumns, getFormattedValue, normalize, printRows } from "./utils";
import "./DataGrid.scss";

// Hauteurs de ligne par densite (px), utilisees aussi pour autoPageSize
const ROW_HEIGHTS = { compact: 36, standard: 52, comfortable: 67 };
const HEADER_HEIGHT = 42;

/**
 * Grille de donnees locale :
 *  - columns : { field, headerName, flex, width, minWidth, maxWidth, align, sortable,
 *                filterable, hide, renderCell(params), valueGetter(params), valueFormatter(params), disableExport }
 *    params = { id, row, field, value }
 *  - rows, getRowId, density, sx, localeText, loading
 *  - components={{ Toolbar: GridToolbar }} : colonnes, filtres, densite, export CSV / Excel / impression
 *  - pagination + pageSize / pageSizeOptions, ou autoPageSize (nombre de lignes calcule sur la hauteur disponible)
 */
const DataGrid = ({
  rows = [],
  columns = [],
  getRowId: getRowIdProp,
  density: densityProp = "standard",
  components = {},
  pagination = false,
  autoPageSize = false,
  pageSize: pageSizeProp,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  localeText,
  loading = false,
  sx,
  className = "",
}) => {
  const t = useMemo(() => ({ ...defaultLocaleText, ...(localeText || {}) }), [localeText]);
  const getRowId = useCallback((row, index) => (getRowIdProp ? getRowIdProp(row) : row.id ?? index), [getRowIdProp]);

  const [density, setDensity] = useState(densityProp);
  const [sort, setSort] = useState(null); // { field, direction: "asc" | "desc" }
  const [filter, setFilter] = useState({ field: "", value: "" });
  const [hiddenFields, setHiddenFields] = useState(() => new Set(columns.filter((c) => c.hide).map((c) => c.field)));
  const [page, setPage] = useState(1);
  const [chosenPageSize, setChosenPageSize] = useState(null); // choix de l'utilisateur, prioritaire sur autoPageSize
  const [autoSize, setAutoSize] = useState(null);
  const wrapRef = useRef(null);

  // "hide" peut changer apres coup (ex: PaymentList cache la colonne facture selon le role)
  const hideKey = columns.map((c) => `${c.field}:${c.hide ? 1 : 0}`).join("|");
  useEffect(() => {
    setHiddenFields(new Set(columns.filter((c) => c.hide).map((c) => c.field)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideKey]);

  const visibleColumns = columns.filter((c) => !hiddenFields.has(c.field));
  const rowHeight = ROW_HEIGHTS[density] || ROW_HEIGHTS.standard;

  // autoPageSize : autant de lignes que la hauteur du conteneur le permet
  useEffect(() => {
    if (!autoPageSize || !wrapRef.current) return;
    const measure = () => {
      const height = wrapRef.current ? wrapRef.current.clientHeight : 0;
      if (height > 0) setAutoSize(Math.max(1, Math.floor((height - HEADER_HEIGHT) / rowHeight)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [autoPageSize, rowHeight]);

  const filteredRows = useMemo(() => {
    const needle = normalize(filter.value.trim());
    if (!needle) return rows;
    const searchColumns = filter.field ? columns.filter((c) => c.field === filter.field) : columns.filter((c) => c.filterable !== false);
    return rows.filter((row, i) => {
      const id = getRowId(row, i);
      return searchColumns.some((c) => normalize(getFormattedValue(c, row, id)).includes(needle));
    });
  }, [rows, columns, filter, getRowId]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const column = columns.find((c) => c.field === sort.field);
    if (!column) return filteredRows;
    const list = filteredRows.map((row, i) => ({ row, value: getCellValue(column, row, getRowId(row, i)) }));
    list.sort((a, b) => compareValues(a.value, b.value));
    if (sort.direction === "desc") list.reverse();
    return list.map((item) => item.row);
  }, [filteredRows, sort, columns, getRowId]);

  const paginated = pagination || !!pageSizeProp;
  const pageSize = chosenPageSize || (autoPageSize && autoSize) || pageSizeProp || pageSizeOptions[0];
  const sizeOptions = useMemo(() => [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b), [pageSizeOptions, pageSize]);
  const total = sortedRows.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  // Page courante toujours bornee : se recale seule quand le filtre reduit les lignes.
  const current = Math.min(Math.max(1, page), pageCount);
  const start = paginated ? (current - 1) * pageSize : 0;
  const end = paginated ? start + pageSize : total;
  const visibleRows = paginated ? sortedRows.slice(start, end) : sortedRows;

  const toggleSort = (column) => {
    if (column.sortable === false) return;
    setPage(1);
    setSort((currentSort) =>
      !currentSort || currentSort.field !== column.field
        ? { field: column.field, direction: "asc" }
        : currentSort.direction === "asc"
          ? { field: column.field, direction: "desc" }
          : null
    );
  };

  const toggleColumn = (field) =>
    setHiddenFields((prev) => {
      const next = new Set(prev);
      next.has(field) ? next.delete(field) : next.add(field);
      return next;
    });

  const setAllColumnsVisible = (visible) =>
    setHiddenFields(visible ? new Set() : new Set(columns.filter((c) => c.hideable !== false).map((c) => c.field)));

  // L'export prend les lignes filtrees et triees (toutes les pages) et les colonnes visibles
  const exportAs = (format) => {
    const exportColumns = getExportColumns(visibleColumns, sortedRows, getRowId);
    if (format === "csv") exportCsv(exportColumns, sortedRows, getRowId);
    else if (format === "excel") exportExcel(exportColumns, sortedRows, getRowId);
    else printRows(exportColumns, sortedRows, getRowId);
  };

  const handleFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  const handlePageSizeChange = (next) => {
    setChosenPageSize(next);
    setPage(1);
  };

  const columnStyle = (c) => ({
    width: c.width,
    minWidth: c.minWidth ?? c.width,
    maxWidth: c.maxWidth ?? c.width,
    textAlign: c.align,
  });

  const renderCell = (column, row, id) => {
    const value = getCellValue(column, row, id);
    if (column.renderCell) return column.renderCell({ id, row, field: column.field, value });
    const formatted = column.valueFormatter ? column.valueFormatter({ id, field: column.field, value }) : value;
    return formatted === null || formatted === undefined ? "" : String(formatted);
  };

  const Toolbar = components.Toolbar;
  const context = { localeText: t, columns, hiddenFields, toggleColumn, setAllColumnsVisible, filter, setFilter: handleFilter, density, setDensity, exportAs };

  return (
    <GridContext.Provider value={context}>
      <Box className={`MuiDataGrid-root grid-root grid-density-${density} ${className}`} sx={sx}>
        {Toolbar && <Toolbar />}

        <div className="grid-wrap" ref={wrapRef}>
          <table className="grid-table">
            <thead className="MuiDataGrid-columnHeaders">
              <tr>
                {visibleColumns.map((c) => {
                  const isSorted = sort?.field === c.field;
                  const label = c.headerName ?? c.field;
                  return (
                    <th key={c.field} style={{ ...columnStyle(c), height: HEADER_HEIGHT }} aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
                      {c.sortable !== false ? (
                        <button type="button" className={`grid-sort-btn${isSorted ? " active" : ""}`} onClick={() => toggleSort(c)} aria-label={`Trier par ${label}`}>
                          <span>{label}</span>
                          <span className="grid-sort-icon" aria-hidden="true">
                            {isSorted ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
                          </span>
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="grid-empty" colSpan={visibleColumns.length || 1}>{t.loadingLabel}</td>
                </tr>
              ) : total === 0 ? (
                <tr>
                  <td className="grid-empty" colSpan={visibleColumns.length || 1}>
                    {rows.length > 0 ? t.noResultsLabel : t.noRowsLabel}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, i) => {
                  const id = getRowId(row, start + i);
                  return (
                    <tr key={id} style={{ height: rowHeight }}>
                      {visibleColumns.map((c) => (
                        <td key={c.field} className="MuiDataGrid-cell" style={columnStyle(c)}>
                          {renderCell(c, row, id)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {paginated ? (
          <div className="grid-pager-wrap">
            <Pagination
              page={current}
              pageCount={pageCount}
              total={total}
              start={start}
              end={end}
              onPage={setPage}
              pageSize={pageSize}
              pageSizeOptions={sizeOptions}
              onPageSizeChange={handlePageSizeChange}
              localeText={t}
            />
          </div>
        ) : (
          total > 0 && <div className="grid-pager-wrap grid-total">{t.totalRows} {total}</div>
        )}
      </Box>
    </GridContext.Provider>
  );
};

export default DataGrid;
