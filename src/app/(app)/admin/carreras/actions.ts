"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import {
  createCareer,
  createFaculty,
  deleteCareer,
  deleteFaculty,
  setCareerActive,
  setFacultyActive,
  updateCareer,
  updateFaculty,
} from "@/lib/data/catalogs";
import { pgErrorCode } from "@/lib/db";
import { careerSchema, facultySchema } from "@/lib/validation";

const PATH = "/admin/carreras";

/** Ejecuta la operación y vuelve a la página con un mensaje de resultado. */
async function run(operation: () => Promise<void>, ok: string): Promise<never> {
  await requireUser(["ADMIN"]);
  let error: string | undefined;
  try {
    await operation();
  } catch (caught) {
    const code = pgErrorCode(caught);
    error = code === "23505" ? "duplicado" : code === "23503" ? "en-uso" : "desconocido";
    if (error === "desconocido") console.error("Error en catálogos", caught);
  }
  revalidatePath(PATH);
  revalidatePath("/estudiantes");
  redirect(error ? `${PATH}?error=${error}` : `${PATH}?ok=${ok}`);
}

function invalid(): never {
  redirect(`${PATH}?error=invalido`);
}

export async function createFacultyAction(formData: FormData) {
  await requireUser(["ADMIN"]);
  const parsed = facultySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid();
  await run(() => createFaculty(parsed.data.name), "facultad-creada");
}

export async function updateFacultyAction(id: number, formData: FormData) {
  await requireUser(["ADMIN"]);
  const parsed = facultySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid();
  await run(() => updateFaculty(id, parsed.data.name), "facultad-actualizada");
}

export async function setFacultyActiveAction(id: number, isActive: boolean) {
  await run(() => setFacultyActive(id, isActive), isActive ? "activada" : "desactivada");
}

export async function deleteFacultyAction(id: number) {
  await run(() => deleteFaculty(id), "facultad-eliminada");
}

export async function createCareerAction(formData: FormData) {
  await requireUser(["ADMIN"]);
  const parsed = careerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid();
  await run(() => createCareer(parsed.data.facultyId, parsed.data.name), "carrera-creada");
}

export async function updateCareerAction(id: number, formData: FormData) {
  await requireUser(["ADMIN"]);
  const parsed = careerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid();
  await run(
    () => updateCareer(id, parsed.data.facultyId, parsed.data.name),
    "carrera-actualizada",
  );
}

export async function setCareerActiveAction(id: number, isActive: boolean) {
  await run(() => setCareerActive(id, isActive), isActive ? "activada" : "desactivada");
}

export async function deleteCareerAction(id: number) {
  await run(() => deleteCareer(id), "carrera-eliminada");
}
