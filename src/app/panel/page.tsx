import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoleLabel, isAppRole } from "@/lib/auth-roles";
import { SignOutButton } from "@/components/sign-out-button";

export default async function PanelPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !isAppRole(role)) redirect("/");

  const studentSections = [
    {
      title: "Registro de tema PAP 2",
      description:
        "Registra tu modalidad, tema y problemática de titulación.",
      href: "/registro-pap2",
      action: "Registrar tema",
    },
  ];
  const secretarySections = [
    {
      title: "Aprobación de PAP 2",
      description:
        "Revisa las propuestas de los estudiantes y gestiona su aprobación.",
      href: "/aprobacion-pap2",
      action: "Revisar solicitudes",
    },
    {
      title: "Asignación de tribunales",
      description:
        "Prepara la convocatoria de defensa con los integrantes establecidos.",
      href: "/tribunales",
      action: "Gestionar tribunal",
    },
  ];
  const sections =
    role === "STUDENT"
      ? studentSections
      : role === "SECRETARY"
        ? secretarySections
        : [...studentSections, ...secretarySections];

  return (
    <main className="dashboard-page">
      <header className="workflow-topbar">
        <Link className="workflow-brand" href="/panel" aria-label="Panel principal">
          <span className="workflow-brand-icon" aria-hidden="true">GT</span>
          <span><strong>GESTIÓN</strong><small>DE TITULACIÓN</small></span>
        </Link>
        <div className="dashboard-user">
          <span>{getRoleLabel(role)}</span>
          <SignOutButton />
        </div>
      </header>
      <section className="dashboard-content">
        <span className="workflow-eyebrow">ESPACIO DE TRABAJO</span>
        <h1>Hola, {session.user.name ?? getRoleLabel(role)}</h1>
        <p className="dashboard-intro">
          Has iniciado sesión como <strong>{getRoleLabel(role)}</strong>.
          {role === "STUDENT"
            ? " Desde aquí puedes registrar tu tema de PAP 2."
            : " Selecciona una sección para continuar."}
        </p>
        <div className="dashboard-cards">
          {sections.map((section) => (
            <article className="dashboard-card" key={section.href}>
              <span className="section-number" aria-hidden="true">→</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <Link className="primary-action" href={section.href}>
                {section.action} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
        <p className="dashboard-prototype-note">
          Los formularios actuales son prototipos y todavía no guardan
          información en una base de datos.
        </p>
      </section>
    </main>
  );
}
