import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateStudentAction } from "@/app/(app)/estudiantes/actions";
import { StudentForm } from "@/components/student-form";
import { BackLink, PageHeader } from "@/components/ui";
import { listCareers } from "@/lib/data/catalogs";
import { getStudentById } from "@/lib/data/students";

export const metadata: Metadata = { title: "Editar estudiante" };

export default async function EditStudentPage(
  props: PageProps<"/estudiantes/[id]/editar">,
) {
  const { id } = await props.params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId) || studentId <= 0) notFound();

  const [student, careers] = await Promise.all([
    getStudentById(studentId),
    listCareers(),
  ]);
  if (!student) notFound();

  // Las carreras inactivas solo se ofrecen si el estudiante ya pertenece a ella.
  const options = careers.filter(
    (career) => career.is_active || career.id === student.career_id,
  );

  return (
    <>
      <BackLink href="/estudiantes">Volver a estudiantes</BackLink>
      <PageHeader
        eyebrow="Gestión académica"
        title={`${student.name} ${student.lastname}`}
        description="Actualiza los datos personales y académicos del estudiante."
      />
      <StudentForm
        action={updateStudentAction.bind(null, student.id)}
        careers={options}
        mode="edit"
        initial={{
          name: student.name,
          lastname: student.lastname,
          email: student.email,
          cedula: student.cedula ?? "",
          careerId: String(student.career_id),
          semester: student.semester?.toString() ?? "",
          phone: student.phone ?? "",
          sex: student.sex ?? "",
          personalEmail: student.personal_email ?? "",
          address: student.address ?? "",
          landline: student.landline ?? "",
          curriculumChanges: student.curriculum_changes?.toString() ?? "",
          enrollmentYear: student.enrollment_year?.toString() ?? "",
        }}
      />
    </>
  );
}
