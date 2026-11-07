import type { Metadata } from "next";
import { createStudentAction } from "@/app/(app)/estudiantes/actions";
import { StudentForm } from "@/components/student-form";
import { Alert, BackLink, PageHeader } from "@/components/ui";
import { listCareers } from "@/lib/data/catalogs";

export const metadata: Metadata = { title: "Nuevo estudiante" };

export default async function NewStudentPage() {
  const careers = await listCareers({ onlyActive: true });

  return (
    <>
      <BackLink href="/estudiantes">Volver a estudiantes</BackLink>
      <PageHeader
        eyebrow="Gestión académica"
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
