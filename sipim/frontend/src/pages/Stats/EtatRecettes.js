import { useContext, useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import moment from "moment";
import "moment/locale/fr";
import Api from "../../services/Api";
import Erreurs from "../../components/Erreurs/Erreurs";
import { UserContext } from "../../services/Context/Context";
import { loadingState } from "../../recoil/atoms/loadingAtom";
import { fmt } from "../../services/Helpers/dashboard";
import { exporterCsv, exporterExcel, imprimer } from "../../services/Helpers/exportRapport";

const GROUPES = [
  { value: "agence", label: "Agence" },
  { value: "prefecture", label: "Préfecture" },
  { value: "region", label: "Région" },
  { value: "jour", label: "Jour" },
  { value: "mois", label: "Mois" },
];
// Colonnes du regroupement, puis nombre d'opérations et recettes par source
const COLONNES_GROUPE = {
  agence: [{ key: "region", label: "Région" }, { key: "prefecture", label: "Préfecture" }, { key: "commune", label: "Commune" }, { key: "agence", label: "Agence" }],
  prefecture: [{ key: "region", label: "Région" }, { key: "prefecture", label: "Préfecture" }],
  region: [{ key: "region", label: "Région" }],
  jour: [{ key: "date", label: "Date" }],
  mois: [{ key: "mois", label: "Mois" }],
};
const COLONNES_NOMBRES = [
  { key: "paiements", label: "Paiements validés" },
  { key: "immatriculations", label: "Immatriculations" },
  { key: "reimmatriculations", label: "Réimmatriculations" },
  { key: "mutations", label: "Mutations" },
  { key: "reformes", label: "Réformes" },
  { key: "services", label: "Vignette / autorisation seules" },
];
const COLONNES_MONTANTS = [
  { key: "vignette", label: "Vignette (GNF)" },
  { key: "cartegrise", label: "Carte grise (GNF)" },
  { key: "autorisation", label: "Autorisation (GNF)" },
  { key: "plaque", label: "Plaques (GNF)" },
  { key: "reforme", label: "Réforme (GNF)" },
  { key: "frais", label: "Frais de service (GNF)" },
  { key: "total", label: "Total (GNF)", total: true },
];

const libelleDate = (groupe, ligne) =>
  groupe === "jour" ? moment(ligne.date).format("DD/MM/YYYY")
    : groupe === "mois" ? moment(ligne.mois, "YYYY-MM").format("MMMM YYYY")
      : null;

// État des recettes : paiements validés d'une période par territoire ou par date, exportable
const EtatRecettes = () => {
  const api = new Api();
  const { decoupage } = useContext(UserContext);
  const [, setIsLoading] = useRecoilState(loadingState);
  const [filtres, setFiltres] = useState({
    debut: moment().startOf("month").format("YYYY-MM-DD"), fin: moment().format("YYYY-MM-DD"),
    groupe: "agence", region_id: "", prefecture_id: "", agence_id: "",
  });
  const [agences, setAgences] = useState([]);
  const [resultat, setResultat] = useState(); // { lignes, filtres appliqués }
  const [erreurs, setErreurs] = useState();

  const prefectures = (decoupage?.prefectures || []).filter((p) => String(p.region_id) === String(filtres.region_id));

  const charger = async (f = filtres) => {
    setErreurs([]);
    if (!f.debut || !f.fin) return setErreurs(["Choisissez une date de début et une date de fin."]);
    if (f.fin < f.debut) return setErreurs(["La date de fin doit être postérieure ou égale à la date de début."]);
    const params = new URLSearchParams({
      date_debut: f.debut, date_fin: f.fin, groupe: f.groupe,
      region_id: f.region_id || 0, prefecture_id: f.prefecture_id || 0, agence_id: f.agence_id || 0,
    });
    const nom = (liste, id, cle, champ) => liste.find((x) => String(x[cle]) === String(id))?.[champ];
    const territoire = [
      f.region_id && `Région : ${nom(decoupage?.regions || [], f.region_id, "region_id", "nom")}`,
      f.prefecture_id && `Préfecture : ${nom(decoupage?.prefectures || [], f.prefecture_id, "prefecture_id", "nom")}`,
      f.agence_id && `Agence : ${nom(agences, f.agence_id, "agence_id", "nom_agence")}`,
    ].filter(Boolean).join(" · ") || "Toutes les agences";
    setIsLoading(true);
    const resp = await api.apiData("get", `/paiement/etat-recettes?${params}`);
    setIsLoading(false);
    if (resp?.status === 200) setResultat({ lignes: resp.lignes, filtres: { ...f }, territoire });
    else setErreurs(resp?.messages || ["Le chargement de l'état des recettes a échoué."]);
  };

  useEffect(() => { charger(); }, []);

  const maj = (champs) => setFiltres((f) => ({ ...f, ...champs }));
  const choisirRegion = (region_id) => { maj({ region_id, prefecture_id: "", agence_id: "" }); setAgences([]); };
  const choisirPrefecture = async (prefecture_id) => {
    maj({ prefecture_id, agence_id: "" });
    setAgences([]);
    if (!prefecture_id) return;
    const resp = await api.apiData("get", `/agence/agenceprefecture/${prefecture_id}`);
    if (resp?.status === 200) setAgences(resp.AgencesPref);
  };

  // Rapport prêt à afficher et à exporter, figé sur les filtres appliqués
  const rapport = useMemo(() => {
    if (!resultat) return null;
    const f = resultat.filtres;
    const colonnes = [
      ...COLONNES_GROUPE[f.groupe],
      ...COLONNES_NOMBRES.map((c) => ({ ...c, nombre: true })),
      ...COLONNES_MONTANTS.map((c) => ({ ...c, nombre: true })),
    ];
    const lignes = resultat.lignes.map((l) => {
      const date = libelleDate(f.groupe, l);
      return date ? { ...l, [f.groupe === "jour" ? "date" : "mois"]: date } : l;
    });
    const totaux = { [COLONNES_GROUPE[f.groupe][0].key]: "Total" };
    [...COLONNES_NOMBRES, ...COLONNES_MONTANTS].forEach((c) => {
      totaux[c.key] = resultat.lignes.reduce((s, l) => s + (parseFloat(l[c.key]) || 0), 0);
    });
    return {
      titre: "État des recettes",
      fichier: `Etat-des-recettes_${f.debut}_${f.fin}`,
      infos: [
        `Période : du ${moment(f.debut).format("DD/MM/YYYY")} au ${moment(f.fin).format("DD/MM/YYYY")}`,
        `${resultat.territoire} · Regroupement par ${GROUPES.find((g) => g.value === f.groupe).label.toLowerCase()}`,
        "Paiements validés uniquement, montants en GNF",
        `Édité le ${moment().format("DD/MM/YYYY [à] HH:mm")}`,
      ],
      colonnes, lignes, totaux,
    };
  }, [resultat]);

  const vide = !rapport?.lignes.length;
  const lancerImpression = () => { if (!imprimer(rapport)) setErreurs(["Autorisez l'ouverture des fenêtres pour imprimer."]); };

  return (
    <section className="etat-recettes">
      <Erreurs validation={erreurs} />
      <form className="filters" onSubmit={(e) => { e.preventDefault(); charger(); }}>
        <div className="input-group">
          <label>Date début
            <input type="date" value={filtres.debut} max={filtres.fin || undefined} onChange={(e) => maj({ debut: e.target.value })} />
          </label>
          <label>Date fin
            <input type="date" value={filtres.fin} min={filtres.debut || undefined} onChange={(e) => maj({ fin: e.target.value })} />
          </label>
          <label>Région
            <select value={filtres.region_id} onChange={(e) => choisirRegion(e.target.value)}>
              <option value="">Toutes</option>
              {(decoupage?.regions || []).map((r) => <option key={r.region_id} value={r.region_id}>{r.nom}</option>)}
            </select>
          </label>
          <label>Préfecture
            <select value={filtres.prefecture_id} disabled={!filtres.region_id} onChange={(e) => choisirPrefecture(e.target.value)}>
              <option value="">Toutes</option>
              {prefectures.map((p) => <option key={p.prefecture_id} value={p.prefecture_id}>{p.nom}</option>)}
            </select>
          </label>
          <label>Agence
            <select value={filtres.agence_id} disabled={!agences.length} onChange={(e) => maj({ agence_id: e.target.value })}>
              <option value="">Toutes</option>
              {agences.map((a) => <option key={a.agence_id} value={a.agence_id}>{a.commune ? `${a.commune} / ` : ""}{a.nom_agence}</option>)}
            </select>
          </label>
          <label>Regrouper par
            <select value={filtres.groupe} onChange={(e) => maj({ groupe: e.target.value })}>
              {GROUPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
        </div>
        <button type="submit">Afficher</button>
      </form>

      {rapport && (
        <div className="rapport">
          <div className="rapport-head">
            <div>
              <h4>{rapport.titre}</h4>
              {rapport.infos.slice(0, 2).map((i) => <p key={i}>{i}</p>)}
            </div>
            <div className="exports" role="group" aria-label="Exporter">
              <button type="button" disabled={vide} onClick={() => exporterExcel(rapport)}>Excel</button>
              <button type="button" disabled={vide} onClick={() => exporterCsv(rapport)}>CSV</button>
              <button type="button" disabled={vide} onClick={lancerImpression}>Imprimer / PDF</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>{rapport.colonnes.map((c) => <th key={c.key} className={c.nombre ? "n" : undefined}>{c.label}</th>)}</tr></thead>
              <tbody>
                {vide ? (
                  <tr><td colSpan={rapport.colonnes.length} className="vide">Aucun paiement validé pour ces critères.</td></tr>
                ) : rapport.lignes.map((l, i) => (
                  <tr key={i}>
                    {rapport.colonnes.map((c) => <td key={c.key} className={c.nombre ? `n${c.total ? " total" : ""}` : undefined}>{c.nombre ? fmt(l[c.key]) : l[c.key] || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
              {!vide && (
                <tfoot>
                  <tr>{rapport.colonnes.map((c) => <th key={c.key} className={c.nombre ? "n" : undefined}>{c.nombre ? fmt(rapport.totaux[c.key]) : rapport.totaux[c.key] || ""}</th>)}</tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default EtatRecettes;
