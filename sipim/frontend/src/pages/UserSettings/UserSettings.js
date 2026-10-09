import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsFillArrowDownCircleFill } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import Erreurs from '../../components/Erreurs/Erreurs';
import { loadingState } from '../../recoil/atoms/loadingAtom';
import Api from '../../services/Api';
import { UserContext } from '../../services/Context/Context'
import { objecttoFormData } from '../../services/Helpers/fonctions';

const UserSettings = () => {
  const{user,setUser} = useContext(UserContext);
  const[userInfo,setUserInfo] = useState(user);
  const url = process.env.REACT_APP_URL.replace('api/','') + 'storage/';
  const [isLoading, setIsLoading] = useRecoilState(loadingState);
  const [erreurs,setErreurs] = useState([]);
  const api = new Api();
  const navigate = useNavigate();
  const { register, handleSubmit, reset,formState: { errors } } = useForm();
 
  const onFileChange = (e) => {
    if(e.target.files[0])
    setUserInfo({...userInfo,[e.target.name]:e.target.files[0],photo:''});
  }
  const handleInput = (e) => {
    if(e.target.name === 'nom'){
       setUserInfo({...userInfo,[e.target.name]:e.target.value.toUpperCase()}); return;
      }
     setUserInfo({...userInfo,[e.target.name]:e.target.value});
  }
  const submitChange = async () => {
    setErreurs([]);setIsLoading(true);
    const formData = objecttoFormData(userInfo);
    const{status,messages,userData} = await api.apiData('post','/user/usersetting',formData);
    if(status === 200){
        toast.success("Compte modifié avec succès.");
        setUser({...user,nom:userInfo.nom,prenom:userInfo.prenom,photo:userData.photo}); 
        navigate('/dashboard');setIsLoading(false);
    }else{
      setErreurs(messages);setIsLoading(false);
    }
  }
  
  return (
    <div className='user-settings page'>
        <h3>Paramètres du compte</h3>
        {userInfo &&
          <main>
              <div className="profile-image">
                {userInfo.photo != '' ? <img src={url + userInfo.photo} alt={`${userInfo.prenom} ${userInfo.nom}`}/>:<img src={URL.createObjectURL(userInfo.Changedphoto)} alt={`${userInfo.prenom} ${userInfo.nom}`}/>}
                  <input type="file" name="profile" id="profile" placeholder="Choisissez une photo" />
                  <div className="file-upload-wrapper">
                    <div className="file-upload">
                      <input type="file" name="Changedphoto"  onChange={onFileChange} accept="image/jpg, image/jpeg,image/png"/>
                      <BsFillArrowDownCircleFill />
                    </div>
                  </div>
              </div> 
              <form onSubmit={handleSubmit(submitChange)}>
                <div className="input-group">
                  <label>Nom
                    <input type="text" name="nom" id="nom" 
                        placeholder="Nom"
                        value={userInfo.nom}
                        {...register('nom', {
                          onChange: (e) => {
                              handleInput(e)
                          },
                          required:true,maxLength:150,minLength:2},
                        )}
                 
                      />
                   {errors.nom && errors.nom?.type === "required" && (
                      <span className="error-msg">Le Nom de famille est obligatoire.</span>
                  )}
                  {errors.nom && errors.nom?.type === "minLength" && (
                  <span className="error-msg">Le caractère minimum est deux (2).</span>
                  )}
                  {errors.nom && errors.nom?.type === "maxLength" && (
                  <span className="error-msg">Le caractère maximum est cent cinquante (150).</span>
                  )}
                  </label>
                  <label>Prenom
                    <input type="text" name="prenom" id="prenom" 
                      placeholder="Prenom"
                      value={userInfo.prenom}
                      {...register('prenom', {
                        onChange: (e) => {
                            handleInput(e)
                      },
                      required:true,maxLength:150,minLength:2},
                      )}
                    />
                  {errors.prenom && errors.prenom?.type === "required" && (
                    <span className="error-msg">Le Prenom est obligatoire.</span>
                  )}
                  {errors.prenom && errors.prenom?.type === "minLength" && (
                   <span className="error-msg">Le caractère minimum est deux (2).</span>
                  )}
                 {errors.prenom && errors.prenom?.type === "maxLength" && (
                 <span className="error-msg">Le caractère maximum est cent cinquante (150).</span>
                )}
                  </label>
                </div>
                <div className="input-group">
                <label className="password">Nouveau mot de passe
                  <div className="password-field">
                      <input type='password' name="password" id="password" 
                         placeholder="Mot de passe"
                         {...register('password', {
                          onChange: (e) => {
                              handleInput(e)
                         },
                         required:false,maxLength:150,minLength:5},
                        )} 
                     />
              
                  {errors.password && errors.password?.type === "minLength" && (
                   <span className="error-msg">Le caractère minimum pour le mot de passe cinq (5).</span>
                  )}
                  {errors.password && errors.password?.type === "maxLength" && (
                   <span className="error-msg">Le caractère maximum est vingt (20).</span>
                  )}
                  </div>
                </label>
                <label className="password">Confirmez mot de passe
                  <div className="password-field">
                      <input type='password' name="confirm_password" id="confirm_password" 
                         placeholder="Confirmez votre mot de passe"
                         value={userInfo?.confirm_password?userInfo.confirm_password:''}
                         onChange = {handleInput}
                        //  {...register('confirm_password', {
                        //   onChange: (e) => {
                        //     handleInput(e)
                        //   },
                        //    validate: (value) => value ===  userInfo.password 
                        //    })
                        //  }
                         />
                     {/* {errors.confirm_password && (
                      <span className="error-msg">Les deux mot de passe doivent être identique.</span>
                      )} */}
                  </div>
                </label>
                </div>
                <Erreurs validation={erreurs} /> 
                <button>Enregistrer</button>
              </form>
          </main>
        }
    </div>
  )
}

export default UserSettings