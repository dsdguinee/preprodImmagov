import React, { useContext, useEffect, useRef, useState } from "react";
import { MdViewColumn, MdFilterList, MdFormatLineSpacing, MdFileDownload } from "react-icons/md";
import { GridContext } from "./GridContext";

// Bouton + panneau deroulant, ferme au clic exterieur
const ToolbarMenu = ({ icon, label, badge, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="grid-toolbar-menu" ref={ref}>
      <button type="button" className="MuiButtonBase-root" onClick={() => setOpen(!open)} aria-expanded={open}>
        {icon}
        {label}
        {badge ? <span className="grid-toolbar-badge">{badge}</span> : null}
      </button>
      {open && <div className="grid-panel">{children(() => setOpen(false))}</div>}
    </div>
  );
};

export const GridToolbar = () => {
  const grid = useContext(GridContext);
  if (!grid) return null;
  const { localeText: t, columns, hiddenFields, toggleColumn, setAllColumnsVisible, filter, setFilter, density, setDensity, exportAs } = grid;
  const hideableColumns = columns.filter((c) => c.hideable !== false);

  return (
    <div className="MuiDataGrid-toolbarContainer grid-toolbar">
      <ToolbarMenu icon={<MdViewColumn />} label={t.toolbarColumns}>
        {() => (
          <div className="grid-columns-panel">
            {hideableColumns.map((col) => (
              <label key={col.field}>
                <input type="checkbox" checked={!hiddenFields.has(col.field)} onChange={() => toggleColumn(col.field)} />
                {col.headerName || col.field}
              </label>
            ))}
            <div className="grid-panel-actions">
              <button type="button" onClick={() => setAllColumnsVisible(false)}>{t.columnsPanelHideAll}</button>
              <button type="button" onClick={() => setAllColumnsVisible(true)}>{t.columnsPanelShowAll}</button>
            </div>
          </div>
        )}
      </ToolbarMenu>

      <ToolbarMenu icon={<MdFilterList />} label={t.toolbarFilters} badge={filter.value ? 1 : 0}>
        {() => (
          <div className="grid-filter-panel">
            <label>
              {t.filterPanelColumns}
              <select value={filter.field} onChange={(e) => setFilter({ ...filter, field: e.target.value })}>
                <option value="">{t.filterPanelAllColumns}</option>
                {columns.filter((c) => c.filterable !== false).map((col) => (
                  <option key={col.field} value={col.field}>{col.headerName || col.field}</option>
                ))}
              </select>
            </label>
            <label>
              {t.filterPanelInputLabel}
              <input
                type="text"
                autoFocus
                placeholder={t.filterPanelInputPlaceholder}
                value={filter.value}
                onChange={(e) => setFilter({ ...filter, value: e.target.value })}
              />
            </label>
            <div className="grid-panel-actions">
              <button type="button" onClick={() => setFilter({ field: "", value: "" })}>{t.filterPanelClear}</button>
            </div>
          </div>
        )}
      </ToolbarMenu>

      <ToolbarMenu icon={<MdFormatLineSpacing />} label={t.toolbarDensity}>
        {(close) => (
          <ul className="grid-menu-list">
            {[["compact", t.toolbarDensityCompact], ["standard", t.toolbarDensityStandard], ["comfortable", t.toolbarDensityComfortable]].map(([value, label]) => (
              <li key={value}>
                <button type="button" className={density === value ? "selected" : ""} onClick={() => { setDensity(value); close(); }}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </ToolbarMenu>

      <ToolbarMenu icon={<MdFileDownload />} label={t.toolbarExport}>
        {(close) => (
          <ul className="grid-menu-list">
            <li><button type="button" onClick={() => { exportAs("csv"); close(); }}>{t.toolbarExportCSV}</button></li>
            <li><button type="button" onClick={() => { exportAs("excel"); close(); }}>{t.toolbarExportExcel}</button></li>
            <li><button type="button" onClick={() => { exportAs("print"); close(); }}>{t.toolbarExportPrint}</button></li>
          </ul>
        )}
      </ToolbarMenu>
    </div>
  );
};

export default GridToolbar;
