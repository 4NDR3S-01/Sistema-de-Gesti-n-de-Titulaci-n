import {
  Check,
  CircleCheck,
  CircleDashed,
  Clock3,
  Crown,
  FileCheck2,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { PatDetail, PatEvent, PatMember } from "@/lib/data/pat";
import { shortDateTime } from "@/lib/labels";
import { ageFrom, patArticulations } from "@/lib/pat-options";
import { eventLabels, personalDataComplete, type Requirement } from "@/lib/pat-rules";

const sexLabel: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino" };

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/* -------------------------------------------------------------- Propuesta */

export function ProposalSummary({ detail }: { detail: PatDetail }) {
  const r = detail.registration;
  const articulations = patArticulations
    .filter((option) => r.articulations.includes(option.value))
    .map((option) => option.label);

  return (
    <>
      <section className="review-section">
        <p className="text-muted" style={{ fontSize: 14 }}>
          {r.modality}
        </p>
        <p className="review-title" style={{ marginTop: 6 }}>
          {r.title}
        </p>
      </section>
      <section className="review-section">
        <h3 className="review-heading">Problemática</h3>
        <p className="review-problem">{r.problem}</p>
      </section>
      <section className="review-section">
        <dl className="readonly-grid">
          <div>
            <dt>Desarrollo</dt>
            <dd>{r.participation_type === "GRUPAL" ? "En pareja" : "Individual"}</dd>
          </div>
          <div>
            <dt>Mecanismo</dt>
            <dd>{r.presentation_mechanism}</dd>
          </div>
          <div className="is-wide">
            <dt>Tutor/a sugerido/a</dt>
            <dd>{r.requested_tutor || <span className="text-muted">Sin sugerencia</span>}</dd>
          </div>
        </dl>
        <h3 className="review-heading" style={{ marginTop: 18 }}>
          Articulación
        </h3>
        <ul className="tag-list">
          {articulations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* -------------------------------------------------------------- Integrantes */

function memberState(
  member: PatMember,
  signedByScan: boolean,
): { label: string; tone: "success" | "warning" | "neutral" | "info" } {
  if (member.status === "INVITED") return { label: "Invitación pendiente", tone: "warning" };
  if (member.signature) return { label: "Firmó", tone: "success" };
  if (signedByScan) return { label: "Firmó (escaneado)", tone: "success" };
  if (!personalDataComplete(member.extra_data)) return { label: "Faltan sus datos", tone: "warning" };
  return { label: "Falta su firma", tone: "info" };
}

export function MemberRow({
  member,
  isYou,
  signedByScan = false,
}: {
  member: PatMember;
  isYou?: boolean;
  signedByScan?: boolean;
}) {
  const name = `${member.name} ${member.lastname}`;
  const state = memberState(member, signedByScan);
  return (
    <li className="member-row">
      <span className={`member-avatar${member.status === "INVITED" ? " is-pending" : ""}`} aria-hidden="true">
        {initials(name)}
      </span>
      <span className="member-text">
        <strong>
          {name}
          {isYou && <span className="text-muted"> (tú)</span>}
          {member.role === "LEADER" && (
            <span className="member-role" title="Creó el registro">
              <Crown aria-hidden="true" /> Autor/a
            </span>
          )}
        </strong>
        <small>
          {member.email}
          {member.cedula && ` · C.I. ${member.cedula}`}
        </small>
      </span>
      {member.signature ? (
        // eslint-disable-next-line @next/next/no-img-element -- firma en data URL
        <img className="member-signature" src={member.signature} alt={`Firma de ${name}`} />
      ) : null}
      <Badge tone={state.tone}>{state.label}</Badge>
    </li>
  );
}

export function MembersList({
  members,
  youStudentId,
  signedByScan = false,
}: {
  members: PatMember[];
  youStudentId?: number;
  /** El registro tiene el formato firmado a mano y escaneado. */
  signedByScan?: boolean;
}) {
  return (
    <ul className="member-list-rows">
      {members.map((member) => (
        <MemberRow
          member={member}
          isYou={member.student_id === youStudentId}
          signedByScan={signedByScan}
          key={member.id}
        />
      ))}
    </ul>
  );
}

/** Datos informativos de cada integrante, en solo lectura (vista de secretaría). */
export function MemberDataSummary({ member }: { member: PatMember }) {
  const extra = member.extra_data;
  const age = ageFrom(extra.birthDate);
  const items = [
    { label: "Cédula", value: member.cedula },
    { label: "Sexo", value: member.sex ? sexLabel[member.sex] : null },
    { label: "Nivel y paralelo", value: [extra.level, extra.parallel && `paralelo ${extra.parallel}`].filter(Boolean).join(", ") },
    { label: "Curso", value: extra.curso || (member.semester ? `${member.semester}.º` : null) },
    { label: "Nacimiento", value: extra.birthDate ? `${extra.birthDate}${age !== null ? ` (${age} años)` : ""}` : null },
    { label: "Nacionalidad", value: extra.nationality },
    { label: "Estado civil", value: extra.maritalStatus },
    { label: "Residencia", value: [extra.parish, extra.canton, extra.province].filter(Boolean).join(", "), wide: true },
    { label: "Correo personal", value: member.personal_email },
    { label: "Celular", value: member.phone },
    { label: "Teléfono", value: member.landline },
    { label: "Certificado de votación", value: extra.votingCertificate },
    { label: "Discapacidad", value: extra.disabilityType ? `${extra.disabilityType}, ${extra.disabilityDegree ?? "?"} %` : "Ninguna", wide: true },
  ];
  return (
    <dl className="readonly-grid">
      {items.map((item) => (
        <div key={item.label} className={item.wide ? "is-wide" : undefined}>
          <dt>{item.label}</dt>
          <dd>{item.value || <span className="text-muted">Sin registrar</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------- Requisitos */

export function RequirementList({ items }: { items: Requirement[] }) {
  return (
    <ul className="requirement-list">
      {items.map((item) => (
        <li key={item.key} className={item.done ? "is-done" : undefined}>
          {item.done ? <CircleCheck aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}
          <span>{item.label}</span>
          <span className="sr-only">{item.done ? "(listo)" : "(pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- Historial */

const eventIcons: Record<string, LucideIcon> = {
  SIGNED: PenLine,
  SCAN_UPLOADED: FileCheck2,
  APPROVED: Check,
};

export function Timeline({ events, limit }: { events: PatEvent[]; limit?: number }) {
  const shown = limit ? events.slice(0, limit) : events;
  if (shown.length === 0) return <p className="text-muted">Sin actividad todavía.</p>;
  return (
    <ol className="timeline">
      {shown.map((event) => {
        const Icon = eventIcons[event.type] ?? Clock3;
        return (
          <li key={event.id} className={`timeline-item is-${event.type.toLowerCase()}`}>
            <span className="timeline-dot" aria-hidden="true">
              <Icon />
            </span>
            <div>
              {event.type === "SIGNATURES_RESET" ? (
                <p>{eventLabels[event.type]}</p>
              ) : (
                <p>
                  <strong>{event.actor_name ?? "Sistema"}</strong>{" "}
                  {(eventLabels[event.type] ?? event.type).replace(/^./, (c) => c.toLowerCase())}
                  {event.detail && event.type === "INVITED" && <> a {event.detail}</>}
                </p>
              )}
              {event.detail && ["RETURNED", "APPROVED"].includes(event.type) && (
                <p className="timeline-note">{event.detail}</p>
              )}
              <time dateTime={event.created_at.toISOString()}>{shortDateTime(event.created_at)}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
