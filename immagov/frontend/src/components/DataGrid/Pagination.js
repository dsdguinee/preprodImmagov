import React from "react";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

// Liste des numeros de page a afficher, avec ellipses au-dela de 7 pages.
function pageItems(current, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const wanted = new Set([1, 2, count - 1, count, current - 1, current, current + 1]);
  const sorted = [...wanted].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) result.push("…");
    result.push(n);
    prev = n;
  }
  return result;
}

const Pagination = ({
  page, // page courante (deja bornee entre 1 et pageCount)
  pageCount,
  total,
  start, // index (base 0) du premier element affiche
  end, // index de fin (exclusif)
  onPage,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  localeText: t,
}) => {
  const showPageSize = !!onPageSizeChange && !!pageSize;
  if (total === 0) return null;

  return (
    <nav className="grid-pager" aria-label="Pagination">
      <span className="grid-page-info">
        {start + 1}–{Math.min(end, total)} {t.paginationOf} {total}
      </span>

      <div className="grid-pager-controls">
        {showPageSize && (
          <label className="grid-page-size">
            {t.rowsPerPage}
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}

        {pageCount > 1 && (
          <div className="grid-page-btns">
            <button type="button" className="grid-page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label={t.paginationPrevious}>
              ‹
            </button>

            {pageItems(page, pageCount).map((item, i) =>
              item === "…" ? (
                <span key={`e-${i}`} className="grid-ellipsis" aria-hidden="true">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`grid-page-btn${item === page ? " active" : ""}`}
                  onClick={() => onPage(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}

            <button type="button" className="grid-page-btn" onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label={t.paginationNext}>
              ›
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Pagination;
