import { useState } from "react";
export const Select_error = ({value}) => {
  
  return parseInt(value) === 0 && value !='' ? 'Ce champ est obligatoire.':'' ;
}