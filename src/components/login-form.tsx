"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  TriangleAlert,
} from "lucide-react";
import { Alert } from "@/components/ui";
import { parseLoginIdentifier, STUDENT_EMAIL_DOMAIN } from "@/lib/institution";

type Audience = "student" | "staff";
const AUDIENCE_KEY = "uleam:login-audience";

const copy = {
  student: {
    label: "Correo institucional o cédula",
    placeholder: `usuario@${STUDENT_EMAIL_DOMAIN}`,
    hint: `Ingresa tu correo institucional completo (@${STUDENT_EMAIL_DOMAIN}) o tu cédula de 10 dígitos.`,
    icon: IdCard,
    forgot: "Pide a la secretaría académica de tu facultad que restablezca tu contraseña. Lleva tu cédula.",
  },
  staff: {
    label: "Correo institucional",
    placeholder: "nombre.apellido@uleam.edu.ec",
    hint: "Usa tu cuenta del personal @uleam.edu.ec.",
    icon: Mail,
    forgot: "Solicita el restablecimiento al administrador del sistema de titulación.",
  },
} as const;

export function LoginForm({
  passwordEnabled,
  microsoftEnabled,
  initialError = "",
}: {
  passwordEnabled: boolean;
  microsoftEnabled: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState<"password" | "microsoft" | null>(null);
  const [error, setError] = useState(initialError);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const text = copy[audience];
  const IdentifierIcon = text.icon;

  useEffect(() => {
    try {
      // Preferencia local: se aplica después de hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(AUDIENCE_KEY) === "staff") setAudience("staff");
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  function chooseAudience(next: Audience) {
    setAudience(next);
    setError("");
    setFieldErrors({});
    setShowForgot(false);
    try {
      localStorage.setItem(AUDIENCE_KEY, next);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const parsed = parseLoginIdentifier(identifier);
    const issues: { identifier?: string; password?: string } = {};

    if (!identifier) {
      issues.identifier = "Ingresa tu correo institucional completo o cédula.";
    } else if (/^\d+$/.test(identifier) && identifier.length !== 10) {
      issues.identifier = "La cédula debe tener exactamente 10 dígitos.";
    } else if (!parsed) {
      issues.identifier = audience === "student"
        ? `Ingresa tu correo completo @${STUDENT_EMAIL_DOMAIN} o una cédula de 10 dígitos.`
        : "Ingresa tu correo institucional completo @uleam.edu.ec.";
    } else if (audience === "student" && parsed.kind === "email" &&
      !parsed.value.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
      issues.identifier = `Utiliza tu cuenta de estudiante @${STUDENT_EMAIL_DOMAIN}.`;
    } else if (audience === "staff" &&
      (parsed.kind !== "email" || !identifier.includes("@") || !parsed.value.endsWith("@uleam.edu.ec"))) {
      issues.identifier = "Para personal, ingresa tu correo @uleam.edu.ec.";
    }

    if (!password) issues.password = "Ingresa tu contraseña.";
    setFieldErrors(issues);
    if (Object.keys(issues).length) return;
    setLoading("password");

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        audience,
        redirect: false,
        redirectTo: "/panel",
      });
      if (result?.error || !result?.url) {
        // NextAuth devuelve un error genérico para credenciales incorrectas y bloqueos.
        // Se consulta solo el tiempo de espera para informar al usuario sin revelar cuentas.
        let message = "No se pudo iniciar sesión. Verifica tus credenciales y el tipo de acceso seleccionado.";
        try {
          const statusResponse = await fetch("/api/auth/login-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier }),
            cache: "no-store",
          });
          if (statusResponse.ok) {
            const status: { blocked?: boolean; waitSeconds?: number } = await statusResponse.json();
            if (status.blocked) {
              const minutes = Math.max(1, Math.ceil((status.waitSeconds ?? 0) / 60));
              message = `Acceso temporalmente restringido por demasiados intentos. Vuelve a intentarlo en aproximadamente ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
            }
          }
        } catch {
          // Si el endpoint de estado no responde, mantener el error genérico.
        }
        setError(message);
        setLoading(null);
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo en unos minutos.");
      setLoading(null);
    }
  }

  async function handleMicrosoft() {
    if (loading) return;
    setLoading("microsoft");
    setError("");
    try {
      await signIn("microsoft-entra-id", { redirectTo: "/panel" });
    } catch {
      setError("No se pudo abrir el inicio de sesión de Microsoft. Inténtalo de nuevo.");
      setLoading(null);
    }
  }

  if (!passwordEnabled && !microsoftEnabled) {
    return (
      <Alert tone="warning" title="Acceso no disponible">
        No hay métodos de inicio de sesión habilitados. Contacta al administrador del sistema.
      </Alert>
    );
  }

  return (
    <div className="login-body">
      <div className="audience-switch" role="group" aria-label="Tipo de cuenta">
        <button type="button" aria-pressed={audience === "student"} onClick={() => chooseAudience("student")}>
          <GraduationCap aria-hidden="true" /> Soy estudiante
        </button>
        <button type="button" aria-pressed={audience === "staff"} onClick={() => chooseAudience("staff")}>
          <BriefcaseBusiness aria-hidden="true" /> Soy personal
        </button>
      </div>

      {microsoftEnabled && (
        <>
          <button
            className="btn btn-secondary btn-lg btn-block ms-button"
            type="button"
            onClick={handleMicrosoft}
            disabled={loading !== null}
          >
            {loading === "microsoft" ? (
              <LoaderCircle className="spin" aria-hidden="true" />
            ) : (
              <span className="ms-mark" aria-hidden="true">
                <span style={{ background: "#f25022" }} />
                <span style={{ background: "#7fba00" }} />
                <span style={{ background: "#00a4ef" }} />
                <span style={{ background: "#ffb900" }} />
              </span>
            )}
            Entrar con mi cuenta Microsoft ULEAM
          </button>
          {passwordEnabled && <div className="login-divider">o con tu contraseña</div>}
        </>
      )}

      {passwordEnabled && (
        <form className="login-form" onSubmit={handlePassword} noValidate>
          <div className={`field${fieldErrors.identifier ? " has-error" : ""}`}>
            <label htmlFor="identifier">{text.label}</label>
            <div className="input-icon">
              <IdentifierIcon aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={text.placeholder}
                aria-describedby={fieldErrors.identifier ? "identifier-hint identifier-error" : "identifier-hint"}
                aria-invalid={Boolean(fieldErrors.identifier)}
                onChange={() => setFieldErrors((prev) => ({ ...prev, identifier: undefined }))}
                required
                disabled={loading !== null}
              />
            </div>
            <span className="field-hint" id="identifier-hint">
              {text.hint}
            </span>
            {fieldErrors.identifier && <span className="field-error" id="identifier-error" role="alert">{fieldErrors.identifier}</span>}
          </div>

          <div className={`field${fieldErrors.password ? " has-error" : ""}`}>
            <div className="field-label-row">
              <label htmlFor="password">Contraseña</label>
              <button
                type="button"
                className="link-button"
                aria-expanded={showForgot}
                aria-controls="forgot-help"
                onClick={() => setShowForgot((value) => !value)}
              >
                ¿Olvidaste tu contraseña?
                <ChevronDown aria-hidden="true" className={showForgot ? "is-open" : undefined} />
              </button>
            </div>
            {showForgot && (
              <p className="forgot-help" id="forgot-help">
                {text.forgot}
              </p>
            )}
            <div className="input-icon input-affix">
              <LockKeyhole aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={loading !== null}
                onKeyUp={trackCapsLock}
                onKeyDown={trackCapsLock}
                onBlur={() => setCapsLock(false)}
                aria-describedby={[capsLock ? "caps-warning" : null, fieldErrors.password ? "password-error" : null].filter(Boolean).join(" ") || undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                onChange={() => setFieldErrors((prev) => ({ ...prev, password: undefined }))}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error" id="password-error" role="alert">{fieldErrors.password}</span>}
            {capsLock && (
              <span className="caps-warning" id="caps-warning" role="status">
                <TriangleAlert aria-hidden="true" /> Bloq Mayús está activado.
              </span>
            )}
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <button className="btn btn-primary btn-lg btn-block login-submit" type="submit" disabled={loading !== null}>
            {loading === "password" ? (
              <>
                <LoaderCircle className="spin" aria-hidden="true" /> Ingresando…
              </>
            ) : (
              <>
                Ingresar <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}

      {!passwordEnabled && error && <Alert tone="error">{error}</Alert>}

      <p className="login-note">
        <LockKeyhole aria-hidden="true" />
        Acceso exclusivo para cuentas institucionales registradas por la universidad.
      </p>
    </div>
  );
}
