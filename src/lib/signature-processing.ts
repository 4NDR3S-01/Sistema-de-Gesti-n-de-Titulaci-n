import "server-only";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const INK = [17, 38, 74]; // azul tinta
const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_SIDE = 1400;

type Bitmap = { width: number; height: number; data: Uint8Array | Buffer };

function decode(content: Buffer): Bitmap | null {
  if (content.length > MAX_INPUT_BYTES) return null;
  const isPng = content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = content[0] === 0xff && content[1] === 0xd8;
  try {
    if (isPng) {
      const png = PNG.sync.read(content);
      return { width: png.width, height: png.height, data: png.data };
    }
    if (isJpeg) {
      // Límite de memoria: evita "bombas" de descompresión.
      const image = jpeg.decode(content, { useTArray: true, maxMemoryUsageInMB: 256, maxResolutionInMP: 60 });
      return { width: image.width, height: image.height, data: image.data };
    }
  } catch {
    return null;
  }
  return null;
}

/** Luminancia sobre fondo blanco (respeta la transparencia de firmas dibujadas). */
function luminance(src: Bitmap): { lum: Float32Array; width: number; height: number } {
  const scale = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
  const width = Math.max(1, Math.round(src.width * scale));
  const height = Math.max(1, Math.round(src.height * scale));
  const lum = new Float32Array(width * height);
  // Promedio por bloques al reducir: suaviza el ruido de la cámara.
  for (let y = 0; y < height; y++) {
    const sy0 = Math.floor(y / scale);
    const sy1 = Math.max(sy0 + 1, Math.min(src.height, Math.floor((y + 1) / scale)));
    for (let x = 0; x < width; x++) {
      const sx0 = Math.floor(x / scale);
      const sx1 = Math.max(sx0 + 1, Math.min(src.width, Math.floor((x + 1) / scale)));
      let sum = 0;
      let count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * src.width + sx) * 4;
          const alpha = src.data[i + 3] / 255;
          const l = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
          sum += l * alpha + 255 * (1 - alpha);
          count++;
        }
      }
      lum[y * width + x] = sum / count;
    }
  }
  return { lum, width, height };
}

/**
 * "Escanea" una firma: compara cada píxel con el promedio de su vecindario
 * (umbral adaptativo) para ignorar sombras y luz desigual, deja el trazo en
 * tinta azul sobre fondo transparente y lo recorta. Devuelve un PNG en data URL
 * o null si no encuentra una firma.
 */
export function processSignature(content: Buffer): string | null {
  const bitmap = decode(content);
  if (!bitmap) return null;
  const { lum, width, height } = luminance(bitmap);

  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 1; y <= height; y++) {
    let row = 0;
    for (let x = 1; x <= width; x++) {
      row += lum[(y - 1) * width + (x - 1)];
      integral[y * stride + x] = integral[(y - 1) * stride + x] + row;
    }
  }

  const radius = Math.max(12, Math.round(Math.max(width, height) / 28));
  const alpha = new Uint8Array(width * height);
  let minX = width, minY = height, maxX = -1, maxY = -1, inked = 0;
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);
      const sum = integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const l = lum[y * width + x];
      const darkness = mean * 0.82 - l;
      if (darkness > 0 && mean - l >= 22) {
        const a = Math.min(255, 70 + darkness * 6);
        alpha[y * width + x] = a;
        if (a > 40) {
          inked++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const ratio = inked / (width * height);
  if (maxX < 0 || ratio < 0.0015 || ratio > 0.45) return null;

  const pad = 12;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const outScale = Math.min(1, 600 / cropW);
  const outW = Math.max(1, Math.round(cropW * outScale));
  const outH = Math.max(1, Math.round(cropH * outScale));

  const out = new PNG({ width: outW, height: outH });
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const sx = minX + Math.min(cropW - 1, Math.floor(x / outScale));
      const sy = minY + Math.min(cropH - 1, Math.floor(y / outScale));
      const o = (y * outW + x) * 4;
      out.data[o] = INK[0];
      out.data[o + 1] = INK[1];
      out.data[o + 2] = INK[2];
      out.data[o + 3] = alpha[sy * width + sx];
    }
  }
  return `data:image/png;base64,${PNG.sync.write(out).toString("base64")}`;
}
