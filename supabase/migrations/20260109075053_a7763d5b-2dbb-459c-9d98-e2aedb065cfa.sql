-- Fix search_path security warning for get_dashboard_charts
ALTER FUNCTION get_dashboard_charts(UUID, TIMESTAMPTZ, TIMESTAMPTZ) SET search_path = public;