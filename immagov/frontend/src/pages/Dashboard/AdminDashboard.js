import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/fr";
import { AiOutlineCheckCircle, AiOutlineTeam } from "react-icons/ai";
import { GiSandsOfTime } from "react-icons/gi";
import { BiBuildings, BiCar } from "react-icons/bi";
import { dashboardAdmin } from "../../services/immatriculation.service";
import Spinner from "../../components/Spinner/Spinner";

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

// Tableau de bord de l'administrateur : gestion de la plateforme (comptes, rôles, organismes, réservations, impressions)
const AdminDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState("");
  const [survol, setSurvol] = useState(-1);
  const [rolesInactifs, setRolesInactifs] = useState(false);

  useEffect(() => {
    dashboardAdmin().then((resp) => {
      if (resp?.success) setData(resp);
      else setErreur(resp?.messages ? Object.values(resp.messages).flat().join(" ") : "Impossible de charger le tableau de bord.");
    });
  }, []);

  if (!data) return <div className="agent-dash dir-dash">{erreur ? <p className="agent-error">{erreur}</p> : <Spinner />}</div>;

  const { comptes, roles, aSurveiller, activite, reservations, dossiers, organismes } = data;
  const kpis = [
    { libelle: "Comptes actifs", valeur: `${comptes.actifs} / ${comptes.total}`, Icone: AiOutlineTeam, ton: "vert",
      note: comptes.desactives ? `${pluriel(comptes.desactives, "compte")} désactivé${comptes.desactives > 1 ? "s" : ""}` : "Aucun compte désactivé" },
    { libelle: "Première connexion en attente", valeur: comptes.premiere_connexion, Icone: GiSandsOfTime, ton: "ambre", alerte: comptes.premiere_connexion > 0,
      note: "Mot de passe initial pas encore changé" },
    { libelle: "Organismes", valeur: organismes.total, Icone: BiBuildings, ton: "neutre",
      note: `${organismes.publique} publics · ${organismes.prive} privés · ${pluriel(organismes.directions, "direction")}` },
    { libelle: "Parc immatriculé", valeur: dossiers.parc, Icone: BiCar, ton: "neutre", note: `${dossiers.ep} EP · ${dossiers.va} VA` },
    { libelle: "Dossiers en attente", valeur: dossiers.attente, Icone: AiOutlineCheckCircle, ton: "neutre",
      note: dossiers.propositions ? `Dont ${pluriel(dossiers.propositions, "proposition")} d'organisme` : "Validation par le Directeur" },
  ];

  // Rôles inactifs sans utilisateur masqués par défaut
  const rolesAffiches = roles.filter((r) => rolesInactifs || Number(r.actif) === 1 || Number(r.utilisateurs) > 0);
  const rolesMasques = roles.length - roles.filter((r) => Number(r.actif) === 1 || Number(r.utilisateurs) > 0).length;
  const maxActivite = Math.max(4, ...activite.map((a) => a.crees)) * 1.15;

  return (
    <div className="agent-dash dir-dash">
      <div className="agent-dash__head">
        <div>
          <h1 className="agent-dash__title">Bonjour, {user?.prenom}</h1>
          <p className="agent-dash__sub">{moment().locale("fr").format("dddd D MMMM YYYY")} · Administration de la plateforme.</p>
        </div>
        <div className="dir-head-actions">
          <Link to="/liste-roles" className="agent-btn dir-btn--secondary">Gérer les rôles</Link>
          <Link to="/liste-utilisateurs" className="agent-btn agent-btn--primary">Gérer les utilisateurs</Link>
        </div>
      </div>

      <div className="dir-kpis">
        {kpis.map((k) => (
          <div key={k.libelle} className="dir-kpi">
            <span className="agent-kpi__top">
              <span className="agent-kpi__label">{k.libelle}</span>
              <span className={`agent-kpi__icon agent-kpi__icon--${k.ton}`}><k.Icone aria-hidden="true" /></span>
            </span>
            <span className="agent-kpi__value">{k.valeur}</span>
            <span className={`agent-kpi__note${k.alerte ? " dir-kpi__alerte" : ""}`}>{k.note}</span>
          </div>
        ))}
      </div>

      <div className="agent-dash__layout">
        <div className="agent-dash__main">
          {/* Comptes par rôle */}
          <section className="agent-card">
            <div className="agent-card__head agent-card__head--bordered">
              <div>
                <h2 className="agent-card__title">Comptes par rôle</h2>
                <p className="agent-muted">Utilisateurs rattachés à chaque rôle et état de leurs comptes</p>
              </div>
              {rolesMasques > 0 && (
                <label className="dir-checkbox">
                  <input type="checkbox" checked={rolesInactifs} onChange={() => setRolesInactifs(!rolesInactifs)} />
                  Afficher les {rolesMasques} rôles inactifs sans utilisateur
                </label>
              )}
            </div>
            <div className="agent-table-wrap">
              <table className="agent-table adm-table">
                <thead>
                  <tr>
                    <th>Rôle</th><th>Statut</th><th className="is-right">Utilisateurs</th><th className="is-right">Actifs</th>
                    <th className="is-right">Désactivés</th><th className="is-right">1re connexion en attente</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesAffiches.map((r) => (
                    <tr key={r.role_id}>
                      <td><span className="agent-cell-main">{r.nom_role}</span></td>
                      <td>
                        <span className={`agent-badge ${Number(r.actif) === 1 ? "agent-badge--valide" : "adm-badge--inactif"}`}>
                          {Number(r.actif) === 1 ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="is-right">{Number(r.utilisateurs)}</td>
                      <td className="is-right">{Number(r.actifs)}</td>
                      <td className="is-right">{Number(r.desactives) || "—"}</td>
                      <td className="is-right">{Number(r.premiere_connexion) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="agent-card__foot">
              <Link to="/liste-roles">Gérer les rôles et leurs droits →</Link>
            </div>
          </section>

          {/* Activité de la plateforme */}
          <section className="agent-card agent-chart">
            <div className="agent-card__head">
              <h2 className="agent-card__title">Dossiers créés par mois</h2>
              <span className="agent-muted">12 derniers mois, tous agents · survolez une barre</span>
            </div>
            <div className="agent-chart__plot" style={{ gap: 6 }} onMouseLeave={() => setSurvol(-1)}>
              <span className="agent-chart__grid" style={{ bottom: "50%" }} />
              {activite.map((a, i) => {
                const pct = Math.round((a.crees / maxActivite) * 100);
                const actif = survol === i;
                const libelle = moment(a.mois + "-01").locale("fr").format("MMMM YYYY");
                return (
                  <div key={a.mois} className="agent-chart__col" tabIndex={0}
                    onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} onBlur={() => setSurvol(-1)}
                    aria-label={`${libelle} : ${a.crees} dossiers créés, ${a.valides} validés`}>
                    {actif && (
                      <div className="agent-chart__tip" style={{ bottom: `calc(${pct}% + 8px)` }}>
                        <strong>{libelle}</strong>
                        <span>{pluriel(a.crees, "dossier")} créé{a.crees > 1 ? "s" : ""} · {a.valides} validé{a.valides > 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {!actif && i === activite.length - 1 && <span className="agent-chart__value">{a.crees}</span>}
                    <div className={`agent-chart__bar${actif ? " is-active" : ""}`} style={{ height: `${a.crees ? Math.max(pct, 2) : 0}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="agent-chart__labels" style={{ gap: 6 }}>
              {activite.map((a) => <span key={a.mois}>{moment(a.mois + "-01").locale("fr").format("MMM")}</span>)}
            </div>
          </section>
        </div>

        <aside className="agent-dash__side">
          {/* Comptes à surveiller */}
          <section className={`agent-card agent-side-card${aSurveiller.length ? " dir-side--attention" : ""}`}>
            <div className="agent-side-card__head">
              <span className="agent-count dir-count--ambre">{aSurveiller.length}</span>
              <h2 className="agent-card__title">Comptes à surveiller</h2>
            </div>
            <p className="agent-muted">Comptes désactivés ou jamais utilisés (mot de passe initial).</p>
            {aSurveiller.length === 0 && <p className="agent-muted">Tous les comptes sont actifs et utilisés.</p>}
            <div className="adm-liste">
              {aSurveiller.map((u) => (
                <div key={u.id} className="dir-approuver">
                  <div className="dir-approuver__info">
                    <span className="agent-cell-main">{u.nom}</span>
                    <span className="agent-muted">{u.role || "Sans rôle"}</span>
                  </div>
                  <span className={`agent-badge ${Number(u.actif) === 0 ? "adm-badge--inactif" : "agent-badge--attente"}`}>
                    {Number(u.actif) === 0 ? "Désactivé" : "1re connexion"}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/liste-utilisateurs" className="adm-lien">Ouvrir la gestion des utilisateurs →</Link>
          </section>

          {/* Réservations de numéros */}
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">Réservations de numéros</h2>
            {reservations.length === 0 && <p className="agent-muted">Aucune réservation.</p>}
            {reservations.map((r) => {
              const capacite = Math.max(1, Number(r.final) - Number(r.initial) + 1);
              const utilises = Number(r.utilises);
              const pct = Math.round((utilises / capacite) * 100);
              return (
                <div key={r.reservation_id} className="adm-reservation">
                  <div className="adm-reservation__top">
                    <span className="agent-cell-main">{r.nom}</span>
                    <span className="agent-badge agent-badge--valide">{r.mode}</span>
                  </div>
                  <span className="agent-muted">Numéros {r.initial} à {r.final} · {Number(r.status) === 1 ? "bouclée" : "en cours"}</span>
                  <div className="dir-org__track" role="img" aria-label={`${utilises} numéros utilisés sur ${capacite}`}>
                    <div className="dir-org__bar" style={{ width: `${utilises ? Math.max(pct, 2) : 0}%` }} />
                  </div>
                  <span className="agent-muted">{utilises} utilisé{utilises > 1 ? "s" : ""} sur {capacite} ({pct} %)</span>
                </div>
              );
            })}
            <Link to="/reservation" className="adm-lien">Gérer les réservations →</Link>
          </section>

          {/* Cartes grises et organismes */}
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">Cartes grises</h2>
            <div className="dir-imprimer">
              <span className="agent-kpi__value">{dossiers.a_imprimer}</span>
              <span className="agent-muted">à imprimer · {dossiers.imprimees} imprimée{dossiers.imprimees > 1 ? "s" : ""}</span>
            </div>
            <Link to="/cartes-grises" className="agent-btn agent-btn--primary dir-btn--compact">Ouvrir les impressions</Link>
          </section>
          <section className="agent-card agent-side-card">
            <h2 className="agent-card__title">Organismes</h2>
            <p className="agent-muted">{organismes.total} organismes ({organismes.publique} publics, {organismes.prive} privés) et {pluriel(organismes.directions, "direction")}.</p>
            <Link to="/liste-ministere" className="adm-lien">Gérer les organismes →</Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
