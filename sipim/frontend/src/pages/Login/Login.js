import React, { useState, useEffect, useMemo, useContext } from "react";
import { useSpring, animated } from "react-spring";
import { onboardingText } from "../../utils/texts";
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import Api from "../../services/Api";
import Erreurs from "../../components/Erreurs/Erreurs";
import DocumentTitle from "../../components/DocumentTitle/DocumentTitle";
import toast from 'react-hot-toast';
import dsdlogo from '../../assets/images/logo-2.png'

import { useRecoilState } from 'recoil'
import { loadingState } from "../../recoil/atoms/loadingAtom"; 

const Login = () => {
  const navigate = useNavigate();

  const [position, setPosition] = useState(0);
  const [erreurs, setErreurs] = useState([]);
  
  const [isLoading,setIsLoading] = useRecoilState(loadingState);

  const [user,setUser] = useState({
      login:'',
      password:''
  });
  const { register, handleSubmit, reset,formState: { errors } } = useForm({
    defaultValues:{
        user
    }
  });
  const api = new Api();

  // TODO: Trouver une autre librairie d'animation pour corriger le problème de l'animation qui se rafraichit à chaque fois qu'on saisit du texte
  const imageAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 100 }, config: {duration: 400} });
  const headerAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 100 }, config: {duration: 450} });
  const textAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 150 }, config: {duration: 500} });
  
  // ? Fais planter l'animation 
  // const imageAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 100 }, reset: true, config: {duration: 400} });
  // const headerAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 100 }, reset: true, config: {duration: 450} });
  // const textAnimation = useSpring({ to: { opacity: 1, x: 0 }, from: { opacity: 0, x: 150 }, reset: true, config: {duration: 500} });
  //const {setCurrentUser} = useContext(UserContext)

  //Autoslide
  const handleSlide = () => {
    if (position === onboardingText.length - 1) {
      setPosition(0);
    } else {
      setPosition((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const handleAutoplay = setInterval(handleSlide, 6000);
    return () => clearInterval(handleAutoplay);
  }, [handleSlide])

  // TODO :  Clarifier utilité
  // useEffect(() => {
  //    reset(user)
  // }, []);
  
  const handleInput = (e) => {
    if(erreurs)
      setErreurs([]);
    setUser({...user,[e.target.name]:e.target.value})
  }
  const login = async (e) => {
    setIsLoading(true);
      setErreurs([]);
      var formData = new FormData();
      formData.append('login',user.login);
      formData.append('password',user.password);
      const {status,messages} = await api.auth(formData);
      if(status !== 200 ){
        setErreurs(messages);
        setIsLoading(false); 
      } 
      else 
         window.location.href='/dashboard'
      
  }
  return (
    <div className="login-page">
       {/* <Helmet>
         <title>VPC-Connexion</title>
       </Helmet> */}
       <DocumentTitle title="SIPIM Connexion" />
      <div className="left">
        <animated.div style={imageAnimation} className="onboarding-image">
          <img src={onboardingText[position].image} alt=""/>
        </animated.div>
        <div className="onboarding-text">
          <animated.h3 style={headerAnimation}>
            {onboardingText[position].header}
          </animated.h3>
          <animated.p style={textAnimation}>
            {onboardingText[position].text}
          </animated.p>
        </div>
        <div className="slide-btns">
          <div className={`btn ${position === 0 && "btn-active"}`} onClick={() => setPosition(0)}></div>
          <div className={`btn ${position === 1 && "btn-active"}`} onClick={() => setPosition(1)}></div>
          <div className={`btn ${position === 2 && "btn-active"}`} onClick={() => setPosition(2)}></div>
        </div>
      </div>
      <div className="right">
        <div className="wrapper">
          <div className="logo-and-label">
            <div className="logo">
              <img src={dsdlogo} alt='logo'/>
            </div>
            <p className="logo-label">Systeme integre de paiement des immatriculations</p>
          </div>
          
          <div className="login-form">
            <div className="header">
              <h3>Connexion</h3>
              <p>Utilisez votre email ou votre numéro de téléphone et votre mot de passe pour vous connecter.</p>
            </div>
            <fieldset disabled={isLoading} style={{border:0}}>
            <form onSubmit={handleSubmit(login)}>
             <Erreurs validation={erreurs} />
              <label>Email ou téléphone
                <input type="text" name="login" id="login"
                     placeholder="Email ou numéro de téléphone"
                     autoComplete="username"
                     {...register('login', {
                         onChange: (e) => {
                              handleInput(e)
                         },
                       required:true,minLength:6,maxLength:100},
                     )}
                />
                {errors.login && errors.login?.type === "required" && (
                     <span className="error-msg">L'email ou le numéro de téléphone est obligatoire.</span>
                )}
                {errors.login && errors.login?.type === "minLength" && (
                    <span className="error-msg">Le minimum de caractère est six (6).</span>
                )}
                {errors.login && errors.login?.type === "maxLength" && (
                    <span className="error-msg">Le caractère maximum est cent (100).</span>
                )}
              </label>
              <label>Mot de passe
                <input type="password" name="password" id="password" placeholder="Mot de passe"
                  {...register('password', {
                    onChange: (e) => {
                         handleInput(e)
                    },
                  required:true,},
                )}
                />
                {errors.password && errors.password?.type === "required" && (
                     <span className="error-msg">Le mot de passe est obligatoire.</span>
                )}
              </label>
              <button className="primary" type="submit" >{!isLoading?"Connexion":"...Patientez"}</button>
            </form>
            </fieldset>
           
          </div>
          <div>
            <p>DSD Guinée © 2022. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;