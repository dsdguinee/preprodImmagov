// Valeur brute d'une cellule (valueGetter si defini, sinon row[field])
export const getCellValue = (column, row, id) =>
  column.valueGetter
    ? column.valueGetter({ id, row, field: column.field, value: row[column.field] })
    : row[column.field];

// Valeur affichee / exportee d'une cellule
export const getFormattedValue = (column, row, id) => {
  const value = getCellValue(column, row, id);
  return column.valueFormatter ? column.valueFormatter({ id, field: column.field, value }) : value;
};

export const toText = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  return String(value);
};

// Minuscules et sans accents, pour la recherche
export const normalize = (value) =>
  toText(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// "1 250 000", "12,5" ou 42 -> nombre ; sinon null
const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !/^-?[\d\s  .,]+$/.test(value.trim())) return null;
  const n = parseFloat(value.replace(/[\s  ]/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
};

export const compareValues = (a, b) => {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na !== null && nb !== null) return na - nb;
  if (a instanceof Date && b instanceof Date) return a - b;
  return toText(a).localeCompare(toText(b), "fr", { numeric: true, sensitivity: "base" });
};

// Colonnes exportables : on ignore celles qui ne contiennent que des boutons (renderCell sans valeur)
export const getExportColumns = (columns, rows, getRowId) =>
  columns.filter(
    (col) =>
      !col.disableExport &&
      (!col.renderCell || rows.some((row, i) => getCellValue(col, row, getRowId(row, i)) !== undefined))
  );

const download = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportFileName = (ext) => `${(document.title || "export").replace(/[\\/:*?"<>|]/g, "-")}.${ext}`;

// CSV separe par ";" avec BOM UTF-8 : s'ouvre directement avec les accents dans Excel (FR)
export const exportCsv = (columns, rows, getRowId) => {
  const escape = (v) => {
    const text = toText(v);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((c) => escape(c.headerName || c.field)).join(";")];
  rows.forEach((row, i) => {
    const id = getRowId(row, i);
    lines.push(columns.map((c) => escape(getFormattedValue(c, row, id))).join(";"));
  });
  download("﻿" + lines.join("\r\n"), exportFileName("csv"), "text/csv;charset=utf-8");
};

const escapeHtml = (v) =>
  toText(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const htmlTable = (columns, rows, getRowId) => {
  const head = columns.map((c) => `<th>${escapeHtml(c.headerName || c.field)}</th>`).join("");
  const body = rows
    .map((row, i) => {
      const id = getRowId(row, i);
      return `<tr>${columns.map((c) => `<td>${escapeHtml(getFormattedValue(c, row, id))}</td>`).join("")}</tr>`;
    })
    .join("");
  return `<table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
};

// Tableau HTML enregistre en .xls : Excel l'ouvre comme une feuille de calcul
export const exportExcel = (columns, rows, getRowId) => {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>${htmlTable(columns, rows, getRowId)}</body></html>`;
  download(html, exportFileName("xls"), "application/vnd.ms-excel;charset=utf-8");
};

export const printRows = (columns, rows, getRowId) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(document.title)}</title>
    <style>
      body { font-family: 'DM Sans', sans-serif; font-size: 12px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
      th { background: #f0f5f7; }
    </style></head><body>${htmlTable(columns, rows, getRowId)}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
};
