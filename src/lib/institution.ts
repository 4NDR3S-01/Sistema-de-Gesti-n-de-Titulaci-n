/**
 * Reglas de identidad institucional de la ULEAM.
 * - Estudiantes: cuentas Microsoft 365 en live.uleam.edu.ec.
 * - Personal: cuentas en uleam.edu.ec.
 * Se pueden cambiar con NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN y NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS.
 */

export const STUDENT_EMAIL_DOMAIN = (
  process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN || "live.uleam.edu.ec"
).toLowerCase();

export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || `${STUDENT_EMAIL_DOMAIN},uleam.edu.ec`
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export const emailDomain = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

export const isInstitutionalEmail = (email: string) =>
  ALLOWED_EMAIL_DOMAINS.includes(emailDomain(email));

export const isStudentEmail = (email: string) => emailDomain(email) === STUDENT_EMAIL_DOMAIN;

export type LoginIdentifier =
  | { kind: "cedula"; value: string }
  | { kind: "email"; value: string };

/**
 * Interpreta lo que la persona escribe en el inicio de sesión:
 * - 10 dígitos: cédula.
 * - Usuario sin "@": se completa con el dominio de estudiantes.
 * - Correo completo: se usa tal cual.
 * Devuelve null si no es un identificador válido.
 */
export function parseLoginIdentifier(raw: string): LoginIdentifier | null {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!value) return null;
  if (/^\d{10}$/.test(value)) return { kind: "cedula", value };
  if (/^[a-z0-9._-]+$/.test(value)) return { kind: "email", value: `${value}@${STUDENT_EMAIL_DOMAIN}` };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return { kind: "email", value };
  return null;
}
