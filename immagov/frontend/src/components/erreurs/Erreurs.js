import React,{ useState ,useEffect}  from "react";

export default function Erreurs(props)
{
  /*  var list = props.validation.map((item) => {
        <li key={item}>{item}</li>
   })  */ 
   
   var data = props.validation; 
  
   var list = Object.entries(data).map(([key, value]) => (
       <li key={key} className = 'error-msg'>{value}</li>
     ));
   
   if(data)
   {
    return (
        <div className="alert alert-danger print-error-msg"> 
            <ul style={{listStyle :'number',paddingLeft:'5px'}}>
               {list}
            </ul>
        </div>);
   }
   else
   { 
       return null;
   }
   
}
function isEmptyDict(d){for (var k in d) return false; return true}