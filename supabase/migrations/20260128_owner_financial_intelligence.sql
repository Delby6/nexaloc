-- Migration: Owner Financial Intelligence dashboard foundations
-- 1) Aggregated views (daily financials, pricing snapshot, and response health)
-- 2) Refresh helper for downstream scheduling
-- 3) RLS policies touching base tables + resulting views

-- ===========================
-- 1. Aggregated views
-- ===========================
ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS timezone text;

CREATE OR REPLACE VIEW public.owner_daily_financials AS
WITH owner_businesses AS (
  SELECT id, owner_id, COALESCE(timezone, 'UTC') AS timezone
  FROM public.businesses
),
owner_bookings AS (
  SELECT
    b.business_id,
    ob.owner_id,
    date_trunc('day', b.booking_date AT TIME ZONE ob.timezone) AS metric_day,
    b.booking_amount,
    b.first_response_seconds
  FROM public.bookings b
  JOIN owner_businesses ob ON ob.id = b.business_id
  WHERE b.status IN ('confirmed', 'completed')
),
owner_signals AS (
  SELECT
    cs.business_id,
    ob.owner_id,
    date_trunc('day', cs.occurred_at AT TIME ZONE ob.timezone) AS metric_day
  FROM public.conversion_signals cs
  JOIN owner_businesses ob ON ob.id = cs.business_id
),
signals_per_day AS (
  SELECT owner_id, metric_day, COUNT(*) AS signal_count
  FROM owner_signals
  GROUP BY owner_id, metric_day
),
price_comparisons AS (
  SELECT
    ob.owner_id,
    ops.business_id,
    ops.snapshot_date,
    ops.avg_price,
    ops.price_bucket,
    ops.price_gap_pct,
    lag(ops.avg_price) OVER (PARTITION BY ops.business_id ORDER BY ops.snapshot_date) AS prev_avg_price
  FROM public.owner_price_snapshots ops
  JOIN owner_businesses ob ON ob.id = ops.business_id
)
SELECT
  ob.owner_id,
  ob.metric_day,
  COUNT(*) AS bookings_count,
  SUM(ob.booking_amount) AS gross_booking_value,
  SUM(ob.booking_amount) / NULLIF(COUNT(*), 0) AS average_price,
  AVG(ob.first_response_seconds) AS response_time_seconds,
  COALESCE(s.signal_count, 0) AS conversion_signal_count,
  CASE
    WHEN COALESCE(s.signal_count, 0) = 0 THEN NULL
    ELSE COUNT(*)::numeric / s.signal_count
  END AS conversion_rate,
  CASE
    WHEN price.prev_avg_price IS NULL OR price.prev_avg_price = 0 THEN NULL
    ELSE (SUM(ob.booking_amount) / NULLIF(COUNT(*), 0) - price.prev_avg_price) / ABS(price.prev_avg_price)
  END AS price_change_pct,
  json_build_object(
    'bookings', COUNT(*),
    'value', SUM(ob.booking_amount),
    'response', AVG(ob.first_response_seconds),
    'signals', COALESCE(s.signal_count, 0)
  ) AS ai_ready_payload
FROM owner_bookings ob
LEFT JOIN signals_per_day s
  ON s.owner_id = ob.owner_id
  AND s.metric_day = ob.metric_day
LEFT JOIN price_comparisons price
  ON price.owner_id = ob.owner_id
  AND price.snapshot_date = ob.metric_day
GROUP BY ob.owner_id, ob.metric_day, s.signal_count, price.prev_avg_price;

CREATE MATERIALIZED VIEW public.owner_daily_pricing AS
WITH owner_businesses AS (
  SELECT id, owner_id
  FROM public.businesses
),
price_comparisons AS (
  SELECT
    ob.owner_id,
    ops.business_id,
    ops.snapshot_date,
    ops.avg_price,
    ops.price_bucket,
    ops.price_gap_pct,
    ops.notes
  FROM public.owner_price_snapshots ops
  JOIN owner_businesses ob ON ob.id = ops.business_id
)
SELECT
  owner_id,
  snapshot_date::date AS metric_day,
  avg_price,
  price_bucket,
  price_gap_pct,
  notes
FROM price_comparisons;

CREATE OR REPLACE VIEW public.owner_response_health AS
WITH owner_businesses AS (
  SELECT id, owner_id, COALESCE(timezone, 'UTC') AS timezone
  FROM public.businesses
),
response_percentiles AS (
  SELECT
    ob.owner_id,
    date_trunc('day', ore.responded_at AT TIME ZONE ob.timezone) AS metric_day,
    percentile_disc(0.5) WITHIN GROUP (ORDER BY ore.response_time_seconds) AS p50_response_seconds,
    percentile_disc(0.9) WITHIN GROUP (ORDER BY ore.response_time_seconds) AS p90_response_seconds
  FROM public.owner_response_events ore
  JOIN owner_businesses ob ON ob.id = ore.business_id
  GROUP BY ob.owner_id, metric_day
)
SELECT *
FROM response_percentiles;

-- ===========================
-- 2. Refresh helper
-- ===========================
CREATE OR REPLACE FUNCTION public.refresh_owner_financial_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.owner_daily_pricing;
END;
$$;

-- ===========================
-- 3. RLS policies
-- ===========================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY businesses_owner_policy
  ON public.businesses
  FOR ALL
  USING (owner_id = auth.uid() OR auth.role = 'admin')
  WITH CHECK (owner_id = auth.uid());

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_owner_policy
  ON public.bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.bookings.business_id
        AND (b.owner_id = auth.uid() OR auth.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.bookings.business_id
        AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE public.conversion_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversion_signals_owner_policy
  ON public.conversion_signals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.conversion_signals.business_id
        AND (b.owner_id = auth.uid() OR auth.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.conversion_signals.business_id
        AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE public.owner_response_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY response_events_owner_policy
  ON public.owner_response_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_response_events.business_id
        AND (b.owner_id = auth.uid() OR auth.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_response_events.business_id
        AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE public.owner_price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY price_snapshots_owner_policy
  ON public.owner_price_snapshots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_price_snapshots.business_id
        AND (b.owner_id = auth.uid() OR auth.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_price_snapshots.business_id
        AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE public.owner_insight_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY insight_signals_owner_policy
  ON public.owner_insight_signals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_insight_signals.business_id
        AND (b.owner_id = auth.uid() OR auth.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.owner_insight_signals.business_id
        AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE public.owner_daily_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_daily_financials_policy
  ON public.owner_daily_financials
  FOR SELECT
  USING (owner_id = auth.uid());

ALTER MATERIALIZED VIEW public.owner_daily_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_daily_pricing_policy
  ON public.owner_daily_pricing
  FOR SELECT
  USING (owner_id = auth.uid());

ALTER VIEW public.owner_response_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_response_health_policy
  ON public.owner_response_health
  FOR SELECT
  USING (owner_id = auth.uid());
