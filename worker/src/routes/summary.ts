import type { Env } from "../config";
import { json } from "./router";

export async function getMonthlySummary(
  req: Request,
  env: Env
): Promise<Response> {
  const url = new URL(req.url);
  const now = new Date();
  const year = parseInt(url.searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(url.searchParams.get("month") || String(now.getMonth() + 1));

  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, "0");
  const endDate = `${nextYear}-${nextMonthStr}-01`;

  const rows = await env.DB.prepare(
    `SELECT
       DATE(checked_at) AS day,
       COUNT(*) AS captures,
       MAX(max_mm) AS peak_mm
     FROM captures
     WHERE is_raining = 1
       AND checked_at >= ?
       AND checked_at < ?
     GROUP BY DATE(checked_at)
     ORDER BY day`
  )
    .bind(startDate, endDate)
    .all<{ day: string; captures: number; peak_mm: number }>();

  let intervalMin = 5;
  try {
    const setting = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'check_interval_min'"
    ).first<{ value: string }>();
    if (setting?.value) intervalMin = parseInt(setting.value);
  } catch {
    // default
  }

  const daily = rows.results.map((r) => ({
    date: r.day,
    captures: r.captures,
    rainHours: parseFloat(((r.captures * intervalMin) / 60).toFixed(2)),
    peakMm: r.peak_mm,
  }));

  const totalCaptures = daily.reduce((sum, d) => sum + d.captures, 0);
  const estimatedRainHours = parseFloat(
    ((totalCaptures * intervalMin) / 60).toFixed(2)
  );

  return json({
    year,
    month,
    checkIntervalMin: intervalMin,
    totalCaptures,
    estimatedRainHours,
    rainDays: daily.length,
    daily,
  });
}
