import map from '../../assets/map.png'
import qr from '../../assets/qr.png'

const LicensePlate = ({ numImmatriculation, modeImmatriculation }) => {
    //console.log(modeImmatriculation)
    return (
        <div className={`license-plate ${modeImmatriculation === "VA" ? "green" : modeImmatriculation === "EP" ? "red" : modeImmatriculation === "CMD"?"yellow":""}`}>
            <div className="left">
                <div className="map">
                    <img src={map} alt="carte de la guinée" />
                </div>
                <div className="qr">
                    <img src={qr} alt="qr code" />
                </div>
                <span>RG</span>
            </div>
            <div className="right">
                <p> {numImmatriculation} </p>
            </div>
        </div>
    );
}
 
export default LicensePlate;