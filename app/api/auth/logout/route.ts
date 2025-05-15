import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type LogoutResponse = {
    success: boolean;
    message: string;
};

export async function POST(): Promise<NextResponse<LogoutResponse>> {
    try {
        // Get cookie store
        const cookieStore = cookies();

        // Delete auth token cookie
        cookieStore.delete('auth-token', {
            path: '/', // Must match the path used when setting
        });

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);

        return NextResponse.json({
            success: false,
            message: 'Logout failed'
        }, { status: 500 });
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}
