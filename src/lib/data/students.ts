import "server-only";
import bcrypt from "bcryptjs";
import { query, withTransaction } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/data/users";

export type StudentRow = {
  id: number;
  user_id: number;
  name: string;
  lastname: string;
  email: string;
  is_active: boolean;
  cedula: string | null;
  semester: number | null;
  phone: string | null;
  sex: "MASCULINO" | "FEMENINO" | null;
  personal_email: string | null;
  address: string | null;
  landline: string | null;
  curriculum_changes: number | null;
  enrollment_year: number | null;
  career_id: number;
  career: string;
  faculty_id: number;
  faculty: string;
  updated_at: Date | null;
};

export type StudentTitlingStatus = {
  procedure_type: string | null;
  procedure_stage: string | null;
  procedure_status: string | null;
  project_title: string | null;
  project_status: string | null;
  advisor_name: string | null;
};

export type StudentInput = {
  name: string;
  lastname: string;
  email: string;
  cedula: string;
  careerId: number;
  semester?: number;
  phone?: string;
  sex?: "MASCULINO" | "FEMENINO";
  personalEmail?: string;
  address?: string;
  landline?: string;
  curriculumChanges?: number;
  enrollmentYear?: number;
};

const studentSelect = `
  SELECT s.id, s.user_id, u.name, u.lastname, u.email, u.is_active,
         s.cedula, s.semester, s.phone, s.sex, s.personal_email, s.address,
         s.landline, s.curriculum_changes, s.enrollment_year,
         s.career_id, c.name AS career, f.id AS faculty_id, f.name AS faculty,
         s.updated_at
  FROM students s
  JOIN users u ON u.id = s.user_id
  JOIN careers c ON c.id = s.career_id
  JOIN faculties f ON f.id = c.faculty_id`;

export async function listStudents(filters: {
  search?: string;
  facultyId?: number;
  careerId?: number;
  page?: number;
}): Promise<{ rows: StudentRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(u.name ILIKE ${p} OR u.lastname ILIKE ${p} OR u.email ILIKE ${p}
        OR s.cedula ILIKE ${p}
        OR (u.name || ' ' || u.lastname) ILIKE ${p})`,
    );
  }
  if (filters.facultyId) {
    params.push(filters.facultyId);
    conditions.push(`f.id = $${params.length}`);
  }
  if (filters.careerId) {
    params.push(filters.careerId);
    conditions.push(`c.id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = Math.max(1, filters.page ?? 1);

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM students s
     JOIN users u ON u.id = s.user_id
     JOIN careers c ON c.id = s.career_id
     JOIN faculties f ON f.id = c.faculty_id
     ${where}`,
    params,
  );
  const rows = await query<StudentRow>(
    `${studentSelect} ${where}
     ORDER BY u.lastname, u.name
     LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    params,
  );
  return { rows, total };
}

export async function getStudentById(id: number): Promise<StudentRow | null> {
  const [row] = await query<StudentRow>(`${studentSelect} WHERE s.id = $1`, [id]);
  return row ?? null;
}

export async function getStudentByUserId(userId: number): Promise<StudentRow | null> {
  const [row] = await query<StudentRow>(`${studentSelect} WHERE s.user_id = $1`, [userId]);
  return row ?? null;
}

export async function getStudentTitlingStatus(
  studentId: number,
): Promise<StudentTitlingStatus> {
  const [row] = await query<StudentTitlingStatus>(
    `SELECT
       (SELECT procedure_type FROM procedures WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1) AS procedure_type,
       (SELECT current_stage FROM procedures WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1) AS procedure_stage,
       (SELECT status FROM procedures WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1) AS procedure_status,
       p.title AS project_title,
       p.status AS project_status,
       adv_u.name || ' ' || adv_u.lastname AS advisor_name
     FROM (SELECT 1) AS one
     LEFT JOIN LATERAL (
       SELECT * FROM projects_theses WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1
     ) p ON TRUE
     LEFT JOIN advisors adv ON adv.id = p.advisor_id
     LEFT JOIN users adv_u ON adv_u.id = adv.user_id`,
    [studentId],
  );
  return row;
}

/** Valores de los campos del formulario institucional, en el orden de las columnas. */
function personalValues(data: Partial<StudentInput>) {
  return [
    data.sex ?? null,
    data.personalEmail ?? null,
    data.address ?? null,
    data.landline ?? null,
    data.curriculumChanges ?? null,
  ];
}

export async function createStudent(
  data: StudentInput & { password: string },
): Promise<number> {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return withTransaction(async (client) => {
    const user = await client.query<{ id: number }>(
      `INSERT INTO users (name, lastname, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name = 'STUDENT'))
       RETURNING id`,
      [data.name, data.lastname, data.email, passwordHash],
    );
    const student = await client.query<{ id: number }>(
      `INSERT INTO students (user_id, cedula, career_id, semester, phone, enrollment_year,
                             sex, personal_email, address, landline, curriculum_changes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        user.rows[0].id,
        data.cedula,
        data.careerId,
        data.semester ?? null,
        data.phone ?? null,
        data.enrollmentYear ?? null,
        ...personalValues(data),
      ],
    );
    return student.rows[0].id;
  });
}

export async function updateStudentByStaff(
  id: number,
  data: StudentInput,
): Promise<boolean> {
  return withTransaction(async (client) => {
    const student = await client.query<{ user_id: number }>(
      `UPDATE students
       SET cedula = $1, career_id = $2, semester = $3, phone = $4, enrollment_year = $5,
           sex = $6, personal_email = $7, address = $8, landline = $9, curriculum_changes = $10
       WHERE id = $11
       RETURNING user_id`,
      [
        data.cedula,
        data.careerId,
        data.semester ?? null,
        data.phone ?? null,
        data.enrollmentYear ?? null,
        ...personalValues(data),
        id,
      ],
    );
    if (!student.rowCount) return false;
    await client.query(
      "UPDATE users SET name = $1, lastname = $2, email = $3 WHERE id = $4",
      [data.name, data.lastname, data.email, student.rows[0].user_id],
    );
    return true;
  });
}

/** Actualización hecha por el propio estudiante (formulario institucional). */
export async function updateStudentSelf(
  userId: number,
  data: Pick<StudentInput, "cedula" | "name" | "lastname" | "email" | "curriculumChanges"> &
    Required<Pick<StudentInput, "sex" | "personalEmail" | "address" | "landline" | "phone">>,
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      "UPDATE users SET name = $1, lastname = $2, email = $3 WHERE id = $4",
      [data.name, data.lastname, data.email, userId],
    );
    await client.query(
      `UPDATE students
       SET cedula = $1, phone = $2, sex = $3, personal_email = $4, address = $5,
           landline = $6, curriculum_changes = $7
       WHERE user_id = $8`,
      [data.cedula, data.phone, ...personalValues(data), userId],
    );
  });
}
