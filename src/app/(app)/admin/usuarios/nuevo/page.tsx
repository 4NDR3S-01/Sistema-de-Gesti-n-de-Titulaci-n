import type { Metadata } from "next";
import Link from "next/link";
import { createUserAction } from "@/app/(app)/admin/usuarios/actions";
import { BackLink, PageHeader } from "@/components/ui";
import { UserForm } from "@/components/user-form";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default function NewUserPage() {
  return (
    <>
      <BackLink href="/admin/usuarios">Volver a usuarios</BackLink>
      <PageHeader
        eyebrow="Administración"
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
