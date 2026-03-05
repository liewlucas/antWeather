interface Props {
  value: number;
  max: number;
}

export default function RainBar({ value, max }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-700 rounded h-4">
      <div
        className="bg-blue-500 h-4 rounded transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
