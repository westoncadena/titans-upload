import { NextResponse } from 'next/server';

// Railway service URL and API key from environment variables
const RAILWAY_SERVICE_URL = process.env.RAILWAY_FACE_API_URL!;
const RAILWAY_API_KEY = process.env.RAILWAY_FACE_API_KEY;

export async function POST(request: Request) {
    try {
        // Check if the required environment variables are set
        if (!RAILWAY_SERVICE_URL) {
            console.error('RAILWAY_FACE_API_URL environment variable is not defined');
            return NextResponse.json(
                { error: 'Face recognition service is not properly configured' },
                { status: 500 }
            );
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        console.log(`Calling Railway API at: ${RAILWAY_SERVICE_URL}/generate-encoding`);

        // Prepare headers for the Railway service request
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if API key is configured
        if (RAILWAY_API_KEY) {
            headers['Authorization'] = `Bearer ${RAILWAY_API_KEY}`;
        } else {
            console.warn('RAILWAY_API_KEY is not set');
        }

        // Call your Railway-hosted face recognition service with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            const response = await fetch(`${RAILWAY_SERVICE_URL}/generate-encoding`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ imageUrl }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Log response status for debugging
            console.log(`Railway API response status: ${response.status}`);

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
            console.log('Successfully received face encoding');

            return NextResponse.json({ encoding: data.encoding });
        } catch (fetchError: any) {
            console.error('Fetch error:', fetchError.message);

            if (fetchError.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Request timeout - face recognition service took too long to respond' },
                    { status: 504 }
                );
            }

            throw fetchError;
        }
    } catch (error: any) {
        console.error('Error generating face encoding:', error);

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 