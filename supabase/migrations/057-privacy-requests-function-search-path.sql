-- Pin the DSAR ledger trigger function to an empty search path so object
-- resolution cannot be influenced by caller-controlled schemas.
ALTER FUNCTION public.set_privacy_requests_updated_at()
  SET search_path = '';
