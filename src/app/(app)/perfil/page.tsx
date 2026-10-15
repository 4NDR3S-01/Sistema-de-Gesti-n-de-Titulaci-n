import { updateOwnProfileAction } from "@/app/(app)/perfil/actions";
import { StudentSelfForm } from "@/components/student-form";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/current-user";
import { getStudentByUserId } from "@/lib/data/students";

export default async function ProfilePage() {
  const user = await requireUser(["STUDENT"]);
  const student = await getStudentByUserId(user.id);

  return (
    <>
      <PageHeader
        eyebrow="MI CUENTA"
        title="Mis datos"
        description="Revisa y actualiza tu información personal y académica."
      />
      {student ? (
        <div className="stack">
          <Alert tone="info" title={`${student.career} · ${student.faculty}`}>
            Tu carrera, facultad, semestre y año de ingreso los registra
            secretaría académica. Si hay un error, comunícate con ellos.
          </Alert>
          <StudentSelfForm
            action={updateOwnProfileAction}
            initial={{
              cedula: student.cedula ?? "",
              name: student.name,
              lastname: student.lastname,
              email: student.email,
              sex: student.sex ?? "",
              personalEmail: student.personal_email ?? "",
              address: student.address ?? "",
              landline: student.landline ?? "",
              phone: student.phone ?? "",
              curriculumChanges: student.curriculum_changes?.toString() ?? "",
            }}
          />
        </div>
      ) : (
        <Alert tone="warning" title="Tu perfil académico aún no está registrado">
          Comunícate con secretaría académica para que registren tus datos de
          estudiante.
        </Alert>
      )}
    </>
  );
}
