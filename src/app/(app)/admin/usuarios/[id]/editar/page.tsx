import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateUserAction } from "@/app/(app)/admin/usuarios/actions";
import { PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { getDbRoleLabel } from "@/lib/auth-roles";
import { getUserById } from "@/lib/data/users";

export default async function EditUserPage(
  props: PageProps<"/admin/usuarios/[id]/editar">,
) {
  const { id } = await props.params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const user = await getUserById(userId);
  if (!user) notFound();
  // Las cuentas de estudiante se editan junto con sus datos académicos.
  if (user.student_id) redirect(`/estudiantes/${user.student_id}/editar`);

  const isStaff = user.role === "ADMIN" || user.role === "SECRETARY";

  return (
    <>
      <Link className="back-link" href="/admin/usuarios">
        ← Volver a usuarios
      </Link>
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title={`${user.name} ${user.lastname}`}
        description="Actualiza los datos, el rol o la contraseña de la cuenta."
      />
      <UserForm
        action={updateUserAction.bind(null, user.id)}
        mode="edit"
        initial={user}
        currentRoleLabel={
          isStaff
            ? undefined
            : user.role === "STUDENT"
              ? "Estudiante (se mantiene; falta registrar sus datos académicos)"
              : `${getDbRoleLabel(user.role)} (sin acceso al sistema)`
        }
      />
    </>
  );
}
