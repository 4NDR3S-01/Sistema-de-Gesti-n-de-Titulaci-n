import "server-only";
import { query } from "@/lib/db";
import { addEvent } from "@/lib/data/pat";

export type TribunalRow = {
  id: number;
  registration_id: number;
  defense_date: string;
  defense_time: string;
  place: string;
  tutor: string;
  president: string;
  member_one: string;
  member_two: string;
  student_name: string;
  cedula: string | null;
  career: string;
  title: string;
};

export type ApprovedWithoutTribunal = {
  registration_id: number;
  student_name: string;
  cedula: string | null;
  career: string;
  title: string;
  requested_tutor: string | null;
};

// Fecha y hora como texto para no depender de la zona horaria del servidor.
const tribunalSelect = `
  SELECT t.id, t.registration_id,
         to_char(t.defense_date, 'YYYY-MM-DD') AS defense_date,
         to_char(t.defense_time, 'HH24:MI') AS defense_time,
         t.place, t.tutor, t.president, t.member_one, t.member_two,
         (SELECT string_agg(mu.name || ' ' || mu.lastname, ' y ' ORDER BY m.role, m.id)
          FROM pat_members m JOIN students ms ON ms.id = m.student_id JOIN users mu ON mu.id = ms.user_id
          WHERE m.registration_id = r.id AND m.status = 'ACCEPTED') AS student_name, s.cedula, c.name AS career, r.title
  FROM tribunals t
  JOIN pat_registrations r ON r.id = t.registration_id
  JOIN students s ON s.id = r.student_id
  JOIN careers c ON c.id = s.career_id`;

export async function listTribunals(): Promise<TribunalRow[]> {
  return query<TribunalRow>(`${tribunalSelect} ORDER BY t.defense_date, t.defense_time`);
}

export async function getTribunalByStudent(studentId: number): Promise<TribunalRow | null> {
  const [row] = await query<TribunalRow>(
    `${tribunalSelect}
     WHERE EXISTS (SELECT 1 FROM pat_members m
                   WHERE m.registration_id = r.id AND m.student_id = $1 AND m.status = 'ACCEPTED')`,
    [studentId],
  );
  return row ?? null;
}

export async function listApprovedWithoutTribunal(): Promise<ApprovedWithoutTribunal[]> {
  return query<ApprovedWithoutTribunal>(
    `SELECT r.id AS registration_id, (SELECT string_agg(mu.name || ' ' || mu.lastname, ' y ' ORDER BY m.role, m.id)
          FROM pat_members m JOIN students ms ON ms.id = m.student_id JOIN users mu ON mu.id = ms.user_id
          WHERE m.registration_id = r.id AND m.status = 'ACCEPTED') AS student_name,
            s.cedula, c.name AS career, r.title, r.requested_tutor
     FROM pat_registrations r
     JOIN students s ON s.id = r.student_id
     JOIN careers c ON c.id = s.career_id
     WHERE r.status = 'APPROVED'
       AND NOT EXISTS (SELECT 1 FROM tribunals t WHERE t.registration_id = r.id)
     ORDER BY r.reviewed_at`,
  );
}

/** Registra el tribunal; devuelve false si el tema no está aprobado. */
export async function createTribunal(
  data: {
    registrationId: number;
    defenseDate: string;
    defenseTime: string;
    place: string;
    tutor: string;
    president: string;
    memberOne: string;
    memberTwo: string;
  },
  createdBy: number,
): Promise<boolean> {
  const rows = await query<{ id: number }>(
    `INSERT INTO tribunals (registration_id, defense_date, defense_time, place, tutor,
                            president, member_one, member_two, created_by)
     SELECT r.id, $2, $3, $4, $5, $6, $7, $8, $9
     FROM pat_registrations r
     WHERE r.id = $1 AND r.status = 'APPROVED'
     RETURNING id`,
    [
      data.registrationId,
      data.defenseDate,
      data.defenseTime,
      data.place,
      data.tutor,
      data.president,
      data.memberOne,
      data.memberTwo,
      createdBy,
    ],
  );
  if (rows.length) {
    await addEvent(
      data.registrationId,
      createdBy,
      "TRIBUNAL_ASSIGNED",
      `${data.defenseDate} ${data.defenseTime}, ${data.place}`,
    );
  }
  return rows.length > 0;
}

export async function deleteTribunal(id: number, actorId: number): Promise<void> {
  const rows = await query<{ registration_id: number }>(
    "DELETE FROM tribunals WHERE id = $1 RETURNING registration_id",
    [id],
  );
  if (rows[0]) await addEvent(rows[0].registration_id, actorId, "TRIBUNAL_REMOVED");
}
