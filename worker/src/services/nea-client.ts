export interface StationReading {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  rainfallMm: number;
}

export interface RainfallResult {
  stations: StationReading[];
  timestamp: string;
  error?: string;
}

export interface RadarResult {
  imageBytes: ArrayBuffer | null;
  timestamp: string | null;
}

export async function fetchRainfall(): Promise<RainfallResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      "https://api.data.gov.sg/v1/environment/rainfall",
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return { stations: [], timestamp: "", error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      metadata: { stations: { id: string; name: string; location: { latitude: number; longitude: number } }[] };
      items: { timestamp: string; readings: { station_id: string; value: number }[] }[];
    };

    const stationMeta = data.metadata.stations;
    const item = data.items?.[0];
    if (!item) {
      return { stations: [], timestamp: "", error: "No items in response" };
    }

    const readingMap = new Map(
      item.readings.map((r) => [r.station_id, r.value])
    );

    const stations: StationReading[] = stationMeta.map((s) => ({
      stationId: s.id,
      name: s.name,
      lat: s.location.latitude,
      lng: s.location.longitude,
      rainfallMm: readingMap.get(s.id) ?? 0,
    }));

    return { stations, timestamp: item.timestamp };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("fetchRainfall failed:", message);
    return { stations: [], timestamp: "", error: message };
  }
}

function roundDown5Min(date: Date): Date {
  const d = new Date(date);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0);
  return d;
}

function formatRadarTimestamp(date: Date): string {
  // NEA filenames are in Singapore Time (SGT, UTC+8)
  const sgt = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const y = sgt.getUTCFullYear();
  const m = String(sgt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(sgt.getUTCDate()).padStart(2, "0");
  const h = String(sgt.getUTCHours()).padStart(2, "0");
  const min = String(sgt.getUTCMinutes()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}`;
}

export async function fetchRadarImage(): Promise<RadarResult> {
  const base = roundDown5Min(new Date());

  for (let offset = 0; offset <= 30; offset += 5) {
    const ts = new Date(base.getTime() - offset * 60 * 1000);
    const stamp = formatRadarTimestamp(ts);
    const url = `https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${stamp}0000dBR.dpsri.png`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const contentLength = res.headers.get("content-length");
      // Allow small/empty radar images so we can always apply the map overlay
      const bytes = await res.arrayBuffer();

      return { imageBytes: bytes, timestamp: ts.toISOString() };
    } catch {
      continue;
    }
  }

  console.warn("fetchRadarImage: no valid image found in last 30 minutes");
  return { imageBytes: null, timestamp: null };
}
