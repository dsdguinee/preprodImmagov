import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function BarChart({ chartData }) {
  //console.log(chartData)
  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  return <Bar data={chartData} options={options} />;
}

export default BarChart;