const fs = require('fs');
const https = require('https');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function run() {
  const base = await download('https://www.weather.gov.sg/wp-content/themes/wsg/assets/img/map/base-853.png');
  // Find latest radar
  const ts = new Date(Date.now() - 5*60000);
  const m = Math.floor(ts.getUTCMinutes() / 5) * 5;
  ts.setUTCMinutes(m, 0, 0);
  const sgt = new Date(ts.getTime() + 8*3600*1000);
  const stamp = sgt.getUTCFullYear() + 
    String(sgt.getUTCMonth()+1).padStart(2,'0') + 
    String(sgt.getUTCDate()).padStart(2,'0') + 
    String(sgt.getUTCHours()).padStart(2,'0') + 
    String(sgt.getUTCMinutes()).padStart(2,'0');

  const radar = await download(`https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${stamp}0000dBR.dpsri.png`);
  console.log("Base length:", base.length);
  console.log("Radar length:", radar.length);
  fs.writeFileSync('base.png', base);
  fs.writeFileSync('radar.png', radar);
}
run().catch(console.error);
