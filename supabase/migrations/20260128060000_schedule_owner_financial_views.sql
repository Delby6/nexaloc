-- Daily refresh job for owner pricing intelligence
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  '0 5 * * *',
  'CALL public.refresh_owner_financial_views();'
);
