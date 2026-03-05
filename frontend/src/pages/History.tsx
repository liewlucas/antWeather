import { useState } from "react";
import { useApi } from "../hooks/useApi";
import RainBar from "../components/RainBar";

interface DailyRecord {
  date: string;
  captures: number;
  rainHours: number;
  peakMm: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  checkIntervalMin: number;
  totalCaptures: number;
  estimatedRainHours: number;
  rainDays: number;
  daily: DailyRecord[];
}

export default function History() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, loading, error } = useApi<MonthlySummary>(
    `/api/summary/monthly?year=${year}&month=${month}`
  );

  const maxPeak = data ? Math.max(...data.daily.map((d) => d.peakMm), 1) : 1;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">History</h2>

      <div className="flex gap-3 items-center">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Total Captures</p>
              <p className="text-2xl font-bold">{data.totalCaptures}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Est. Rain Hours</p>
              <p className="text-2xl font-bold">{data.estimatedRainHours}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Rain Days</p>
              <p className="text-2xl font-bold">{data.rainDays}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Daily Breakdown
            </h3>
            {data.daily.length === 0 ? (
              <p className="text-gray-500 text-sm">No rain data for this month.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Captures</th>
                    <th className="pb-2 pr-4">Rain Hours</th>
                    <th className="pb-2 pr-4">Peak (mm)</th>
                    <th className="pb-2 w-40">Relative</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.date} className="border-b border-gray-800">
                      <td className="py-2 pr-4">{d.date}</td>
                      <td className="py-2 pr-4">{d.captures}</td>
                      <td className="py-2 pr-4">{d.rainHours}</td>
                      <td className="py-2 pr-4">{d.peakMm}</td>
                      <td className="py-2">
                        <RainBar value={d.peakMm} max={maxPeak} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
