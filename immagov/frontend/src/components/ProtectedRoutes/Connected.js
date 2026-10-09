
const Connected = ({children}) => {
  const token = localStorage.getItem('token'); 
  if( token ){
     window.location.href='/dashboard';
  }else {
    return children;
  }
}
export default Connected;