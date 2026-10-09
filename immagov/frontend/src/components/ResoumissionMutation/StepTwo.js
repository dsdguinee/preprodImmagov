import { useState, useEffect, useMemo } from "react";
import { BiUpload } from "react-icons/bi";
import { useForm } from "react-hook-form";
import {
  getministeres,
  getdirectionsByMinistere,
} from "../../services/organisation.service";
import Spinner from "../Spinner/Spinner";

const StepTwo = ({
  handleNextStep,
  handlePrevStep,
  mutationInfo,
  setMutationInfo,
  ministeres,
  setStepChk,
  stepChk,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [directions, setDirections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const url = process.env.REACT_APP_URL + "/storage/";
  const [previews, setPreviews] = useState({ document1: "", document2: "" });

  const isValide = useMemo(() => {
    return (
      mutationInfo.nouveauMinistere_id !== "0" &&
      mutationInfo.motif !== "" &&
      mutationInfo.fonction !== "" &&
      mutationInfo.document1 !== "" &&
      mutationInfo.document2 !== ""
    );
  }, [mutationInfo]);

  useEffect(() => {
    if (mutationInfo.document1 != null || mutationInfo.document2 != null) {
      setPreviews({
        ...previews,
        document1:
          typeof mutationInfo.document1 === "string" ||
          mutationInfo.document1 instanceof String ||
          mutationInfo.document1 == null
            ? url + mutationInfo.document1
            : URL.createObjectURL(mutationInfo.document1),
        document2:
          typeof mutationInfo.document2 === "string" ||
          mutationInfo.document2 instanceof String ||
          mutationInfo.document2 == null
            ? url + mutationInfo.document2
            : URL.createObjectURL(mutationInfo.document2),
      });
    }
    getdirectionsByMinistere(mutationInfo.nouveauMinistere_id).then((resp) => {
      setDirections(resp);
    });
    setIsLoading(false);
    setStepChk({ ...stepChk, step3: isValide });
  }, [isValide]);

  const handleMinistere = (e) => {
    setDirections([]);
    setMutationInfo({
      ...mutationInfo,
      nouveauMinistere_id: e.target.value,
      nouveauDirection_id: 0,
    });
    if (e.target.value != 0) {
      setIsLoading(true);
      getdirectionsByMinistere(e.target.value).then((resp) => {
        setDirections(resp);
      });
      setIsLoading(false);
    }
  };

  const onFileChange = (event) => {
    setPreviews({
      ...previews,
      [event.target.name]: URL.createObjectURL(event.target.files[0]),
    });
    setMutationInfo({
      ...mutationInfo,
      [event.target.name]: event.target.files[0],
    });
  };

  const handleInput = (e) => {
    setMutationInfo({ ...mutationInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className="step-two">
      {isLoading && <Spinner />}
      <form onSubmit={handleSubmit(handleNextStep)}>
        <div className="input-group">
          <label>
            Nouveau Ministère d'Affectation
            <select
              id="ministère"
              name="ministere"
              value={mutationInfo.nouveauMinistere_id}
              {...register("nouveauMinistere_id", {
                onChange: (e) => {
                  handleMinistere(e);
                },
                validate: (value) => value !== "0",
              })}
            >
              <option value={0}>Selectionner le Ministère</option>
              {ministeres.length > 0 &&
                ministeres.map((ministere) => {
                  return (
                    <option
                      key={ministere.ministere_id}
                      value={ministere.ministere_id}
                    >
                      {ministere.nom}
                    </option>
                  );
                })}
            </select>
            {errors.nouveauMinistere_id && (
              <span className="error-msg">
                Veuillez selectionner le ministere .
              </span>
            )}
          </label>
          <label>
            Direction ou service
            <select
              id="nouveauDirection_id"
              name="nouveauDirection_id"
              value={mutationInfo.nouveauDirection_id}
              onChange={handleInput}
            >
              <option value={0}>Selectionner la Direction ou Service</option>
              {directions.length > 0 &&
                directions.map((direction) => {
                  return (
                    <option
                      key={direction.direction_id}
                      value={direction.direction_id}
                    >
                      {direction.nom}
                    </option>
                  );
                })}
            </select>
          </label>
        </div>
        <div className="input-group">
          <label>
            Motif
            <textarea
              name="motif"
              id=""
              cols="45"
              rows="5"
              defaultValue={mutationInfo.motif}
              {...register("motif", {
                onChange: (e) => {
                  handleInput(e);
                },
                required: true,
                minLength: 4,
              })}
            ></textarea>
            {errors.motif && errors.motif?.type == "required" && (
              <span className="error-msg">Veuillez renseigner ce champ .</span>
            )}
            {errors.motif && errors.motif?.type == "minLength" && (
              <span className="error-msg">
                Le caractère minimum pour le Motif est quatre (4) .
              </span>
            )}
          </label>
        </div>
        <div className="input-group">
          <div>
            <label>
              Quelle est la fonction du nouveau propriétaire?
              <span className="obligatoire">*</span>
            </label>
            <input
              defaultValue={mutationInfo.fonction}
              name="fonction"
              type="text"
              {...register("fonction", {
                onChange: (e) => {
                  handleInput(e);
                },
                required: true,
                minLength: 3,
              })}
            />
            {errors.fonction && errors.fonction?.type == "required" && (
              <span className="error-msg">
                Veuillez fournir la fonction du nouveau propriétaire .
              </span>
            )}
            {errors.fonction && errors.fonction?.type == "minLength" && (
              <span className="error-msg">
                Le caractère minimum pour le Motif est trois (3) .
              </span>
            )}
          </div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="step-files">
          <div className="files">
            <div className="file-wrapper">
              <p>Document 1</p>
              <div className="image">
                <img
                  src={previews.document1 ? previews.document1 : ""}
                  alt="document1"
                />
              </div>
              <div className="upload-btn-wrapper">
                <button className="btn">
                  <BiUpload /> Importer une photo
                </button>
                <input
                  type="file"
                  name="document1"
                  //onChange={onFileChange}
                  {...register("document1", {
                    onChange: (e) => {
                      onFileChange(e);
                    },
                    validate: (value) => value != "",
                  })}
                  accept="image/*"
                />
                {errors.document1 && (
                  <span className="error-msg">
                    Vous n'avez pas choisi d'image.
                  </span>
                )}
              </div>
            </div>

            <div className="file-wrapper">
              <p>Document 2</p>
              <div className="image">
                <img
                  src={previews.document2 ? previews.document2 : ""}
                  alt="document2"
                />
              </div>
              <div className="upload-btn-wrapper">
                <button className="btn">
                  {" "}
                  <BiUpload /> Importer une photo
                </button>
                <input
                  type="file"
                  name="document2"
                  onChange={onFileChange}
                  accept="image/*"
                />
              </div>
            </div>
            <div></div>
            <div></div>
          </div>
        </div>
        <div className="buttons" style={{ marginTop: "2em" }}>
          <button className="secondary" onClick={handlePrevStep}>
            Precedent
          </button>
          <button type="submit">Suivant</button>
        </div>
      </form>
    </div>
  );
};

export default StepTwo;
