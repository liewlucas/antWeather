interface Station {
  stationId: string;
  name: string;
  rainfallMm: number;
  distanceKm: number;
  inPolygon: boolean;
}

interface Props {
  stations: Station[];
}

export default function StationTable({ stations }: Props) {
  if (stations.length === 0) {
    return <p className="text-gray-500 text-sm">No nearby stations found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="pb-2 pr-4">Station</th>
            <th className="pb-2 pr-4">Rainfall (mm)</th>
            <th className="pb-2 pr-4">Distance (km)</th>
            <th className="pb-2">In Polygon</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s) => (
            <tr key={s.stationId} className="border-b border-gray-800">
              <td className="py-2 pr-4">{s.name}</td>
              <td
                className={`py-2 pr-4 ${
                  s.rainfallMm > 0 ? "text-blue-400 font-semibold" : ""
                }`}
              >
                {s.rainfallMm}
              </td>
              <td className="py-2 pr-4">{s.distanceKm.toFixed(1)}</td>
              <td className="py-2">{s.inPolygon ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
