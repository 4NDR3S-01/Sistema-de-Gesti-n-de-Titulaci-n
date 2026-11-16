-- ========================================================
-- MIGRACIÓN 007
-- Opción de aprobación previo a titulación, nuevas modalidades
-- y retiro del mecanismo de desarrollo separado.
-- Es idempotente.
-- ========================================================

BEGIN;

ALTER TABLE pat_registrations ADD COLUMN IF NOT EXISTS approval_option VARCHAR(100);
ALTER TABLE pat_registrations ADD COLUMN IF NOT EXISTS legacy_modality VARCHAR(150);

-- Los registros antiguos de Examen de Carácter Complexivo ahora llevan esa
-- opción en approval_option; la modalidad se migra a "Análisis de casos" y
-- el texto anterior queda guardado para trazabilidad.
UPDATE pat_registrations
SET legacy_modality = COALESCE(legacy_modality, modality),
    approval_option = 'Examen de carácter complexivo',
    modality = 'Análisis de casos'
WHERE modality ILIKE '%complexivo%';

-- Los antiguos trabajos de integración curricular se traducen a las nuevas
-- modalidades del formato.
UPDATE pat_registrations
SET approval_option = 'Trabajo de Integración Curricular',
    modality = CASE modality
      WHEN 'Trabajo de Integración Curricular - Proyecto de Investigación'
        THEN 'Proyectos de investigación'
      WHEN 'Trabajo de Integración Curricular - Desarrollo Tecnológico / Software'
        THEN 'Desarrollo o Implementación de proceso, producto, servicio, patente, software.'
      WHEN 'Trabajo de Integración Curricular - Artículo Académico / Científico'
        THEN 'Ensayos o artículos académicos'
      WHEN 'Trabajo de Integración Curricular - Proyecto de Vinculación'
        THEN 'Prácticas de investigación y/o intervención'
      WHEN 'Trabajo de Integración Curricular - Emprendimiento / Plan de Negocios'
        THEN 'Emprendimientos'
      ELSE modality
    END
WHERE modality LIKE 'Trabajo de Integración Curricular - %';

-- Cualquier registro restante sin opción de aprobación se considera TIC.
UPDATE pat_registrations
SET approval_option = 'Trabajo de Integración Curricular'
WHERE approval_option IS NULL;

ALTER TABLE pat_registrations ALTER COLUMN approval_option SET NOT NULL;

ALTER TABLE pat_registrations DROP COLUMN IF EXISTS presentation_mechanism;

ALTER TABLE pat_registrations DROP CONSTRAINT IF EXISTS chk_pat_approval_option;
ALTER TABLE pat_registrations ADD CONSTRAINT chk_pat_approval_option
    CHECK (approval_option IN (
        'Trabajo de Integración Curricular',
        'Examen de carácter complexivo',
        'Trabajo de titulación',
        'NA'
    ));

COMMIT;
