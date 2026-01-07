-- ============================================
-- FASE 4: LIMPIEZA COMPLETA SISTEMA LEGACY
-- ============================================

-- 1. BORRAR FUNCIONES DE GENERACIÓN OBSOLETAS
DROP FUNCTION IF EXISTS generate_ticket_batch CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_batch_v2 CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_batch_v3 CASCADE;
DROP FUNCTION IF EXISTS process_ticket_batch CASCADE;
DROP FUNCTION IF EXISTS claim_next_job CASCADE;

-- 2. BORRAR TABLA TICKETS (ya borrada anteriormente, por si acaso)
DROP TABLE IF EXISTS tickets CASCADE;

-- 3. BORRAR TABLA DE JOBS (obsoleta)
DROP TABLE IF EXISTS ticket_generation_jobs CASCADE;

-- 4. BORRAR VISTAS OBSOLETAS
DROP VIEW IF EXISTS active_generation_jobs CASCADE;
DROP VIEW IF EXISTS job_health_dashboard CASCADE;
DROP VIEW IF EXISTS problematic_jobs CASCADE;

-- 5. CREAR VISTA PLACEHOLDER PARA DOCUMENTACIÓN
CREATE OR REPLACE VIEW legacy_tickets_archived AS
SELECT 
  'Tabla tickets borrada' as nota,
  'Datos migrados a sold_tickets' as detalle,
  NOW() as fecha_limpieza;

COMMENT ON VIEW legacy_tickets_archived IS 
  'Placeholder view - tabla tickets fue borrada el 2026-01-07. Datos de tickets vendidos/reservados fueron migrados a sold_tickets.';