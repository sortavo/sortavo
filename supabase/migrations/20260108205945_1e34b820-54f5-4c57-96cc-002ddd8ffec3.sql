-- =====================================================
-- FASE 2-3: TABLA ORDERS + FUNCIONES DE COMPRESIÓN
-- Arquitectura ultra-comprimida para 250M+ boletos
-- =====================================================

-- Función para comprimir array de índices en rangos JSONB
-- Ej: [1,2,3,4,5,100,101,102] → [{"s":1,"e":5},{"s":100,"e":102}]
CREATE OR REPLACE FUNCTION public.compress_ticket_indices(indices INTEGER[])
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  sorted INTEGER[];
  ranges JSONB := '[]';
  range_start INTEGER;
  range_end INTEGER;
  curr INTEGER;
  i INTEGER;
BEGIN
  IF indices IS NULL OR array_length(indices, 1) IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  -- Ordenar y eliminar duplicados
  SELECT array_agg(DISTINCT x ORDER BY x) INTO sorted FROM unnest(indices) x;
  
  IF array_length(sorted, 1) IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  range_start := sorted[1];
  range_end := sorted[1];
  
  FOR i IN 2..array_length(sorted, 1) LOOP
    curr := sorted[i];
    IF curr = range_end + 1 THEN
      range_end := curr;
    ELSE
      ranges := ranges || jsonb_build_object('s', range_start, 'e', range_end);
      range_start := curr;
      range_end := curr;
    END IF;
  END LOOP;
  
  -- Agregar último rango
  ranges := ranges || jsonb_build_object('s', range_start, 'e', range_end);
  
  RETURN ranges;
END;
$$;

-- Función para expandir rangos JSONB a array de índices
-- Ej: [{"s":1,"e":5},{"s":100,"e":102}] → [1,2,3,4,5,100,101,102]
CREATE OR REPLACE FUNCTION public.expand_ticket_ranges(ranges JSONB)
RETURNS INTEGER[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result INTEGER[] := '{}';
  r RECORD;
BEGIN
  IF ranges IS NULL OR jsonb_array_length(ranges) = 0 THEN
    RETURN '{}';
  END IF;
  
  FOR r IN SELECT * FROM jsonb_array_elements(ranges) LOOP
    result := result || (
      SELECT array_agg(x) 
      FROM generate_series(
        (r.value->>'s')::INTEGER, 
        (r.value->>'e')::INTEGER
      ) x
    );
  END LOOP;
  
  RETURN COALESCE(result, '{}');
END;
$$;

-- Función para verificar si un índice está en una orden
CREATE OR REPLACE FUNCTION public.is_index_in_order(
  p_ticket_ranges JSONB,
  p_lucky_indices INTEGER[],
  p_index INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Verificar en lucky_indices
  IF p_lucky_indices IS NOT NULL AND p_index = ANY(p_lucky_indices) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar en rangos
  IF p_ticket_ranges IS NOT NULL THEN
    FOR r IN SELECT * FROM jsonb_array_elements(p_ticket_ranges) LOOP
      IF p_index BETWEEN (r.value->>'s')::INTEGER AND (r.value->>'e')::INTEGER THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Función para contar boletos en rangos
CREATE OR REPLACE FUNCTION public.count_tickets_in_ranges(ranges JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  total INTEGER := 0;
  r RECORD;
BEGIN
  IF ranges IS NULL OR jsonb_array_length(ranges) = 0 THEN
    RETURN 0;
  END IF;
  
  FOR r IN SELECT * FROM jsonb_array_elements(ranges) LOOP
    total := total + ((r.value->>'e')::INTEGER - (r.value->>'s')::INTEGER + 1);
  END LOOP;
  
  RETURN total;
END;
$$;

-- =====================================================
-- TABLA ORDERS: 1 fila = 1 orden de compra
-- =====================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- Comprador (UNA vez por orden, no por boleto)
  buyer_id UUID REFERENCES public.buyers(id),
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_city TEXT,
  
  -- BOLETOS COMPRIMIDOS
  -- Rangos para compras secuenciales: [{"s":1,"e":100}] = índices 1-100
  ticket_ranges JSONB NOT NULL DEFAULT '[]',
  -- Solo para lucky numbers individuales (no secuenciales)
  lucky_indices INTEGER[] DEFAULT '{}',
  -- Total de boletos en esta orden
  ticket_count INTEGER NOT NULL,
  
  -- Pago
  reference_code TEXT UNIQUE NOT NULL,
  payment_method TEXT,
  payment_proof_url TEXT,
  order_total NUMERIC(12,2),
  
  -- Estados
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'pending', 'sold', 'canceled')),
  reserved_at TIMESTAMPTZ DEFAULT now(),
  reserved_until TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices optimizados para queries frecuentes
CREATE INDEX idx_orders_raffle_status ON public.orders(raffle_id, status);
CREATE INDEX idx_orders_org ON public.orders(organization_id);
CREATE INDEX idx_orders_reference ON public.orders(reference_code);
CREATE INDEX idx_orders_buyer_email ON public.orders(buyer_email) WHERE buyer_email IS NOT NULL;
CREATE INDEX idx_orders_reserved_until ON public.orders(reserved_until) 
  WHERE status = 'reserved' AND reserved_until IS NOT NULL;

-- Índice GIN para búsqueda eficiente de lucky numbers
CREATE INDEX idx_orders_lucky_gin ON public.orders USING GIN(lucky_indices);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can insert orders for active raffles"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.raffles r
      WHERE r.id = orders.raffle_id AND r.status = 'active'
    )
  );

CREATE POLICY "Public can view orders for active/completed raffles"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles r
      WHERE r.id = orders.raffle_id 
      AND r.status IN ('active', 'completed')
    )
  );

CREATE POLICY "Org members can manage orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles r
      WHERE r.id = orders.raffle_id 
      AND has_org_access(auth.uid(), r.organization_id)
    )
  );

-- Habilitar realtime para orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;