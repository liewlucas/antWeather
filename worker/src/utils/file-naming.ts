function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function expandPattern(pattern: string, timestamp: Date): string {
  const year = String(timestamp.getUTCFullYear());
  const month = pad(timestamp.getUTCMonth() + 1);
  const day = pad(timestamp.getUTCDate());
  const hour = pad(timestamp.getUTCHours());
  const minute = pad(timestamp.getUTCMinutes());
  const second = pad(timestamp.getUTCSeconds());

  return pattern
    .replace(/\{datetime\}/g, `${year}${month}${day}_${hour}${minute}${second}`)
    .replace(/\{date\}/g, `${year}${month}${day}`)
    .replace(/\{time\}/g, `${hour}${minute}${second}`)
    .replace(/\{year\}/g, year)
    .replace(/\{month\}/g, month)
    .replace(/\{day\}/g, day)
    .replace(/\{hour\}/g, hour)
    .replace(/\{minute\}/g, minute)
    .replace(/\{second\}/g, second);
}
