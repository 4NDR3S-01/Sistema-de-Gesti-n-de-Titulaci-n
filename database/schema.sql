-- ========================================================
-- SISTEMA DE GESTIÓN Y SEGUIMIENTO DE TRÁMITES DE TITULACIÓN
-- Esquema de Base de Datos PostgreSQL
-- ========================================================

-- Limpieza opcional (descomentar si se desea reiniciar el esquema)
-- DROP VIEW IF EXISTS vw_student_titling_summary CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS procedure_stages CASCADE;
-- DROP TABLE IF EXISTS procedures CASCADE;
-- DROP TABLE IF EXISTS projects_theses CASCADE;
-- DROP TABLE IF EXISTS advisors CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'ADMIN', 'STUDENT', 'ADVISOR', 'COORDINATOR', 'JURY'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Autenticación y Datos Generales)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE NOT NULL, -- Matrícula / Código de estudiante
    faculty VARCHAR(150) NOT NULL,            -- Facultad / Escuela
    career VARCHAR(150) NOT NULL,             -- Carrera / Programa académico
    enrollment_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Asesores / Tutores / Docentes
CREATE TABLE IF NOT EXISTS advisors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(150) NOT NULL,         -- Departamento o área académica
    specialization VARCHAR(200),              -- Especialidad o línea de investigación
    max_students INTEGER DEFAULT 5            -- Límite de tesistas/estudiantes asignados
);

-- 5. Tabla de Proyectos de Tesis / Titulación
CREATE TABLE IF NOT EXISTS projects_theses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    advisor_id INTEGER REFERENCES advisors(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PROPOSED',    -- PROPOSED, APPROVED, IN_PROGRESS, DEFENDED, REJECTED, COMPLETED
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Trámites de Titulación
CREATE TABLE IF NOT EXISTS procedures (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    procedure_type VARCHAR(100) NOT NULL,     -- Ej: 'TESIS', 'EXAMEN_PROFESIONAL', 'DIPLOMADO', 'EXCELENCIA_ACADEMICA'
    current_stage VARCHAR(100) DEFAULT 'INICIO', -- Ej: 'REVISION_DOCUMENTOS', 'DESIGNACION_JURADO', 'DEFENSA', 'FINALIZADO'
    status VARCHAR(50) DEFAULT 'PENDING',     -- PENDING, IN_REVIEW, APPROVED, REJECTED, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Historial / Seguimiento de Etapas del Trámite
CREATE TABLE IF NOT EXISTS procedure_stages (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES procedures(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,              -- PENDING, APPROVED, REJECTED
    comments TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quién aprobó o revisó la etapa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Documentos Adjuntos
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES procedures(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,      -- Ej: 'CARTA_LIBERACION', 'TESIS_PDF', 'CERTIFICADO_ESTUDIOS', 'COMPROBANTE_PAGO'
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ========================================================

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para projects_theses
DROP TRIGGER IF EXISTS update_projects_theses_updated_at ON projects_theses;
CREATE TRIGGER update_projects_theses_updated_at
    BEFORE UPDATE ON projects_theses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para procedures
DROP TRIGGER IF EXISTS update_procedures_updated_at ON procedures;
CREATE TRIGGER update_procedures_updated_at
    BEFORE UPDATE ON procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- VISTAS ÚTILES PARA REPORTES Y CONSULTAS
-- ========================================================

-- Vista resumen de estudiantes, proyectos y trámites de titulación
CREATE OR REPLACE VIEW vw_student_titling_summary AS
SELECT 
    s.id AS student_id,
    u.name || ' ' || u.lastname AS student_name,
    u.email AS student_email,
    s.student_code,
    s.faculty,
    s.career,
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
LEFT JOIN projects_theses p ON s.id = p.student_id
LEFT JOIN advisors adv ON p.advisor_id = adv.id
LEFT JOIN users adv_u ON adv.user_id = adv_u.id
LEFT JOIN procedures proc ON s.id = proc.student_id;

-- ========================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS FRECUENTES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_procedures_student ON procedures(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_student ON projects_theses(student_id);
CREATE INDEX IF NOT EXISTS idx_procedures_stages ON procedure_stages(procedure_id);
