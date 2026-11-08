/** Tipos de la API /api/v1 del servidor (mismos nombres de campo que la base). */

export type Role = "STUDENT" | "SECRETARY" | "ADMIN";
export type PatStatus = "DRAFT" | "PENDING" | "RETURNED" | "APPROVED";

export type User = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: Role;
  roleLabel: string;
  hasPassword?: boolean;
};

export type Student = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  cedula: string | null;
  semester: number | null;
  phone: string | null;
  sex: "MASCULINO" | "FEMENINO" | null;
  personal_email: string | null;
  address: string | null;
  landline: string | null;
  curriculum_changes: number | null;
  enrollment_year: number | null;
  career: string;
  faculty: string;
};

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "info" | "warning" | "danger" | "success";
};

export type Me = { user: User; student: Student | null; notifications: AppNotification[] };

export type ExtraData = Partial<{
  level: string;
  parallel: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  votingCertificate: string;
  province: string;
  canton: string;
  parish: string;
  disabilityType: string;
  disabilityDegree: string;
}>;

export type Registration = {
  id: number;
  student_id: number;
  modality: string;
  participation_type: "INDIVIDUAL" | "GRUPAL";
  presentation_mechanism: string;
  requested_tutor: string | null;
  title: string;
  problem: string;
  articulations: string[];
  status: PatStatus;
  observations: string | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  career: string;
  faculty: string;
  members_label: string;
  member_count: number;
  has_tribunal: boolean;
  has_scan: boolean;
};

export type Member = {
  id: number;
  registration_id: number;
  student_id: number;
  role: "LEADER" | "MEMBER";
  status: "INVITED" | "ACCEPTED" | "DECLINED";
  extra_data: ExtraData;
  signature: string | null;
  signature_method: "DRAW" | "PHOTO" | null;
  signed_at: string | null;
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
  created_at: string;
  actor_name: string | null;
  title?: string;
};

export type Requirement = { key: string; label: string; done: boolean };
export type ScanMeta = { file_name: string; size_bytes: number; uploaded_at: string; uploader_name: string | null };

export type Tribunal = {
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

export type StudentPat =
  | { registration: null; tribunal: null }
  | {
      registration: Registration;
      members: Member[];
      membership: { role: "LEADER" | "MEMBER"; status: "INVITED" | "ACCEPTED" | "DECLINED" };
      scan: ScanMeta | null;
      events: PatEvent[];
      requirements: Requirement[];
      tribunal: Tribunal | null;
      me: { studentId: number };
      editable: boolean;
      canSubmit: boolean;
    };

export type PatDetail = {
  registration: Registration;
  members: Member[];
  scan: ScanMeta | null;
  events: PatEvent[];
  requirements: Requirement[];
};

export type Catalog = {
  modalities: string[];
  mechanisms: string[];
  articulations: { value: string; label: string }[];
  levels: string[];
  parallels: string[];
  maritalStatuses: string[];
  disabilityTypes: string[];
  provinces: string[];
};

export type Candidate = {
  registration_id: number;
  student_name: string;
  cedula: string | null;
  career: string;
  title: string;
  requested_tutor: string | null;
};

export type StaffSummary = {
  counts: Record<PatStatus, number>;
  waitingTribunal: number;
  pending: Registration[];
  upcoming: Tribunal[];
  activity: (PatEvent & { title: string })[];
};
