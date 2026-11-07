import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { searchTeammates } from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";

/** Busca compañeros de la misma carrera disponibles para un trabajo en pareja. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const student = await getStudentByUserId(user.id);
  if (!student) return NextResponse.json({ results: [] });

  const text = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (text.length < 3) return NextResponse.json({ results: [] });

  const results = await searchTeammates(student.id, text);
  // Se oculta parte de la cédula: basta para distinguir homónimos.
  return NextResponse.json({
    results: results.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      cedula: row.cedula ? `${row.cedula.slice(0, 3)}••••${row.cedula.slice(-3)}` : null,
    })),
  });
}
