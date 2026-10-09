import { Link } from "react-router-dom";
import { GiReceiveMoney, GiCash } from "react-icons/gi";
import { AiOutlineUser } from "react-icons/ai";
import { BsBuilding } from "react-icons/bs";

const StatsBox = ({ title, amount, link, position,stat }) => {
  const icon =
    position === 1 ? (
      <GiReceiveMoney />
    ) : position === 2 ? (
      <AiOutlineUser />
    ) : position === 3 ? (
      <BsBuilding />
    ) : (
      <GiCash />
    );

  return (
    <div className="stats-box">
      <div className="top">
        <p>{title}</p>
        <strong>{amount}</strong>
      </div>
      <div className="bottom">
        <Link to={link} state={stat}>
          {position != 4 && <span>Détails</span>}
       
        </Link>
        <div className="icon">
            {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsBox;
