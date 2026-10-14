import "server-only";
import { query } from "@/lib/db";

export type FacultyRow = {
  id: number;
  name: string;
  is_active: boolean;
  career_count: number;
  student_count: number;
};

export type CareerRow = {
  id: number;
  name: string;
  is_active: boolean;
  faculty_id: number;
  faculty: string;
  student_count: number;
};

export async function listFaculties(): Promise<FacultyRow[]> {
  return query<FacultyRow>(
    `SELECT f.id, f.name, f.is_active,
            COUNT(DISTINCT c.id)::int AS career_count,
            COUNT(s.id)::int AS student_count
     FROM faculties f
     LEFT JOIN careers c ON c.faculty_id = f.id
     LEFT JOIN students s ON s.career_id = c.id
     GROUP BY f.id
     ORDER BY f.name`,
  );
}

export async function listCareers(options: { onlyActive?: boolean } = {}): Promise<CareerRow[]> {
  return query<CareerRow>(
    `SELECT c.id, c.name, c.is_active, f.id AS faculty_id, f.name AS faculty,
            COUNT(s.id)::int AS student_count
     FROM careers c
     JOIN faculties f ON f.id = c.faculty_id
     LEFT JOIN students s ON s.career_id = c.id
     ${options.onlyActive ? "WHERE c.is_active AND f.is_active" : ""}
     GROUP BY c.id, f.id
     ORDER BY f.name, c.name`,
  );
}

export async function createFaculty(name: string): Promise<void> {
  await query("INSERT INTO faculties (name) VALUES ($1)", [name]);
}

export async function updateFaculty(id: number, name: string): Promise<void> {
  await query("UPDATE faculties SET name = $1 WHERE id = $2", [name, id]);
}

export async function setFacultyActive(id: number, isActive: boolean): Promise<void> {
  await query("UPDATE faculties SET is_active = $1 WHERE id = $2", [isActive, id]);
}

/** Elimina la facultad; falla con 23503 si tiene carreras asociadas. */
export async function deleteFaculty(id: number): Promise<void> {
  await query("DELETE FROM faculties WHERE id = $1", [id]);
}

export async function createCareer(facultyId: number, name: string): Promise<void> {
  await query("INSERT INTO careers (faculty_id, name) VALUES ($1, $2)", [facultyId, name]);
}

export async function updateCareer(id: number, facultyId: number, name: string): Promise<void> {
  await query("UPDATE careers SET faculty_id = $1, name = $2 WHERE id = $3", [
    facultyId,
    name,
    id,
  ]);
}

export async function setCareerActive(id: number, isActive: boolean): Promise<void> {
  await query("UPDATE careers SET is_active = $1 WHERE id = $2", [isActive, id]);
}

/** Elimina la carrera; falla con 23503 si tiene estudiantes asociados. */
export async function deleteCareer(id: number): Promise<void> {
  await query("DELETE FROM careers WHERE id = $1", [id]);
}
