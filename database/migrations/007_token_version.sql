-- ========================================================
-- MIGRACIÓN 007
-- Versión de credenciales por usuario. Los tokens de la app móvil llevan
-- esta versión; al cambiar la contraseña se incrementa y todos los tokens
-- emitidos antes dejan de ser válidos.
-- Es idempotente.
-- ========================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

COMMIT;
