import "server-only";
import { query } from "@/lib/db";

export type AdminMetrics = {
  students: number;
  activeUsers: number;
  inactiveUsers: number;
  secretaries: number;
  admins: number;
  faculties: number;
  careers: number;
  proceduresByStatus: { status: string; total: number }[];
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [[counts], proceduresByStatus] = await Promise.all([
    query<Omit<AdminMetrics, "proceduresByStatus">>(
      `SELECT
         (SELECT COUNT(*)::int FROM students) AS students,
         (SELECT COUNT(*)::int FROM users WHERE is_active) AS "activeUsers",
         (SELECT COUNT(*)::int FROM users WHERE NOT is_active) AS "inactiveUsers",
         (SELECT COUNT(*)::int FROM users u JOIN roles r ON r.id = u.role_id
            WHERE r.name = 'SECRETARY' AND u.is_active) AS secretaries,
         (SELECT COUNT(*)::int FROM users u JOIN roles r ON r.id = u.role_id
            WHERE r.name = 'ADMIN' AND u.is_active) AS admins,
         (SELECT COUNT(*)::int FROM faculties WHERE is_active) AS faculties,
         (SELECT COUNT(*)::int FROM careers WHERE is_active) AS careers`,
    ),
    query<{ status: string; total: number }>(
      `SELECT COALESCE(status, 'SIN_ESTADO') AS status, COUNT(*)::int AS total
       FROM procedures
       GROUP BY status
       ORDER BY total DESC`,
    ),
  ]);
  return { ...counts, proceduresByStatus };
}
