import { useEffect } from "react";
const DocumentTitle = (props) =>{
   useEffect(() => {
      document.title = props.title;
   },[props])
} 
export default DocumentTitle;