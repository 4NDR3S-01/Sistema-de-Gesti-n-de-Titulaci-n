import Link from "next/link";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Alert } from "@/components/ui";
import { getRoleLabel } from "@/lib/auth-roles";
import { requireUser, type CurrentUser } from "@/lib/current-user";
import { getAdminMetrics } from "@/lib/data/metrics";
import { getStudentByUserId, getStudentTitlingStatus } from "@/lib/data/students";
import { statusLabel } from "@/lib/labels";

const steps = [
  { title: "Registro del tema PAT 2", description: "Modalidad, tema y problemática." },
  { title: "Revisión del expediente", description: "Secretaría valida los datos académicos." },
  { title: "Aprobación del tema", description: "La propuesta se aprueba o se devuelve con observaciones." },
  { title: "Asignación de tribunal", description: "Se designan los integrantes de la defensa." },
  { title: "Defensa y titulación", description: "Sustentación y cierre del trámite." },
];

const studentChecklist = [
  "Revisa que tus datos personales y de contacto estén actualizados.",
  "Elige tu modalidad: trabajo de integración curricular o examen complexivo.",
  "Define el tema y redacta la problemática de forma clara.",
  "Revisa tu información antes de enviarla a secretaría.",
];

const staffChecklist = [
  "Revisa que cada propuesta tenga modalidad, tema y problemática.",
  "Deja observaciones claras cuando devuelvas una solicitud.",
  "Confirma la disponibilidad de los integrantes antes de asignar el tribunal.",
  "Registra fecha, hora y lugar de la defensa en la convocatoria.",
];

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("es-EC", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Guayaquil",
    }).format(new Date()),
  );
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function Hero({ user, children, action }: {
  user: CurrentUser;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  const today = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date());

  return (
    <section className="dash-hero">
      <div>
        <span className="dash-hero-date">{today}</span>
        <h1>
          {greeting()}, {user.name}
        </h1>
        <p>
          Has iniciado sesión como <strong>{getRoleLabel(user.role)}</strong>. {children}
        </p>
      </div>
      {action && (
        <Link className="dash-hero-action" href={action.href}>
          {action.label} <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}

function ProcessCard({ title }: { title: string }) {
  return (
    <section className="dash-card" aria-labelledby="route-title">
      <header className="dash-card-head">
        <div>
          <span className="dash-eyebrow">PROCESO</span>
          <h2 id="route-title">{title}</h2>
        </div>
        <span className="dash-pill">{steps.length} etapas</span>
      </header>
      <ol className="dash-steps">
        {steps.map((step, index) => (
          <li className={`dash-step ${index === 0 ? "is-current" : "is-upcoming"}`} key={step.title}>
            <span className="dash-step-dot">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="dash-card" aria-labelledby="checklist-title">
      <header className="dash-card-head">
        <div>
          <span className="dash-eyebrow">ANTES DE EMPEZAR</span>
          <h2 id="checklist-title">{title}</h2>
        </div>
      </header>
      <ul className="dash-checklist">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

async function StudentDashboard({ user }: { user: CurrentUser }) {
  const student = await getStudentByUserId(user.id);
  const status = student ? await getStudentTitlingStatus(student.id) : null;

  return (
    <>
      <Hero user={user} action={{ href: "/registro-pat-2", label: "Registrar tema" }}>
        Aquí tienes tu información y el avance de tu proceso de titulación.
      </Hero>
      {student && status ? (
        <StudentProfileCard student={student} status={status} editHref="/perfil" />
      ) : (
        <Alert tone="warning" title="Tu perfil académico aún no está registrado">
          Comunícate con secretaría académica para que registren tus datos de estudiante.
        </Alert>
      )}
      <div className="dash-grid">
        <ProcessCard title="Tu ruta de titulación" />
        <div className="dash-column">
          <ChecklistCard title="Lo que necesitas" items={studentChecklist} />
          <section className="dash-help">
            <strong>¿Necesitas ayuda?</strong>
            <p>
              Si tienes dudas sobre tu trámite, comunícate con la secretaría
              académica de tu facultad.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

function SecretaryDashboard({ user }: { user: CurrentUser }) {
  return (
    <>
      <Hero user={user} action={{ href: "/aprobacion-pat-2", label: "Revisar solicitudes" }}>
        Desde aquí puedes revisar solicitudes, gestionar estudiantes y organizar
        los tribunales de defensa.
      </Hero>
      <div className="dash-grid">
        <ProcessCard title="Flujo del proceso de titulación" />
        <ChecklistCard title="Buenas prácticas" items={staffChecklist} />
      </div>
    </>
  );
}

async function AdminDashboard({ user }: { user: CurrentUser }) {
  const metrics = await getAdminMetrics();
  const tiles = [
    { label: "Estudiantes registrados", value: metrics.students, href: "/estudiantes" },
    { label: "Usuarios activos", value: metrics.activeUsers, href: "/admin/usuarios?estado=active" },
    { label: "Personal de secretaría", value: metrics.secretaries, href: "/admin/usuarios?rol=SECRETARY" },
    { label: "Carreras activas", value: metrics.careers, href: "/admin/carreras" },
  ];
  const procedureTotal = metrics.proceduresByStatus.reduce((sum, item) => sum + item.total, 0);
  const modules = [
    { title: "Usuarios", description: "Crea cuentas del personal, cambia roles y activa o desactiva accesos.", href: "/admin/usuarios" },
    { title: "Estudiantes", description: "Busca, registra y actualiza los datos de los estudiantes.", href: "/estudiantes" },
    { title: "Carreras y facultades", description: "Mantén el catálogo académico usado en los registros.", href: "/admin/carreras" },
    { title: "Aprobación de PAT 2", description: "Revisa las propuestas de tema de los estudiantes.", href: "/aprobacion-pat-2" },
  ];

  return (
    <>
      <Hero user={user}>
        Este es el resumen general del sistema y el acceso a los módulos de administración.
      </Hero>

      <section className="stat-grid" aria-label="Indicadores">
        {tiles.map((tile) => (
          <Link className="stat-tile" href={tile.href} key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value.toLocaleString("es-EC")}</strong>
          </Link>
        ))}
      </section>

      <div className="dash-grid">
        <section aria-labelledby="modules-title">
          <h2 className="dash-section-title" id="modules-title">
            Módulos de administración
          </h2>
          <div className="dash-access">
            {modules.map((module) => (
              <Link className="dash-access-card" href={module.href} key={module.href}>
                <strong>{module.title}</strong>
                <small>{module.description}</small>
                <span className="dash-access-link">
                  Abrir <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="dash-column">
          <section className="dash-card" aria-labelledby="procedures-title">
            <header className="dash-card-head">
              <div>
                <span className="dash-eyebrow">TRÁMITES</span>
                <h2 id="procedures-title">Trámites por estado</h2>
              </div>
              <span className="dash-pill">{procedureTotal} en total</span>
            </header>
            {metrics.proceduresByStatus.length === 0 ? (
              <p className="text-muted">Aún no hay trámites registrados.</p>
            ) : (
              <ul className="bar-list">
                {metrics.proceduresByStatus.map((item) => (
                  <li key={item.status}>
                    <div>
                      <span>{statusLabel(item.status)}</span>
                      <strong>{item.total}</strong>
                    </div>
                    <span className="bar-track" aria-hidden="true">
                      <span style={{ width: `${(item.total / procedureTotal) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-card" aria-labelledby="notices-title">
            <header className="dash-card-head">
              <div>
                <span className="dash-eyebrow">AVISOS</span>
                <h2 id="notices-title">Estado del sistema</h2>
              </div>
            </header>
            <ul className="dash-notices">
              {metrics.inactiveUsers > 0 && (
                <li>
                  <strong>{metrics.inactiveUsers} cuentas inactivas</strong>
                  <span>No pueden iniciar sesión hasta que se reactiven.</span>
                </li>
              )}
              <li className="is-warning">
                <strong>Registro PAT 2 y tribunales en prototipo</strong>
                <span>Esos formularios todavía no guardan información.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

export default async function PanelPage() {
  const user = await requireUser();

  return (
    <div className="stack">
      {user.role === "STUDENT" ? (
        <StudentDashboard user={user} />
      ) : user.role === "SECRETARY" ? (
        <SecretaryDashboard user={user} />
      ) : (
        <AdminDashboard user={user} />
      )}
    </div>
  );
}
