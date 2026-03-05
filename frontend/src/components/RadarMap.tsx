import { useEffect, useState, useMemo } from "react";
import {
    MapContainer,
    TileLayer,
    ImageOverlay,
    CircleMarker,
    Marker,
    Polygon,
    Tooltip,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";

// Custom red pin icon for the center marker
const centerIcon = L.divIcon({
    html: '<div style="width:14px;height:14px;background:#ef4444;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(239,68,68,0.6)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: '',
});

interface Station {
    stationId: string;
    name: string;
    lat: number;
    lng: number;
    rainfallMm: number;
    distanceKm: number;
    inPolygon: boolean;
}

interface RadarMapProps {
    stations: Station[];
}

// NEA radar image covers this bounding box over Singapore
const RADAR_BOUNDS: LatLngBoundsExpression = [
    [1.156, 103.565],
    [1.475, 104.13],
];

// Monitored region polygon from wrangler.toml
const REGION_POLYGON: LatLngTuple[] = [
    [1.342303, 103.974133],
    [1.332562, 103.997088],
    [1.364491, 104.009104],
    [1.370897, 103.985884],
];

const CENTER: LatLngTuple = [1.354829, 103.990242];

function buildRadarUrl(): string {
    const now = new Date();
    // Round down to nearest 5 minutes
    const mins = Math.floor(now.getUTCMinutes() / 5) * 5;
    const d = new Date(now);
    d.setUTCMinutes(mins, 0, 0);

    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");

    return `https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${y}${m}${day}${h}${min}000000dBR.dpsri.png`;
}

export default function RadarMap({ stations }: RadarMapProps) {
    const [radarUrl, setRadarUrl] = useState(buildRadarUrl);

    // Refresh radar image every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            setRadarUrl(buildRadarUrl());
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const stationMarkers = useMemo(
        () =>
            stations.map((s) => {
                const isRaining = s.rainfallMm > 0;
                return (
                    <CircleMarker
                        key={s.stationId}
                        center={[s.lat, s.lng]}
                        radius={7}
                        pathOptions={{
                            color: isRaining ? "#3b82f6" : "#6b7280",
                            fillColor: isRaining ? "#60a5fa" : "#9ca3af",
                            fillOpacity: 0.85,
                            weight: 2,
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -6]}>
                            <span className="text-xs font-medium">
                                {s.name}
                                <br />
                                {s.rainfallMm} mm &middot; {s.distanceKm.toFixed(1)} km
                            </span>
                        </Tooltip>
                    </CircleMarker>
                );
            }),
        [stations]
    );

    const LEGEND_ITEMS = [
        { color: "#40ff00", label: "Light < 5" },
        { color: "#ffff00", label: "Mod 5–20" },
        { color: "#ff8c00", label: "Heavy 20–50" },
        { color: "#ff0000", label: "V.Heavy > 50" },
    ];

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 relative" style={{ height: 420 }}>
            <MapContainer
                center={CENTER}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
                attributionControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ImageOverlay url={radarUrl} bounds={RADAR_BOUNDS} opacity={0.55} />

                <Polygon
                    positions={REGION_POLYGON}
                    pathOptions={{
                        color: "#f59e0b",
                        weight: 2,
                        dashArray: "6 4",
                        fillColor: "#f59e0b",
                        fillOpacity: 0.08,
                    }}
                />

                {stationMarkers}

                <Marker position={CENTER} icon={centerIcon}>
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                        <span className="text-xs font-semibold">📍 Site Location</span>
                    </Tooltip>
                </Marker>
            </MapContainer>

            {/* Rain intensity legend */}
            <div
                className="absolute bottom-6 right-3 z-[1000] rounded-lg px-3 py-2 text-xs shadow-lg"
                style={{ background: "rgba(17, 24, 39, 0.88)", backdropFilter: "blur(4px)" }}
            >
                <p className="font-semibold text-gray-300 mb-1.5">Rainfall (mm/hr)</p>
                {LEGEND_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 py-0.5">
                        <span
                            className="inline-block w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-300">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
