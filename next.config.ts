import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Permite abrir el servidor de desarrollo desde otros equipos de la red
  // (por ejemplo, un celular): DEV_ALLOWED_ORIGINS=192.168.1.20,mi-pc.local
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export default nextConfig;
