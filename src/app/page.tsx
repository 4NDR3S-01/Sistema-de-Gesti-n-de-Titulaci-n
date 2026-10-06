"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === "true";
  const microsoftEnabled =
    process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
        redirectTo: "/panel",
      });

      if (result?.error || !result?.url) {
        setMessage("Correo o contraseña incorrectos. Verifica e intenta de nuevo.");
        return;
      }

      router.push(result.url);
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servicio de acceso. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setMessage("");
    setIsSubmitting(true);
    try {
      await signIn("microsoft-entra-id", { redirectTo: "/panel" });
    } catch {
      setMessage("No se pudo iniciar el acceso con Microsoft. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <a className="brand" href="#login" aria-label="Gestión de Titulación">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3.5 27 9.75v12.5L16 28.5 5 22.25V9.75L16 3.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M11 20v-8h2.1l5.8 5.15V12H21v8h-2.05l-5.85-5.2V20H11Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="brand-name">
            <strong>GESTIÓN</strong>
            <span>DE TITULACIÓN</span>
          </span>
        </a>

        <div className="welcome-copy">
          <span className="eyebrow">PORTAL ACADÉMICO</span>
          <h1 id="welcome-title">
            Tu proceso de titulación,
            <span> paso a paso.</span>
          </h1>
          <p>
            Un espacio para dar seguimiento a tu PAP 2, revisar los avances del
            trámite y consultar la asignación de tribunales.
          </p>
        </div>

        <section className="process-card" aria-labelledby="process-title">
          <span className="card-eyebrow">TU RUTA</span>
          <h2 id="process-title">Un proceso más claro</h2>
          <ol>
            <li><span>01</span> Registro del PAP 2</li>
            <li><span>02</span> Revisión del expediente</li>
            <li><span>03</span> Asignación de tribunal</li>
          </ol>
        </section>
        <span className="panel-caption">ACOMPAÑANDO TU CAMINO ACADÉMICO</span>
      </section>

      <section className="form-panel" id="login" aria-labelledby="login-title">
        <div className="login-card">
          <div className="form-heading">
            <span className="form-eyebrow">BIENVENIDO/A</span>
            <h2 id="login-title">Inicia sesión</h2>
            <p>Ingresa tus credenciales para continuar.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@pruebas.test"
              autoComplete="username"
              required
              disabled={isSubmitting}
            />

            <label className="password-label" htmlFor="password">
              Contraseña
            </label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verificando…" : "Ingresar"}{" "}
              <span aria-hidden="true">→</span>
            </button>
            <p className="form-message" role="status" aria-live="polite">
              {message}
            </p>
          </form>

          {microsoftEnabled ? (
            <button
              className="microsoft-button"
              type="button"
              disabled={isSubmitting}
              onClick={handleMicrosoftSignIn}
            >
              Continuar con Microsoft institucional
            </button>
          ) : (
            <p className="microsoft-note">
              El acceso institucional de Microsoft se habilitará cuando la
              universidad proporcione la configuración de su aplicación.
            </p>
          )}

          {demoEnabled && (
            <p className="demo-note">
              Modo de prueba: utiliza una de las cuentas locales de estudiante,
              secretaría o administración. No uses tu correo institucional.
            </p>
          )}

          <p className="help-note">
            ¿Tienes inconvenientes para ingresar?
            <span> Comunícate con la secretaría académica.</span>
          </p>
          <p className="form-caption">
            Acceso para estudiantes y personal académico
          </p>
        </div>
      </section>
    </main>
  );
}
