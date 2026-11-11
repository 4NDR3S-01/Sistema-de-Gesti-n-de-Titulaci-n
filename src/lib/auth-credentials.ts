import "server-only";
import bcrypt from "bcryptjs";
import { isAppRole, type AppRole } from "@/lib/auth-roles";
import { findUserByCedula, findUserByEmail } from "@/lib/data/users";
import { emailDomain, isInstitutionalEmail, isStudentEmail, parseLoginIdentifier } from "@/lib/institution";
import { clearSuccessfulLogin, loginIsRateLimited, recordFailedLogin } from "@/lib/login-rate-limit";

export type VerifiedUser = { id: number; email: string; name: string; lastname: string; role: AppRole };
export type LoginAudience = "student" | "staff";

export const isLoginAudience = (value: unknown): value is LoginAudience => value === "student" || value === "staff";

/** En desarrollo, explica en la consola del servidor por qué se rechazó un login. */
function logRejected(who: string, reason: string) {
  if (process.env.NODE_ENV === "development") console.warn(`[login] ${who}: ${reason}`);
}

/**
 * Verifica correo institucional completo o cédula más contraseña.
 * La usan el inicio de sesión web (Auth.js) y la API de la app móvil, con las mismas reglas:
 * - límite de intentos fallidos por identificador e IP (src/lib/login-rate-limit.ts);
 * - la pestaña elegida (estudiante o personal) debe corresponder al dominio y al rol de la cuenta.
 */
export async function verifyCredentials(
  rawIdentifier: unknown,
  rawPassword: unknown,
  rawAudience: unknown,
  request: Request,
): Promise<VerifiedUser | null> {
  if (process.env.PASSWORD_AUTH_ENABLED !== "true") {
    logRejected("-", "PASSWORD_AUTH_ENABLED no está en true");
    return null;
  }
  const identifierText = typeof rawIdentifier === "string" ? rawIdentifier : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const identifier = parseLoginIdentifier(identifierText);
  // Clave estable para contabilizar fallos (el módulo la guarda con hash, nunca en claro).
  const throttleId = identifierText.trim().toLowerCase().slice(0, 256);

  if (loginIsRateLimited(throttleId, request)) {
    logRejected(throttleId, "demasiados intentos fallidos; bloqueado temporalmente");
    return null;
  }
  const reject = (reason: string) => {
    recordFailedLogin(throttleId, request);
    logRejected(throttleId || "-", reason);
    return null;
  };

  if (!identifier || !password) return reject("faltan datos o el identificador no es válido");
  if (!isLoginAudience(rawAudience)) return reject("tipo de cuenta no indicado");
  const audience = rawAudience;
  const loginValue = identifier.value;

  if (identifier.kind === "email" && !isInstitutionalEmail(loginValue)) {
    return reject("el correo no pertenece a un dominio institucional");
  }
  // La selección estudiante/personal se verifica en el servidor.
  if (audience === "student") {
    if (identifier.kind === "email" && !isStudentEmail(loginValue)) return reject("no es un correo de estudiante");
  } else if (identifier.kind !== "email" || emailDomain(loginValue) !== "uleam.edu.ec") {
    return reject("el personal ingresa con su correo @uleam.edu.ec");
  }

  const user = identifier.kind === "cedula" ? await findUserByCedula(loginValue) : await findUserByEmail(loginValue);
  if (!user) return reject("no existe");
  if (!user.is_active || !isAppRole(user.role)) return reject("cuenta desactivada o rol sin acceso");
  if (audience === "student" && user.role !== "STUDENT") return reject("la cuenta no es de estudiante");
  if (audience === "staff" && user.role !== "SECRETARY" && user.role !== "ADMIN") return reject("la cuenta no es de personal");
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash)) {
    return reject("no tiene contraseña asignada (usa npm run db:password)");
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return reject("contraseña incorrecta");
  }

  clearSuccessfulLogin(throttleId);
  return { id: user.id, email: user.email, name: user.name, lastname: user.lastname, role: user.role };
}
