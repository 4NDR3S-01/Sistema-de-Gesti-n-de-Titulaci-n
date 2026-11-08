import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api/http";
import { getScanFile, isMemberUser } from "@/lib/data/pat";

/** Formato escaneado: solo para sus integrantes y el personal (sesión web o token de la app). */
export async function GET(request: Request, ctx: RouteContext<"/api/pat/[id]/escaneado">) {
  const { id } = await ctx.params;
  const registrationId = Number(id);
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!Number.isInteger(registrationId) || registrationId <= 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (user.role === "STUDENT" && !(await isMemberUser(registrationId, user.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const file = await getScanFile(registrationId);
  if (!file) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const safeName = file.file_name.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
