import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

// Recherche sans tenir compte des accents ni de la casse
const normaliser = (texte) => String(texte ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Liste déroulante avec recherche.
 * - options : [{ value, label }] ; value : valeur sélectionnée (contrôlée par le parent)
 * - onChange reçoit un événement dont target est un <select> natif (name, value, type "select-one") :
 *   les gestionnaires existants (e.target.value) et react-hook-form ({...register(...)}) fonctionnent tels quels.
 * - Clavier : ↓/↑ pour parcourir, Entrée pour choisir, Échap pour fermer.
 */
const SearchSelect = forwardRef(({
  name,
  value,
  options = [],
  onChange,
  onBlur,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  noResultText = "Aucun résultat",
  disabled = false,
  id,
}, ref) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const nativeRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const autoId = useId();
  const listId = `${id || autoId}-liste`;

  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const filtered = useMemo(() => {
    const q = normaliser(query.trim());
    return q ? options.filter((o) => normaliser(o.label).includes(q)) : options;
  }, [options, query]);

  // Le ref de react-hook-form pointe sur le <select> natif caché
  const setNativeRef = (el) => {
    nativeRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const fermer = (rendreFocus = false) => {
    setOpen(false);
    setQuery("");
    if (onBlur && nativeRef.current) onBlur({ target: nativeRef.current, type: "blur" });
    if (rendreFocus) triggerRef.current?.focus();
  };
  const ouvrir = () => {
    if (disabled) return;
    const index = options.findIndex((o) => String(o.value) === String(value ?? ""));
    setActive(index >= 0 ? index : 0);
    setOpen(true);
  };
  const choisir = (option) => {
    const el = nativeRef.current;
    if (el) {
      el.value = String(option.value);
      onChange && onChange({ target: el, type: "change" });
    }
    fermer(true);
  };

  // Fermeture au clic en dehors (fermerRef : toujours la dernière version de fermer)
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;
  useEffect(() => {
    if (!open) return;
    const surClic = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) fermerRef.current(); };
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, [open]);

  useEffect(() => { if (open) searchRef.current?.focus(); }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  // Garde l'option active visible pendant la navigation au clavier
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active, open]);

  const surToucheRecherche = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) choisir(filtered[active]); }
    else if (e.key === "Escape") { e.preventDefault(); fermer(true); }
    else if (e.key === "Tab") fermer();
  };
  const surToucheBouton = (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); ouvrir(); }
  };

  return (
    <div className={`search-select${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`} ref={rootRef}>
      <select
        ref={setNativeRef}
        name={name}
        value={value ?? ""}
        onChange={() => {}}
        className="search-select__native"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onFocus={() => triggerRef.current?.focus()}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <button
        type="button"
        id={id}
        ref={triggerRef}
        className="search-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? fermer() : ouvrir())}
        onKeyDown={surToucheBouton}
      >
        <span className={selected ? "search-select__value" : "search-select__placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="search-select__panel">
          <input
            ref={searchRef}
            type="text"
            className="search-select__search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={surToucheRecherche}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
          />
          {/* preventDefault : un clic dans la liste ne doit pas activer le <label> parent */}
          <ul className="search-select__list" role="listbox" id={listId} ref={listRef} onClick={(e) => e.preventDefault()}>
            {filtered.map((o, i) => {
              const estChoisi = String(o.value) === String(value ?? "");
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={estChoisi}
                  className={`search-select__option${i === active ? " is-active" : ""}${estChoisi ? " is-selected" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choisir(o)}
                >
                  {o.label}
                  {estChoisi && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}
                </li>
              );
            })}
            {filtered.length === 0 && <li className="search-select__empty">{noResultText}</li>}
          </ul>
        </div>
      )}
    </div>
  );
});

export default SearchSelect;
