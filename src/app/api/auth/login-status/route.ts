import { NextResponse } from "next/server";
import { getLoginRateLimitStatus } from "@/lib/login-rate-limit";

// Solo informa si hay un bloqueo temporal activo; nunca valida contraseñas.
// El control efectivo permanece en src/auth.ts.
export async function POST(request: Request) {
  let identifier = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "identifier" in body) {
      const value = (body as { identifier?: unknown }).identifier;
      if (typeof value === "string") identifier = value.trim().toLowerCase().slice(0, 256);
    }
  } catch {
    return NextResponse.json({ blocked: false, waitSeconds: 0 }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const status = identifier
    ? getLoginRateLimitStatus(identifier, request)
    : { blocked: false, waitSeconds: 0 };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
