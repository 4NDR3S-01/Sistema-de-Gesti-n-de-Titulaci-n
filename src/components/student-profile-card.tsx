import Link from "next/link";
import { Badge } from "@/components/ui";
import type { StudentRow, StudentTitlingStatus } from "@/lib/data/students";
import {
  procedureTypeLabel,
  stageLabel,
  statusLabel,
  statusTone,
} from "@/lib/labels";

export function StudentProfileCard({
  student,
  status,
  editHref,
}: {
  student: StudentRow;
  status: StudentTitlingStatus;
  editHref?: string;
}) {
  const initials = `${student.name[0] ?? ""}${student.lastname[0] ?? ""}`.toUpperCase();
  const sexLabel = { MASCULINO: "Masculino", FEMENINO: "Femenino" } as const;
  const details = [
    { label: "Cédula", value: student.cedula },
    { label: "Sexo", value: student.sex ? sexLabel[student.sex] : null },
    { label: "Carrera", value: student.career },
    { label: "Facultad", value: student.faculty },
    { label: "Correo institucional", value: student.email, wide: true },
    { label: "Correo personal", value: student.personal_email, wide: true },
    { label: "Domicilio", value: student.address, wide: true },
    { label: "Teléfono", value: student.landline },
    { label: "Celular", value: student.phone },
    { label: "Semestre / nivel", value: student.semester ? `${student.semester}.º semestre` : null },
    { label: "Año de ingreso", value: student.enrollment_year?.toString() },
    { label: "Número de cambio de malla", value: student.curriculum_changes?.toString(), wide: true },
  ];

  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <header className="profile-card-head">
        <span className="profile-avatar" aria-hidden="true">{initials}</span>
        <div>
          <span className="page-eyebrow">PERFIL DEL ESTUDIANTE</span>
          <h2 id="profile-title">
            {student.name} {student.lastname}
          </h2>
          <p>
            {student.career} · {student.faculty}
          </p>
        </div>
        {editHref && (
          <Link className="btn btn-secondary btn-sm" href={editHref}>
            Actualizar mis datos
          </Link>
        )}
      </header>

      <dl className="profile-details">
        {details.map((item) => (
          <div key={item.label} className={item.wide ? "is-wide" : undefined}>
            <dt>{item.label}</dt>
            <dd>{item.value || <span className="text-muted">No registrado</span>}</dd>
          </div>
        ))}
      </dl>

      <footer className="profile-status">
        <div>
          <span>Trámite de titulación</span>
          {status.procedure_status ? (
            <p>
              <Badge tone={statusTone(status.procedure_status)}>
                {statusLabel(status.procedure_status)}
              </Badge>
              {status.procedure_type && <> {procedureTypeLabel(status.procedure_type)}</>}
              {status.procedure_stage && <> · Etapa: {stageLabel(status.procedure_stage)}</>}
            </p>
          ) : (
            <p className="text-muted">Aún no tienes un trámite registrado.</p>
          )}
        </div>
        <div>
          <span>Proyecto de titulación</span>
          {status.project_title ? (
            <p>
              {status.project_title}
              {status.project_status && (
                <>
                  {" "}
                  <Badge tone={statusTone(status.project_status)}>
                    {statusLabel(status.project_status)}
                  </Badge>
                </>
              )}
              {status.advisor_name && (
                <small className="text-muted">Tutor: {status.advisor_name}</small>
              )}
            </p>
          ) : (
            <p className="text-muted">Aún no tienes un tema registrado.</p>
          )}
        </div>
      </footer>
    </section>
  );
}
