import type { Env } from "../config";
import { json } from "./router";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function listCaptures(
  req: Request,
  env: Env
): Promise<Response> {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

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
