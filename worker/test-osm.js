const fs = require('fs');
const UPNG = require('upng-js');

function lon2px(lon, zoom) {
  return ((lon + 180) / 360) * 256 * Math.pow(2, zoom);
}
function lat2px(lat, zoom) {
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return y * 256 * Math.pow(2, zoom);
}

async function run() {
  const newLonMin = 103.8;
  const newLonMax = 104.0;
  const newLatMax = 1.45;
  const newLatMin = 1.30;
  const zoom = 12;

  const pxLeft = Math.floor(lon2px(newLonMin, zoom));
  const pxRight = Math.floor(lon2px(newLonMax, zoom));
  const pxTop = Math.floor(lat2px(newLatMax, zoom));
  const pxBottom = Math.floor(lat2px(newLatMin, zoom));

  const osmWidth = pxRight - pxLeft;
  const osmHeight = pxBottom - pxTop;
  const osmRgba = new Uint8Array(osmWidth * osmHeight * 4);

  const minTX = Math.floor(pxLeft / 256);
  const maxTX = Math.floor(pxRight / 256);
  const minTY = Math.floor(pxTop / 256);
  const maxTY = Math.floor(pxBottom / 256);
  
  console.log(`Fetching tiles from X:${minTX}-${maxTX}, Y:${minTY}-${maxTY}`);

  for(let tx = minTX; tx <= maxTX; tx++) {
    for(let ty = minTY; ty <= maxTY; ty++) {
      const url = `https://a.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      const res = await fetch(url, { headers: { "User-Agent": "AntWeather/1.0" } });
      if(!res.ok) continue;
      const buf = await res.arrayBuffer();
      const img = UPNG.decode(buf);
      const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
      
      for(let y=0; y<256; y++) {
        for(let x=0; x<256; x++) {
          const destX = (tx * 256 + x) - pxLeft;
          const destY = (ty * 256 + y) - pxTop;
          if(destX >= 0 && destX < osmWidth && destY >= 0 && destY < osmHeight) {
            const srcIdx = (y * 256 + x) * 4;
            const destIdx = (destY * osmWidth + destX) * 4;
            osmRgba[destIdx] = rgba[srcIdx];
            osmRgba[destIdx+1] = rgba[srcIdx+1];
            osmRgba[destIdx+2] = rgba[srcIdx+2];
            osmRgba[destIdx+3] = rgba[srcIdx+3];
          }
        }
      }
    }
  }

  // resize
  const finalW = 240;
  const finalH = 240;
  const finalRgba = new Uint8Array(finalW * finalH * 4);
  for(let y=0; y<finalH; y++) {
    for(let x=0; x<finalW; x++) {
      const srcX = Math.floor(x * osmWidth / finalW);
      const srcY = Math.floor(y * osmHeight / finalH);
      const srcIdx = (srcY * osmWidth + srcX) * 4;
      const dstIdx = (y * finalW + x) * 4;
      finalRgba[dstIdx] = osmRgba[srcIdx];
      finalRgba[dstIdx+1] = osmRgba[srcIdx+1];
      finalRgba[dstIdx+2] = osmRgba[srcIdx+2];
      finalRgba[dstIdx+3] = 255;
    }
  }

  const out = UPNG.encode([finalRgba.buffer], finalW, finalH, 256);
  fs.writeFileSync('test-map.png', Buffer.from(out));
  console.log("Success! osmWidth:", osmWidth, "osmHeight:", osmHeight);
}
run().catch(console.error);
