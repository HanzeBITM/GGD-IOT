import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import postgres from 'postgres';
import { z } from 'zod';

// Database configuration - match your Python settings
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
const registerSchema = z.object({
    username: z.string().min(1, "Username is required").max(50),
    email: z.string().email("Please enter a valid email address").max(100),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// Define types
type RegisterResponse = {
    message?: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    error?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({
                error: result.error.errors[0].message
            }, { status: 400 });
        }

        const { username, email, password } = result.data;

        // Check if user already exists
        const existingUsers = await sql`
      SELECT * FROM users WHERE username = ${username} OR email = ${email}
    `;

        if (existingUsers.length > 0) {
            // Determine which field caused the conflict
            const conflictField = existingUsers[0].username === username ? 'username' : 'email';
            return NextResponse.json({
                error: `${conflictField === 'username' ? 'Username' : 'Email'} already exists`
            }, { status: 409 });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await hash(password, saltRounds);

        // Insert new user
        const newUsers = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email, created_at
    `;

        if (newUsers.length === 0) {
            throw new Error("Failed to create user");
        }

        const newUser = newUsers[0];

        // Return success response
        return NextResponse.json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);

        // Handle specific database errors
        if (error instanceof Error) {
            // Check for PostgreSQL error codes if available in the error message
            if (error.message.includes('duplicate key')) {
                return NextResponse.json({
                    error: "Username or email already exists"
                }, { status: 409 });
            }
        }

        // Generic error
        return NextResponse.json({
            error: "Registration failed"
        }, { status: 500 });
    }
}
