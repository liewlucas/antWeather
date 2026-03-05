import type { Env } from "../config";
import { json } from "./router";

export async function getAlertLog(
  req: Request,
  env: Env
): Promise<Response> {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const rows = await env.DB.prepare(
    "SELECT * FROM alert_logs ORDER BY sent_at DESC LIMIT ?"
  )
    .bind(limit)
    .all();

  return json(rows.results);
}
