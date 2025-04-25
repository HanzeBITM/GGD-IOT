import { PrismaClient } from '@prisma/client';

// Import types from your types file to ensure consistency
import { TemperatureReading } from '@/types/types';

// Global PrismaClient for development hot reloading
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Fetches temperature readings from the database
 * @param limit Number of readings to return (default: 100)
 * @param days Number of days to look back (default: 7)
 */
export async function getTemperatureReadings(limit = 100, days = 7): Promise<TemperatureReading[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const readings = await prisma.temperatureReading.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });

        return readings;
    } catch (error) {
        console.error('Error fetching temperature readings:', error);
        throw new Error('Failed to fetch temperature readings');
    }
}

/**
 * Creates a new temperature reading in the database
 */
export async function createTemperatureReading(
    data: { value: number; warning?: boolean }
): Promise<TemperatureReading> {
    try {
        return await prisma.temperatureReading.create({
            data: {
                value: data.value,
                warning: data.warning ?? false,
            },
        });
    } catch (error) {
        console.error('Error creating temperature reading:', error);
        throw new Error('Failed to create temperature reading');
    }
}

/**
 * Gets temperature statistics
 */
export async function getTemperatureStats(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const readings = await prisma.temperatureReading.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                },
            },
            select: {
                value: true,
            },
        });

        if (readings.length === 0) {
            return { min: 0, max: 0, avg: 0 };
        }

        const temperatures = readings.map(r => r.value);
        return {
            min: Math.min(...temperatures),
            max: Math.max(...temperatures),
            avg: temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length,
        };
    } catch (error) {
        console.error('Error fetching temperature statistics:', error);
        throw new Error('Failed to fetch temperature statistics');
    }
}
