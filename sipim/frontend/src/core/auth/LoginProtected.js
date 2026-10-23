import { useNavigate } from 'react-router-dom';
import { tokenStore } from './tokenStore';

const LoginProtected = ({isLogging,children,redirectPath='/' }) => {
    const navigate = useNavigate()

    const token = tokenStore.get();
    if(token || isLogging) 
        return children;
    
   tokenStore.clear();
   navigate(redirectPath)
    //window.location.href=redirectPath;
    //navigate(redirectPath);
}

export default LoginProtected;