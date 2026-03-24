import UPNG from "upng-js";

function getOsmPixelCoords(lat: number, lon: number, zoom: number) {
    const x = ((lon + 180) / 360) * 256 * Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    const py = y * 256 * Math.pow(2, zoom);
    return { x, y: py };
}

function px2lon(x: number, zoom: number): number {
    return (x / (256 * Math.pow(2, zoom))) * 360 - 180;
}

function px2lat(y: number, zoom: number): number {
    const n = Math.PI - (2 * Math.PI * y) / (256 * Math.pow(2, zoom));
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export async function overlayRadarWithMap(
    radarBuffer: ArrayBuffer,
    center: { lat: number; lng: number }
): Promise<ArrayBuffer> {
    const radarImg = UPNG.decode(radarBuffer);
    const width = radarImg.width;
    const height = radarImg.height;

    const ZOOM = 13;
    const cropSize = 240;

    // 1. Determine bounding box for the map center
    const centerPx = getOsmPixelCoords(center.lat, center.lng, ZOOM);
    const pxLeft = Math.floor(centerPx.x - cropSize / 2);
    const pxTop = Math.floor(centerPx.y - cropSize / 2);
    const pxRight = pxLeft + cropSize;
    const pxBottom = pxTop + cropSize;

    // Pre-allocate map layer and fill with opaque light gray fallback
    const resultRgba = new Uint8Array(cropSize * cropSize * 4);
    for (let i = 0; i < resultRgba.length; i += 4) {
        resultRgba[i] = 240;
        resultRgba[i + 1] = 240;
        resultRgba[i + 2] = 240;
        resultRgba[i + 3] = 255;
    }

    // 2. Fetch OSM tiles covering this 240x240 box
    const minTX = Math.floor(pxLeft / 256);
    const maxTX = Math.floor((pxRight - 1) / 256);
    const minTY = Math.floor(pxTop / 256);
    const maxTY = Math.floor((pxBottom - 1) / 256);

    const tilePromises = [];
    for (let tx = minTX; tx <= maxTX; tx++) {
        for (let ty = minTY; ty <= maxTY; ty++) {
            tilePromises.push(
                (async () => {
                    try {
                        const s = ["a", "b", "c"][(tx + ty) % 3];
                        const url = `https://${s}.tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`;
                        const reqUrl = new Request(url, {
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Accept": "image/png"
                            },
                        });
                        const res = await fetch(reqUrl);
                        if (res.ok) {
                            const buf = await res.arrayBuffer();
                            const img = UPNG.decode(buf);
                            const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
                            // Draw tile pixels into the 240x240 base map
                            for (let y = 0; y < 256; y++) {
                                const globalY = ty * 256 + y;
                                const destY = globalY - pxTop;
                                if (destY >= 0 && destY < cropSize) {
                                    for (let x = 0; x < 256; x++) {
                                        const globalX = tx * 256 + x;
                                        const destX = globalX - pxLeft;
                                        if (destX >= 0 && destX < cropSize) {
                                            const srcIdx = (y * 256 + x) * 4;
                                            const destIdx = (destY * cropSize + destX) * 4;
                                            resultRgba[destIdx] = rgba[srcIdx];
                                            resultRgba[destIdx + 1] = rgba[srcIdx + 1];
                                            resultRgba[destIdx + 2] = rgba[srcIdx + 2];
                                            resultRgba[destIdx + 3] = 255;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed tile ${tx}/${ty}:`, e);
                    }
                })()
            );
        }
    }
    await Promise.allSettled(tilePromises);

    // 3. Reverse wrap radar image pixels exactly onto our 240x240 map!
    const MIN_LON = 103.565;
    const MAX_LON = 104.131;
    const MIN_LAT = 1.156;
    const MAX_LAT = 1.4895;

    const radarRgba = new Uint8Array(UPNG.toRGBA8(radarImg)[0]);

    for (let cy = 0; cy < cropSize; cy++) {
        for (let cx = 0; cx < cropSize; cx++) {
            const globalX = pxLeft + cx;
            const globalY = pxTop + cy;
            const lon = px2lon(globalX, ZOOM);
            const lat = px2lat(globalY, ZOOM);

            const radX = Math.floor(((lon - MIN_LON) / (MAX_LON - MIN_LON)) * width);
            const radY = Math.floor(((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * height);

            if (radX >= 0 && radX < width && radY >= 0 && radY < height) {
                const radIdx = (radY * width + radX) * 4;
                const alpha = radarRgba[radIdx + 3];
                if (alpha > 0) {
                    const resIdx = (cy * cropSize + cx) * 4;
                    const aF = alpha / 255;
                    resultRgba[resIdx] = radarRgba[radIdx] * aF + resultRgba[resIdx] * (1 - aF);
                    resultRgba[resIdx + 1] = radarRgba[radIdx + 1] * aF + resultRgba[resIdx + 1] * (1 - aF);
                    resultRgba[resIdx + 2] = radarRgba[radIdx + 2] * aF + resultRgba[resIdx + 2] * (1 - aF);
                }
            }
        }
    }

    // 4. Draw Center Marker (4x4 red square with 1px white border)
    const mx = Math.floor(cropSize / 2);
    const my = Math.floor(cropSize / 2);
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const pxC = mx + dx;
            const pyC = my + dy;
            if (pxC >= 0 && pxC < cropSize && pyC >= 0 && pyC < cropSize) {
                const idx = (pyC * cropSize + pxC) * 4;
                if (Math.abs(dx) === 3 || Math.abs(dy) === 3) {
                    resultRgba[idx] = 255;
                    resultRgba[idx + 1] = 255;
                    resultRgba[idx + 2] = 255; // White border
                } else {
                    resultRgba[idx] = 239;
                    resultRgba[idx + 1] = 68;
                    resultRgba[idx + 2] = 68; // Tailwind red-500
                }
            }
        }
    }

    return UPNG.encode([resultRgba.buffer as ArrayBuffer], cropSize, cropSize, 256);
}
