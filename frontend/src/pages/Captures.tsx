import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { useApi } from "../hooks/useApi";

interface Capture {
  id: number;
  checked_at: string;
  max_mm: number;
  stations: string;
  radar_key: string;
  radar_bytes: number;
}

interface CapturesResponse {
  total: number;
  captures: Capture[];
}

interface DateEntry {
  date: string;
  count: number;
  peak_mm: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Captures() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [capturesTotal, setCapturesTotal] = useState(0);
  const [capturesLoading, setCapturesLoading] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: datesData, loading: datesLoading, error } = useApi<{ dates: DateEntry[] }>(
    "/api/captures/dates"
  );

  useEffect(() => {
    if (!selectedDate) return;
    setCapturesLoading(true);
    apiFetch<CapturesResponse>(`/api/captures?date=${selectedDate}&limit=200`)
      .then((res) => {
        setCaptures(res.captures);
        setCapturesTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setCapturesLoading(false));
  }, [selectedDate]);

  const stationCount = (json: string) => {
    try {
      return JSON.parse(json).length;
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-SG", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            &larr; All dates
          </button>
        )}
        <h2 className="text-xl font-bold">
          {selectedDate ? formatDate(selectedDate) : "Captures"}
        </h2>
      </div>

      {(datesLoading || capturesLoading) && (
        <p className="text-gray-500 text-sm">Loading...</p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {viewId !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-lg">
            <img
              src={`${API_BASE}/api/captures/${viewId}/image`}
              alt="Radar capture"
              className="w-full rounded"
            />
            <button
              onClick={() => setViewId(null)}
              className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!selectedDate && datesData && (
        <>
          <p className="text-gray-400 text-sm">
            {datesData.dates.length} date{datesData.dates.length !== 1 && "s"} with captures
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {datesData.dates.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className="bg-gray-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <p className="font-medium">{formatDate(d.date)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {d.count} capture{d.count !== 1 && "s"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Peak: {d.peak_mm} mm
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedDate && captures.length > 0 && (
        <>
          <p className="text-gray-400 text-sm">
            {capturesTotal} capture{capturesTotal !== 1 && "s"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {captures.map((c) => (
              <div
                key={c.id}
                onClick={() => setViewId(c.id)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <img
                  src={`${API_BASE}/api/captures/${c.id}/image`}
                  alt={`Capture ${c.id}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="p-3 space-y-1">
                  <p className="text-xs text-gray-400">
                    {new Date(c.checked_at).toLocaleString("en-SG", {
                      timeZone: "Asia/Singapore",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm">
                    {c.max_mm} mm &middot; {stationCount(c.stations)} station{stationCount(c.stations) !== 1 && "s"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedDate && !capturesLoading && captures.length === 0 && (
        <p className="text-gray-500 text-sm">No captures for this date.</p>
      )}
    </div>
  );
}
