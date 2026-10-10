// Export d'un rapport (titre, informations, tableau et ligne de totaux) en Excel, CSV ou impression / PDF.
// colonnes : [{ key, label, nombre }] ; lignes et totaux : objets indexés par key.

const texte = (v) => (v === null || v === undefined ? "" : String(v));
const html = (v) => texte(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nombreFr = (v) => Math.round(parseFloat(v) || 0).toLocaleString("fr-FR");
const nomFichier = (nom, ext) => `${nom.replace(/[\\/:*?"<>|\s]+/g, "-")}.${ext}`;

const telecharger = (contenu, fichier, type) => {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = fichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
};

// Tableau HTML ; `brut` garde les nombres sans séparateurs (cellules numériques dans Excel)
const tableau = ({ colonnes, lignes, totaux }, brut) => {
  const cellule = (c, v, balise = "td") => {
    const valeur = c.nombre ? (brut ? Math.round(parseFloat(v) || 0) : nombreFr(v)) : html(v);
    return `<${balise}${c.nombre ? ' class="n" style="mso-number-format:\'#,##0\'"' : ""}>${valeur}</${balise}>`;
  };
  const tete = colonnes.map((c) => `<th>${html(c.label)}</th>`).join("");
  const corps = lignes.map((l) => `<tr>${colonnes.map((c) => cellule(c, l[c.key])).join("")}</tr>`).join("");
  const pied = totaux ? `<tr class="total">${colonnes.map((c) => cellule(c, totaux[c.key], "th")).join("")}</tr>` : "";
  return `<table border="1"><thead><tr>${tete}</tr></thead><tbody>${corps}</tbody><tfoot>${pied}</tfoot></table>`;
};

const entete = ({ titre, infos = [] }) =>
  `<h2>${html(titre)}</h2>${infos.map((i) => `<p>${html(i)}</p>`).join("")}`;

// Fichier .xls (tableau HTML ouvert par Excel comme une feuille de calcul)
export const exporterExcel = (rapport) => {
  const contenu = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>${entete(rapport)}${tableau(rapport, true)}</body></html>`;
  telecharger(contenu, nomFichier(rapport.fichier, "xls"), "application/vnd.ms-excel;charset=utf-8");
};

// CSV séparé par « ; » avec BOM UTF-8 : s'ouvre avec les accents dans Excel (FR)
export const exporterCsv = ({ titre, infos = [], colonnes, lignes, totaux, fichier }) => {
  const cel = (v) => (/[";\n\r]/.test(texte(v)) ? `"${texte(v).replace(/"/g, '""')}"` : texte(v));
  const valeur = (c, v) => (c.nombre ? Math.round(parseFloat(v) || 0) : v);
  const contenu = [
    cel(titre), ...infos.map(cel), "",
    colonnes.map((c) => cel(c.label)).join(";"),
    ...lignes.map((l) => colonnes.map((c) => cel(valeur(c, l[c.key]))).join(";")),
    ...(totaux ? [colonnes.map((c) => cel(valeur(c, totaux[c.key]))).join(";")] : []),
  ];
  telecharger("﻿" + contenu.join("\r\n"), nomFichier(fichier, "csv"), "text/csv;charset=utf-8");
};

// Impression (ou « Enregistrer en PDF » depuis la boîte d'impression), en paysage
export const imprimer = (rapport) => {
  const fenetre = window.open("", "_blank");
  if (!fenetre) return false;
  fenetre.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${html(rapport.fichier)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; color: #2b2d42; }
      h2 { margin: 0 0 4px; font-size: 16px; }
      p { margin: 0 0 2px; color: #555; }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; }
      th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
      thead th { background: #f0f5f7; }
      .n { text-align: right; white-space: nowrap; }
      tfoot th { background: #f0f5f7; }
    </style></head><body>${entete(rapport)}${tableau(rapport, false)}</body></html>`);
  fenetre.document.close();
  fenetre.focus();
  fenetre.print();
  return true;
};
