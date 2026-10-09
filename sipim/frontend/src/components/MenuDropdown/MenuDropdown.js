import { Link, useNavigate } from "react-router-dom";
import Api from "../../services/Api";
import { isEmpty } from "../../services/Helpers/fonctions";
import OutsideClickHandler from "react-outside-click-handler";

const MenuDropdown = ({
  setOpenDropdown,
  user,
  userRole,
  agence,
  nomCommune,
}) => {
  const api = new Api();
  const navigate = useNavigate();
  const logout = () => {
    api.logout();
    navigate("/");
  };
  return (
    <div className="menu-dropdown">
      <OutsideClickHandler
        onOutsideClick={() => {
          setOpenDropdown(false);
         // console.log("outside click")
        }}
      >
        {nomCommune != "" ? (
          <>
            <div className="top">
              <p className="name">
                {!isEmpty(user) &&
                  user.prenom.charAt(0).toUpperCase() +
                    user.prenom.slice(1) +
                    " " +
                    user.nom.charAt(0).toUpperCase() +
                    user.nom.slice(1)}
              </p>
              {agence && (
                <p>
                  <span>Agence : </span>
                  {agence.nom_agence}
                </p>
              )}
              {agence && (
                <p>
                  <span>Localité : </span>
                  {nomCommune}
                </p>
              )}
              <p>
                <span>Role : </span>
                {userRole && userRole.nom_role}
              </p>
            </div>
            <div className="middle">
              <p>
                <span>Compte</span>
              </p>
              <p className="link" onClick={() => setOpenDropdown(false)}>
                <Link to={"myaccount/settings"}>Paramètres du compte</Link>
              </p>
            </div>
            <div className="bottom">
              <p className="link" onClick={logout}>
                Se déconnecter
              </p>
            </div>
          </>
        ):<>
            <div>
             <p>
                <span>Role : </span>
                {userRole && userRole.nom_role}
              </p>
            </div>
            <div className="middle">
              <p>
                <span>Compte</span>
              </p>
              <p className="link" onClick={() => setOpenDropdown(false)}>
                <Link to={"myaccount/settings"}>Paramètres du compte</Link>
              </p>
            </div>
           <div className="bottom">
              <p className="link" onClick={logout}>
                Se déconnecter
              </p>
            </div>
        </>}
      </OutsideClickHandler>
    </div>
  );
};

export default MenuDropdown;
