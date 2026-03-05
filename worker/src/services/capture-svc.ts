import type { Env } from "../config";
import { expandPattern } from "../utils/file-naming";
import type { CheckResult } from "./rain-detector";

export interface CaptureRecord {
  captureId: number;
  r2Key: string;
}

export function buildR2Key(pattern: string, timestamp: Date): string {
  const expanded = expandPattern(pattern, timestamp);
  const year = String(timestamp.getUTCFullYear());
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${expanded}_radar.png`;
}

export async function saveCapture(
  env: Env,
  result: CheckResult
): Promise<CaptureRecord | null> {
  if (!result.radarImage) return null;

  let pattern = env.CAPTURE_FILE_PATTERN;
  try {
    const row = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'capture_file_pattern'"
    )
      .first<{ value: string }>();
    if (row?.value) pattern = row.value;
  } catch {
    // fall back to env var
  }

  const ts = result.radarTimestamp
    ? new Date(result.radarTimestamp)
    : new Date();
  const r2Key = buildR2Key(pattern, ts);

  await env.CAPTURES.put(r2Key, result.radarImage, {
    httpMetadata: { contentType: "image/png" },
    customMetadata: {
      maxMm: String(result.maxRainfallMm),
      stations: String(result.rainingStations.length),
    },
  });

  const dbResult = await env.DB.prepare(
    `INSERT INTO captures (checked_at, is_raining, max_mm, stations, radar_key, radar_bytes, alert_sent)
     VALUES (?, 1, ?, ?, ?, ?, 0)`
  )
    .bind(
      new Date().toISOString(),
      result.maxRainfallMm,
      JSON.stringify(result.rainingStations),
      r2Key,
      result.radarImage.byteLength
    )
    .run();

  return {
    captureId: dbResult.meta.last_row_id as number,
    r2Key,
  };
}
