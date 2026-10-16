-- Frozen two-table ACL repair candidate. Root owns project identity/live execution.
-- No content reads/DML, service narrowing, policy/schema/global-role/default-ACL edits.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
SET LOCAL search_path = pg_catalog;
DO $repair$
DECLARE
  targets oid[] := ARRAY[to_regclass('public.gazette_changes'),to_regclass('public.review_queue')];
  ordinary oid[];
  role_name text;
  before_metadata jsonb;
  after_metadata jsonb;
  service_before jsonb;
  service_after jsonb;
BEGIN
  IF array_position(targets,NULL) IS NOT NULL OR
     (SELECT count(*) FROM pg_roles WHERE rolname IN('anon','authenticated','service_role','pg_maintain'))<>4 THEN
    RAISE EXCEPTION 'Required exact relations or roles absent';
  END IF;
  SELECT array_agg(oid ORDER BY oid) INTO ordinary FROM pg_roles WHERE rolname IN('anon','authenticated');
  IF (SELECT count(*) FROM pg_class c WHERE c.oid=ANY(targets) AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity AND pg_get_userbyid(c.relowner)='postgres')<>2 OR
     EXISTS(SELECT 1 FROM pg_inherits WHERE inhrelid=ANY(targets) OR inhparent=ANY(targets)) THEN
    RAISE EXCEPTION 'Plain postgres-owned service-only RLS table prestate required';
  END IF;
  -- Two finite relation locks only; block concurrent DDL/TRUNCATE while checking.
  LOCK TABLE ONLY public.gazette_changes, ONLY public.review_queue IN ACCESS EXCLUSIVE MODE;
  IF (SELECT count(*) FROM pg_class c WHERE c.oid=ANY(targets) AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity AND pg_get_userbyid(c.relowner)='postgres')<>2 OR
     EXISTS(SELECT 1 FROM pg_inherits WHERE inhrelid=ANY(targets) OR inhparent=ANY(targets)) THEN
    RAISE EXCEPTION 'Plain postgres-owned service-only RLS table prestate required';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid=ANY(targets))<>2 OR
     (SELECT count(*) FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
       WHERE p.polrelid=ANY(targets) AND p.polname='Service role manages '||c.relname
       AND p.polcmd='*' AND p.polpermissive AND p.polroles=ARRAY[(SELECT oid FROM pg_roles WHERE rolname='service_role')]
       AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true')<>2 THEN
    RAISE EXCEPTION 'Exact two service-only ALL true/true policies required';
  END IF;
  FOR role_name IN SELECT unnest(ARRAY['anon','authenticated']) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name AND NOT rolsuper AND NOT rolbypassrls) OR
       pg_has_role(role_name,'service_role','MEMBER') OR pg_has_role(role_name,'pg_maintain','MEMBER') OR
       EXISTS(SELECT 1 FROM pg_roles r WHERE (r.rolsuper OR r.rolbypassrls) AND pg_has_role(role_name,r.oid,'MEMBER')) OR
       EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname<>role_name AND pg_has_role(role_name,r.oid,'MEMBER') AND
         EXISTS(SELECT 1 FROM unnest(targets) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p WHERE has_table_privilege(r.oid,t,p))) THEN
      RAISE EXCEPTION 'Ordinary role attributes or privileged membership drift: %',role_name;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl) x
       WHERE a.attrelid=ANY(targets) AND (x.grantee=0 OR x.grantee=ANY(ordinary))) THEN
    RAISE EXCEPTION 'Ordinary or PUBLIC column ACL needs separate review';
  END IF;
  IF EXISTS(SELECT 1 FROM unnest(targets) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p
       WHERE NOT has_table_privilege('service_role',t,p)) THEN
    RAISE EXCEPTION 'Reviewed service effective all-eight prestate drift';
  END IF;
  SELECT jsonb_build_object(
 'relations',(SELECT jsonb_agg(to_jsonb(c)-'relacl' ORDER BY c.oid) FROM pg_class c WHERE c.oid=ANY(targets)),
 'columns',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_attribute a WHERE a.attrelid=ANY(targets)),
 'constraints',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_constraint c WHERE c.conrelid=ANY(targets) OR c.confrelid=ANY(targets)),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_attrdef d WHERE d.adrelid=ANY(targets)),
 'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p WHERE p.polrelid=ANY(targets)),
 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_trigger t WHERE t.tgrelid=ANY(targets)),
 'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_index i WHERE i.indrelid=ANY(targets)),
 'kept_acl',(SELECT jsonb_agg(jsonb_build_array(c.oid,a.grantor,a.grantee,a.privilege_type,a.is_grantable) ORDER BY c.oid,a.grantor,a.grantee,a.privilege_type,a.is_grantable) FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a WHERE c.oid=ANY(targets) AND a.grantee<>0 AND a.grantee<>ALL(ordinary)),
 'other_public_acl',(SELECT jsonb_agg(jsonb_build_array(c.oid,c.relacl) ORDER BY c.oid) FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.oid<>ALL(targets)),
 'schema_acl',(SELECT jsonb_agg(jsonb_build_array(n.oid,n.nspacl) ORDER BY n.oid) FROM pg_namespace n),
 'default_acl',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_default_acl d),
 'roles',(SELECT jsonb_agg(jsonb_build_array(r.oid,r.rolsuper,r.rolbypassrls,r.rolinherit,r.rolcreaterole,r.rolcanlogin) ORDER BY r.oid) FROM pg_roles r),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.roleid,m.member,m.grantor) FROM pg_auth_members m)) INTO before_metadata;
  SELECT jsonb_agg(jsonb_build_array(t,p,has_table_privilege('service_role',t,p)) ORDER BY t,p)
    INTO service_before FROM unnest(targets) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p;

  REVOKE ALL PRIVILEGES ON TABLE public.gazette_changes, public.review_queue FROM PUBLIC, anon, authenticated RESTRICT;

  FOR role_name IN SELECT unnest(ARRAY['anon','authenticated']) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name AND NOT rolsuper AND NOT rolbypassrls) OR
       pg_has_role(role_name,'service_role','MEMBER') OR pg_has_role(role_name,'pg_maintain','MEMBER') OR
       EXISTS(SELECT 1 FROM pg_roles r WHERE (r.rolsuper OR r.rolbypassrls) AND pg_has_role(role_name,r.oid,'MEMBER')) OR
       EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname<>role_name AND pg_has_role(role_name,r.oid,'MEMBER') AND
         EXISTS(SELECT 1 FROM unnest(targets) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p WHERE has_table_privilege(r.oid,t,p))) THEN
      RAISE EXCEPTION 'Ordinary role attributes or privileged membership drift: %',role_name;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM unnest(targets) t CROSS JOIN unnest(ARRAY['anon','authenticated']) r
       CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p
       WHERE has_table_privilege(r,t,p)) OR
     EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
       WHERE c.oid=ANY(targets) AND (a.grantee=0 OR a.grantee=ANY(ordinary))) THEN
    RAISE EXCEPTION 'Ordinary effective or direct privilege remains; rollback required';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_attribute a CROSS JOIN unnest(ARRAY['anon','authenticated']) r
       CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','REFERENCES']) p
       WHERE a.attrelid=ANY(targets) AND a.attnum>0 AND NOT a.attisdropped AND has_column_privilege(r,a.attrelid,a.attnum,p)) THEN
    RAISE EXCEPTION 'Ordinary effective column privilege remains; rollback required';
  END IF;
  SELECT jsonb_agg(jsonb_build_array(t,p,has_table_privilege('service_role',t,p)) ORDER BY t,p)
    INTO service_after FROM unnest(targets) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p;
  SELECT jsonb_build_object(
 'relations',(SELECT jsonb_agg(to_jsonb(c)-'relacl' ORDER BY c.oid) FROM pg_class c WHERE c.oid=ANY(targets)),
 'columns',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum) FROM pg_attribute a WHERE a.attrelid=ANY(targets)),
 'constraints',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.oid) FROM pg_constraint c WHERE c.conrelid=ANY(targets) OR c.confrelid=ANY(targets)),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_attrdef d WHERE d.adrelid=ANY(targets)),
 'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p WHERE p.polrelid=ANY(targets)),
 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_trigger t WHERE t.tgrelid=ANY(targets)),
 'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_index i WHERE i.indrelid=ANY(targets)),
 'kept_acl',(SELECT jsonb_agg(jsonb_build_array(c.oid,a.grantor,a.grantee,a.privilege_type,a.is_grantable) ORDER BY c.oid,a.grantor,a.grantee,a.privilege_type,a.is_grantable) FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a WHERE c.oid=ANY(targets) AND a.grantee<>0 AND a.grantee<>ALL(ordinary)),
 'other_public_acl',(SELECT jsonb_agg(jsonb_build_array(c.oid,c.relacl) ORDER BY c.oid) FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.oid<>ALL(targets)),
 'schema_acl',(SELECT jsonb_agg(jsonb_build_array(n.oid,n.nspacl) ORDER BY n.oid) FROM pg_namespace n),
 'default_acl',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_default_acl d),
 'roles',(SELECT jsonb_agg(jsonb_build_array(r.oid,r.rolsuper,r.rolbypassrls,r.rolinherit,r.rolcreaterole,r.rolcanlogin) ORDER BY r.oid) FROM pg_roles r),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.roleid,m.member,m.grantor) FROM pg_auth_members m)) INTO after_metadata;
  IF service_before IS DISTINCT FROM service_after OR before_metadata IS DISTINCT FROM after_metadata THEN
    RAISE EXCEPTION 'Service privileges or nonordinary ACL/metadata/collateral changed';
  END IF;
END;
$repair$;
COMMIT;
