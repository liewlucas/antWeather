export interface Env {
  DB: D1Database;
  CAPTURES: R2Bucket;
  REGION_CENTER_LAT: string;
  REGION_CENTER_LNG: string;
  REGION_POLYGON: string;
  STATION_RADIUS_KM: string;
  MIN_RAINFALL_MM: string;
  CAPTURE_FILE_PATTERN: string;
  ALERT_COOLDOWN_MIN: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_BOT_USERNAME?: string;
  GEMINI_API_KEY?: string;
  RADAR_CLEAR_SIZE_THRESHOLD: string;
}

export interface RegionConfig {
  center: { lat: number; lng: number };
  polygon: [number, number][];
  radiusKm: number;
  minRainfallMm: number;
}

export function parseRegionConfig(env: Env): RegionConfig {
  const polygon = env.REGION_POLYGON.split(";").map((pair) => {
    const [lat, lng] = pair.split(",").map(Number);
    return [lat, lng] as [number, number];
  });

  return {
    center: {
      lat: parseFloat(env.REGION_CENTER_LAT),
      lng: parseFloat(env.REGION_CENTER_LNG),
    },
    polygon,
    radiusKm: parseFloat(env.STATION_RADIUS_KM),
    minRainfallMm: parseFloat(env.MIN_RAINFALL_MM),
  };
}
