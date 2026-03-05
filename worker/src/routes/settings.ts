import type { Env } from "../config";
import { json } from "./router";

const ENV_DEFAULTS: Record<string, (env: Env) => string> = {
  region_center_lat: (e) => e.REGION_CENTER_LAT,
  region_center_lng: (e) => e.REGION_CENTER_LNG,
  region_polygon: (e) => e.REGION_POLYGON,
  station_radius_km: (e) => e.STATION_RADIUS_KM,
  min_rainfall_mm: (e) => e.MIN_RAINFALL_MM,
  capture_file_pattern: (e) => e.CAPTURE_FILE_PATTERN,
  alert_cooldown_min: (e) => e.ALERT_COOLDOWN_MIN,
  radar_clear_size_threshold: (e) => e.RADAR_CLEAR_SIZE_THRESHOLD,
};

export async function getSettings(
  _req: Request,
  env: Env
): Promise<Response> {
  const defaults: Record<string, string> = {};
  for (const [key, getter] of Object.entries(ENV_DEFAULTS)) {
    defaults[key] = getter(env);
  }

  const rows = await env.DB.prepare("SELECT * FROM settings").all<{
    key: string;
    value: string;
  }>();

  for (const row of rows.results) {
    defaults[row.key] = row.value;
  }

  return json(defaults);
}

export async function putSettings(
  req: Request,
  env: Env
): Promise<Response> {
  const body = (await req.json()) as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    )
      .bind(key, value)
      .run();
  }

  return getSettings(req, env);
}
