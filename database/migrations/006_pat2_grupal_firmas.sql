-- ========================================================
-- MIGRACIÓN 006
-- Registro PAT 2 compartido entre integrantes (individual o en pareja),
-- firmas digitales por integrante, formato escaneado e historial.
-- Es idempotente.
-- ========================================================

BEGIN;

-- 1. Nuevo estado DRAFT: el registro se prepara (integrantes, datos, firmas)
--    antes de enviarlo a revisión.
ALTER TABLE pat_registrations DROP CONSTRAINT IF EXISTS chk_pat_status;
ALTER TABLE pat_registrations
    ADD CONSTRAINT chk_pat_status CHECK (status IN ('DRAFT', 'PENDING', 'RETURNED', 'APPROVED'));
ALTER TABLE pat_registrations ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE pat_registrations ALTER COLUMN submitted_at DROP DEFAULT;

-- 2. Integrantes del registro. student_id de pat_registrations es quien lo creó (LEADER).
CREATE TABLE IF NOT EXISTS pat_members (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL REFERENCES pat_registrations(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'INVITED',
    -- Datos informativos del formato propios de cada integrante.
    extra_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature TEXT,                 -- imagen PNG (data URL) con fondo transparente
    signature_method VARCHAR(10),   -- DRAW / PHOTO
    signed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pat_member_role CHECK (role IN ('LEADER', 'MEMBER')),
    CONSTRAINT chk_pat_member_status CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED')),
    CONSTRAINT chk_pat_member_signature CHECK (signature_method IS NULL OR signature_method IN ('DRAW', 'PHOTO')),
    CONSTRAINT uq_pat_member UNIQUE (registration_id, student_id)
);

-- Un estudiante solo puede estar en un registro activo a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pat_member_active_student
    ON pat_members(student_id) WHERE status <> 'DECLINED';

-- Registros creados antes de esta migración: su autor pasa a ser integrante.
INSERT INTO pat_members (registration_id, student_id, role, status, extra_data, responded_at)
SELECT r.id, r.student_id, 'LEADER', 'ACCEPTED', r.extra_data, r.created_at
FROM pat_registrations r
ON CONFLICT (registration_id, student_id) DO NOTHING;

-- 3. Formato firmado a mano y escaneado (alternativa a la firma digital).
CREATE TABLE IF NOT EXISTS pat_scans (
    registration_id INTEGER PRIMARY KEY REFERENCES pat_registrations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    size_bytes INTEGER NOT NULL,
    content BYTEA NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Historial del registro.
CREATE TABLE IF NOT EXISTS pat_events (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL REFERENCES pat_registrations(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pat_events_registration ON pat_events(registration_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pat_events_created ON pat_events(created_at DESC);

COMMIT;
