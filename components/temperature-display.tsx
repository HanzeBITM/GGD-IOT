'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { TemperatureReading } from '@/types/types';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface TemperatureLineChartProps {
    data: TemperatureReading[];
}

const TemperatureLineChart: React.FC<TemperatureLineChartProps> = ({ data }) => {
    const chartData = {
        datasets: [
            {
                label: 'Temperature (°C)',
                data: data.map(reading => ({
                    x: new Date(reading.timestamp),
                    y: reading.temperature,
                })),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            x: {
                type: 'time' as const,
                time: {
                    unit: 'day' as const,
                    tooltipFormat: 'PPpp',
                    displayFormats: {
                        day: 'MMM d',
                    },
                },
                title: {
                    display: true,
                    text: 'Date',
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
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Temperature History',
            },
        },
    };

    return <Line data={chartData} options={options} />;
};

export default TemperatureLineChart;




