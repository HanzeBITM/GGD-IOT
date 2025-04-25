// filepath: my-next-app/my-next-app/src/components/charts/temperature-line-chart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { TemperatureReading } from '@/types/types';

interface TemperatureLineChartProps {
  data: TemperatureReading[];
}

const TemperatureLineChart: React.FC<TemperatureLineChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(reading => new Date(reading.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.map(reading => reading.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        beginAtZero: false,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default TemperatureLineChart;
