import "server-only";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/data/users";
import type { PatExtraData } from "@/lib/pat-options";
import {
  canSubmit,
  submissionRequirements,
  type MemberRole,
  type MemberStatus,
  type PatStatus,
  type Requirement,
} from "@/lib/pat-rules";
import type { PatPersonalInput, PatProposalInput } from "@/lib/validation";

export type { PatStatus } from "@/lib/pat-rules";

export type PatRegistration = {
  id: number;
  student_id: number; // quien creó el registro
  modality: string;
  participation_type: "INDIVIDUAL" | "GRUPAL";
  presentation_mechanism: string;
  requested_tutor: string | null;
  title: string;
  problem: string;
  articulations: string[];
  status: PatStatus;
  observations: string | null;
  reviewed_at: Date | null;
  reviewer_name: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  career: string;
  faculty: string;
  members_label: string;
  member_count: number;
  has_tribunal: boolean;
  has_scan: boolean;
};

export type PatMember = {
  id: number;
  registration_id: number;
  student_id: number;
  user_id: number;
  role: MemberRole;
  status: MemberStatus;
  extra_data: PatExtraData;
  signature: string | null;
  signature_method: "DRAW" | "PHOTO" | null;
  signed_at: Date | null;
  name: string;
  lastname: string;
  email: string;
  cedula: string | null;
  sex: string | null;
  personal_email: string | null;
  phone: string | null;
  landline: string | null;
  career: string;
  faculty: string;
};

export type PatEvent = {
  id: number;
  registration_id: number;
  type: string;
  detail: string | null;
  created_at: Date;
  actor_name: string | null;
};

export type PatScanMeta = {
  file_name: string;
  size_bytes: number;
  uploaded_at: Date;
  uploader_name: string | null;
};

export type PatDetail = {
  registration: PatRegistration;
  members: PatMember[];
  scan: PatScanMeta | null;
  events: PatEvent[];
  requirements: Requirement[];
};

const activeMembers = `(SELECT string_agg(mu.name || ' ' || mu.lastname, ' y ' ORDER BY m.role, m.id)
     FROM pat_members m JOIN students ms ON ms.id = m.student_id JOIN users mu ON mu.id = ms.user_id
     WHERE m.registration_id = r.id AND m.status <> 'DECLINED')`;

const registrationSelect = `
  SELECT r.id, r.student_id, r.modality, r.participation_type, r.presentation_mechanism,
         r.requested_tutor, r.title, r.problem, r.articulations, r.status, r.observations,
         r.reviewed_at, r.submitted_at, r.created_at, r.updated_at,
         rev.name || ' ' || rev.lastname AS reviewer_name,
         c.name AS career, f.name AS faculty,
         ${activeMembers} AS members_label,
         (SELECT COUNT(*)::int FROM pat_members m WHERE m.registration_id = r.id AND m.status <> 'DECLINED') AS member_count,
         EXISTS (SELECT 1 FROM tribunals t WHERE t.registration_id = r.id) AS has_tribunal,
         EXISTS (SELECT 1 FROM pat_scans sc WHERE sc.registration_id = r.id) AS has_scan
  FROM pat_registrations r
  JOIN students s ON s.id = r.student_id
  JOIN careers c ON c.id = s.career_id
  JOIN faculties f ON f.id = c.faculty_id
  LEFT JOIN users rev ON rev.id = r.reviewed_by`;

const memberSelect = `
  SELECT m.id, m.registration_id, m.student_id, u.id AS user_id, m.role, m.status, m.extra_data,
         m.signature, m.signature_method, m.signed_at,
         u.name, u.lastname, u.email, s.cedula, s.sex, s.personal_email, s.phone, s.landline,
         c.name AS career, f.name AS faculty
  FROM pat_members m
  JOIN students s ON s.id = m.student_id
  JOIN users u ON u.id = s.user_id
  JOIN careers c ON c.id = s.career_id
  JOIN faculties f ON f.id = c.faculty_id`;

/* ---------------------------------------------------------------- Lectura */

export async function getActiveMembership(
  studentId: number,
): Promise<{ registration_id: number; role: MemberRole; status: MemberStatus } | null> {
  const [row] = await query<{ registration_id: number; role: MemberRole; status: MemberStatus }>(
    `SELECT registration_id, role, status FROM pat_members
     WHERE student_id = $1 AND status <> 'DECLINED'`,
    [studentId],
  );
  return row ?? null;
}

export async function getPatDetail(registrationId: number): Promise<PatDetail | null> {
  const [registration] = await query<PatRegistration>(`${registrationSelect} WHERE r.id = $1`, [
    registrationId,
  ]);
  if (!registration) return null;

  const [members, scans, events] = await Promise.all([
    query<PatMember>(
      `${memberSelect} WHERE m.registration_id = $1 AND m.status <> 'DECLINED' ORDER BY m.role, m.id`,
      [registrationId],
    ),
    query<PatScanMeta>(
      `SELECT sc.file_name, sc.size_bytes, sc.uploaded_at, u.name || ' ' || u.lastname AS uploader_name
       FROM pat_scans sc LEFT JOIN users u ON u.id = sc.uploaded_by
       WHERE sc.registration_id = $1`,
      [registrationId],
    ),
    query<PatEvent>(
      `SELECT e.id, e.registration_id, e.type, e.detail, e.created_at,
              u.name || ' ' || u.lastname AS actor_name
       FROM pat_events e LEFT JOIN users u ON u.id = e.actor_id
       WHERE e.registration_id = $1
       ORDER BY e.created_at DESC, e.id DESC`,
      [registrationId],
    ),
  ]);

  const requirements = submissionRequirements({
    participationType: registration.participation_type,
    hasScan: scans.length > 0,
    members: members.map((member) => ({
      name: `${member.name} ${member.lastname}`,
      status: member.status,
      extra_data: member.extra_data,
      signed: Boolean(member.signature),
    })),
  });

  return { registration, members, scan: scans[0] ?? null, events, requirements };
}

/** Registro activo del estudiante (como autor, integrante o invitado). */
export async function getPatDetailForStudent(
  studentId: number,
): Promise<(PatDetail & { membership: { role: MemberRole; status: MemberStatus } }) | null> {
  const membership = await getActiveMembership(studentId);
  if (!membership) return null;
  const detail = await getPatDetail(membership.registration_id);
  return detail ? { ...detail, membership } : null;
}

export async function listRegistrations(filters: {
  status?: string;
  search?: string;
  page?: number;
}): Promise<{ rows: PatRegistration[]; total: number }> {
  // Los borradores son privados de los estudiantes hasta que los envían.
  const conditions: string[] = ["r.status <> 'DRAFT'"];
  const params: unknown[] = [];
  if (filters.status && ["PENDING", "RETURNED", "APPROVED"].includes(filters.status)) {
    params.push(filters.status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(r.title ILIKE ${p} OR EXISTS (
         SELECT 1 FROM pat_members m JOIN students ms ON ms.id = m.student_id
         JOIN users mu ON mu.id = ms.user_id
         WHERE m.registration_id = r.id AND m.status <> 'DECLINED'
           AND ((mu.name || ' ' || mu.lastname) ILIKE ${p} OR ms.cedula ILIKE ${p})))`,
    );
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const page = Math.max(1, filters.page ?? 1);

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM pat_registrations r ${where}`,
    params,
  );
  const rows = await query<PatRegistration>(
    `${registrationSelect} ${where}
     ORDER BY CASE r.status WHEN 'PENDING' THEN 0 WHEN 'RETURNED' THEN 1 ELSE 2 END,
              r.submitted_at ASC NULLS LAST
     LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    params,
  );
  return { rows, total };
}

export async function countRegistrationsByStatus(): Promise<Record<PatStatus, number>> {
  const rows = await query<{ status: PatStatus; total: number }>(
    "SELECT status, COUNT(*)::int AS total FROM pat_registrations GROUP BY status",
  );
  const counts: Record<PatStatus, number> = { DRAFT: 0, PENDING: 0, RETURNED: 0, APPROVED: 0 };
  for (const row of rows) counts[row.status] = row.total;
  return counts;
}

/** Estado del registro de cada estudiante (para el listado de secretaría). */
export async function registrationStatusByStudent(
  studentIds: number[],
): Promise<Map<number, { status: PatStatus; registration_id: number }>> {
  if (studentIds.length === 0) return new Map();
  const rows = await query<{ student_id: number; status: PatStatus; registration_id: number }>(
    `SELECT m.student_id, r.status, r.id AS registration_id
     FROM pat_members m JOIN pat_registrations r ON r.id = m.registration_id
     WHERE m.student_id = ANY($1::int[]) AND m.status = 'ACCEPTED'`,
    [studentIds],
  );
  return new Map(rows.map((row) => [row.student_id, row]));
}

export async function recentEvents(limit = 8): Promise<(PatEvent & { title: string })[]> {
  return query<PatEvent & { title: string }>(
    `SELECT e.id, e.registration_id, e.type, e.detail, e.created_at, r.title,
            u.name || ' ' || u.lastname AS actor_name
     FROM pat_events e
     JOIN pat_registrations r ON r.id = e.registration_id
     LEFT JOIN users u ON u.id = e.actor_id
     WHERE r.status <> 'DRAFT' OR e.type IN ('SUBMITTED')
     ORDER BY e.created_at DESC, e.id DESC
     LIMIT $1`,
    [limit],
  );
}

/** Compañeros que se pueden invitar: misma carrera, cuenta activa y sin registro activo. */
export async function searchTeammates(
  studentId: number,
  text: string,
): Promise<{ id: number; name: string; cedula: string | null; email: string }[]> {
  return query(
    `SELECT s.id, u.name || ' ' || u.lastname AS name, s.cedula, u.email
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.id <> $1
       AND u.is_active
       AND s.career_id = (SELECT career_id FROM students WHERE id = $1)
       AND NOT EXISTS (SELECT 1 FROM pat_members m WHERE m.student_id = s.id AND m.status <> 'DECLINED')
       AND ((u.name || ' ' || u.lastname) ILIKE $2 OR (u.lastname || ' ' || u.name) ILIKE $2
            OR s.cedula LIKE $3 OR u.email ILIKE $2)
     ORDER BY u.lastname, u.name
     LIMIT 8`,
    [studentId, `%${text}%`, `${text}%`],
  );
}

export async function getScanFile(
  registrationId: number,
): Promise<{ file_name: string; content: Buffer } | null> {
  const [row] = await query<{ file_name: string; content: Buffer }>(
    "SELECT file_name, content FROM pat_scans WHERE registration_id = $1",
    [registrationId],
  );
  return row ?? null;
}

/** ¿Puede este usuario ver el registro? (integrante activo o personal). */
export async function isMemberUser(registrationId: number, userId: number): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM pat_members m JOIN students s ON s.id = m.student_id
     WHERE m.registration_id = $1 AND s.user_id = $2 AND m.status <> 'DECLINED'`,
    [registrationId, userId],
  );
  return rows.length > 0;
}

/* ---------------------------------------------------------------- Escritura */

async function logEvent(
  client: PoolClient,
  registrationId: number,
  actorId: number | null,
  type: string,
  detail?: string | null,
) {
  await client.query(
    "INSERT INTO pat_events (registration_id, actor_id, type, detail) VALUES ($1, $2, $3, $4)",
    [registrationId, actorId, type, detail ?? null],
  );
}

/** Bloquea el registro y comprueba que se pueda editar. */
async function lockEditable(client: PoolClient, registrationId: number) {
  const { rows } = await client.query<{ status: PatStatus; student_id: number; participation_type: string }>(
    "SELECT status, student_id, participation_type FROM pat_registrations WHERE id = $1 FOR UPDATE",
    [registrationId],
  );
  const row = rows[0];
  if (!row || (row.status !== "DRAFT" && row.status !== "RETURNED")) return null;
  return row;
}

/** Anula firmas y escaneado: el documento firmado ya no corresponde al contenido. */
async function resetSignatures(client: PoolClient, registrationId: number, actorId: number) {
  const signed = await client.query(
    "UPDATE pat_members SET signature = NULL, signature_method = NULL, signed_at = NULL WHERE registration_id = $1 AND signature IS NOT NULL",
    [registrationId],
  );
  const scan = await client.query("DELETE FROM pat_scans WHERE registration_id = $1", [registrationId]);
  if (signed.rowCount || scan.rowCount) {
    await logEvent(client, registrationId, actorId, "SIGNATURES_RESET");
  }
}

function personalData(data: PatPersonalInput): PatExtraData {
  return {
    level: data.level,
    parallel: data.parallel,
    birthDate: data.birthDate,
    nationality: data.nationality,
    maritalStatus: data.maritalStatus,
    votingCertificate: data.votingCertificate,
    province: data.province,
    canton: data.canton,
    parish: data.parish,
    disabilityType: data.disabilityType,
    disabilityDegree: data.disabilityDegree?.toString(),
  };
}

const proposalValues = (data: PatProposalInput) => [
  data.modality,
  data.participationType,
  data.presentationMechanism,
  data.requestedTutor ?? null,
  data.title,
  data.problem,
  data.articulations,
];

/** Crea el borrador con su autor como primer integrante. Falla con 23505 si ya tiene registro. */
export async function createRegistration(
  studentId: number,
  actorId: number,
  proposal: PatProposalInput,
  personal: PatPersonalInput,
): Promise<number> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO pat_registrations
         (student_id, modality, participation_type, presentation_mechanism, requested_tutor,
          title, problem, articulations, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
       RETURNING id`,
      [studentId, ...proposalValues(proposal)],
    );
    const id = rows[0].id;
    await client.query(
      `INSERT INTO pat_members (registration_id, student_id, role, status, extra_data, responded_at)
       VALUES ($1, $2, 'LEADER', 'ACCEPTED', $3, CURRENT_TIMESTAMP)`,
      [id, studentId, JSON.stringify(personalData(personal))],
    );
    await logEvent(client, id, actorId, "CREATED");
    return id;
  });
}

export async function updateProposal(
  registrationId: number,
  leaderStudentId: number,
  actorId: number,
  proposal: PatProposalInput,
): Promise<boolean> {
  return withTransaction(async (client) => {
    const row = await lockEditable(client, registrationId);
    if (!row || row.student_id !== leaderStudentId) return false;

    await client.query(
      `UPDATE pat_registrations
       SET modality = $1, participation_type = $2, presentation_mechanism = $3, requested_tutor = $4,
           title = $5, problem = $6, articulations = $7
       WHERE id = $8`,
      [...proposalValues(proposal), registrationId],
    );
    if (proposal.participationType === "INDIVIDUAL") {
      const removed = await client.query(
        "DELETE FROM pat_members WHERE registration_id = $1 AND role = 'MEMBER' AND status <> 'DECLINED'",
        [registrationId],
      );
      if (removed.rowCount) await logEvent(client, registrationId, actorId, "TEAMMATE_REMOVED");
    }
    await resetSignatures(client, registrationId, actorId);
    await logEvent(client, registrationId, actorId, "PROPOSAL_UPDATED");
    return true;
  });
}

export async function updatePersonal(
  registrationId: number,
  studentId: number,
  actorId: number,
  personal: PatPersonalInput,
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const updated = await client.query<{ had_signature: boolean }>(
      `UPDATE pat_members m
       SET extra_data = $3, signature = NULL, signature_method = NULL, signed_at = NULL
       FROM (SELECT signature IS NOT NULL AS had_signature FROM pat_members
             WHERE registration_id = $1 AND student_id = $2) prev
       WHERE m.registration_id = $1 AND m.student_id = $2 AND m.status = 'ACCEPTED'
       RETURNING prev.had_signature`,
      [registrationId, studentId, JSON.stringify(personalData(personal))],
    );
    if (!updated.rowCount) return false;
    const scan = await client.query("DELETE FROM pat_scans WHERE registration_id = $1", [registrationId]);
    if (updated.rows[0].had_signature || scan.rowCount) {
      await logEvent(client, registrationId, actorId, "SIGNATURES_RESET");
    }
    await logEvent(client, registrationId, actorId, "DATA_UPDATED");
    return true;
  });
}

export type InviteResult = "ok" | "not-editable" | "not-group" | "invalid-teammate" | "busy";

export async function inviteTeammate(
  registrationId: number,
  leaderStudentId: number,
  teammateStudentId: number,
  actorId: number,
): Promise<InviteResult> {
  return withTransaction(async (client) => {
    const row = await lockEditable(client, registrationId);
    if (!row || row.student_id !== leaderStudentId) return "not-editable";
    if (row.participation_type !== "GRUPAL") return "not-group";

    const { rows: candidate } = await client.query<{ name: string }>(
      `SELECT u.name || ' ' || u.lastname AS name
       FROM students s JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.id <> $2 AND u.is_active
         AND s.career_id = (SELECT career_id FROM students WHERE id = $2)`,
      [teammateStudentId, leaderStudentId],
    );
    if (!candidate[0]) return "invalid-teammate";

    const busy = await client.query(
      "SELECT 1 FROM pat_members WHERE student_id = $1 AND status <> 'DECLINED' AND registration_id <> $2",
      [teammateStudentId, registrationId],
    );
    if (busy.rowCount) return "busy";

    await client.query(
      "DELETE FROM pat_members WHERE registration_id = $1 AND role = 'MEMBER' AND student_id <> $2 AND status <> 'DECLINED'",
      [registrationId, teammateStudentId],
    );
    await client.query(
      `INSERT INTO pat_members (registration_id, student_id, role, status)
       VALUES ($1, $2, 'MEMBER', 'INVITED')
       ON CONFLICT (registration_id, student_id) DO UPDATE
         SET status = 'INVITED', signature = NULL, signature_method = NULL, signed_at = NULL,
             responded_at = NULL, created_at = CURRENT_TIMESTAMP`,
      [registrationId, teammateStudentId],
    );
    await resetSignatures(client, registrationId, actorId);
    await logEvent(client, registrationId, actorId, "INVITED", candidate[0].name);
    return "ok";
  });
}

export async function removeTeammate(
  registrationId: number,
  leaderStudentId: number,
  actorId: number,
): Promise<boolean> {
  return withTransaction(async (client) => {
    const row = await lockEditable(client, registrationId);
    if (!row || row.student_id !== leaderStudentId) return false;
    const removed = await client.query(
      "DELETE FROM pat_members WHERE registration_id = $1 AND role = 'MEMBER' AND status <> 'DECLINED'",
      [registrationId],
    );
    if (removed.rowCount) {
      await resetSignatures(client, registrationId, actorId);
      await logEvent(client, registrationId, actorId, "TEAMMATE_REMOVED");
    }
    return true;
  });
}

/** El invitado acepta o rechaza. Al aceptar puede guardar sus datos informativos. */
export async function respondInvitation(
  registrationId: number,
  studentId: number,
  actorId: number,
  accept: boolean,
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const updated = await client.query(
      `UPDATE pat_members SET status = $3, responded_at = CURRENT_TIMESTAMP
       WHERE registration_id = $1 AND student_id = $2 AND status = 'INVITED'`,
      [registrationId, studentId, accept ? "ACCEPTED" : "DECLINED"],
    );
    if (!updated.rowCount) return false;
    await logEvent(client, registrationId, actorId, accept ? "ACCEPTED" : "DECLINED");
    return true;
  });
}

/** Un integrante (no el autor) deja el trabajo mientras aún se puede editar. */
export async function leaveRegistration(
  registrationId: number,
  studentId: number,
  actorId: number,
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const updated = await client.query(
      `UPDATE pat_members SET status = 'DECLINED', responded_at = CURRENT_TIMESTAMP,
              signature = NULL, signature_method = NULL, signed_at = NULL
       WHERE registration_id = $1 AND student_id = $2 AND role = 'MEMBER' AND status = 'ACCEPTED'`,
      [registrationId, studentId],
    );
    if (!updated.rowCount) return false;
    await resetSignatures(client, registrationId, actorId);
    await logEvent(client, registrationId, actorId, "LEFT");
    return true;
  });
}

export async function saveSignature(
  registrationId: number,
  studentId: number,
  actorId: number,
  signature: string,
  method: "DRAW" | "PHOTO",
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const updated = await client.query(
      `UPDATE pat_members SET signature = $3, signature_method = $4, signed_at = CURRENT_TIMESTAMP
       WHERE registration_id = $1 AND student_id = $2 AND status = 'ACCEPTED'`,
      [registrationId, studentId, signature, method],
    );
    if (!updated.rowCount) return false;
    await logEvent(client, registrationId, actorId, "SIGNED", method === "PHOTO" ? "Foto de firma" : "Firma dibujada");
    return true;
  });
}

export async function removeSignature(
  registrationId: number,
  studentId: number,
  actorId: number,
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const updated = await client.query(
      `UPDATE pat_members SET signature = NULL, signature_method = NULL, signed_at = NULL
       WHERE registration_id = $1 AND student_id = $2 AND signature IS NOT NULL`,
      [registrationId, studentId],
    );
    if (updated.rowCount) await logEvent(client, registrationId, actorId, "SIGNATURE_REMOVED");
    return true;
  });
}

export async function saveScan(
  registrationId: number,
  actorId: number,
  fileName: string,
  content: Buffer,
): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    await client.query(
      `INSERT INTO pat_scans (registration_id, file_name, size_bytes, content, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (registration_id) DO UPDATE
         SET file_name = EXCLUDED.file_name, size_bytes = EXCLUDED.size_bytes,
             content = EXCLUDED.content, uploaded_by = EXCLUDED.uploaded_by,
             uploaded_at = CURRENT_TIMESTAMP`,
      [registrationId, fileName.slice(0, 255), content.length, content, actorId],
    );
    await logEvent(client, registrationId, actorId, "SCAN_UPLOADED", fileName.slice(0, 255));
    return true;
  });
}

export async function deleteScan(registrationId: number, actorId: number): Promise<boolean> {
  return withTransaction(async (client) => {
    if (!(await lockEditable(client, registrationId))) return false;
    const removed = await client.query("DELETE FROM pat_scans WHERE registration_id = $1", [registrationId]);
    if (removed.rowCount) await logEvent(client, registrationId, actorId, "SCAN_REMOVED");
    return true;
  });
}

export type SubmitResult = { ok: true } | { ok: false; missing: string[] };

export async function submitRegistration(
  registrationId: number,
  leaderStudentId: number,
  actorId: number,
): Promise<SubmitResult> {
  return withTransaction(async (client) => {
    const row = await lockEditable(client, registrationId);
    if (!row || row.student_id !== leaderStudentId) {
      return { ok: false, missing: ["El registro ya no se puede enviar."] };
    }
    const { rows: members } = await client.query<{
      name: string;
      status: MemberStatus;
      extra_data: PatExtraData;
      signed: boolean;
    }>(
      `SELECT u.name || ' ' || u.lastname AS name, m.status, m.extra_data, m.signature IS NOT NULL AS signed
       FROM pat_members m JOIN students s ON s.id = m.student_id JOIN users u ON u.id = s.user_id
       WHERE m.registration_id = $1 AND m.status <> 'DECLINED'`,
      [registrationId],
    );
    const scan = await client.query("SELECT 1 FROM pat_scans WHERE registration_id = $1", [registrationId]);
    const requirements = submissionRequirements({
      participationType: row.participation_type as "INDIVIDUAL" | "GRUPAL",
      members,
      hasScan: Boolean(scan.rowCount),
    });
    if (!canSubmit(requirements)) {
      return { ok: false, missing: requirements.filter((item) => !item.done).map((item) => item.label) };
    }
    await client.query(
      "UPDATE pat_registrations SET status = 'PENDING', submitted_at = CURRENT_TIMESTAMP WHERE id = $1",
      [registrationId],
    );
    await logEvent(client, registrationId, actorId, "SUBMITTED");
    return { ok: true };
  });
}

export async function deleteDraft(registrationId: number, leaderStudentId: number): Promise<boolean> {
  const rows = await query(
    "DELETE FROM pat_registrations WHERE id = $1 AND student_id = $2 AND status = 'DRAFT' RETURNING id",
    [registrationId, leaderStudentId],
  );
  return rows.length > 0;
}

/**
 * Aprueba o devuelve un registro pendiente. Al aprobar se crea el proyecto de
 * titulación de cada integrante. Devuelve false si ya no está pendiente.
 */
export async function reviewRegistration(
  id: number,
  reviewerId: number,
  decision: "APPROVED" | "RETURNED",
  observations: string | undefined,
): Promise<boolean> {
  return withTransaction(async (client) => {
    const updated = await client.query<{ title: string; problem: string }>(
      `UPDATE pat_registrations
       SET status = $1, observations = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'PENDING'
       RETURNING title, problem`,
      [decision, observations ?? null, reviewerId, id],
    );
    if (!updated.rowCount) return false;
    await logEvent(client, id, reviewerId, decision, observations);

    if (decision === "APPROVED") {
      const { title, problem } = updated.rows[0];
      const project = await client.query<{ id: number }>(
        `INSERT INTO projects_theses (title, abstract, student_id, status, approval_date)
         SELECT $1, $2, m.student_id, 'APPROVED', CURRENT_TIMESTAMP
         FROM pat_members m WHERE m.registration_id = $3 AND m.status = 'ACCEPTED'
         RETURNING id`,
        [title.slice(0, 255), problem, id],
      );
      await client.query("UPDATE pat_registrations SET project_id = $1 WHERE id = $2", [
        project.rows[0]?.id ?? null,
        id,
      ]);
    }
    return true;
  });
}

/** Registra en el historial un evento ajeno al registro en sí (p. ej. tribunal). */
export async function addEvent(
  registrationId: number,
  actorId: number,
  type: string,
  detail?: string,
): Promise<void> {
  await query(
    "INSERT INTO pat_events (registration_id, actor_id, type, detail) VALUES ($1, $2, $3, $4)",
    [registrationId, actorId, type, detail ?? null],
  );
}
