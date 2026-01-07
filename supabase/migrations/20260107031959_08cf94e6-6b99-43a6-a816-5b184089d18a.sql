-- =====================================================
-- CREATE 3 MEGA RAFFLES WITH 10M TICKETS EACH
-- For verification of post-optimization generation system
-- =====================================================

DO $$
DECLARE
  v_org1_id UUID := '94e38554-07af-4c46-bae3-7b27d034b298'; -- Sorteos El Dorado (demo1)
  v_org2_id UUID := '50069f32-7b83-4baf-a28f-42918719707b'; -- Fundación Esperanza (demo2)
  v_org3_id UUID := '1d614c1b-eaac-4b5d-9ff1-d9ba93acdfa4'; -- Loterías Premium (demo3)
  v_raffle1_id UUID;
  v_raffle2_id UUID;
  v_raffle3_id UUID;
  v_user1_id UUID;
  v_user2_id UUID;
  v_user3_id UUID;
BEGIN
  -- Get user IDs (creators)
  SELECT p.id INTO v_user1_id FROM profiles p WHERE p.organization_id = v_org1_id LIMIT 1;
  SELECT p.id INTO v_user2_id FROM profiles p WHERE p.organization_id = v_org2_id LIMIT 1;
  SELECT p.id INTO v_user3_id FROM profiles p WHERE p.organization_id = v_org3_id LIMIT 1;

  -- =====================================================
  -- RAFFLE 1: Toyota Land Cruiser 2027 (Sorteos El Dorado)
  -- =====================================================
  INSERT INTO raffles (
    organization_id, created_by, title, description, prize_name, prize_value, prize_images,
    total_tickets, ticket_price, currency_code, status, draw_date, draw_method,
    lottery_digits, template_id, slug, ticket_number_format, numbering_config,
    customization, prize_terms, allow_individual_sale, max_tickets_per_purchase,
    min_tickets_per_purchase, reservation_time_minutes, start_date
  ) VALUES (
    v_org1_id, v_user1_id,
    '🔥 MEGA SORTEO 10M - Toyota Land Cruiser 2027',
    'El sorteo más grande de Sorteos El Dorado. ¡10 millones de boletos con oportunidad de ganar una Toyota Land Cruiser 2027 último modelo! Participando también entras al sorteo de 9 premios adicionales incluyendo viajes, electrónicos y más.',
    'Toyota Land Cruiser 2027 Último Modelo',
    1200000,
    ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200'],
    10000000, 50, 'MXN', 'active',
    '2026-12-31 20:00:00+00', 'lottery_nacional', 7, 'luxury',
    'mega-sorteo-10m-land-cruiser-2027', 'sequential',
    '{"mode":"sequential","start_number":1,"step":1,"pad_enabled":true,"pad_width":7,"pad_char":"0"}'::jsonb,
    '{"show_probability":true,"show_social_proof":true,"show_viewers_count":true,"show_urgency_badge":true,"show_purchase_ticker":true,"show_floating_whatsapp":true,"primary_color":"#D4AF37","secondary_color":"#1a1a2e"}'::jsonb,
    'Válido para mayores de 18 años residentes en México. Premio no transferible ni canjeable por efectivo. El ganador tiene 30 días para reclamar el premio.',
    true, 1000, 1, 15, NOW()
  ) RETURNING id INTO v_raffle1_id;

  -- Packages for Raffle 1
  INSERT INTO raffle_packages (raffle_id, quantity, price, label, discount_percent, display_order) VALUES
    (v_raffle1_id, 1, 50, 'Individual', 0, 1),
    (v_raffle1_id, 10, 400, 'Familiar', 20, 2),
    (v_raffle1_id, 50, 1750, 'Popular', 30, 3),
    (v_raffle1_id, 100, 3000, 'Mejor Valor ⭐', 40, 4),
    (v_raffle1_id, 500, 12500, 'Mega Pack', 50, 5),
    (v_raffle1_id, 1000, 20000, 'Ultra Pack 🔥', 60, 6);

  -- Generation job for Raffle 1
  INSERT INTO ticket_generation_jobs (
    raffle_id, status, total_tickets, batch_size, total_batches, 
    current_batch, generated_count, ticket_format
  ) VALUES (
    v_raffle1_id, 'pending', 10000000, 5000, 2000, 0, 0, 'sequential'
  );

  -- =====================================================
  -- RAFFLE 2: Mansión en Cancún (Fundación Esperanza)
  -- =====================================================
  INSERT INTO raffles (
    organization_id, created_by, title, description, prize_name, prize_value, prize_images,
    total_tickets, ticket_price, currency_code, status, draw_date, draw_method,
    lottery_digits, template_id, slug, ticket_number_format, numbering_config,
    customization, prize_terms, allow_individual_sale, max_tickets_per_purchase,
    min_tickets_per_purchase, reservation_time_minutes, start_date
  ) VALUES (
    v_org2_id, v_user2_id,
    '🏠 MEGA SORTEO 10M - Mansión de Lujo en Cancún',
    'Fundación Esperanza presenta el sorteo benéfico más grande del año. ¡Gana una espectacular mansión de 500m² frente al mar en la zona hotelera de Cancún! Todos los fondos van a apoyar a niños con cáncer.',
    'Mansión de Lujo 500m² Frente al Mar en Cancún',
    8000000,
    ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'],
    10000000, 100, 'MXN', 'active',
    '2026-12-31 19:00:00+00', 'lottery_nacional', 7, 'charity',
    'mega-sorteo-10m-mansion-cancun', 'sequential',
    '{"mode":"sequential","start_number":1,"step":1,"pad_enabled":true,"pad_width":7,"pad_char":"0"}'::jsonb,
    '{"show_probability":true,"show_social_proof":true,"show_viewers_count":true,"show_urgency_badge":true,"show_purchase_ticker":true,"show_floating_whatsapp":true,"primary_color":"#2E86AB","secondary_color":"#F24236"}'::jsonb,
    'Válido para mayores de 18 años. El premio incluye escrituras y gastos notariales. Aplican restricciones. El 80% de las ventas se destina a la fundación.',
    true, 500, 1, 15, NOW()
  ) RETURNING id INTO v_raffle2_id;

  -- Packages for Raffle 2
  INSERT INTO raffle_packages (raffle_id, quantity, price, label, discount_percent, display_order) VALUES
    (v_raffle2_id, 1, 100, 'Individual', 0, 1),
    (v_raffle2_id, 5, 400, 'Familiar', 20, 2),
    (v_raffle2_id, 20, 1400, 'Popular', 30, 3),
    (v_raffle2_id, 50, 3000, 'Mejor Valor ⭐', 40, 4),
    (v_raffle2_id, 200, 10000, 'Mega Pack', 50, 5),
    (v_raffle2_id, 500, 20000, 'Ultra Pack 🔥', 60, 6);

  -- Generation job for Raffle 2
  INSERT INTO ticket_generation_jobs (
    raffle_id, status, total_tickets, batch_size, total_batches, 
    current_batch, generated_count, ticket_format
  ) VALUES (
    v_raffle2_id, 'pending', 10000000, 5000, 2000, 0, 0, 'sequential'
  );

  -- =====================================================
  -- RAFFLE 3: Ferrari 296 GTB (Loterías Premium)
  -- =====================================================
  INSERT INTO raffles (
    organization_id, created_by, title, description, prize_name, prize_value, prize_images,
    total_tickets, ticket_price, currency_code, status, draw_date, draw_method,
    lottery_digits, template_id, slug, ticket_number_format, numbering_config,
    customization, prize_terms, allow_individual_sale, max_tickets_per_purchase,
    min_tickets_per_purchase, reservation_time_minutes, start_date
  ) VALUES (
    v_org3_id, v_user3_id,
    '🏎️ MEGA SORTEO 10M - Ferrari 296 GTB 2027',
    'Loterías Nacionales Premium presenta: ¡El super deportivo italiano más deseado del mundo! Ferrari 296 GTB con motor V6 híbrido de 830 HP. El sorteo exclusivo para conocedores.',
    'Ferrari 296 GTB 2027 - Rosso Corsa',
    6500000,
    ARRAY['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200', 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1200'],
    10000000, 200, 'MXN', 'active',
    '2026-12-31 21:00:00+00', 'lottery_nacional', 7, 'luxury',
    'mega-sorteo-10m-ferrari-296-gtb', 'sequential',
    '{"mode":"sequential","start_number":1,"step":1,"pad_enabled":true,"pad_width":7,"pad_char":"0"}'::jsonb,
    '{"show_probability":true,"show_social_proof":true,"show_viewers_count":true,"show_urgency_badge":true,"show_purchase_ticker":true,"show_floating_whatsapp":true,"primary_color":"#DC143C","secondary_color":"#1a1a1a"}'::jsonb,
    'Válido para mayores de 18 años con licencia de conducir vigente. Premio incluye seguro por 1 año y tenencias pagadas. No canjeable por efectivo.',
    true, 500, 1, 15, NOW()
  ) RETURNING id INTO v_raffle3_id;

  -- Packages for Raffle 3
  INSERT INTO raffle_packages (raffle_id, quantity, price, label, discount_percent, display_order) VALUES
    (v_raffle3_id, 1, 200, 'Individual', 0, 1),
    (v_raffle3_id, 5, 800, 'Familiar', 20, 2),
    (v_raffle3_id, 10, 1400, 'Popular', 30, 3),
    (v_raffle3_id, 25, 3000, 'Mejor Valor ⭐', 40, 4),
    (v_raffle3_id, 100, 10000, 'Mega Pack', 50, 5),
    (v_raffle3_id, 250, 20000, 'Ultra Pack 🔥', 60, 6);

  -- Generation job for Raffle 3
  INSERT INTO ticket_generation_jobs (
    raffle_id, status, total_tickets, batch_size, total_batches, 
    current_batch, generated_count, ticket_format
  ) VALUES (
    v_raffle3_id, 'pending', 10000000, 5000, 2000, 0, 0, 'sequential'
  );

  RAISE NOTICE 'Created 3 raffles with 10M tickets each:';
  RAISE NOTICE '  1. Toyota Land Cruiser: %', v_raffle1_id;
  RAISE NOTICE '  2. Mansión Cancún: %', v_raffle2_id;
  RAISE NOTICE '  3. Ferrari 296 GTB: %', v_raffle3_id;
END $$;