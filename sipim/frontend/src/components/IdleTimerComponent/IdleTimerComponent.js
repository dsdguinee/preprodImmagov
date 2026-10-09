import { useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

import { withIdleTimer } from 'react-idle-timer'
import { UserContext } from "../../services/Context/Context";
import Api from "../../services/Api";

const IdleTimerComponent = () => {
  const api = new Api();
  const navigate = useNavigate();
  const idleTimerRef = useRef(null);
  const { user: isOnline } = useContext(UserContext);

  const onIdle = () => {
    if (isOnline) {
      api.logout()
      toast.success("Vous avez été déconnecté pour cause d'inactivité.");
      navigate('/');
    }
  };

  return (
    <div>
      {isOnline ? (
        <IdleTimer
          ref={idleTimerRef}
          timeout={1000 * 60}
          onIdle={onIdle}
        />
      ) : null}
    </div>
  );
};

export default IdleTimerComponent;
