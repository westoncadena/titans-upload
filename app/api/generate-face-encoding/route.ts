import { NextResponse } from 'next/server';

// Railway service URL and API key from environment variables
const RAILWAY_SERVICE_URL = process.env.RAILWAY_FACE_API_URL!;
const RAILWAY_API_KEY = process.env.RAILWAY_FACE_API_KEY;

export async function POST(request: Request) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        // Prepare headers for the Railway service request
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if API key is configured
        if (RAILWAY_API_KEY) {
            headers['Authorization'] = `Bearer ${RAILWAY_API_KEY}`;
        }

        // Call your Railway-hosted face recognition service
        const response = await fetch(`${RAILWAY_SERVICE_URL}/generate-encoding`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
            // Try to get detailed error message from response
            const errorData = await response.json().catch(() => ({}));
            console.error('Railway service error:', errorData);

            return NextResponse.json(
                { error: errorData.detail || `Face recognition service error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({ encoding: data.encoding });
    } catch (error: any) {
        console.error('Error generating face encoding:', error);

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 