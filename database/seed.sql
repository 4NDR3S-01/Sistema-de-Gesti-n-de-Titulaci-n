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

-- 2. Usuarios de Prueba (Contraseña de ejemplo: 'admin123' / 'password123')
INSERT INTO users (id, name, lastname, email, password_hash, role_id, is_active) VALUES
(1, 'Administrador', 'Sistema', 'admin@titulacion.edu', '$2b$10$YourHashedPasswordExamplePlaceholderForTestingOnly123456', 1, TRUE),
(2, 'Carlos', 'Coordinador', 'coordinator@titulacion.edu', '$2b$10$YourHashedPasswordExamplePlaceholderForTestingOnly123456', 2, TRUE),
(3, 'Dra. María', 'Gómez', 'advisor@titulacion.edu', '$2b$10$YourHashedPasswordExamplePlaceholderForTestingOnly123456', 3, TRUE),
(4, 'Juan', 'Pérez', 'student@titulacion.edu', '$2b$10$YourHashedPasswordExamplePlaceholderForTestingOnly123456', 4, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. Registro de Asesor
INSERT INTO advisors (id, user_id, department, specialization, max_students) VALUES
(1, 3, 'Ingeniería en Sistemas y Computación', 'Inteligencia Artificial y Desarrollo Web', 5)
ON CONFLICT (id) DO NOTHING;

SELECT setval('advisors_id_seq', (SELECT MAX(id) FROM advisors));

-- 4. Registro de Estudiante
INSERT INTO students (id, user_id, student_code, faculty, career, enrollment_year) VALUES
(1, 4, '2021102345', 'Facultad de Ingeniería', 'Ingeniería de Software', 2021)
ON CONFLICT (id) DO NOTHING;

SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));

-- 5. Proyecto de Tesis de Ejemplo
INSERT INTO projects_theses (id, title, abstract, student_id, advisor_id, status) VALUES
(1, 'Sistema Web Inteligente para la Gestión de Titulación Universitaria', 'Desarrollo de una plataforma web moderna con arquitectura por capas y base de datos relacional para optimizar los procesos de titulación.', 1, 1, 'IN_PROGRESS')
ON CONFLICT (id) DO NOTHING;

SELECT setval('projects_theses_id_seq', (SELECT MAX(id) FROM projects_theses));

-- 6. Trámite de Titulación de Ejemplo
INSERT INTO procedures (id, student_id, procedure_type, current_stage, status) VALUES
(1, 1, 'TESIS', 'REVISION_DOCUMENTOS', 'IN_REVIEW')
ON CONFLICT (id) DO NOTHING;

SELECT setval('procedures_id_seq', (SELECT MAX(id) FROM procedures));

-- 7. Etapas del Trámite
INSERT INTO procedure_stages (id, procedure_id, stage_name, status, comments, updated_by) VALUES
(1, 1, 'INICIO', 'APPROVED', 'Trámite iniciado correctamente y expediente abierto.', 2),
(2, 1, 'REVISION_DOCUMENTOS', 'PENDING', 'Pendiente de entrega de carta de liberación del asesor.', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('procedure_stages_id_seq', (SELECT MAX(id) FROM procedure_stages));
