-- AfroTools target schema snapshot query.
-- Captured through Supabase MCP on 2026-05-13.
-- This query returns schema metadata only. It does not export user or business rows.

with target_tables as (
  select table_schema, table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_type in ('BASE TABLE', 'VIEW')
    and (
      table_name = 'profiles'
      or table_name in ('data_buyer_leads', 'email_leads', 'mw_alert_subscriptions')
      or table_name like 'payroll_%'
      or table_name like 'afrohr_%'
      or table_name like 'afrobooks_%'
      or table_name like 'books_%'
      or table_name like 'hr_%'
      or table_name like '%subscription%'
      or table_name like '%paystack%'
    )
),
cols as (
  select c.table_name,
    string_agg(
      c.column_name || ' ' || c.data_type ||
      case when c.is_nullable = 'NO' then ' not null' else '' end ||
      coalesce(' default ' || c.column_default, ''),
      E'\n  '
      order by c.ordinal_position
    ) as columns
  from information_schema.columns c
  join target_tables t using (table_schema, table_name)
  group by c.table_name
),
con as (
  select tc.table_name,
    string_agg(
      tc.constraint_type || ' ' || tc.constraint_name || ': ' || pg_get_constraintdef(pc.oid),
      E'\n  '
      order by tc.constraint_name
    ) as constraints
  from information_schema.table_constraints tc
  join pg_constraint pc on pc.conname = tc.constraint_name
  join target_tables t using (table_schema, table_name)
  group by tc.table_name
),
idx as (
  select tablename as table_name,
    string_agg(indexname || ': ' || indexdef, E'\n  ' order by indexname) as indexes
  from pg_indexes
  where schemaname = 'public'
  group by tablename
),
pol as (
  select tablename as table_name,
    string_agg(
      policyname || ' [' || cmd || '] roles=' || array_to_string(roles, ',') ||
      coalesce(' using=' || qual, '') ||
      coalesce(' check=' || with_check, ''),
      E'\n  '
      order by policyname
    ) as policies
  from pg_policies
  where schemaname = 'public'
  group by tablename
)
select
  t.table_name,
  coalesce(pt.rowsecurity, false) as rls_enabled,
  coalesce(c.columns, '') as columns,
  coalesce(con.constraints, '') as constraints,
  coalesce(idx.indexes, '') as indexes,
  coalesce(pol.policies, '') as policies
from target_tables t
left join pg_tables pt on pt.schemaname = t.table_schema and pt.tablename = t.table_name
left join cols c on c.table_name = t.table_name
left join con on con.table_name = t.table_name
left join idx on idx.table_name = t.table_name
left join pol on pol.table_name = t.table_name
order by t.table_name;
