import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  ClipboardCheck,
  FilePen,
  Gavel,
  MailOpen,
  UserPen,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { DefenseDetails } from "@/components/defense-card";
import { MembersList, Timeline } from "@/components/pat-parts";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Alert, Badge } from "@/components/ui";
import { requireUser, type CurrentUser } from "@/lib/current-user";
import { getAdminMetrics } from "@/lib/data/metrics";
import {
  countRegistrationsByStatus,
  getPatDetailForStudent,
  listRegistrations,
  recentEvents,
  type PatRegistration,
} from "@/lib/data/pat";
import { getStudentByUserId, type StudentRow } from "@/lib/data/students";
import {
  getTribunalByStudent,
  listApprovedWithoutTribunal,
  listTribunals,
  type TribunalRow,
} from "@/lib/data/tribunals";
import { longDate, patStatusLabel, patStatusTone, shortDateTime } from "@/lib/labels";
import { canSubmit, eventLabels, isEditable } from "@/lib/pat-rules";

export const metadata: Metadata = { title: "Inicio" };

const HERO_PHOTO = "/campus/ingreso-uleam.jpg";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("es-EC", { hour: "numeric", hourCycle: "h23", timeZone: "America/Guayaquil" }).format(
      new Date(),
    ),
  );
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function today() {
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date());
}

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());
}

type HeroAction = { href: string; label: string; icon: LucideIcon };

function Hero({
  user,
  text,
  action,
  children,
}: {
  user: CurrentUser;
  text: string;
  action?: HeroAction;
  children?: React.ReactNode;
}) {
  const ActionIcon = action?.icon;
  return (
    <section className="hero duotone">
      <Image
        className="duotone-bg"
        src={HERO_PHOTO}
        alt=""
        fill
        sizes="(max-width: 960px) 100vw, 1200px"
        preload
        style={{ objectPosition: "center 35%" }}
      />
      <div className="hero-top">
        <div>
          <p className="hero-date">{today()}</p>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="hero-text">{text}</p>
        </div>
        {action && ActionIcon && (
          <Link className="btn btn-primary btn-lg" href={action.href}>
            <ActionIcon aria-hidden="true" />
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/* ================================================================ Estudiante */

type StepState = "done" | "current" | "upcoming" | "blocked";
type Detail = NonNullable<Awaited<ReturnType<typeof getPatDetailForStudent>>>;

function studentJourney(student: StudentRow, detail: Detail | null, tribunal: TribunalRow | null) {
  const profileComplete = Boolean(
    student.cedula && student.sex && student.personal_email && student.address && student.landline && student.phone,
  );
  const r = detail?.registration;
  const invited = detail?.membership.status === "INVITED";
  const editable = r ? isEditable(r.status) : false;
  const teamReady = r
    ? r.participation_type === "INDIVIDUAL" || detail!.members.every((member) => member.status === "ACCEPTED") && detail!.members.length > 1
    : false;
  const submitted = r ? r.status === "PENDING" || r.status === "APPROVED" : false;
  const defended = tribunal ? tribunal.defense_date < todayIso() : false;

  const steps: { title: string; detail: string; state: StepState }[] = [
    {
      title: "Datos personales",
      detail: profileComplete ? "Completos" : "Faltan datos en tu ficha",
      state: profileComplete ? "done" : "current",
    },
    {
      title: "Propuesta",
      detail: invited
        ? "Tienes una invitación"
        : !r
          ? "Modalidad, tema y problemática"
          : r.participation_type === "GRUPAL"
            ? teamReady
              ? "En pareja, equipo listo"
              : "Esperando a tu compañero/a"
            : "Individual",
      state: invited ? "current" : r && teamReady ? "done" : r || profileComplete ? "current" : "upcoming",
    },
    {
      title: "Firmas y envío",
      detail: submitted
        ? "Enviado"
        : r && editable && !invited
          ? `${detail!.requirements.filter((item) => item.done).length} de ${detail!.requirements.length} requisitos`
          : "Firma y envía a secretaría",
      state: submitted ? "done" : r && teamReady && !invited ? "current" : "upcoming",
    },
    {
      title: "Revisión",
      detail: r && r.status !== "DRAFT" ? patStatusLabel(r.status) : "Secretaría académica",
      state: !r || invited
        ? "upcoming"
        : r.status === "APPROVED"
          ? "done"
          : r.status === "RETURNED"
            ? "blocked"
            : r.status === "PENDING"
              ? "current"
              : "upcoming",
    },
    {
      title: "Tribunal y defensa",
      detail: tribunal ? longDate(tribunal.defense_date) : "Designación y sustentación",
      state: defended ? "done" : tribunal || r?.status === "APPROVED" ? "current" : "upcoming",
    },
  ];

  let next: { action: HeroAction; text: string };
  if (!profileComplete) {
    next = {
      action: { href: "/perfil", label: "Completar mis datos", icon: UserPen },
      text: "Primero completa tu cédula y tus datos de contacto: aparecen en el formato oficial.",
    };
  } else if (invited) {
    next = {
      action: { href: "/registro-pat-2", label: "Ver invitación", icon: MailOpen },
      text: "Un compañero/a te invitó a desarrollar el trabajo de titulación en pareja. Revisa la propuesta y responde.",
    };
  } else if (!r) {
    next = {
      action: { href: "/registro-pat-2", label: "Registrar mi tema", icon: FilePen },
      text: "Registra tu propuesta de titulación: modalidad, título provisional y problemática.",
    };
  } else if (r.status === "RETURNED") {
    next = {
      action: { href: "/registro-pat-2", label: "Corregir el registro", icon: FilePen },
      text: "Secretaría devolvió el registro con observaciones. Corrígelo y vuelve a enviarlo.",
    };
  } else if (r.status === "DRAFT") {
    const ready = canSubmit(detail!.requirements);
    const pending = detail!.requirements.find((item) => !item.done);
    next = {
      action: { href: "/registro-pat-2", label: ready ? "Enviar a revisión" : "Continuar registro", icon: FilePen },
      text: ready
        ? "Todo está listo. Envía el registro a secretaría."
        : `Tu registro es un borrador. Siguiente: ${pending?.label.toLowerCase()}.`,
    };
  } else if (r.status === "PENDING") {
    next = {
      action: { href: "/registro-pat-2", label: "Ver mi registro", icon: FilePen },
      text: "Secretaría está revisando tu registro. Verás la decisión aquí.",
    };
  } else if (!tribunal) {
    next = {
      action: { href: "/registro-pat-2", label: "Ver mi registro", icon: FilePen },
      text: "Tu tema fue aprobado. Secretaría asignará tu tribunal de defensa.",
    };
  } else {
    next = {
      action: { href: "/registro-pat-2", label: "Ver convocatoria", icon: Gavel },
      text: defended
        ? "Tu defensa ya se realizó. ¡Felicitaciones por completar el proceso!"
        : `Tu defensa es el ${longDate(tribunal.defense_date)} a las ${tribunal.defense_time}.`,
    };
  }

  return { steps, next };
}

async function StudentDashboard({ user }: { user: CurrentUser }) {
  const student = await getStudentByUserId(user.id);

  if (!student) {
    return (
      <>
        <Hero user={user} text="Bienvenido al sistema de titulación de la ULEAM." />
        <Alert tone="warning" title="Tu perfil académico aún no está registrado">
          Pide a la secretaría académica de tu facultad que registre tus datos de estudiante para iniciar el proceso.
        </Alert>
      </>
    );
  }

  const [detail, tribunal] = await Promise.all([getPatDetailForStudent(student.id), getTribunalByStudent(student.id)]);
  const { steps, next } = studentJourney(student, detail, tribunal);
  const r = detail?.registration;
  const invited = detail?.membership.status === "INVITED";
  const leader = detail?.members.find((member) => member.role === "LEADER");

  return (
    <>
      <Hero user={user} text={next.text} action={next.action}>
        <ol className="route" aria-label="Ruta de titulación">
          {steps.map((step) => (
            <li className={`route-step is-${step.state}`} key={step.title} aria-current={step.state === "current" ? "step" : undefined}>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </li>
          ))}
        </ol>
      </Hero>

      {invited && leader && (
        <Link className="invite-card is-link" href="/registro-pat-2">
          <MailOpen aria-hidden="true" />
          <div>
            <strong>
              {leader.name} {leader.lastname} te invitó a su trabajo en pareja
            </strong>
            <p>«{r?.title}»</p>
          </div>
          <ChevronRight className="link-row-chevron" aria-hidden="true" />
        </Link>
      )}

      {r?.status === "RETURNED" && !invited && (
        <Alert tone="error" title="El registro fue devuelto con observaciones">
          {r.observations}
        </Alert>
      )}

      <div className="dash-grid">
        <div className="dash-column">
          <StudentProfileCard student={student} editHref="/perfil" />
          {detail && !invited && (
            <section className="panel-card" aria-labelledby="activity-title">
              <header className="panel-card-head">
                <h2 id="activity-title">Actividad del registro</h2>
              </header>
              <div className="panel-card-body">
                <Timeline events={detail.events} limit={5} />
              </div>
            </section>
          )}
        </div>

        <div className="dash-column">
          <section className="panel-card" aria-labelledby="topic-title">
            <header className="panel-card-head">
              <h2 id="topic-title">Mi tema</h2>
              {r && !invited && <Badge tone={patStatusTone(r.status)}>{patStatusLabel(r.status)}</Badge>}
            </header>
            {r && !invited ? (
              <>
                <div className="panel-card-body">
                  <p style={{ fontWeight: 600 }}>{r.title}</p>
                  <p className="text-muted" style={{ marginTop: 6, fontSize: 14 }}>
                    {r.modality}
                  </p>
                </div>
                {detail!.members.length > 1 && <MembersList members={detail!.members} youStudentId={student.id} signedByScan={Boolean(detail!.scan)} />}
              </>
            ) : (
              <div className="panel-card-body">
                <p className="text-muted">
                  {invited
                    ? "Responde la invitación para unirte al tema propuesto o crear el tuyo."
                    : "Aún no registras tu tema. Necesitas la modalidad, el título provisional y la problemática; si trabajas en pareja, invitarás a tu compañero/a desde el registro."}
                </p>
              </div>
            )}
          </section>

          <section className="panel-card" aria-labelledby="defense-title">
            <header className="panel-card-head">
              <h2 id="defense-title">Mi defensa</h2>
            </header>
            {tribunal ? (
              <DefenseDetails tribunal={tribunal} />
            ) : (
              <div className="panel-card-body">
                <p className="text-muted">
                  Cuando tu tema esté aprobado, secretaría asignará el tribunal y verás aquí la fecha, hora y lugar.
                </p>
              </div>
            )}
          </section>

          <section className="help-card">
            <strong>¿Tienes dudas?</strong>
            <p>Escribe a la secretaría académica de tu facultad indicando tu cédula y carrera.</p>
          </section>
        </div>
      </div>
    </>
  );
}

/* ================================================================ Personal */

function PendingList({ rows }: { rows: PatRegistration[] }) {
  return (
    <section className="panel-card" aria-labelledby="pending-title">
      <header className="panel-card-head">
        <div>
          <h2 id="pending-title">Registros por revisar</h2>
          <p>Los más antiguos primero.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/aprobacion-pat-2">
          Ver todos
        </Link>
      </header>
      {rows.length === 0 ? (
        <div className="panel-card-body">
          <p className="text-muted">No hay registros pendientes. Todo está al día.</p>
        </div>
      ) : (
        <ul className="link-list">
          {rows.map((row) => (
            <li key={row.id}>
              <Link className="link-row" href={`/aprobacion-pat-2/${row.id}`}>
                <span className="link-row-icon" aria-hidden="true">
                  {row.member_count > 1 ? <Users /> : <FilePen />}
                </span>
                <span className="link-row-text">
                  <strong>{row.members_label}</strong>
                  <small>
                    {row.career}, enviado el {row.submitted_at ? shortDateTime(row.submitted_at) : "—"}
                  </small>
                </span>
                <ChevronRight className="link-row-chevron" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function StaffDashboard({ user }: { user: CurrentUser }) {
  const isAdmin = user.role === "ADMIN";
  const [counts, pending, withoutTribunal, tribunals, metrics, activity] = await Promise.all([
    countRegistrationsByStatus(),
    listRegistrations({ status: "PENDING" }),
    listApprovedWithoutTribunal(),
    listTribunals(),
    isAdmin ? getAdminMetrics() : null,
    recentEvents(6),
  ]);
  const upcoming = tribunals.filter((row) => row.defense_date >= todayIso()).slice(0, 4);

  const tiles = [
    { label: "Por revisar", value: counts.PENDING, href: "/aprobacion-pat-2?estado=PENDING", attention: counts.PENDING > 0 },
    { label: "Esperan tribunal", value: withoutTribunal.length, href: "/tribunales", attention: withoutTribunal.length > 0 },
    { label: "Temas aprobados", value: counts.APPROVED, href: "/aprobacion-pat-2?estado=APPROVED" },
    metrics
      ? { label: "Estudiantes", value: metrics.students, href: "/estudiantes" }
      : { label: "Defensas programadas", value: upcoming.length, href: "/tribunales" },
  ];
  const modules = [
    { title: "Usuarios", description: "Cuentas del personal, roles y accesos.", href: "/admin/usuarios", icon: Users },
    { title: "Carreras y facultades", description: "Catálogo académico usado en los registros.", href: "/admin/carreras", icon: Building2 },
    { title: "Estudiantes", description: "Busca, registra y actualiza estudiantes.", href: "/estudiantes", icon: UsersRound },
  ];
  const patTotal = counts.PENDING + counts.RETURNED + counts.APPROVED;

  return (
    <>
      <Hero
        user={user}
        text={
          counts.PENDING > 0
            ? `Tienes ${counts.PENDING} ${counts.PENDING === 1 ? "registro de tema pendiente" : "registros de tema pendientes"} de revisión.`
            : withoutTribunal.length > 0
              ? `${withoutTribunal.length} ${withoutTribunal.length === 1 ? "tema aprobado espera" : "temas aprobados esperan"} su tribunal.`
              : "No hay trámites pendientes. Todo está al día."
        }
        action={
          counts.PENDING > 0
            ? { href: "/aprobacion-pat-2?estado=PENDING", label: "Revisar registros", icon: ClipboardCheck }
            : withoutTribunal.length > 0
              ? { href: "/tribunales", label: "Asignar tribunales", icon: Gavel }
              : { href: "/estudiantes/nuevo", label: "Nuevo estudiante", icon: UserPlus }
        }
      />

      <section className="stat-grid" aria-label="Indicadores">
        {tiles.map((tile) => (
          <Link className={`stat-tile${tile.attention ? " is-attention" : ""}`} href={tile.href} key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value.toLocaleString("es-EC")}</strong>
          </Link>
        ))}
      </section>

      <div className="dash-grid">
        <div className="dash-column">
          <PendingList rows={pending.rows.slice(0, 5)} />

          <section className="panel-card" aria-labelledby="activity-title">
            <header className="panel-card-head">
              <h2 id="activity-title">Actividad reciente</h2>
            </header>
            {activity.length === 0 ? (
              <div className="panel-card-body">
                <p className="text-muted">Aún no hay movimientos en los registros.</p>
              </div>
            ) : (
              <ul className="link-list">
                {activity.map((event) => (
                  <li key={event.id}>
                    <Link className="link-row is-compact" href={`/aprobacion-pat-2/${event.registration_id}`}>
                      <span className="link-row-text">
                        <strong>
                          {event.actor_name ?? "Sistema"}{" "}
                          <span className="text-muted" style={{ fontWeight: 400 }}>
                            {(eventLabels[event.type] ?? event.type).replace(/^./, (c) => c.toLowerCase())}
                          </span>
                        </strong>
                        <small>
                          «{event.title}» · {shortDateTime(event.created_at)}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isAdmin && (
            <section className="panel-card" aria-labelledby="modules-title">
              <header className="panel-card-head">
                <h2 id="modules-title">Administración</h2>
              </header>
              <ul className="link-list">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <li key={module.href}>
                      <Link className="link-row" href={module.href}>
                        <span className="link-row-icon" aria-hidden="true">
                          <Icon />
                        </span>
                        <span className="link-row-text">
                          <strong>{module.title}</strong>
                          <small>{module.description}</small>
                        </span>
                        <ChevronRight className="link-row-chevron" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <div className="dash-column">
          <section className="panel-card" aria-labelledby="upcoming-title">
            <header className="panel-card-head">
              <h2 id="upcoming-title">Próximas defensas</h2>
              <Link className="btn btn-ghost btn-sm" href="/tribunales">
                Tribunales
              </Link>
            </header>
            {upcoming.length === 0 ? (
              <div className="panel-card-body">
                <p className="text-muted">No hay defensas programadas.</p>
              </div>
            ) : (
              <ul className="note-list">
                {upcoming.map((row) => (
                  <li key={row.id}>
                    <strong>{row.student_name}</strong>
                    <span>
                      {longDate(row.defense_date)}, {row.defense_time} en {row.place}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel-card" aria-labelledby="pat-status-title">
            <header className="panel-card-head">
              <h2 id="pat-status-title">Registros PAT 2</h2>
              <span className="text-muted tabular" style={{ fontSize: 13 }}>
                {patTotal} enviados · {counts.DRAFT} en preparación
              </span>
            </header>
            <ul className="bar-list">
              {(["PENDING", "RETURNED", "APPROVED"] as const).map((status) => (
                <li key={status}>
                  <div>
                    <span>{patStatusLabel(status)}</span>
                    <strong>{counts[status]}</strong>
                  </div>
                  <span className={`bar-track is-${patStatusTone(status)}`} aria-hidden="true">
                    <span style={{ width: `${patTotal ? (counts[status] / patTotal) * 100 : 0}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {metrics && metrics.inactiveUsers > 0 && (
            <Alert tone="info" title={`${metrics.inactiveUsers} cuentas inactivas`}>
              No pueden iniciar sesión hasta que se reactiven en Usuarios.
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}

export default async function PanelPage() {
  const user = await requireUser();
  return (
    <div className="stack">
      {user.role === "STUDENT" ? <StudentDashboard user={user} /> : <StaffDashboard user={user} />}
    </div>
  );
}
