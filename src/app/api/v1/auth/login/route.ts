import { verifyCredentials } from "@/lib/auth-credentials";
import { getRoleLabel } from "@/lib/auth-roles";
import { fail, handler, issueToken, ok, readJson } from "@/lib/api/http";
import { getLoginRateLimitStatus } from "@/lib/login-rate-limit";

/** Inicio de sesión de la app: correo institucional completo o cédula + contraseña y tipo de cuenta. */
export const POST = handler(async (request: Request) => {
  const body = await readJson(request);
  const user = await verifyCredentials(body.identifier, body.password, body.audience, request);
  if (!user) {
    const identifier = typeof body.identifier === "string" ? body.identifier.trim().toLowerCase().slice(0, 256) : "";
    const status = identifier ? getLoginRateLimitStatus(identifier, request) : { blocked: false, waitSeconds: 0 };
    if (status.blocked) {
      const minutes = Math.max(1, Math.ceil(status.waitSeconds / 60));
      return fail({
        status: 429,
        code: "too_many_attempts",
        message: `Acceso temporalmente restringido por demasiados intentos. Vuelve a intentarlo en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
      });
    }
    return fail({
      status: 401,
      code: "invalid_credentials",
      message: "No se pudo iniciar sesión. Verifica tus credenciales y el tipo de acceso seleccionado.",
    });
  }
  if (user.role === "ADMIN" || user.role === "SECRETARY" || user.role === "STUDENT") {
    const { token, expiresAt } = await issueToken(user.id);
    return ok({
      token,
      expiresAt,
      user: { ...user, roleLabel: getRoleLabel(user.role) },
    });
  }
  return fail({ status: 403, code: "forbidden", message: "Tu rol no tiene acceso a la app." });
});
