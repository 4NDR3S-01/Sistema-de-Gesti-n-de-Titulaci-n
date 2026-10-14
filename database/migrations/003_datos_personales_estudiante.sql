-- ========================================================
-- MIGRACIÓN 003
-- Datos personales del estudiante según el formulario institucional:
-- sexo, correo personal, domicilio, teléfono convencional y
-- número de cambio de malla. El correo institucional es users.email
-- y el celular es students.phone.
-- ========================================================

BEGIN;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS sex VARCHAR(10),
    ADD COLUMN IF NOT EXISTS personal_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS address VARCHAR(200),
    ADD COLUMN IF NOT EXISTS landline VARCHAR(10),
    ADD COLUMN IF NOT EXISTS curriculum_changes SMALLINT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_sex') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_sex
            CHECK (sex IS NULL OR sex IN ('MASCULINO', 'FEMENINO'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_landline') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_landline
            CHECK (landline IS NULL OR landline ~ '^[0-9]{7,10}$');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_curriculum_changes') THEN
        ALTER TABLE students ADD CONSTRAINT chk_student_curriculum_changes
            CHECK (curriculum_changes IS NULL OR curriculum_changes BETWEEN 0 AND 20);
    END IF;
END $$;

COMMIT;
