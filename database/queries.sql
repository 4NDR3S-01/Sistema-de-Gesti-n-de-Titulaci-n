-- ========================================================
-- CONSULTAS ÚTILES Y REPORTES - SISTEMA DE TITULACIÓN
-- ========================================================

-- 1. Consultar todos los usuarios con sus roles respectivos
SELECT u.id, u.name, u.lastname, u.email, r.name AS role_name, u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id;

-- 2. Consultar el resumen completo de estudiantes y sus proyectos (Usando la vista)
SELECT * FROM vw_student_titling_summary;

-- 3. Consultar trámites pendientes de revisión con detalles del estudiante
SELECT 
    p.id AS procedure_id,
    p.procedure_type,
    p.current_stage,
    p.status,
    s.student_code,
    u.name || ' ' || u.lastname AS student_name,
    c.name AS career
FROM procedures p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN careers c ON s.career_id = c.id
WHERE p.status = 'IN_REVIEW';

-- 4. Consultar proyectos de tesis y su asesor asignado
SELECT 
    pt.id AS project_id,
    pt.title AS project_title,
    pt.status AS project_status,
    s.student_code,
    stu.name || ' ' || stu.lastname AS student_name,
    adv_u.name || ' ' || adv_u.lastname AS advisor_name,
    adv.department
FROM projects_theses pt
JOIN students s ON pt.student_id = s.id
JOIN users stu ON s.user_id = stu.id
LEFT JOIN advisors adv ON pt.advisor_id = adv.id
LEFT JOIN users adv_u ON adv.user_id = adv_u.id;

-- 5. Consultar el historial de etapas de un trámite específico (ej. trámite ID 1)
SELECT 
    ps.id AS stage_id,
    ps.stage_name,
    ps.status,
    ps.comments,
    u.name || ' ' || u.lastname AS updated_by_user,
    ps.created_at
FROM procedure_stages ps
LEFT JOIN users u ON ps.updated_by = u.id
WHERE ps.procedure_id = 1
ORDER BY ps.created_at ASC;
