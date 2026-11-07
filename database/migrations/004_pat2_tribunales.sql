-- ========================================================
-- MIGRACIÓN 004
-- Registro de modalidad y tema PAT 2 (formato PAT-04-F-002),
-- revisión por secretaría y asignación de tribunal de defensa.
-- Es idempotente.
-- ========================================================

BEGIN;

-- 1. Registro del tema PAT 2: uno por estudiante.
--    PENDING  = enviado, esperando revisión
--    RETURNED = devuelto con observaciones; el estudiante puede corregirlo
--    APPROVED = aprobado; queda bloqueado y genera el proyecto de titulación
CREATE TABLE IF NOT EXISTS pat_registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    modality VARCHAR(150) NOT NULL,
    participation_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    teammate_info VARCHAR(255),
    presentation_mechanism VARCHAR(150) NOT NULL,
    requested_tutor VARCHAR(150),
    title VARCHAR(255) NOT NULL,
    problem TEXT NOT NULL,
    articulations TEXT[] NOT NULL DEFAULT '{}',
    -- Datos informativos del formato que no viven en students
    -- (nivel, paralelo, nacimiento, estado civil, residencia, discapacidad...).
    extra_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    observations TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    project_id INTEGER REFERENCES projects_theses(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pat_status CHECK (status IN ('PENDING', 'RETURNED', 'APPROVED')),
    CONSTRAINT chk_pat_participation CHECK (participation_type IN ('INDIVIDUAL', 'GRUPAL'))
);

CREATE INDEX IF NOT EXISTS idx_pat_registrations_status ON pat_registrations(status);

DROP TRIGGER IF EXISTS update_pat_registrations_updated_at ON pat_registrations;
CREATE TRIGGER update_pat_registrations_updated_at
    BEFORE UPDATE ON pat_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Tribunal y convocatoria a la defensa (solo para temas aprobados).
CREATE TABLE IF NOT EXISTS tribunals (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL UNIQUE REFERENCES pat_registrations(id) ON DELETE CASCADE,
    defense_date DATE NOT NULL,
    defense_time TIME NOT NULL,
    place VARCHAR(200) NOT NULL,
    tutor VARCHAR(150) NOT NULL,
    president VARCHAR(150) NOT NULL,
    member_one VARCHAR(150) NOT NULL,
    member_two VARCHAR(150) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tribunal_distinct_members CHECK (
        LOWER(president) <> LOWER(member_one)
        AND LOWER(president) <> LOWER(member_two)
        AND LOWER(member_one) <> LOWER(member_two)
    )
);

DROP TRIGGER IF EXISTS update_tribunals_updated_at ON tribunals;
CREATE TRIGGER update_tribunals_updated_at
    BEFORE UPDATE ON tribunals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
