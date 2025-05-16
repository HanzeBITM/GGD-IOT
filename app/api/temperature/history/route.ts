import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

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

// Type definition for temperature readings
type TemperatureReading = {
  temperature: number;
  warning: boolean;
  timestamp: string;
};

/**
 * GET handler for retrieving all temperature history data
 * Route: /api/temperature/history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Define temperature threshold for warnings (adjust as needed)
    const warningThreshold = 40.0;

    // Query all temperature readings, ordered by timestamp (newest first)
    const readings = await sql`
      SELECT
        temperature,
        timestamp
      FROM
        temperature_readings
      ORDER BY
        timestamp DESC
    `;

    // Process the data to match the expected format
    const formattedReadings: TemperatureReading[] = readings.map(reading => ({
      temperature: parseFloat(reading.temperature as string),
      warning: parseFloat(reading.temperature as string) >= warningThreshold,
      timestamp: new Date(reading.timestamp).toISOString()
    }));

    // Return the data as JSON
    return NextResponse.json(formattedReadings);
  } catch (error) {
    console.error("Error fetching temperature history:", error);

    // Return an appropriate error response
    return NextResponse.json(
      { error: "Failed to retrieve temperature history data" },
      { status: 500 }
    );
  }
}
