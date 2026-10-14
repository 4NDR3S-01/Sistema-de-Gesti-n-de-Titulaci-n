import { updateOwnProfileAction } from "@/app/(app)/perfil/actions";
import { ProfileForm } from "@/components/profile-form";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/current-user";
import { getStudentByUserId, getStudentTitlingStatus } from "@/lib/data/students";

export default async function ProfilePage() {
  const user = await requireUser(["STUDENT"]);
  const student = await getStudentByUserId(user.id);

  return (
    <>
      <PageHeader
        eyebrow="MI CUENTA"
        title="Mis datos"
        description="Revisa tu información registrada y actualiza tus datos de contacto."
      />
      {student ? (
        <div className="stack">
          <StudentProfileCard
            student={student}
            status={await getStudentTitlingStatus(student.id)}
          />
          <ProfileForm
            action={updateOwnProfileAction}
            email={student.email}
            phone={student.phone ?? ""}
          />
          <Alert tone="info" title="¿Hay un error en tu cédula, carrera o facultad?">
            Esos datos solo los puede corregir secretaría académica. Comunícate
            con ellos para solicitar el cambio.
          </Alert>
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
