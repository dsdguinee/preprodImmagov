import React from 'react'

const RectoCarte = React.forwardRef(({ immaData, validite, currentDate }, ref) => {
  return (
    <div className="recto face-carte" ref={ref}>
        <p className="num-immatriculation">{immaData.immatriculation_number}</p>
        <p className="emission">{currentDate.slice(0,3) + currentDate.charAt(3).toUpperCase()+currentDate.slice(4) }</p>
        <p className="validite-1">{validite.slice(0,3) + validite.charAt(3).toUpperCase()+validite.slice(4)}</p>
    </div>
  )
})

export default RectoCarte