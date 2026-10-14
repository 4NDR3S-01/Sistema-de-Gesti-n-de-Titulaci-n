import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoleLabel, isAppRole } from "@/lib/auth-roles";
import { DashboardShell } from "@/components/dashboard-shell";
import packageJson from "../../../package.json";

export default async function PanelPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !isAppRole(role)) redirect("/");

  const roleLabel = getRoleLabel(role);
  const userName = session.user.name ?? roleLabel;
  const today = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date());
  const hour = Number(
    new Intl.DateTimeFormat("es-EC", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Guayaquil",
    }).format(new Date()),
  );
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const studentSections = [
    {
      title: "Registro de tema PAT 2",
      description: "Registra tu modalidad, tema y problemática de titulación.",
      href: "/registro-pat-2",
      action: "Registrar tema",
      icon: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h4",
    },
  ];
  const secretarySections = [
    {
      title: "Aprobación de PAT 2",
      description:
        "Revisa las propuestas de los estudiantes y gestiona su aprobación.",
      href: "/aprobacion-pat-2",
      action: "Revisar solicitudes",
      icon: "M5 12l4 4 10-10M4 20h16",
    },
    {
      title: "Asignación de tribunales",
      description:
        "Prepara la convocatoria de defensa con los integrantes establecidos.",
      href: "/tribunales",
      action: "Gestionar tribunal",
      icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 8 1 8 5",
    },
  ];
  const sections =
    role === "STUDENT"
      ? studentSections
      : role === "SECRETARY"
        ? secretarySections
        : [...studentSections, ...secretarySections];

  const steps = [
    {
      title: "Registro del tema PAT 2",
      description: "Modalidad, tema y problemática.",
      state: "current",
    },
    {
      title: "Revisión del expediente",
      description: "Secretaría valida los datos académicos.",
      state: "upcoming",
    },
    {
      title: "Aprobación del tema",
      description: "La propuesta se aprueba o se devuelve con observaciones.",
      state: "upcoming",
    },
    {
      title: "Asignación de tribunal",
      description: "Se designan los integrantes de la defensa.",
      state: "upcoming",
    },
    {
      title: "Defensa y titulación",
      description: "Sustentación y cierre del trámite.",
      state: "upcoming",
    },
  ];

  const checklist =
    role === "STUDENT"
      ? [
          "Ten a mano tus datos personales y de contacto actualizados.",
          "Elige tu modalidad: trabajo de integración curricular o examen complexivo.",
          "Define el tema y redacta la problemática de forma clara.",
          "Revisa tu información antes de enviarla a secretaría.",
        ]
      : [
          "Revisa que cada propuesta tenga modalidad, tema y problemática.",
          "Deja observaciones claras cuando devuelvas una solicitud.",
          "Confirma la disponibilidad de los integrantes antes de asignar el tribunal.",
          "Registra fecha, hora y lugar de la defensa en la convocatoria.",
        ];

  return (
    <DashboardShell
      role={role}
      userName={userName}
      roleLabel={roleLabel}
      version={packageJson.version}
    >
      <section className="dash-hero">
        <div>
          <span className="dash-hero-date">{today}</span>
          <h2>
            {greeting}, {userName}
          </h2>
          <p>
            Has iniciado sesión como <strong>{roleLabel}</strong>.
            {role === "STUDENT"
              ? " Sigue tu proceso de titulación y registra tu tema de PAT 2 desde aquí."
              : " Desde aquí puedes revisar solicitudes y organizar los tribunales de defensa."}
          </p>
        </div>
        <Link className="dash-hero-action" href={sections[0].href}>
          {sections[0].action} <span aria-hidden="true">→</span>
        </Link>
      </section>

      <div className="dash-grid">
        <div className="dash-column">
          <section className="dash-card" aria-labelledby="route-title">
            <header className="dash-card-head">
              <div>
                <span className="dash-eyebrow">PROCESO</span>
                <h3 id="route-title">
                  {role === "STUDENT"
                    ? "Tu ruta de titulación"
                    : "Flujo del proceso de titulación"}
                </h3>
              </div>
              <span className="dash-pill">5 etapas</span>
            </header>
            <ol className="dash-steps">
              {steps.map((step, index) => (
                <li className={`dash-step is-${step.state}`} key={step.title}>
                  <span className="dash-step-dot">{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="access-title">
            <h3 className="dash-section-title" id="access-title">
              Accesos rápidos
            </h3>
            <div className="dash-access">
              {sections.map((section) => (
                <Link className="dash-access-card" href={section.href} key={section.href}>
                  <span className="dash-access-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d={section.icon} />
                    </svg>
                  </span>
                  <strong>{section.title}</strong>
                  <small>{section.description}</small>
                  <span className="dash-access-link">
                    {section.action} <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="dash-column">
          <section className="dash-card" aria-labelledby="checklist-title">
            <header className="dash-card-head">
              <div>
                <span className="dash-eyebrow">ANTES DE EMPEZAR</span>
                <h3 id="checklist-title">
                  {role === "STUDENT" ? "Lo que necesitas" : "Buenas prácticas"}
                </h3>
              </div>
            </header>
            <ul className="dash-checklist">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="dash-card" aria-labelledby="notices-title">
            <header className="dash-card-head">
              <div>
                <span className="dash-eyebrow">AVISOS</span>
                <h3 id="notices-title">Estado del sistema</h3>
              </div>
            </header>
            <ul className="dash-notices">
              <li className="is-warning">
                <strong>Formularios en modo prototipo</strong>
                <span>
                  Todavía no guardan información en una base de datos.
                </span>
              </li>
              <li>
                <strong>Acceso con Microsoft institucional</strong>
                <span>
                  Se habilitará cuando la universidad entregue la configuración.
                </span>
              </li>
            </ul>
          </section>

          <section className="dash-help">
            <strong>¿Necesitas ayuda?</strong>
            <p>
              Si tienes dudas sobre tu trámite, comunícate con la secretaría
              académica de tu facultad.
            </p>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
