import { NextResponse } from 'next/server';

// Configuration for the API - update with your Flask API address
const API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function GET() {
    try {
        const response = await fetch(`${API_URL}/settings/thresholds`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching threshold settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch threshold settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_URL}/settings/thresholds`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                errorData,
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating threshold settings:', error);
        return NextResponse.json(
            { error: 'Failed to update threshold settings' },
            { status: 500 }
        );
    }
}
