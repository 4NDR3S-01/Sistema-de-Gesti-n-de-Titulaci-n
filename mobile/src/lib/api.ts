import * as SecureStore from "expo-secure-store";
import { File, Directory, Paths } from "expo-file-system";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKEN_KEY = "uleam.token";

export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldErrors = {},
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const tokenStore = {
  async load() {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
  },
  async save(value: string) {
    token = value;
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  },
  async clear() {
    token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/** La sesión expiró en el servidor: la app vuelve al inicio de sesión. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && typeof init.body === "string") headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "network", "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    const error = (data as { error?: { code?: string; message?: string; fields?: FieldErrors } }).error;
    throw new ApiError(
      response.status,
      error?.code ?? "error",
      error?.message ?? "Ocurrió un error. Inténtalo de nuevo.",
      error?.fields ?? {},
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T = { ok: true }>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = { ok: true }>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T = { ok: true }>(path: string) => request<T>(path, { method: "DELETE" }),
  /** Sube un archivo local como multipart/form-data. */
  upload: <T = { ok: true }>(path: string, field: string, file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // React Native acepta { uri, name, type } como archivo en FormData.
    form.append(field, file as unknown as Blob);
    return request<T>(path, { method: "POST", body: form });
  },
};

/** Descarga un archivo protegido (PDF) a la caché del teléfono y devuelve su uri local. */
export async function downloadFile(path: string, fileName: string): Promise<string> {
  const dir = new Directory(Paths.cache, "documentos");
  dir.create({ idempotent: true, intermediates: true });
  const target = new File(dir, fileName);
  if (target.exists) target.delete();
  try {
    const task = File.createDownloadTask(`${API_URL}${path}`, target, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const file = await task.downloadAsync();
    if (!file) throw new Error("descarga pausada");
    // Si el servidor respondió con un error, el archivo no es un PDF.
    const head = (await file.bytes()).slice(0, 5);
    if (String.fromCharCode(...head) !== "%PDF-") {
      file.delete();
      throw new Error("respuesta no válida");
    }
    return file.uri;
  } catch {
    throw new ApiError(0, "download", "No se pudo descargar el documento. Inténtalo de nuevo.");
  }
}
