interface Props {
  status: "rain" | "dry" | "error" | "loading";
}

const styles: Record<string, string> = {
  rain: "bg-blue-500 text-white",
  dry: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  loading: "bg-gray-600 text-gray-300",
};

const labels: Record<string, string> = {
  rain: "Raining",
  dry: "Dry",
  error: "Error",
  loading: "Loading...",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
