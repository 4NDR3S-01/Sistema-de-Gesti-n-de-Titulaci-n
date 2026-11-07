-- ========================================================
-- MIGRACIÓN 005
-- El acceso solo admite correos institucionales:
--   estudiantes -> @live.uleam.edu.ec, personal -> @uleam.edu.ec.
-- Renombra únicamente los usuarios de ejemplo del seed original,
-- si todavía conservan su correo de prueba. Es idempotente.
-- ========================================================

UPDATE users SET email = 'admin@uleam.edu.ec' WHERE email = 'admin@titulacion.edu';
UPDATE users SET email = 'coordinacion@uleam.edu.ec' WHERE email = 'coordinator@titulacion.edu';
UPDATE users SET email = 'maria.gomez@uleam.edu.ec' WHERE email = 'advisor@titulacion.edu';
UPDATE users SET email = 'juan.perez@live.uleam.edu.ec' WHERE email = 'student@titulacion.edu';
UPDATE users SET email = 'secretaria@uleam.edu.ec' WHERE email = 'secretaria@titulacion.edu';
