const fs = require('fs');
const https = require('https');
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
      const data = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode !== 200) return resolve(null);
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', resolve);
      });
      if (data && data.length > 1000) {
        console.log("Success! File size:", data.length);
        const img = UPNG.decode(data);
        console.log("Dimensions:", img.width, "x", img.height);
        fs.writeFileSync('radar-good.png', data);
        return;
      }
    } catch {}
  }
}
getRadar().catch(console.error);
