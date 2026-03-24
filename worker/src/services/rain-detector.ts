import type { Env } from "../config";
import { parseRegionConfig, type RegionConfig } from "../config";
import { haversine, pointInPolygon } from "../utils/geo";
import {
  fetchRainfall,
  fetchRadarImage,
  type StationReading,
} from "./nea-client";
import { overlayRadarWithMap } from "../utils/image";

export interface NearbyStation extends StationReading {
  distanceKm: number;
  inPolygon: boolean;
}

export interface CheckResult {
  isRaining: boolean;
  maxRainfallMm: number;
  nearbyStations: NearbyStation[];
  rainingStations: NearbyStation[];
  radarImage: ArrayBuffer | null;
  radarTimestamp: string | null;
  apiTimestamp: string;
}

export function filterNearbyStations(
  stations: StationReading[],
  config: RegionConfig
): NearbyStation[] {
  return stations
    .map((s) => {
      const distanceKm = haversine(
        config.center.lat,
        config.center.lng,
        s.lat,
        s.lng
      );
      const inPolygon = pointInPolygon(s.lat, s.lng, config.polygon);
      return { ...s, distanceKm, inPolygon };
    })
    .filter((s) => s.inPolygon || s.distanceKm <= config.radiusKm);
}

export async function fullCheck(env: Env): Promise<CheckResult> {
  const config = parseRegionConfig(env);

  const [rainfallResult, radarResult] = await Promise.all([
    fetchRainfall(),
    fetchRadarImage(),
  ]);

  const nearby = filterNearbyStations(rainfallResult.stations, config);
  const raining = nearby.filter((s) => s.rainfallMm > config.minRainfallMm);
  const maxMm = raining.length > 0
    ? Math.max(...raining.map((s) => s.rainfallMm))
    : 0;

  const sizeThreshold = parseInt(env.RADAR_CLEAR_SIZE_THRESHOLD) || 15000;

  // Decide rain status based on original raw image size BEFORE applying overlay
  const radarRain =
    radarResult.imageBytes !== null &&
    radarResult.imageBytes.byteLength > sizeThreshold;

  let finalRadarImage = radarResult.imageBytes;

  // Always apply map overlay so the user receives a map image on manual check
  if (finalRadarImage) {
    try {
      finalRadarImage = await overlayRadarWithMap(finalRadarImage, config.center);
    } catch (e) {
      console.error("overlayRadarWithMap failed:", e);
    }
  }

  return {
    isRaining: raining.length > 0 || radarRain,
    maxRainfallMm: maxMm,
    nearbyStations: nearby,
    rainingStations: raining,
    radarImage: finalRadarImage,
    radarTimestamp: radarResult.timestamp,
    apiTimestamp: rainfallResult.timestamp,
  };
}
