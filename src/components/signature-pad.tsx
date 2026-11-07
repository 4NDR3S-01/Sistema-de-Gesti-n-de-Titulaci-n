"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Eraser, LoaderCircle, PenLine, Upload } from "lucide-react";
import { saveSignatureAction } from "@/app/(app)/registro-pat-2/actions";

const INK = [17, 38, 74]; // azul tinta

/** Recorta un lienzo al área con trazos y lo devuelve como PNG transparente. */
function cropToInk(source: HTMLCanvasElement, maxWidth = 600): string | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1, inked = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 40) {
        inked++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const ratio = inked / (width * height);
  if (maxX < 0 || ratio < 0.0015) return null;

  const pad = 12;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const scale = Math.min(1, maxWidth / w);
  const out = document.createElement("canvas");
  out.width = Math.round(w * scale);
  out.height = Math.round(h * scale);
  out.getContext("2d")?.drawImage(source, minX, minY, w, h, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

/**
 * "Escanea" la foto de una firma hecha en papel: compara cada píxel con el brillo
 * promedio de su vecindario (umbral adaptativo), de modo que las sombras y la luz
 * desigual de una foto de celular no se confundan con tinta. Conserva el trazo
 * en azul tinta sobre fondo transparente y lo recorta.
 */
async function processPhoto(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const image = ctx.getImageData(0, 0, width, height);
  const px = image.data;
  const lum = new Float32Array(width * height);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }

  // Imagen integral para obtener el promedio de cualquier ventana en O(1).
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
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);
      const sum =
        integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const i = y * width + x;
      // Tinta: claramente más oscura que el papel que la rodea.
      const darkness = mean * 0.82 - lum[i];
      px[i * 4] = INK[0];
      px[i * 4 + 1] = INK[1];
      px[i * 4 + 2] = INK[2];
      px[i * 4 + 3] = darkness <= 0 || mean - lum[i] < 22 ? 0 : Math.min(255, 70 + darkness * 6);
    }
  }
  ctx.putImageData(image, 0, 0);
  return cropToInk(canvas);
}

export function SignaturePad({ signerName }: { signerName: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"draw" | "photo">("draw");
  const [preview, setPreview] = useState<string | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgb(${INK.join(",")})`;
  }, [mode]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const ctx = event.currentTarget.getContext("2d");
    const { x, y } = point(event);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const { x, y } = point(event);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    if (!hasStrokes) setHasStrokes(true);
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setPreview(null);
    setError("");
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una foto (JPG o PNG).");
      return;
    }
    setBusy(true);
    try {
      const result = await processPhoto(file);
      if (!result) setError("No se detectó una firma. Usa una hoja blanca, buena luz y tinta oscura.");
      setPreview(result);
    } catch {
      setError("No se pudo leer la imagen. Prueba con otra foto.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setError("");
    const image =
      mode === "draw" ? (canvasRef.current ? cropToInk(canvasRef.current) : null) : preview;
    if (!image) {
      setError(mode === "draw" ? "Dibuja tu firma antes de guardarla." : "Sube la foto de tu firma.");
      return;
    }
    setBusy(true);
    const result = await saveSignatureAction(image, mode === "draw" ? "DRAW" : "PHOTO");
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="signature-pad">
      <div className="segmented" role="tablist" aria-label="Forma de firmar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "draw"}
          onClick={() => {
            setMode("draw");
            clear();
          }}
        >
          <PenLine aria-hidden="true" /> Dibujar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "photo"}
          onClick={() => {
            setMode("photo");
            clear();
          }}
        >
          <Camera aria-hidden="true" /> Foto de mi firma
        </button>
      </div>

      {mode === "draw" ? (
        <div className="signature-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            aria-label={`Área para la firma de ${signerName}`}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
          />
          <span className="signature-baseline" aria-hidden="true">
            {signerName}
          </span>
        </div>
      ) : (
        <div className="signature-photo">
          {preview ? (
            <div className="signature-preview">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (data URL) */}
              <img src={preview} alt="Firma procesada" />
            </div>
          ) : (
            <label className="dropzone">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => onPhoto(event.target.files?.[0])}
              />
              {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              <strong>{busy ? "Procesando la foto…" : "Toma o sube una foto de tu firma"}</strong>
              <small>Firma con tinta oscura sobre una hoja blanca. Recortamos y quitamos el fondo.</small>
            </label>
          )}
        </div>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <div className="signature-actions">
        <button className="btn btn-ghost btn-sm" type="button" onClick={clear} disabled={busy}>
          <Eraser aria-hidden="true" /> {mode === "draw" ? "Limpiar" : "Otra foto"}
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={save}
          disabled={busy || (mode === "draw" ? !hasStrokes : !preview)}
        >
          {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
          Guardar mi firma
        </button>
      </div>
    </div>
  );
}
