import Link from "next/link";
import { createStudentAction } from "@/app/(app)/estudiantes/actions";
import { StudentForm } from "@/components/student-form";
import { Alert, PageHeader } from "@/components/ui";
import { listCareers } from "@/lib/data/catalogs";

export default async function NewStudentPage() {
  const careers = await listCareers({ onlyActive: true });

  return (
    <>
      <Link className="back-link" href="/estudiantes">
        ← Volver a estudiantes
      </Link>
      <PageHeader
        eyebrow="GESTIÓN ACADÉMICA"
        title="Nuevo estudiante"
        description="Registra al estudiante y crea su cuenta de acceso al sistema."
      />
      {careers.length === 0 ? (
        <Alert tone="warning" title="No hay carreras activas">
          Antes de registrar estudiantes, un administrador debe crear al menos
          una facultad y una carrera.
        </Alert>
      ) : (
        <StudentForm action={createStudentAction} careers={careers} mode="create" />
      )}
    </>
  );
}
