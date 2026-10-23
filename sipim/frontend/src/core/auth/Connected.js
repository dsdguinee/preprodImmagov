import { useNavigate } from 'react-router-dom';
import { tokenStore } from './tokenStore';

const Connected = ({children}) => {
  const navigate = useNavigate()

    const token = tokenStore.get();
    if( token ){
       navigate('/dashboard')
    }
    else {
      return children;
    }
  }
  export default Connected;