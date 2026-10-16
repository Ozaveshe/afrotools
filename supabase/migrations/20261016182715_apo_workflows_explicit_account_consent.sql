-- DRAFT ONLY / NOT EXECUTED. No product migration timestamp assigned.
-- Target: AfroTools zpclagtgczsygrgztlts; Root must reverify live metadata first.
-- One atomic absent-table creation. This is NOT a replay of migration 019.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $pre$
DECLARE role_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='public') OR
     to_regclass('auth.users') IS NULL OR to_regprocedure('auth.uid()') IS NULL OR
     to_regprocedure('gen_random_uuid()') IS NULL THEN
    RAISE EXCEPTION 'Required schema/auth/UUID dependency absent';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='apo_workflows') OR
     EXISTS (SELECT 1 FROM pg_type WHERE typname='apo_workflows') THEN
    RAISE EXCEPTION 'apo_workflows already exists; do not adopt or replay';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname IN
               ('idx_apo_workflows_user_updated','idx_apo_workflows_status')) THEN
    RAISE EXCEPTION 'Workflow index name occupied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='auth.users'::regclass
                 AND attname='id' AND atttypid='uuid'::regtype AND attnum>0 AND NOT attisdropped) THEN
    RAISE EXCEPTION 'auth.users.id UUID contract mismatch';
  END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname=role_name) THEN
      RAISE EXCEPTION 'Required API role absent';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls)) OR
     pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') OR
     pg_has_role('anon','pg_maintain','MEMBER') OR pg_has_role('authenticated','pg_maintain','MEMBER') OR
     pg_has_role('service_role','pg_maintain','MEMBER') THEN
    RAISE EXCEPTION 'Ordinary API role bypass/membership drift';
  END IF;
END
$pre$;

CREATE TABLE public.apo_workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_type text NOT NULL,
  country text NOT NULL,
  current_step integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 0,
  carry_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  step_statuses jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in-progress',
  last_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sync_consent_version text NOT NULL,
  sync_consented_at timestamptz NOT NULL,
  UNIQUE (user_id,journey_type),
  CONSTRAINT apo_country_shape CHECK (country ~ '^[A-Z]{2}$'),
  -- Derived from reviewed JOURNEYS and stepAppliesToCountry, not a guessed fixed seven.
  CONSTRAINT apo_journey_shape CHECK (journey_type IN ('new-hire','new-job','expansion','offboarding')),
  CONSTRAINT apo_step_count CHECK (total_steps = CASE journey_type
    WHEN 'new-hire' THEN 7 WHEN 'new-job' THEN 6 WHEN 'expansion' THEN 6
    WHEN 'offboarding' THEN CASE WHEN country='ZA' THEN 6 ELSE 5 END END),
  CONSTRAINT apo_step_range CHECK (current_step BETWEEN 0 AND total_steps),
  CONSTRAINT apo_status_array CHECK (CASE WHEN jsonb_typeof(step_statuses)='array'
    THEN jsonb_array_length(step_statuses)=total_steps
      AND step_statuses <@ '["pending","done","skipped"]'::jsonb ELSE false END),
  CONSTRAINT apo_carry_shape CHECK (jsonb_typeof(carry_data)='object'
    AND carry_data ? 'country' AND carry_data->>'country'=country
    AND (carry_data - ARRAY['country','salary','role','currency']::text[])='{}'::jsonb
    AND jsonb_typeof(carry_data->'country')='string'
    AND (NOT carry_data ? 'salary' OR jsonb_typeof(carry_data->'salary')='string')
    AND (NOT carry_data ? 'role' OR jsonb_typeof(carry_data->'role')='string')
    AND (NOT carry_data ? 'currency' OR jsonb_typeof(carry_data->'currency')='string')),
  CONSTRAINT apo_completion CHECK (status IN ('in-progress','complete')
    AND (status='complete') = (step_statuses <@ '["done"]'::jsonb)
    AND (current_step < total_steps OR status='complete')
    AND (status='complete') = (last_completed_at IS NOT NULL)),
  CONSTRAINT apo_consent_version CHECK (sync_consent_version='payroll-workflow-sync-v1'),
  CONSTRAINT apo_finite_dates CHECK (isfinite(created_at) AND isfinite(updated_at)
    AND isfinite(sync_consented_at)
    AND (last_completed_at IS NULL OR isfinite(last_completed_at)))
);
CREATE INDEX idx_apo_workflows_user_updated ON public.apo_workflows(user_id,updated_at DESC);
CREATE INDEX idx_apo_workflows_status ON public.apo_workflows(status);
ALTER TABLE public.apo_workflows ENABLE ROW LEVEL SECURITY;
-- Table-local revocation also counters inherited public-schema default ACLs on creation.
REVOKE ALL PRIVILEGES ON TABLE public.apo_workflows FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.apo_workflows TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON TABLE public.apo_workflows TO service_role;

-- Reuse the four historical names: an accidental 019 replay cannot add duplicate policies.
CREATE POLICY "Users can read own AfroPayroll workflows" ON public.apo_workflows
  FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY "Users can insert own AfroPayroll workflows" ON public.apo_workflows
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY "Users can update own AfroPayroll workflows" ON public.apo_workflows
  FOR UPDATE TO authenticated USING ((SELECT auth.uid())=user_id)
  WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY "Users can delete own AfroPayroll workflows" ON public.apo_workflows
  FOR DELETE TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY "Service maintenance AfroPayroll workflows" ON public.apo_workflows
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $post$
DECLARE role_name text; privilege_name text; wanted boolean;
BEGIN
  IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity AND relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)
          FROM pg_class WHERE oid='public.apo_workflows'::regclass) OR
     (SELECT count(*) FROM pg_policy WHERE polrelid='public.apo_workflows'::regclass)<>5 OR
     EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.apo_workflows'::regclass AND attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'New workflow relation/policy/column-ACL drift';
  END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] LOOP
      wanted := (role_name='authenticated' AND privilege_name IN ('SELECT','INSERT','UPDATE','DELETE'))
        OR (role_name='service_role' AND privilege_name IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE'));
      IF has_table_privilege(role_name,'public.apo_workflows',privilege_name) IS DISTINCT FROM wanted THEN
        RAISE EXCEPTION 'Effective workflow privilege drift: % %',role_name,privilege_name;
      END IF;
    END LOOP;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE c.oid='public.apo_workflows'::regclass AND
      (a.grantee NOT IN (c.relowner,(SELECT oid FROM pg_roles WHERE rolname='authenticated'),
                                  (SELECT oid FROM pg_roles WHERE rolname='service_role')) OR
       (a.grantee<>c.relowner AND a.is_grantable) OR
       (a.grantee=(SELECT oid FROM pg_roles WHERE rolname='authenticated') AND a.privilege_type NOT IN ('SELECT','INSERT','UPDATE','DELETE')) OR
       (a.grantee=(SELECT oid FROM pg_roles WHERE rolname='service_role') AND a.privilege_type NOT IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')))) THEN
    RAISE EXCEPTION 'Unexpected direct workflow ACL/grant option';
  END IF;
END
$post$;
COMMIT;
