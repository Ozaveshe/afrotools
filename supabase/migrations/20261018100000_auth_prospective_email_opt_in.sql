-- Prospective explicit optional-email consent for newly constructed profiles.
-- Guard exact reviewed production metadata; fail atomically on drift or bounded lock timeout.
-- Preserve existing profiles, Auth/access protections and unrelated defaults; no row backfill.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
SET LOCAL search_path = pg_catalog;
SET LOCAL TimeZone = 'UTC';
LOCK TABLE auth.users IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE;

DO $guard$
DECLARE
  expected_columns constant jsonb := $columns$[{"column":"id","type":"uuid","nullable":"NO","default":null},{"column":"email","type":"text","nullable":"YES","default":null},{"column":"name","type":"text","nullable":"YES","default":null},{"column":"country","type":"text","nullable":"YES","default":null},{"column":"avatar_url","type":"text","nullable":"YES","default":null},{"column":"tier","type":"text","nullable":"YES","default":"'free'::text"},{"column":"created_at","type":"timestamp with time zone","nullable":"YES","default":"now()"},{"column":"job_title","type":"text","nullable":"YES","default":null},{"column":"company","type":"text","nullable":"YES","default":null},{"column":"industry","type":"text","nullable":"YES","default":null},{"column":"phone","type":"text","nullable":"YES","default":null},{"column":"city","type":"text","nullable":"YES","default":null},{"column":"bio","type":"text","nullable":"YES","default":null},{"column":"interests","type":"ARRAY","nullable":"YES","default":"'{}'::text[]"},{"column":"linkedin_url","type":"text","nullable":"YES","default":null},{"column":"website_url","type":"text","nullable":"YES","default":null},{"column":"company_size","type":"text","nullable":"YES","default":null},{"column":"experience_level","type":"text","nullable":"YES","default":null},{"column":"updated_at","type":"timestamp with time zone","nullable":"YES","default":"now()"},{"column":"country_code","type":"text","nullable":"YES","default":null},{"column":"currency","type":"text","nullable":"YES","default":"'USD'::text"},{"column":"employment_type","type":"text","nullable":"YES","default":null},{"column":"monthly_income_range","type":"text","nullable":"YES","default":null},{"column":"subscription_tier","type":"text","nullable":"YES","default":"'free'::text"},{"column":"subscription_expires_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"paystack_customer_id","type":"text","nullable":"YES","default":null},{"column":"paystack_subscription_code","type":"text","nullable":"YES","default":null},{"column":"onboarding_completed","type":"boolean","nullable":"YES","default":"false"},{"column":"preferred_tools","type":"ARRAY","nullable":"YES","default":"'{}'::text[]"},{"column":"calculation_count","type":"integer","nullable":"YES","default":"0"},{"column":"role","type":"text","nullable":"YES","default":"'user'::text"},{"column":"email_digest_enabled","type":"boolean","nullable":"YES","default":null},{"column":"education_level","type":"text","nullable":"YES","default":null},{"column":"institution","type":"text","nullable":"YES","default":null},{"column":"gpa_value","type":"numeric","nullable":"YES","default":null},{"column":"gpa_scale","type":"numeric","nullable":"YES","default":null},{"column":"target_study_level","type":"text","nullable":"YES","default":null},{"column":"target_countries","type":"ARRAY","nullable":"YES","default":null},{"column":"target_fields","type":"ARRAY","nullable":"YES","default":null},{"column":"ielts_overall","type":"numeric","nullable":"YES","default":null},{"column":"ielts_components","type":"jsonb","nullable":"YES","default":null},{"column":"jamb_score","type":"integer","nullable":"YES","default":null},{"column":"nationality","type":"text","nullable":"YES","default":null},{"column":"email_last_digest_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"email_unsubscribe_token","type":"uuid","nullable":"YES","default":"gen_random_uuid()"},{"column":"email_welcome_sent_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"email_weekly_enabled","type":"boolean","nullable":"NO","default":null},{"column":"email_last_weekly_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"email_last_signin_reminder_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"email_onboarding_nudge_sent_at","type":"timestamp with time zone","nullable":"YES","default":null},{"column":"email_activity_milestone_sent_at","type":"timestamp with time zone","nullable":"YES","default":null}]$columns$::jsonb;
  desired_source constant text := $body$
begin
  insert into public.profiles (id, email, name, avatar_url, email_digest_enabled, email_weekly_enabled)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    case when new.raw_user_meta_data->'email_digest_enabled' = 'true'::jsonb then true else false end,
    case when new.raw_user_meta_data->'email_weekly_enabled' = 'true'::jsonb then true else false end
  );
  return new;
end;
$body$;
  desired_ddl constant text := $ddl$CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.profiles (id, email, name, avatar_url, email_digest_enabled, email_weekly_enabled)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    case when new.raw_user_meta_data->'email_digest_enabled' = 'true'::jsonb then true else false end,
    case when new.raw_user_meta_data->'email_weekly_enabled' = 'true'::jsonb then true else false end
  );
  return new;
end;
$function$
$ddl$;
  before_meta jsonb;
  after_meta jsonb;
  actual_columns jsonb;
  constructor_hash text;
  constructor_source text;
  digest_default text;
  weekly_default text;
  f record;
BEGIN
  IF current_user <> 'postgres' OR session_user <> 'postgres'
     OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN
    RAISE EXCEPTION 'CONSENT_ROLE_OR_VERSION_DRIFT';
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE (n.nspname='public' AND p.proname IN ('handle_new_user','auto_confirm_user'))
      OR (n.nspname='private' AND p.proname='protect_profile_access_fields')) <> 3 THEN
    RAISE EXCEPTION 'CONSENT_FUNCTION_SET_DRIFT';
  END IF;
  FOR f IN
    SELECT p.*, n.nspname, l.lanname, p.proowner::regrole::text AS owner_name
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
    WHERE (n.nspname='public' AND p.proname IN ('handle_new_user','auto_confirm_user'))
    OR (n.nspname='private' AND p.proname='protect_profile_access_fields')
  LOOP
    IF f.owner_name <> 'postgres' OR f.lanname <> 'plpgsql' OR f.pronargs <> 0
       OR f.prorettype <> 'trigger'::regtype OR f.provolatile <> 'v'
       OR f.proleakproof OR f.proisstrict OR f.proparallel <> 'u' THEN
      RAISE EXCEPTION 'CONSENT_FUNCTION_METADATA_DRIFT';
    END IF;
    IF f.nspname='public' THEN
      IF NOT f.prosecdef OR f.proconfig IS DISTINCT FROM ARRAY['search_path=public, pg_temp']
         OR f.proacl::text IS DISTINCT FROM '{postgres=X/postgres,service_role=X/postgres}' THEN
        RAISE EXCEPTION 'CONSENT_FUNCTION_ACL_OR_PATH_DRIFT';
      END IF;
    ELSE
      IF f.prosecdef OR f.proconfig IS DISTINCT FROM ARRAY['search_path=""']
         OR f.proacl::text IS DISTINCT FROM '{postgres=X/postgres}' THEN
        RAISE EXCEPTION 'CONSENT_ACCESS_GUARD_ACL_OR_PATH_DRIFT';
      END IF;
    END IF;
    IF f.proname='auto_confirm_user' AND encode(sha256(convert_to(pg_get_functiondef(f.oid),'UTF8')),'hex')
       <> '4ce9c41cd5e3d739f0d65db5abaa5865cb01a6582c8b96836e7bddd3d2f0d249' THEN
      RAISE EXCEPTION 'CONSENT_AUTO_CONFIRM_DRIFT';
    END IF;
    IF f.proname='protect_profile_access_fields' AND encode(sha256(convert_to(pg_get_functiondef(f.oid),'UTF8')),'hex')
       <> '6978a7916491a8beda74b04a56caee1e4386e3a4a10b59bc363037408c1a346a' THEN
      RAISE EXCEPTION 'CONSENT_ACCESS_GUARD_DRIFT';
    END IF;
  END LOOP;
  -- Trigger expectations come from the exact-ref catalog capture under pg_catalog.
  -- Attached-function hashes are independently guarded above/below, not mistaken for trigger hashes.
  IF (SELECT coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,
       'name',t.tgname,'enabled',t.tgenabled,'bits',t.tgtype,'args',t.tgnargs,
       'argument_bytes',octet_length(t.tgargs),'has_when',t.tgqual IS NOT NULL,
       'column_numbers',to_jsonb(t.tgattr::smallint[]),'deferrable',t.tgdeferrable,
       'initially_deferred',t.tginitdeferred,'is_constraint',t.tgconstraint<>0,'has_parent',t.tgparentid<>0,
       'old_transition_table',t.tgoldtable,'new_transition_table',t.tgnewtable,
       'function_schema',pn.nspname,'function_name',p.proname,
       'trigger_definition_sha256',CASE WHEN t.tgnargs=0 AND t.tgqual IS NULL
         THEN encode(sha256(convert_to(pg_get_triggerdef(t.oid),'UTF8')),'hex') ELSE NULL END)
       ORDER BY n.nspname,c.relname,t.tgname),'[]'::jsonb)
      FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace
      WHERE NOT t.tgisinternal AND t.tgrelid IN ('auth.users'::regclass,'public.profiles'::regclass))
     IS DISTINCT FROM $triggers$[{"schema":"auth","table":"users","name":"auto_confirm_on_signup","enabled":"O","bits":7,"args":0,"argument_bytes":0,"has_when":false,"column_numbers":[],"deferrable":false,"initially_deferred":false,"is_constraint":false,"has_parent":false,"old_transition_table":null,"new_transition_table":null,"function_schema":"public","function_name":"auto_confirm_user","trigger_definition_sha256":"b4d2ebbc1a61db923809ce289d2e2a8300f526d301afdf9a86d734ef59d3c501"},{"schema":"auth","table":"users","name":"on_auth_user_created","enabled":"O","bits":5,"args":0,"argument_bytes":0,"has_when":false,"column_numbers":[],"deferrable":false,"initially_deferred":false,"is_constraint":false,"has_parent":false,"old_transition_table":null,"new_transition_table":null,"function_schema":"public","function_name":"handle_new_user","trigger_definition_sha256":"ab9bf2a610d02b1236cfdbe1b6f7aef91ea6571808059d799b60781c15ee10fe"},{"schema":"public","table":"profiles","name":"profiles_protect_access_fields","enabled":"O","bits":23,"args":0,"argument_bytes":0,"has_when":false,"column_numbers":[],"deferrable":false,"initially_deferred":false,"is_constraint":false,"has_parent":false,"old_transition_table":null,"new_transition_table":null,"function_schema":"private","function_name":"protect_profile_access_fields","trigger_definition_sha256":"b5eb7172326b136f3b83afefaaef28d5171bc9aa1c1ba5c902451673d9978c83"}]$triggers$::jsonb THEN
    RAISE EXCEPTION 'CONSENT_TRIGGER_DRIFT';
  END IF;
  SELECT jsonb_agg(jsonb_build_object('column',column_name,'type',data_type,'nullable',is_nullable,
       'default',CASE WHEN column_name IN ('email_digest_enabled','email_weekly_enabled') THEN NULL ELSE column_default END)
       ORDER BY ordinal_position) INTO actual_columns
    FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles';
  IF actual_columns IS DISTINCT FROM expected_columns THEN RAISE EXCEPTION 'CONSENT_COLUMN_DRIFT'; END IF;
  SELECT column_default INTO digest_default FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='email_digest_enabled';
  SELECT column_default INTO weekly_default FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='email_weekly_enabled';
  SELECT encode(sha256(convert_to(pg_get_functiondef('public.handle_new_user()'::regprocedure),'UTF8')),'hex'),prosrc
    INTO constructor_hash,constructor_source FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure;
  IF constructor_source=desired_source
     AND constructor_hash=encode(sha256(convert_to(desired_ddl,'UTF8')),'hex')
     AND digest_default='false' AND weekly_default='false' THEN
    RAISE NOTICE 'CONSENT_EXACT_REPLAY_NO_CHANGE';
    RETURN;
  END IF;
  IF constructor_hash <> 'c9b75d885c0092dd627ac71efd67e8b6da3ef8264927aa5595ceb42c752b2910'
     OR digest_default IS DISTINCT FROM 'true' OR weekly_default IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CONSENT_CONSTRUCTOR_OR_DEFAULT_DRIFT';
  END IF;

  -- No table content read. Snapshot all unaffected catalog attributes/ACLs/policies.
  SELECT jsonb_build_object(
    'relations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_class c WHERE c.oid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_attribute a WHERE a.attrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.adrelid,d.adnum) FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
       WHERE d.adrelid IN ('auth.users'::regclass,'public.profiles'::regclass) AND NOT (d.adrelid='public.profiles'::regclass AND a.attname IN ('email_digest_enabled','email_weekly_enabled'))),
    'constraints',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_constraint c WHERE c.conrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p WHERE p.polrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_trigger t WHERE t.tgrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'functions',(SELECT jsonb_agg(CASE WHEN p.oid='public.handle_new_user()'::regprocedure THEN to_jsonb(p) - 'prosrc' ELSE to_jsonb(p) END ORDER BY p.oid) FROM pg_proc p WHERE p.oid IN ('public.handle_new_user()'::regprocedure,'public.auto_confirm_user()'::regprocedure,'private.protect_profile_access_fields()'::regprocedure))
  ) INTO before_meta;
  EXECUTE desired_ddl;
  ALTER TABLE public.profiles ALTER COLUMN email_digest_enabled SET DEFAULT false;
  ALTER TABLE public.profiles ALTER COLUMN email_weekly_enabled SET DEFAULT false;
  SELECT jsonb_build_object(
    'relations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_class c WHERE c.oid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_attribute a WHERE a.attrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.adrelid,d.adnum) FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
       WHERE d.adrelid IN ('auth.users'::regclass,'public.profiles'::regclass) AND NOT (d.adrelid='public.profiles'::regclass AND a.attname IN ('email_digest_enabled','email_weekly_enabled'))),
    'constraints',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_constraint c WHERE c.conrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p WHERE p.polrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_trigger t WHERE t.tgrelid IN ('auth.users'::regclass,'public.profiles'::regclass)),
    'functions',(SELECT jsonb_agg(CASE WHEN p.oid='public.handle_new_user()'::regprocedure THEN to_jsonb(p) - 'prosrc' ELSE to_jsonb(p) END ORDER BY p.oid) FROM pg_proc p WHERE p.oid IN ('public.handle_new_user()'::regprocedure,'public.auto_confirm_user()'::regprocedure,'private.protect_profile_access_fields()'::regprocedure))
  ) INTO after_meta;
  IF before_meta IS DISTINCT FROM after_meta THEN RAISE EXCEPTION 'CONSENT_UNRELATED_METADATA_CHANGED'; END IF;
  IF (SELECT prosrc FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure) IS DISTINCT FROM desired_source
     OR pg_get_functiondef('public.handle_new_user()'::regprocedure) IS DISTINCT FROM desired_ddl
     OR (SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email_digest_enabled') IS DISTINCT FROM 'false'
     OR (SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email_weekly_enabled') IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'CONSENT_POSTCONDITION_FAILED';
  END IF;
END;
$guard$;
COMMIT;
