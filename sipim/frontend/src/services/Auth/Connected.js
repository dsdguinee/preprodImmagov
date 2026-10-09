import { useNavigate } from 'react-router-dom';

const Connected = ({children}) => {
  const navigate = useNavigate()

    const token = localStorage.getItem('token'); 
    if( token ){
       navigate('/dashboard')
    }
    else {
      return children;
    }
  }
  export default Connected;