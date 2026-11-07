import Link from "next/link";
import { UserPen } from "lucide-react";
import type { StudentRow } from "@/lib/data/students";

const sexLabel = { MASCULINO: "Masculino", FEMENINO: "Femenino" } as const;

export function StudentProfileCard({
  student,
  editHref,
}: {
  student: StudentRow;
  editHref?: string;
}) {
  const initials = `${student.name[0] ?? ""}${student.lastname[0] ?? ""}`.toUpperCase();
  const details = [
    { label: "Cédula", value: student.cedula },
    { label: "Sexo", value: student.sex ? sexLabel[student.sex] : null },
    { label: "Semestre", value: student.semester ? `${student.semester}.º semestre` : null },
    { label: "Año de ingreso", value: student.enrollment_year?.toString() },
    { label: "Correo institucional", value: student.email, wide: true },
    { label: "Correo personal", value: student.personal_email, wide: true },
    { label: "Celular", value: student.phone },
    { label: "Teléfono", value: student.landline },
    { label: "Domicilio", value: student.address, wide: true },
  ];

  return (
    <section className="panel-card" aria-labelledby="profile-title">
      <header className="profile-head">
        <span className="profile-avatar" aria-hidden="true">
          {initials}
        </span>
        <div>
          <h2 id="profile-title">
            {student.name} {student.lastname}
          </h2>
          <p>
            {student.career}, {student.faculty}
          </p>
        </div>
        {editHref && (
          <Link className="btn btn-secondary btn-sm" href={editHref}>
            <UserPen aria-hidden="true" /> Actualizar mis datos
          </Link>
        )}
      </header>

      <dl className="profile-details">
        {details.map((item) => (
          <div key={item.label} className={item.wide ? "is-wide" : undefined}>
            <dt>{item.label}</dt>
            <dd>{item.value || <span className="text-muted">Sin registrar</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
