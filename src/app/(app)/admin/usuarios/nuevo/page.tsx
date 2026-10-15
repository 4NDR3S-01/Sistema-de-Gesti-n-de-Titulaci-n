import Link from "next/link";
import { createUserAction } from "@/app/(app)/admin/usuarios/actions";
import { PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";

export default function NewUserPage() {
  return (
    <>
      <Link className="back-link" href="/admin/usuarios">
        ← Volver a usuarios
      </Link>
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Nuevo usuario"
        description={
          <>
            Crea cuentas para el personal de secretaría o administración. Para
            registrar estudiantes usa <Link href="/estudiantes/nuevo">Nuevo estudiante</Link>.
          </>
        }
      />
      <UserForm action={createUserAction} mode="create" />
    </>
  );
}
