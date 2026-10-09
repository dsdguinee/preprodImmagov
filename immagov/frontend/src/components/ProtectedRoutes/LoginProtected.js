import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"
import { getCurrentUser } from "../../services/auth.service";
import { isEmpty } from "../../utils/helper/functions";

const LoginProtected = ({children,redirectPath='/' }) => {
    const token = localStorage.getItem('token');
    const [connected,setConnected] = useState(false);
    useEffect(()=>{
        getCurrentUser().then((resp) => {
            setConnected(true);
            if(!resp?.id){
              localStorage.removeItem('token');
              window.location.href=redirectPath;
            }

        });
       
    },[]);
    if(token) {
        return children;
    }
    
    localStorage.removeItem('token');
    window.location.href=redirectPath;
    //navigate(redirectPath);
}

export default LoginProtected;