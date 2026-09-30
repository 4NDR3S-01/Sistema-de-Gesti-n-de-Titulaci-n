-- ========================================================
-- DATOS INICIALES (SEED) - SISTEMA DE TITULACIÓN
-- ========================================================

-- 1. Inserción de Roles Base
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'Administrador del sistema con acceso total'),
(2, 'COORDINATOR', 'Coordinador de titulación encargado de validar trámites y jurados'),
(3, 'ADVISOR', 'Docente / Asesor de tesis o proyectos de grado'),
(4, 'STUDENT', 'Estudiante en proceso de titulación')
ON CONFLICT (id) DO NOTHING;

-- Ajustar secuencia de roles si es necesario
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- 2. Usuario Administrador por defecto (Contraseña por defecto hasheada o texto plano para entorno de pruebas: 'admin123')
-- Nota: En producción usar bcrypt / argon2. Este es un hash de ejemplo para 'admin123'.
INSERT INTO users (id, name, lastname, email, password_hash, role_id, is_active) VALUES
(1, 'Administrador', 'Sistema', 'admin@titulacion.edu', '$2b$10$YourHashedPasswordExamplePlaceholderForTestingOnly123456', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
