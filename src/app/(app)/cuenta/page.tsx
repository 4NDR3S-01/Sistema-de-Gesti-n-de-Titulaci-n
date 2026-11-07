import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PasswordForm } from "@/components/password-form";
import { Alert, PageHeader } from "@/components/ui";
import { getRoleLabel } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { hasLocalPassword } from "@/lib/data/users";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  const withPassword = await hasLocalPassword(user.id);
  const initials = `${user.name[0] ?? ""}${user.lastname[0] ?? ""}`.toUpperCase();

  return (
    <div className="stack">
      <PageHeader eyebrow="Mi cuenta" title="Cuenta y seguridad" description="Tus datos de acceso al sistema de titulación." />

      <section className="panel-card">
        <header className="profile-head">
          <span className="profile-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <h2>
              {user.name} {user.lastname}
            </h2>
            <p>
              {user.email} · {getRoleLabel(user.role)}
            </p>
          </div>
          {user.role === "STUDENT" && (
            <Link className="btn btn-secondary btn-sm" href="/perfil">
              Mis datos personales
            </Link>
          )}
        </header>
        <div className="panel-card-body">
          <p className="account-note">
            <ShieldCheck aria-hidden="true" />
            Puedes ingresar con tu correo institucional
            {user.role === "STUDENT" ? ", solo tu usuario o tu cédula" : ""}. Tu correo institucional lo asigna la
            universidad; si hay un error, comunícate con secretaría.
          </p>
        </div>
      </section>

      {withPassword ? (
        <PasswordForm />
      ) : (
        <Alert tone="info" title="Tu cuenta no usa contraseña propia">
          Ingresas con tu cuenta Microsoft de la ULEAM; la contraseña se cambia en Microsoft 365.
        </Alert>
      )}
    </div>
  );
}
