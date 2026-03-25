import type { Env } from "../config";
import { json } from "./router";
import { buildR2Key } from "../services/capture-svc";
import { expandPattern } from "../utils/file-naming";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function listCaptureDates(
  _req: Request,
  env: Env
): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT DATE(checked_at) AS date, COUNT(*) AS count, MAX(max_mm) AS peak_mm
     FROM captures WHERE is_raining = 1
     GROUP BY DATE(checked_at)
     ORDER BY date DESC`
  ).all<{ date: string; count: number; peak_mm: number }>();

  return json({ dates: rows.results });
}

export async function listCaptures(
  req: Request,
  env: Env
): Promise<Response> {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  if (date) {
    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        "SELECT * FROM captures WHERE is_raining = 1 AND DATE(checked_at) = ? ORDER BY checked_at DESC LIMIT ? OFFSET ?"
      )
        .bind(date, limit, offset)
        .all(),
      env.DB.prepare(
        "SELECT COUNT(*) as total FROM captures WHERE is_raining = 1 AND DATE(checked_at) = ?"
      )
        .bind(date)
        .first<{ total: number }>(),
    ]);
    return json({ total: countRow?.total ?? 0, captures: rows.results });
  }

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(
      "SELECT * FROM captures WHERE is_raining = 1 ORDER BY checked_at DESC LIMIT ? OFFSET ?"
    )
      .bind(limit, offset)
      .all(),
    env.DB.prepare(
      "SELECT COUNT(*) as total FROM captures WHERE is_raining = 1"
    ).first<{ total: number }>(),
  ]);

  return json({ total: countRow?.total ?? 0, captures: rows.results });
}

export async function getCaptureImage(
  _req: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const id = parseInt(params.id);
  const row = await env.DB.prepare(
    "SELECT radar_key FROM captures WHERE id = ?"
  )
    .bind(id)
    .first<{ radar_key: string }>();

  if (!row?.radar_key) {
    return json({ error: "Not found" }, 404);
  }

  const object = await env.CAPTURES.get(row.radar_key);
  if (!object) {
    return json({ error: "Image not found in storage" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "image/png",
      ...CORS_HEADERS,
    },
  });
}

export async function migrateCaptures(
  _req: Request,
  env: Env
): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT id, radar_key, checked_at FROM captures WHERE radar_key IS NOT NULL"
  ).all<{ id: number; radar_key: string; checked_at: string }>();

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows.results) {
    const parts = row.radar_key.split("/");
    // Already in year/month/day/ format (4+ parts like 2026/03/15/file.png)
    if (parts.length >= 4) {
      skipped++;
      continue;
    }

    // Current format: year/month/file.png -> year/month/day/file.png
    const ts = new Date(row.checked_at);
    const day = String(ts.getUTCDate()).padStart(2, "0");
    const newKey = `${parts[0]}/${parts[1]}/${day}/${parts.slice(2).join("/")}`;

    try {
      // Copy old object to new key
      const obj = await env.CAPTURES.get(row.radar_key);
      if (!obj) {
        errors.push(`ID ${row.id}: R2 object not found at ${row.radar_key}`);
        continue;
      }

      await env.CAPTURES.put(newKey, await obj.arrayBuffer(), {
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata,
      });

      // Update D1 to point to new key
      await env.DB.prepare("UPDATE captures SET radar_key = ? WHERE id = ?")
        .bind(newKey, row.id)
        .run();

      // Delete old object
      await env.CAPTURES.delete(row.radar_key);

      migrated++;
    } catch (err) {
      errors.push(`ID ${row.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return json({ migrated, skipped, errors, total: rows.results.length });
}
