import React, { useState } from "react";
import Erreurs from "../../components/erreurs/Erreurs";
import logo from "../../assets/logo.png";
import armoiries from "../../assets/armoiries.png";
import star from "../../assets/Star1.svg";
import ellipse1 from "../../assets/Ellipse1.svg";
import ellipse2 from "../../assets/Ellipse2.svg";
import line1 from "../../assets/Line1.svg";
import polygon1 from "../../assets/Polygon1.svg";
import rectangle1 from "../../assets/Rectangle1.svg";
import { useForm } from "react-hook-form";
import { login, setToken } from "../../services/auth.service";
import { Helmet } from "react-helmet-async";

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [credential, setCredential] = useState([]);
  const [backerreur, setBackerreur] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  //Avoir les Inputs de l'utilisateur
  const handleInput = (e) => {
    e.persist();
    setCredential({
      ...credential, 
      [e.target.name]: e.target.value,
    });
  };

  const onSubmit = async (e) => {
    setBackerreur({});
    setIsLoading(true);
    await login(credential)
      .then((res) => {
        if (res.data.success) {
          const token = res.data.token;
          setToken(token);
          window.location.href = "/dashboard";
          setIsLoading(false);
        } else if (!res.data.success) {
          setBackerreur(res.data.messages);
          setIsLoading(false);
        } else {
          setBackerreur({ login: "Connexion Impossible." });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setBackerreur({ login: "Serveur Indisponible." });
        setIsLoading(false);
      });
  };
  
  return (
    <div className="login-page">
      <Helmet>
        <title>IMMAGOV - Connexion</title>
      </Helmet>
    
      <div className="head">
        <div className="header-1">
          <p>République de Guinée</p>
          <p>Présidence de la république</p>
        </div>
        <div className="armoiries">
          <div>
            <img src={armoiries} alt="" />
          </div>
        </div>
        <div className="header-2">
          <p>Direction générale des garages du gouvernement</p>
        </div>
      </div>
      <div className="form">
        <div className="logo">
          <div className="image">
            <img src={logo} alt="" />
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} disabled={isLoading}>
            <h3>Connectez-vous à votre compte.</h3>
            <div>
              <Erreurs validation={backerreur} />
              <input
                type="text"
                name="login"
                placeholder="Téléphone ou email"
                onChange={handleInput}
                aria-invalid={errors.login ? "true" : "false"}
                {...register("login", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                  minLength: 2,
                })}
                autoFocus
              />
              {errors.login && errors.login.type === "required" && (
                <span role="alert" className="error-msg">
                  Le téléphone ou l'email est obligatoire
                </span>
              )}
              {errors.login && errors.login.type === "minLength" && (
                <span role="alert" className="error-msg">
                  Le caractère minimum est deux (2).
                </span>
              )}
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Mot de passe"
                onChange={handleInput}
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                })}
              />
              {errors.password && errors.password.type === "required" && (
                <span role="alert" className="error-msg">
                  Le mot de passe est obligatoire.
                </span>
              )}
            </div>
            {/* <div className="forgot">
              <span>Mot de passe oublié ?</span>
            </div> */}
            <button type="submit" disabled={isLoading}> {isLoading ? "...Patientez":"Se connecter"}</button>
     
        </form>
      </div>
      <div className="motifs">
        <img src={star} alt="" className="motif star" />
        <img src={ellipse1} alt="" className="motif ellipse1" />
        <img src={ellipse2} alt="" className="motif ellipse2" />
        <img src={polygon1} alt="" className="motif polygon1" />
        <img src={line1} alt="" className="motif line1" />
        <img src={rectangle1} alt="" className="motif rectangle1" />
      </div>
      <div className="footer">
        <p>DSD-GUINEE &copy;2022. Tous droits réservés</p>
      </div>
    </div>
  );
};

export default Login;
