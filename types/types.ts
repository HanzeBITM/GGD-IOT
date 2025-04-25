// This should match your PostgreSQL and Prisma schema structure
export interface TemperatureReading {
  temperature: number;
  // value?: number;
  warning: boolean;
  // Using string type for ISO timestamp with timezone info
  // This allows handling of TIMESTAMP WITH TIME ZONE from PostgreSQL
  timestamp: string;
}

// Helper function to create timezone-aware timestamp string
export function createTimestampWithTimezone(): string {
  return new Date().toISOString();
}

// Function to format a timestamp for display with the correct timezone
export function formatTimestamp(timestamp: string, locale: string = 'nl-NL'): string {
  // Explicitly use Europe/Amsterdam timezone for Dutch time (UTC+2 during summer)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Amsterdam',
    timeZoneName: 'short'
  }).format(new Date(timestamp));
}

// Additional types can be added as needed
export interface TemperatureStats {
  min: number;
  max: number;
  avg: number;
}
