-- ========================================================
-- MIGRACIÓN 001
-- - Rol SECRETARY usado por la aplicación.
-- - Catálogos de facultades y carreras.
-- - Datos de contacto y académicos del estudiante
--   (cédula, semestre, teléfono) y carrera por catálogo.
-- Es idempotente: puede ejecutarse sobre una base creada con
-- el schema.sql anterior o con el actual.
-- ========================================================

BEGIN;

-- 1. Rol de secretaría
INSERT INTO roles (name, description) VALUES
('SECRETARY', 'Secretaría académica: revisa solicitudes y gestiona estudiantes')
ON CONFLICT (name) DO NOTHING;

-- 2. Catálogos
CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS careers (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_career_faculty_name UNIQUE (faculty_id, name)
);

-- 3. Nuevas columnas del estudiante
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS cedula VARCHAR(10),
    ADD COLUMN IF NOT EXISTS semester SMALLINT,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(10),
    ADD COLUMN IF NOT EXISTS career_id INTEGER REFERENCES careers(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_cedula') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_cedula
            CHECK (cedula IS NULL OR cedula ~ '^[0-9]{10}$');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_semester') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_semester
            CHECK (semester IS NULL OR semester BETWEEN 1 AND 12);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_phone') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_phone
            CHECK (phone IS NULL OR phone ~ '^09[0-9]{8}$');
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_students_cedula ON students(cedula);
CREATE INDEX IF NOT EXISTS idx_students_career ON students(career_id);
CREATE INDEX IF NOT EXISTS idx_careers_faculty ON careers(faculty_id);

-- 4. Pasar facultad/carrera en texto libre a los catálogos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'career'
    ) THEN
        EXECUTE $sql$
            INSERT INTO faculties (name)
            SELECT DISTINCT TRIM(faculty) FROM students
            WHERE faculty IS NOT NULL AND TRIM(faculty) <> ''
            ON CONFLICT (name) DO NOTHING
        $sql$;

        EXECUTE $sql$
            INSERT INTO careers (faculty_id, name)
            SELECT DISTINCT f.id, TRIM(s.career)
            FROM students s
            JOIN faculties f ON f.name = TRIM(s.faculty)
            WHERE s.career IS NOT NULL AND TRIM(s.career) <> ''
            ON CONFLICT (faculty_id, name) DO NOTHING
        $sql$;

        EXECUTE $sql$
            UPDATE students s
            SET career_id = c.id
            FROM careers c
            JOIN faculties f ON f.id = c.faculty_id
            WHERE s.career_id IS NULL
              AND f.name = TRIM(s.faculty)
              AND c.name = TRIM(s.career)
        $sql$;

        DROP VIEW IF EXISTS vw_student_titling_summary;
        ALTER TABLE students DROP COLUMN faculty, DROP COLUMN career;
    END IF;
END $$;

ALTER TABLE students ALTER COLUMN career_id SET NOT NULL;

-- 5. updated_at automático
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculties_updated_at ON faculties;
CREATE TRIGGER update_faculties_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_careers_updated_at ON careers;
CREATE TRIGGER update_careers_updated_at
    BEFORE UPDATE ON careers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Vista resumen con los catálogos
CREATE OR REPLACE VIEW vw_student_titling_summary AS
SELECT
    s.id AS student_id,
    u.name || ' ' || u.lastname AS student_name,
    u.email AS student_email,
    s.student_code,
    s.cedula,
    f.name AS faculty,
    c.name AS career,
    s.semester,
    p.id AS project_id,
    p.title AS project_title,
    p.status AS project_status,
    adv_u.name || ' ' || adv_u.lastname AS advisor_name,
    proc.id AS procedure_id,
    proc.procedure_type,
    proc.current_stage AS procedure_stage,
    proc.status AS procedure_status
FROM students s
JOIN users u ON s.user_id = u.id
JOIN careers c ON s.career_id = c.id
JOIN faculties f ON c.faculty_id = f.id
LEFT JOIN projects_theses p ON s.id = p.student_id
LEFT JOIN advisors adv ON p.advisor_id = adv.id
LEFT JOIN users adv_u ON adv.user_id = adv_u.id
LEFT JOIN procedures proc ON s.id = proc.student_id;

COMMIT;
