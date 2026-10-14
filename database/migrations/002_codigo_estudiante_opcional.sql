-- ========================================================
-- MIGRACIÓN 002
-- El código de estudiante deja de pedirse en la aplicación:
-- la columna se conserva (con su valor único) pero pasa a ser opcional.
-- ========================================================

ALTER TABLE students ALTER COLUMN student_code DROP NOT NULL;
