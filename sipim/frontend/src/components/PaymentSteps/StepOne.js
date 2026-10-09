import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { memoirecode } from "../../utils/memoires";
import { ElementContext, UserContext } from "../../services/Context/Context";
const privilegeExiste = (privileName,privilegestable) => {
  const privilege = privilegestable.filter((p) => p.privilege === privileName);
   if(Array.isArray(privilege) && privilege.length > 0)
     return true;
  return false   
}
const StepOne = ({ nextStep, prevStep, paiement, setPaiement,setCustumErr,custumErr,inputRef }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paiement,
    },
  });
  const { elementsData } = useContext(ElementContext);
  const {privileges} = useContext(UserContext);

  const [typeCarteGrises, setTypeCarteGrises] = useState([]);
  const [typeVignettes, setTypeVignettes] = useState([]);
  const [autorisations, setAutorisations] = useState([]);
  const [errmsg, setErrmsg] = useState("");
  //Convertir une chaine de caracter apres space
  // function UpperAfterSpace(data){
  //   console.log(data.length)
  //    if(data.length === 1 )
  //     return data.toUpperCase();

  //    for (var i = 1; i < data.length; i++) {
  //       if(data.charCodeAt(i - 1) === 32)
  //         data[i] = data[i].toUpperCase();
  //    }
  //    return data;
  // }
  //console.log(typeCarteGrises)
  const getVignetteExoID = (cartegrise_id) => {
     let vignette_id = 0 ;
     if(elementsData?.typeVignette){
       const vignette = elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(cartegrise_id) && c.nomType === 'Vignette Exonérée');
       if(Array.isArray(vignette) && vignette.length > 0){
         vignette_id = vignette[0].typevg_id
       }
     }
     return vignette_id;
  }
  const expressionCarteGrise = (id, elementsData) => {
    if (elementsData) {
      setErrmsg(""); 
      if (paiement.modeImma == "")
        setErrmsg("Veuillez selectionner le mode d'immatriculation d'abord.");
      const cartegrises = elementsData.typeCarteGrise.filter(
        (c) => c.categorie_id == id && c.type == paiement.modeImma
      );
        
        const libellecg = cartegrises.map((cartegrise) => {
         
        const memoire = memoirecode.filter((m) => m.signe == cartegrise.signe);
       if(cartegrise.signe){
        var expression = "";
        const doublesigne = cartegrise.signe.split(",");
     
        if (Array.isArray(doublesigne) && doublesigne.length === 1) {
          if (cartegrise.signe == "!") {
            const capacites = cartegrise.capacite.split(",");
            let libellepoid = '';
           if(cartegrise.libellepoids !== null)
           libellepoid = cartegrise.libellepoids + " ";
        
            expression =  libellepoid +
              memoire[0]?.signification +
              " " +
              capacites[0] +
              " et " +
              capacites[1] +
              " " +
              cartegrise.unite;
          } else if (
            cartegrise.signe == ">" ||
            cartegrise.signe == "<" ||
            cartegrise.signe == ">=" ||
            cartegrise.signe == "<="
          ) {
            const nomtype =
              cartegrise?.nomType !== null ? cartegrise?.nomType + " " : "";
            expression = cartegrise.libellepoids + " "+
              nomtype +
              memoire[0]?.signification +
              " à " +
              cartegrise.capacite +
              " " +
              cartegrise.unite;
          } else if (cartegrise.signe !== "" || cartegrise.signe !== null) {
            let libellepoid = '';
            if(cartegrise.libellepoids !== null)
               libellepoid = cartegrise.libellepoids + " ";

            expression = libellepoid +
              cartegrise?.nomType !== null ? cartegrise?.nomType + " " : "";
            return {
              id: cartegrise.typecg_id,
              expression: expression,
              isVignettre: cartegrise.isVignette,
            };
          }

          return {
            id: cartegrise.typecg_id,
            expression: expression.replace('null',''),
            isVignettre: cartegrise.isVignette,
          };
          } else if (Array.isArray(doublesigne) && doublesigne.length === 2) {
          const expression1 = memoirecode.filter(
            (m) => m.signe == doublesigne[0]
          )[0];
          const expression2 = memoirecode.filter(
            (m) => m.signe == doublesigne[1]
          )[0];
          const capacites = cartegrise.capacite.split(",");
          let libellepoid = '';
          if(cartegrise.libellepoids !== null)
             libellepoid = cartegrise.libellepoids + " ";
            
          expression = libellepoid +
            expression1?.signification +
            " à " +
            capacites[0] +
            " et " +
            expression2?.signification +
            " à " +
            capacites[1] +
            " " +
            cartegrise.unite;

          return {
            id: cartegrise.typecg_id,
            expression: expression.replace('null',''),
            isVignettre: cartegrise.isVignette,
          };
        }
       }else{
          return {
            id: cartegrise.typecg_id,
            expression: cartegrise.nomType.replace('null',''),
            isVignettre: cartegrise.isVignette,
          };
       }
      });
    
      setTypeCarteGrises(libellecg);
    }
  };
  useEffect(() => {
    reset(paiement);
    expressionCarteGrise(paiement.categorieCg, elementsData);
    if (elementsData) {
      if(paiement.modeExp === "Transport"){
          setTypeVignettes(elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(paiement.categorieCg)));
       }else{
          if(parseInt(paiement.categorieCg) === 3){
            if(privilegeExiste('Vignette Exonérée',privileges)){ 
              setTypeVignettes(elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(paiement.categorieCg)));
            }else{
              const vignettes = elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(paiement.categorieCg)).filter((c) => c.nomType !== 'Vignette Exonérée');
              setTypeVignettes(vignettes);
            }
          }else{
            if(privilegeExiste('Vignette Exonérée',privileges)){ 
              setTypeVignettes(elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(paiement.categorieCg) && c.nomType.indexOf('transport') === -1 ));
            }else{
              const vignettes = elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(paiement.categorieCg) && c.nomType.indexOf('transport') === -1 ).filter((c) => c.nomType !== 'Vignette Exonérée');
              setTypeVignettes(vignettes);
            }

          }
       }
    
      setAutorisations(
        elementsData.autorisations.filter(
          (c) => c.categorie_id === parseInt(paiement.categorieCg)
        )
      );
    }
  }, [prevStep, nextStep]);

  const handleInput = (e) => {
    if (e.target.name === "chassis") {
      if(e.target.value.length <= 17)
        setPaiement({
          ...paiement,
          [e.target.name]: e.target.value.toUpperCase(),
        });

      return;
    }
    if(custumErr !== '')
      setCustumErr('');
    if(e.target.name === "tel"){
      if(e.target.value.length <= 9)
        setPaiement({
          ...paiement,
          [e.target.name]: e.target.value,
        });
        return;
    }
    if(e.target.name === 'pf' && parseInt(paiement.categorieCg) !== 3){
      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,nbrePlace:0
      });
      return;
    }
    if(e.target.name === 'nbrePlace' && parseInt(paiement.categorieCg) !== 3){
      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,pf:0
      });
      return;
    }
    if(e.target.name === "fullName"){
      setPaiement({
        ...paiement,
        fullName: e.target.value.toUpperCase(),
      });
      // const fullName = FirstUpperCase(paiement.fullName,e.target.value); 
      // console.log(fullName)
      return;
    }
    if(e.target.name === "isIT"){
      setPaiement({
        ...paiement,
        [e.target.name]: !paiement.isIT,
        document:'IT',
        isEP:false,
        isVA:false,
      });
      return;
    }
    else  if(e.target.name === "isEP"){
      setPaiement({
        ...paiement,
        [e.target.name]: !paiement.isEP,
        document:'EP',
        isIT:false,
        isVA:false,
      });
      return;
    } 
    else if(e.target.name === "isVA"){
      setPaiement({
        ...paiement,
        [e.target.name]: !paiement.isVA,
        document:'VA',
        isEP:false,
        isIT:false,
      });
      return;
    }
    if (e.target.name === "modeExp" && e.target.value === "Personnel") {
      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,
        autorisation_id: 0,
      });
      return;
    }
    if (e.target.name === "modeImma") {
      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,
        typeCg: 0,
        typeVignette: 0,
        autorisation_id: 0,
      });
      return;
    }
    // if(e.target.name === "pa" || e.target.name === "cu"){
    //     if(e.target.value === '')
    //         setPaiement({...paiement,[e.target.name]:0});
    //     else
    //       setPaiement({...paiement,[e.target.name]:e.target.value});
    //  return;
    // }

    if (e.target.name === "categorieCg") {
      setTypeCarteGrises([]);
      setTypeVignettes([]);
      setAutorisations([]);
      if (elementsData) {
        expressionCarteGrise(e.target.value, elementsData);
        setAutorisations(elementsData.autorisations.filter((c) => c.categorie_id === parseInt(e.target.value)));
        if(privilegeExiste('Vignette Exonérée',privileges)){ 
           setTypeVignettes(elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(e.target.value)));
        }else {
          const vignettes = elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(e.target.value)).filter((c) => c.nomType !== 'Vignette Exonérée');
          setTypeVignettes(vignettes);
          //console.log(vignettes1)
        }
      }

    }
   
    if (e.target.name == "typeCg") {
      // setTypeVignettes([]);
      // setTypeVignettes(elementsData.typeVignette.filter((c) => c.typecg_id === parseInt(e.target.value) && c.type === parseInt(paiement.modeImma)));

      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,
        typeVignette: 0,
        expressionCg: e.target.selectedOptions[0].text,
      });
      return;
    }
    if (e.target.name === "typeClient") {
      if(paiement.typeClient === 'Gouvernement'){
        setPaiement({
          ...paiement,
          [e.target.name]: e.target.value,
          //  typeVignette:0,autorisation_id:0,typeCg:0,pf:0,
           isEP:false,
           isIT:false,
           isVA:false,
           document:'',
        });
      }else{
      setPaiement({
        ...paiement,
        [e.target.name]: e.target.value,
      });
    }
    }else if(e.target.name === 'nif'){
      setPaiement({ ...paiement, [e.target.name]: e.target.value.toUpperCase() });
    } 
    else {
      if (e.target.name === "categorieCg")
        setPaiement({
          ...paiement,
          [e.target.name]: e.target.value,
          typeCg: 0,
          typeVignette: 0,
          autorisation_id: 0,
          pf:0,
        });
      else setPaiement({ ...paiement, [e.target.name]: e.target.value });
    }
    //console.log(paiement);
  };
//  console.log(typeVignettes);
//console.log(paiement.categorieCg)
//console.log(paiement)

  return (
    <div className="step-component">
      <h4>Informations</h4>
      <form onSubmit={handleSubmit(nextStep)}>
        <div className="input-group">
          <label>
            Type de client
            <select
              name="typeClient"
              id="typeClient"
              {...register("typeClient", {
                onChange: (e) => {
                  handleInput(e);
                },
                validate: (value) => value != "",
              })}
              value={paiement.typeClient}
            >
              <option value="" key={"typeClient"}>
                Selectionnez le type de client
              </option>
              <option value="Particulier" key={"particulier"}>
                Particulier
              </option>
               <option value="Société" key={"societe"}>
                Société
              </option>
              <option value="Gouvernement" key={"Gouvernement"}>
                Gouvernement
              </option>
            </select>
            {errors.typeClient && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
          </label>
          <label>
            Mode d'exploitation
            <select
              name="modeExp"
              id="modeExp"
              {...register("modeExp", {
                onChange: (e) => {
                  handleInput(e);
                },
                validate: (value) => value != "",
              })}
              value={paiement.modeExp}
              key="modeExp"
             >
              <option value="">Selectionner l'Usage</option>
              <option value="Personnel">Usage personnel</option>
              <option value="Transport">Transport</option>
            </select>
            {errors.modeExp && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
          </label>
        </div>
        {paiement.typeClient !== "" && (
          <div className="input-group">
            <label>
              {paiement.typeClient === "Société" && 
                "Nom de la société"}
              {paiement.typeClient === "Particulier" &&  "Prénom et Nom"}
              {paiement.typeClient === "Gouvernement" &&  "Nom du ministère ou structure"}
              <input
                value={paiement.fullName}
                type="text"
                name="fullName"
                key="fullName"
                placeholder={paiement.typeClient === "Société"? "Nom de la société"
                    : paiement.typeClient === 'Particulier' ? "Prénom et Nom de la Personne":paiement.typeClient === 'Gouvernement' && 'Nom du ministère ou structure'
                }
                id="fullName"
                {...register("fullName", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                  maxLength: 150,
                  minLength: 2,
                })}
              />
              {errors.fullName && errors.fullName?.type === "required" && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
              {errors.fullName && errors.fullName?.type === "minLength" && (
                <span className="error-msg">
                  Ne peut pas être inférieur à 2 caractères.
                </span>
              )}
              {errors.fullName && errors.fullName?.type === "maxLength" && (
                <span className="error-msg">
                  Ne peut pas être supérieur à 150 caractères.
                </span>
              )}
            </label>

            <label>
              Numéro de téléphone
              <input
                type="text"
                placeholder="Numéro de téléphone(ex: 620000000)"
                name="tel"
                id="tel"
                value={paiement.tel}
                {...register("tel", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                  maxLength: 9,
                  minLength: 5,
                  pattern: /6[0-9]{8}$/g,
                })}
              />
              {errors.tel && errors.tel?.type === "required" && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
              {errors.tel && errors.tel?.type === "minLength" && (
                <span className="error-msg">
                  Ne peut pas être inférieur à 5 caractères.
                </span>
              )}
              {errors.tel && errors.tel?.type === "maxLength" && (
                <span className="error-msg">
                  Ne peut pas être supérieur à 9 caractères.
                </span>
              )}
              {errors.tel && errors.tel.type === "pattern" && (
                  <span role="alert" className="error-msg">
                    Format invalide.ex: 620000000
                  </span>
                )}
            </label>
            {paiement.typeClient === "Société" && (
              <label>
                Code NIF
                <input
                  type="text"
                  value={paiement.nif}
                  placeholder="Code NIF"
                  name="nif"
                  id="nif"
                  {...register("nif", {
                    onChange: (e) => {
                      handleInput(e);
                    },
                    required: true,
                    maxLength: 16,
                    minLength:3
                  })}
                />
                {errors.nif && errors.nif?.type === "required" && (
                  <span className="error-msg">Ce champ est obligatoire.</span>
                )}
                {errors.nif && errors.nif?.type === "minLength" && (
                  <span className="error-msg">
                    Ne peut pas être inférieur à 3 caractères.
                  </span>
                )}
                {/* {errors.nif && errors.nif?.type === "maxLength" && (
                  <span className="error-msg">
                    Ne peut pas être supérieur à 16 caractères.
                  </span>
                )} */}
              </label>
            )}
          </div>
        )}

        <div className="input-group">
          <label>
            Numéro de chassis
            <input
              type="text"
              value={paiement.chassis}
              placeholder="Numéro de chassis"
              name="chassis"
              id="chassis"
              {...register("chassis", {
                onChange: (e) => {
                  handleInput(e);
                },
                required: true,
                maxLength: 17,
                minLength: 2,
              })}
            />
            {errors.chassis && errors.chassis?.type === "required" && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
            {errors.chassis && errors.chassis?.type === "minLength" && (
              <span className="error-msg">
                Ne peut pas être inférieur à deux caractères.
              </span>
            )}
            {errors.chassis && errors.chassis?.type === "maxLength" && (
              <span className="error-msg">
                Ne peut pas être superieur à dix sept (17).
              </span>
            )}
          </label>
          <label>
            Mode d'immatriculation
            <select
              name="modeImma"
              id="modeImma"
              {...register("modeImma", {
                onChange: (e) => {
                  handleInput(e);
                },
                validate: (value) => value != "",
              })}
              value={paiement.modeImma}
            >
              <option value="">Mode d'Immatriculation</option>
              <option value="1">Immatriculation</option>
              <option value="2">Reimmatriculation</option>
            </select>
            {errors.modeImma && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
          </label>
          <label>
             Categorie de carte grise
            <select
              placeholder="Categorie de carte grise"
              name="categorieCg"
              id="categorieCg"
              {...register("categorieCg", {
                onChange: (e) => {
                  handleInput(e);
                },
                validate: (value) => value != 0,
              })}
              value={paiement.categorieCg}
            >
              <option value="0">Categorie de Carte Grise</option>
              {elementsData &&
                elementsData.categories.map((categorie) => (
                  <option
                    key={categorie.categorie_id}
                    value={categorie.categorie_id}
                  >
                    {categorie.nomCategorie}
                  </option>
                ))}
            </select>
            {errors.categorieCg && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
            {errmsg && paiement.categorieCg != 0 && (
              <span className="error-msg">{errmsg}</span>
            )}
          </label>
        </div>

        <div className="input-group">
          {!paiement.isVA &&
            <label>
           Type de carte grise
            <select
              name="typeCg"
              id="typeCg"
              {...register("typeCg", {
                onChange: (e) => {
                  handleInput(e);
                },
               validate: (value) => value != 0,
              })}
              value={paiement.typeCg}
            >
              <option value={0}>Type de Carte Grise</option>
              {typeCarteGrises &&
                typeCarteGrises.map((typecarte) => (
                  <option key={typecarte.id} value={typecarte.id}>
                    {typecarte.expression}
                  </option>
                ))}
            </select>
            {errors.typeCg && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
          </label>}
          {(parseInt(paiement.categorieCg) !== 6 && !paiement.isVA)?(
          <label>
            Type de vignette
            <select
              placeholder="Type de vignette"
              name="typeVignette"
              id="typeVignette"
              {...register("typeVignette", {
                onChange: (e) => {
                  handleInput(e);
                },
                validate: (value) => value != 0,
              })}
              value={paiement.typeVignette}
            >
              <option value={0}>Type de vignette</option>
              {typeVignettes &&
                typeVignettes.map((typecarte) => (
                  
                  <option key={typecarte.typevg_id} value={typecarte.typevg_id}>
                    {typecarte.nomType}
                  </option>
                ))}
            </select>
            {errors.typeVignette && (
              <span className="error-msg">Ce champ est obligatoire.</span>
            )}
          </label>): 
          parseInt(paiement.categorieCg) === 6 && !paiement.isVA &&(
            <label>Saisir 
             {parseInt(paiement.categorieCg) === 1 && " la cylindrée( en CC)"}
             {parseInt(paiement.categorieCg) === 2 && " la puissance fiscale( en CV )"}
             {parseInt(paiement.categorieCg) === 3 && " le nombre de place( en P )"}
             {(parseInt(paiement.categorieCg) === 4 || parseInt(paiement.categorieCg) === 5 || parseInt(paiement.categorieCg) === 6)&& " la puissance fiscale( en CV )"}
                <input type="number" value={paiement.pf} name="pf" min={0}
                onChange={handleInput}
                ref={inputRef}
                />

            </label>
          )
          }
          {(parseInt(paiement.categorieCg) !== 6 && !paiement.isVA)&&
          <label>Saisir 
            {parseInt(paiement.categorieCg) === 1 && " la cylindrée( en CC)"}
            {parseInt(paiement.categorieCg) === 2 && " la puissance fiscale( en CV )"}
            {parseInt(paiement.categorieCg) === 3 && " le nombre de place Assis(en P)"}
            {(parseInt(paiement.categorieCg) === 4 || parseInt(paiement.categorieCg) === 5 || parseInt(paiement.categorieCg) === 6)&& " la puissance fiscale( en CV )"}
            {parseInt(paiement.categorieCg) !== 3 && <input type="number" value={paiement.pf} name="pf"  min={0}
                 onChange={handleInput}
                 ref={inputRef}
              />}
             {parseInt(paiement.categorieCg) === 3  && <input type="number" value={paiement.nbrePlace} name="nbrePlace"  min={0}
                 onChange={handleInput}
                 ref={inputRef}
              />}

          </label>}
        
        </div>
        
  
          <div className="input-group">
          {(paiement.modeExp === "Transport" && !paiement.isVA) && (
            <label>
              Autorisation de Transport
              <select
                value={paiement.autorisation_id}
                name="autorisation_id"
                id="autorisation_id"
                {...register("autorisation_id", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  validate: (value) => value != 0,
                })}
              >
                <option value={0}>Autorisation de Transport</option>
                {autorisations &&
                  autorisations.map((autorisation) => (
                    <option
                      key={autorisation.autorisation_id}
                      value={autorisation.autorisation_id}
                    >
                      {autorisation.nomAutorisation}
                    </option>
                  ))}
              </select>
              {errors.autorisation_id && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
            </label>
          )}
          {((parseInt(paiement.categorieCg) === 4 || parseInt(paiement.categorieCg) === 5 || parseInt(paiement.categorieCg) === 6) && !paiement.isVA)&& (
            <label>
              Poids à Vide(en Kg)
              <input
                type="number"
                placeholder="Poids à Vide"
                min={1}
                name="pv"
                id="pv"
                {...register("pv", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                  min: 1,
                })}
              />
              {errors.pa && errors.pa?.type === "required" && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
              {errors.pa && errors.pa?.type === "min" && (
                <span className="error-msg">
                  Ne peut pas être inférieur à 1 caractère.
                </span>
              )}
            </label>
          )}
          {((parseInt(paiement.categorieCg) === 4 || parseInt(paiement.categorieCg) === 5 || parseInt(paiement.categorieCg) === 6) && !paiement.isVA)&& (
            <label>
              {" "}
              Charge Utile(en Kg)
              <input
                type="number"
                placeholder="Charge Utile"
                name="cu"
                id="cu"
                min={1}
                value={paiement.cu}
                {...register("cu", {
                  onChange: (e) => {
                    handleInput(e);
                  },
                  required: true,
                  min: 1,
                })}
              />
              {errors.cu && errors.cu?.type === "required" && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
              {errors.cu && errors.cu?.type === "min" && (
                <span className="error-msg">
                  Ne peut pas être inférieur à 10.
                </span>
              )}
            </label>
          )}
          </div>

        {((parseInt(paiement.categorieCg) === 4 || parseInt(paiement.categorieCg) === 5 || parseInt(paiement.categorieCg) === 6)&& !paiement.isVA) && (
          <div className="input-group">
             <label>
              Poids Total Roulant Autorisé(En T)
              {/* <strong>
                {(
                  (2 * parseInt(paiement.pv != "" ? paiement.pv : 0) +
                    parseInt(paiement.cu != "" ? paiement.cu : 0)) *
                  0.001
                ).toFixed(2)}
              </strong> */}
              <input type="number" value={paiement.ptra}
                 placeholder="Poids Total Roulant Autorisé"
                 name="ptra"
                 id="ptra"
                 {...register("ptra", {
                   onChange: (e) => {
                     handleInput(e);
                   },
                   required: true,
                   min: 1,
                 })}
              />
             {errors.ptra && errors.ptra?.type === "required" && (
                <span className="error-msg">Ce champ est obligatoire.</span>
              )}
              {errors.ptra && errors.ptra?.type === "min" && (
                <span className="error-msg">
                  Ne peut pas être inférieur à 1.
                </span>
              )}
            </label>
            <label>
              Poids Total Autorisé à Charge(En T)
              <strong style={{ marginTop: "12px" }}>
                {(
                  (parseInt(paiement.pv != "" ? paiement.pv : 0) +
                    parseInt(paiement.cu != "" ? paiement.cu : 0)) *
                  0.001
                ).toFixed(2)}
              </strong>
            </label>
           
          </div>
        )}
         {/* {privilegeExiste('Paiement EP',privileges) && 
          <div className="input-group">
            <div className="checkbox">
            
                <label>
                  <input type="checkbox" name="vignetteExo" checked={paiement.vignetteExo} onChange={handleInput}
                  /> Vignette Exonorée
                </label>
            </div>
          </div>
        } */}
      
          <div className="input-group">
       
          <div className="checkbox">
          {(privilegeExiste('Paiement IT',privileges) && paiement.typeClient !== 'Gouvernement') && 
             <label>
              <input type="checkbox" name="isIT" checked={paiement.isIT} onChange={handleInput}
              /> Plaque IT
            </label>
           }
            {privilegeExiste('Paiement EP',privileges) && 
              <label>
              <input type="checkbox" name="isEP" checked={paiement.isEP} onChange={handleInput}
                /> Plaque EP
              </label>
            }
             {(paiement.typeClient === 'Gouvernement' && privilegeExiste('Paiement VA',privileges)) &&
             <label>
              <input type="checkbox" name="isVA" checked={paiement.isVA} onChange={handleInput}/> Plaque VA
             </label>}
                
            </div>
            {(paiement.isIT && privilegeExiste('Paiement IT',privileges) ) &&
             <label>Date d'expiration
               <input type="date" name="dateExpCg" onChange={handleInput} value={paiement.dateExpCg}/>
               
           </label>}
           {/* {(paiement.isIT)&&
           <div></div>} */}
          {(parseInt(paiement.categorieCg) === 3 && !paiement.isVA) && 
              <label>Saisir La puissance fiscale
                <input type="number" value={paiement.pf} name="pf"  min={0}
                  onChange={handleInput}
                />
              </label>
           }
          </div>
      
       
       { custumErr && 
        (<div className="input-group">
           <div>
           <span className="error-msg">
                {custumErr}
            </span>
           </div>
        </div>)}
        <div className="buttons">
          <button type="submit">Suivant</button>
        </div>
      </form>
    </div>
  );
};

export default StepOne;
