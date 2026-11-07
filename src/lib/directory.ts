import "server-only";
import { query } from "@/lib/db";
import { isValidCedula } from "@/lib/validation";

type GraphProfile = {
  givenName?: string | null;
  surname?: string | null;
  mobilePhone?: string | null;
  employeeId?: string | null;
  department?: string | null;
};

/** Perfil del usuario en el directorio de Microsoft 365 de la universidad. */
async function fetchGraphProfile(accessToken: string): Promise<GraphProfile | null> {
  try {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,mobilePhone,employeeId,department",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as GraphProfile;
  } catch {
    return null;
  }
}

/** Celular ecuatoriano en formato 09XXXXXXXX, si se puede normalizar. */
function normalizeMobile(value?: string | null): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (/^09\d{8}$/.test(digits)) return digits;
  if (/^5939\d{8}$/.test(digits)) return `0${digits.slice(3)}`;
  return null;
}

/**
 * Completa los datos del estudiante que están vacíos con los del directorio:
 * cédula (si TI la guarda en employeeId) y celular. Nunca sobrescribe lo que
 * el estudiante o secretaría ya registraron. Si Graph no responde, no hace nada.
 */
export async function syncStudentFromDirectory(userId: number, accessToken: string): Promise<void> {
  const profile = await fetchGraphProfile(accessToken);
  if (!profile) return;

  const cedula = profile.employeeId?.trim() ?? "";
  const phone = normalizeMobile(profile.mobilePhone);

  try {
    await query(
      `UPDATE students
       SET cedula = COALESCE(cedula, $1),
           phone = COALESCE(phone, $2)
       WHERE user_id = $3
         AND NOT EXISTS (SELECT 1 FROM students o WHERE o.cedula = $1 AND o.user_id <> $3)`,
      [isValidCedula(cedula) ? cedula : null, phone, userId],
    );
  } catch (error) {
    console.error("No se pudo sincronizar el perfil del directorio", error);
  }
}
