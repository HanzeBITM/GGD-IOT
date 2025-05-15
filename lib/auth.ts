import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Secret for JWT verification
const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long'
);

export type UserSession = {
    id: string | number;
    username: string;
};

// Get current user from auth token (for server components)
export async function getCurrentUser(): Promise<UserSession | null> {
    try {
        const cookieStore = cookies();
        const token = (await cookieStore).get('auth-token')?.value;

        if (!token) return null;

        const { payload } = await jwtVerify(token, secretKey);

        return {
            id: payload.id as string | number,
            username: payload.username as string
        };
    } catch (error) {
        return null;
    }
}
