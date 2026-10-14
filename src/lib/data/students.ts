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
  student_code: string;
  cedula: string | null;
  semester: number | null;
  phone: string | null;
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
  studentCode: string;
  careerId: number;
  semester?: number;
  phone?: string;
  enrollmentYear?: number;
};

const studentSelect = `
  SELECT s.id, s.user_id, u.name, u.lastname, u.email, u.is_active,
         s.student_code, s.cedula, s.semester, s.phone, s.enrollment_year,
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
        OR s.cedula ILIKE ${p} OR s.student_code ILIKE ${p}
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
      `INSERT INTO students (user_id, student_code, cedula, career_id, semester, phone, enrollment_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        user.rows[0].id,
        data.studentCode,
        data.cedula,
        data.careerId,
        data.semester ?? null,
        data.phone ?? null,
        data.enrollmentYear ?? null,
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
       SET student_code = $1, cedula = $2, career_id = $3, semester = $4,
           phone = $5, enrollment_year = $6
       WHERE id = $7
       RETURNING user_id`,
      [
        data.studentCode,
        data.cedula,
        data.careerId,
        data.semester ?? null,
        data.phone ?? null,
        data.enrollmentYear ?? null,
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

export async function updateStudentSelf(
  userId: number,
  data: { email: string; phone?: string },
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("UPDATE users SET email = $1 WHERE id = $2", [data.email, userId]);
    await client.query("UPDATE students SET phone = $1 WHERE user_id = $2", [
      data.phone ?? null,
      userId,
    ]);
  });
}
