"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Alert } from "@/components/ui";
import { parseLoginIdentifier, STUDENT_EMAIL_DOMAIN } from "@/lib/institution";

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"password" | "microsoft" | null>(null);
  const [error, setError] = useState(initialError);

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "");
    if (!parseLoginIdentifier(identifier)) {
      setError("Escribe tu correo institucional o tu cédula de 10 dígitos.");
      return;
    }
    setLoading("password");

    try {
      const result = await signIn("credentials", {
        identifier,
        password: String(data.get("password") ?? ""),
        redirect: false,
        redirectTo: "/panel",
      });
      if (result?.error || !result?.url) {
        setError(
          "Los datos no coinciden con una cuenta activa. Revisa tu correo o cédula y tu contraseña.",
        );
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
      <div className="login-form">
        <Alert tone="warning" title="Acceso no disponible">
          No hay métodos de inicio de sesión habilitados. Contacta al administrador del sistema.
        </Alert>
      </div>
    );
  }

  return (
    <>
      {microsoftEnabled && (
        <div className="login-form">
          <button
            className="btn btn-secondary btn-lg btn-block"
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
          {!passwordEnabled && error && <Alert tone="error">{error}</Alert>}
          {passwordEnabled && <div className="login-divider" style={{ margin: "4px 0 0" }}>o con tu contraseña</div>}
        </div>
      )}

      {passwordEnabled && (
        <form
          className="login-form"
          style={microsoftEnabled ? { marginTop: 18 } : undefined}
          onSubmit={handlePassword}
        >
          <div className="field">
            <label htmlFor="identifier">Correo institucional o cédula</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={`usuario@${STUDENT_EMAIL_DOMAIN}`}
              aria-describedby="identifier-hint"
              required
              disabled={loading !== null}
            />
            <span className="field-hint" id="identifier-hint">
              Estudiantes: correo @{STUDENT_EMAIL_DOMAIN} o cédula. Personal: correo @uleam.edu.ec.
            </span>
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-affix">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={loading !== null}
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
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading !== null}>
            {loading === "password" ? (
              <>
                <LoaderCircle className="spin" aria-hidden="true" /> Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      )}

      <p className="login-note">
        <LockKeyhole aria-hidden="true" />
        Solo las cuentas registradas por la universidad pueden ingresar.
      </p>
    </>
  );
}
