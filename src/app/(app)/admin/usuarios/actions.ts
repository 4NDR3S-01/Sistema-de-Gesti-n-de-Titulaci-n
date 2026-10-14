"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import {
  countActiveAdmins,
  createStaffUser,
  getUserById,
  setUserActive,
  updateUser,
} from "@/lib/data/users";
import { pgErrorCode } from "@/lib/db";
import { formResult, type FormState } from "@/lib/form-state";
import {
  formValues,
  userCreateSchema,
  userUpdateSchema,
  validationError,
} from "@/lib/validation";

function userDbError(error: unknown, formData: FormData): FormState {
  if (pgErrorCode(error) === "23505") {
    return validationError(formData, { email: ["Ya existe un usuario con ese correo."] });
  }
  console.error("Error al guardar usuario", error);
  return formResult({
    status: "error",
    message: "No se pudo guardar el usuario. Inténtalo de nuevo.",
    values: formValues(formData),
  });
}

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["ADMIN"]);

  const parsed = userCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  try {
    await createStaffUser(parsed.data);
  } catch (error) {
    return userDbError(error, formData);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=creado");
}

export async function updateUserAction(
  userId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireUser(["ADMIN"]);

  const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  const target = await getUserById(userId);
  if (!target) return formResult({ status: "error", message: "El usuario ya no existe." });

  // Los estudiantes conservan su rol: sus datos se editan desde Estudiantes.
  const role = target.role === "STUDENT" ? undefined : parsed.data.role;
  if (target.id === admin.id && role && role !== "ADMIN") {
    return validationError(formData, {
      role: ["No puedes quitarte el rol de administrador a ti mismo."],
    });
  }

  try {
    await updateUser(userId, { ...parsed.data, role });
  } catch (error) {
    return userDbError(error, formData);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=actualizado");
}

export async function setUserActiveAction(
  userId: number,
  isActive: boolean,
): Promise<void> {
  const admin = await requireUser(["ADMIN"]);
  const target = await getUserById(userId);
  if (!target) redirect("/admin/usuarios?error=no-existe");

  if (!isActive) {
    if (target.id === admin.id) redirect("/admin/usuarios?error=propio");
    if (target.role === "ADMIN" && target.is_active && (await countActiveAdmins()) <= 1) {
      redirect("/admin/usuarios?error=ultimo-admin");
    }
  }

  await setUserActive(userId, isActive);
  revalidatePath("/admin/usuarios");
  redirect(`/admin/usuarios?ok=${isActive ? "activado" : "desactivado"}`);
}
