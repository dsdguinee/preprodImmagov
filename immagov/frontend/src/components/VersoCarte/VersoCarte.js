import React from 'react'
import moment from "moment";
import 'moment/locale/fr';

const VersoCarte = React.forwardRef(({ ministere, direction, typeVehicule, marque, modele, vehiculeData}, ref) => {
  return (
    <div className="verso face-carte" ref={ref}>
        <p className="department">{ministere}</p>
        <p className="service">{direction ? direction:"Non Defini"}</p>
        <p className="type">{typeVehicule }</p>
        <p className="marque">{marque}</p>
        <p className="modele">{modele}</p>
        <p className="chassis">{vehiculeData.numChassie}</p>
        <p className="energie">{vehiculeData.energy}</p>
        <p className="pa">{vehiculeData.pa}</p>
        <p className="ptac">{vehiculeData.pv && vehiculeData.cu ? parseInt(vehiculeData.pv) + parseInt(vehiculeData.cu):0}</p>
        <p className="pv">{vehiculeData.pv?vehiculeData.pv:0}</p>
        <p className="cu">{vehiculeData.cu?vehiculeData.cu:0}</p>
        <p className="date-mc">{moment(vehiculeData.releaseYear).format('DD-MMMM-YYYY').slice(0,3)
            +moment(vehiculeData.releaseYear).format('DD-MMMM-YYYY').charAt(3).toUpperCase()+moment(vehiculeData.releaseYear).format('DD-MMMM-YYYY').slice(4)}</p>
    </div>
  )
})

export default VersoCarte