import { useNavigate } from 'react-router-dom';

const LoginProtected = ({isLogging,children,redirectPath='/' }) => {
    const navigate = useNavigate()

    const token = localStorage.getItem('token');
    if(token || isLogging) 
        return children;
    
   localStorage.removeItem('token');
   navigate(redirectPath)
    //window.location.href=redirectPath;
    //navigate(redirectPath);
}

export default LoginProtected;