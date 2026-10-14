import "server-only";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const PAGE_SIZE = 15;

export type LoginUser = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  role: string;
};

export type UserRow = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  student_id: number | null;
};

export async function findUserByEmail(email: string): Promise<LoginUser | null> {
  const [row] = await query<LoginUser>(
    `SELECT u.id, u.name, u.lastname, u.email, u.password_hash, u.is_active, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = LOWER($1)`,
    [email],
  );
  return row ?? null;
}

export async function listUsers(filters: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
}): Promise<{ rows: UserRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(u.name ILIKE $${params.length} OR u.lastname ILIKE $${params.length} OR u.email ILIKE $${params.length})`,
    );
  }
  if (filters.role) {
    params.push(filters.role);
    conditions.push(`r.name = $${params.length}`);
  }
  if (filters.status === "active") conditions.push("u.is_active");
  if (filters.status === "inactive") conditions.push("NOT u.is_active");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = Math.max(1, filters.page ?? 1);

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
    params,
  );
  const rows = await query<UserRow>(
    `SELECT u.id, u.name, u.lastname, u.email, r.name AS role, u.is_active, u.created_at,
            s.id AS student_id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN students s ON s.user_id = u.id
     ${where}
     ORDER BY u.lastname, u.name
     LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    params,
  );
  return { rows, total };
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const [row] = await query<UserRow>(
    `SELECT u.id, u.name, u.lastname, u.email, r.name AS role, u.is_active, u.created_at,
            s.id AS student_id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN students s ON s.user_id = u.id
     WHERE u.id = $1`,
    [id],
  );
  return row ?? null;
}

export async function createStaffUser(data: {
  name: string;
  lastname: string;
  email: string;
  role: "ADMIN" | "SECRETARY";
  password: string;
}): Promise<void> {
  await query(
    `INSERT INTO users (name, lastname, email, password_hash, role_id)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name = $5))`,
    [data.name, data.lastname, data.email, await bcrypt.hash(data.password, 12), data.role],
  );
}

export async function updateUser(
  id: number,
  data: {
    name: string;
    lastname: string;
    email: string;
    role?: "ADMIN" | "SECRETARY";
    password?: string;
  },
): Promise<void> {
  const params: unknown[] = [data.name, data.lastname, data.email];
  const sets = ["name = $1", "lastname = $2", "email = $3"];
  if (data.role) {
    params.push(data.role);
    sets.push(`role_id = (SELECT id FROM roles WHERE name = $${params.length})`);
  }
  if (data.password) {
    params.push(await bcrypt.hash(data.password, 12));
    sets.push(`password_hash = $${params.length}`);
  }
  params.push(id);
  await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
}

export async function setUserActive(id: number, isActive: boolean): Promise<void> {
  await query("UPDATE users SET is_active = $1 WHERE id = $2", [isActive, id]);
}

export async function countActiveAdmins(): Promise<number> {
  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'ADMIN' AND u.is_active`,
  );
  return total;
}
