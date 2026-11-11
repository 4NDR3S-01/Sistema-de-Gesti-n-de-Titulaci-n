import type { NextConfig } from "next";

/** Cabeceras de seguridad para todas las respuestas. */
const securityHeaders = [
  // Nadie puede incrustar el sistema en un iframe (clickjacking).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=(), usb=()" },
  // HSTS solo en producción: en desarrollo se usa http://localhost.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // Formato PAT escaneado (máx. 5 MB) más el margen del multipart.
      bodySizeLimit: "6mb",
    },
  },
  // Permite abrir el servidor de desarrollo desde otros equipos de la red
  // (por ejemplo, un celular): DEV_ALLOWED_ORIGINS=192.168.1.20,mi-pc.local
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
