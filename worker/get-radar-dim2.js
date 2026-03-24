const fs = require('fs');
const UPNG = require('upng-js');

function formatTimestamp(date) {
  const sgt = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const y = sgt.getUTCFullYear();
  const m = String(sgt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(sgt.getUTCDate()).padStart(2, "0");
  const h = String(sgt.getUTCHours()).padStart(2, "0");
  const min = String(sgt.getUTCMinutes()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}`;
}

async function getRadar() {
  const base = new Date();
  base.setUTCMinutes(Math.floor(base.getUTCMinutes() / 5) * 5, 0, 0);

  for (let offset = 0; offset <= 30; offset += 5) {
    const ts = new Date(base.getTime() - offset * 60 * 1000);
    const stamp = formatTimestamp(ts);
    const url = `https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${stamp}0000dBR.dpsri.png`;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      const data = await res.arrayBuffer();
      if (data && data.byteLength > 0) {
        console.log("Success! File size:", data.byteLength);
        const buf = Buffer.from(data);
        const img = UPNG.decode(buf);
        console.log("Dimensions:", img.width, "x", img.height);
        fs.writeFileSync('radar-actual.png', buf);
        return;
      }
    } catch {}
  }
}
getRadar().catch(console.error);
