-- =====================================================
-- CLEANUP: Remove obsolete database functions
-- These functions reference old tables (sold_tickets, tickets) 
-- that no longer exist in the new orders-based architecture
-- =====================================================

-- 1. Drop reserve_virtual_tickets (replaced by reserve_tickets_v2)
DROP FUNCTION IF EXISTS public.reserve_virtual_tickets(uuid, integer[], text, text, text, text, integer, numeric);

-- 2. Drop reserve_virtual_tickets_resilient (replaced by reserve_tickets_v2)
DROP FUNCTION IF EXISTS public.reserve_virtual_tickets_resilient(uuid, integer[], text, text, text, text, integer, numeric);

-- 3. Drop log_ticket_event (no longer used - no events table)
DROP FUNCTION IF EXISTS public.log_ticket_event();
DROP FUNCTION IF EXISTS public.log_ticket_event(text, uuid, uuid, jsonb);

-- 4. Drop append_ticket_batch (references old tickets table)
DROP FUNCTION IF EXISTS public.append_ticket_batch(uuid, integer, integer, jsonb);

-- 5. Drop apply_random_permutation (references old tickets table)
DROP FUNCTION IF EXISTS public.apply_random_permutation(uuid, jsonb);

-- 6. Drop apply_custom_numbers (references old tickets table)
DROP FUNCTION IF EXISTS public.apply_custom_numbers(uuid);

-- =====================================================
-- VERIFICATION: These functions should remain
-- =====================================================
-- reserve_tickets_v2 - Current reservation function
-- approve_order - Order approval
-- reject_order - Order rejection
-- get_virtual_tickets_v2 - Virtual ticket display
-- get_virtual_ticket_counts - Ticket counting
-- expand_ticket_ranges - Range expansion
-- compress_ticket_indices - Range compression
-- format_virtual_ticket - Number formatting