import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import 'moment/locale/fr';

const BarChartComponent = ({graph}) => {
  const[data,setData] = useState([]);
  useState(() => {
     if(graph){
      setData(graph.map((gr) => {
        const mois = moment(gr.mois, 'M').format('MMMM');
      // console.log(gr) 
        return {
          mois:mois.charAt(0).toUpperCase() + mois.slice(1),
          "Particulier":gr.Particulier?gr.Particulier:0,
          "Société":gr.Société?gr.Société:0
         
        }
      
      }))
     }
     // console.log(graph)
  },[graph]);
 

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mois" />
        {/* <YAxis /> */}
        <Tooltip />
        {/* <Legend /> */}
        <Bar dataKey="Particulier" fill="#ff8d13" />
        <Bar dataKey="Société" fill="#8d99ae" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
