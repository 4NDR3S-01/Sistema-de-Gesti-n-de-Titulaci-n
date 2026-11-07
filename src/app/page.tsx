import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { microsoftConfigured } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

const route = [
  "Registro del tema",
  "Revisión",
  "Aprobación",
  "Tribunal",
  "Defensa",
];

const authErrors: Record<string, string> = {
  AccessDenied:
    "Tu cuenta Microsoft no tiene acceso. Usa tu correo @live.uleam.edu.ec (estudiantes) o @uleam.edu.ec (personal) y verifica con secretaría que estés registrado.",
  Configuration: "El inicio de sesión con Microsoft no está bien configurado. Avisa al administrador.",
};

export default async function LoginPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  // Si la base no responde, se muestra igualmente el formulario.
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/panel");

  return (
    <main className="login">
      <section className="login-visual duotone" aria-label="Universidad Laica Eloy Alfaro de Manabí">
        <Image
          className="duotone-bg"
          src="/campus/ingreso-uleam.jpg"
          alt=""
          fill
          sizes="55vw"
          preload
        />
        <Image
          className="login-visual-logo"
          src="/brand/uleam-logo-white.png"
          alt="Uleam, Universidad Laica Eloy Alfaro de Manabí"
          width={796}
          height={231}
        />

        <div className="login-visual-copy">
          <h1>Tu titulación, paso a paso.</h1>
          <p>
            Registra tu tema, sigue su revisión y conoce tu tribunal de defensa
            desde un solo lugar.
          </p>
          <ol className="login-route" aria-label="Etapas del proceso">
            {route.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <p className="login-visual-foot">
          Dirección de Gestión y Desarrollo Académico · Manta, Ecuador
        </p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Image
            className="login-card-logo"
            src="/brand/uleam-logo.png"
            alt="Uleam, Universidad Laica Eloy Alfaro de Manabí"
            width={796}
            height={231}
          />
          <h2>Iniciar sesión</h2>
          <p>Usa tu cuenta institucional de la ULEAM.</p>
          <LoginForm
            passwordEnabled={process.env.NEXT_PUBLIC_PASSWORD_AUTH_ENABLED === "true"}
            microsoftEnabled={microsoftConfigured}
            initialError={errorCode ? (authErrors[errorCode] ?? "No se pudo iniciar sesión. Inténtalo de nuevo.") : ""}
          />
        </div>
      </section>
    </main>
  );
}
