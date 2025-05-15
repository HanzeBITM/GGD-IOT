import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import postgres from 'postgres';
import { z } from 'zod';
import { cookies } from 'next/headers';

// Database configuration
const PGHOST = "ep-shy-glitter-a2hoqg38-pooler.eu-central-1.aws.neon.tech";
const PGDATABASE = "neondb";
const PGUSER = "neondb_owner";
const PGPASSWORD = "npg_qYvBVlm4ZI6k";
const DB_PORT = 5432;

// Create SQL connection
const sql = postgres({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: DB_PORT,
    ssl: true, // Required for Neon and most cloud PostgreSQL providers
    max: 10, // Connection pool size
});

// Validate user input
const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

// Define types
type LoginResponse = {
    message?: string;
    user?: {
        id: number;
        username: string;
    };
    authenticated?: boolean;
    error?: string;
};

// How long the session cookie should last (1 day)
const SESSION_DURATION = 60 * 60 * 24;

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({
                error: result.error.errors[0].message,
                authenticated: false
            }, { status: 400 });
        }

        const { username, password } = result.data;

        // Find user by username
        const users = await sql`
            SELECT id, username, password FROM users
            WHERE username = ${username}
        `;

        if (users.length === 0) {
            return NextResponse.json({
                error: "Invalid credentials",
                authenticated: false
            }, { status: 401 });
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json({
                error: "Invalid credentials",
                authenticated: false
            }, { status: 401 });
        }

        // Update last login timestamp
        await sql`
            UPDATE users
            SET last_login = NOW()
            WHERE id = ${user.id}
        `;

        // Set session cookie for server-side authentication
        const cookieStore = cookies();
        (await cookieStore).set('auth-token', `${user.id}:${user.username}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_DURATION,
            path: '/',
        });

        // Return success response with user data
        return NextResponse.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username
            },
            authenticated: true
        });

    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json({
            error: "Authentication failed",
            authenticated: false
        }, { status: 500 });
    }
}
