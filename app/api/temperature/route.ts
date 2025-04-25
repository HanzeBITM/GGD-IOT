import { NextResponse } from 'next/server';
import { TemperatureReading } from '@/types/types';

// Configuration for the API - update with your Flask API address
const API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function GET() {
    try {
        const response = await fetch(`${API_URL}/temperature/history`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching temperature data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch temperature data' },
            { status: 500 }
        );
    }
}
