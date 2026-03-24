const fs = require('fs');
const UPNG = require('upng-js');

const radar = fs.readFileSync('radar.png');
try {
  const img = UPNG.decode(radar);
  console.log("Radar dimensions:", img.width, "x", img.height);
} catch (e) {
  console.error("Not a valid PNG or empty");
}
