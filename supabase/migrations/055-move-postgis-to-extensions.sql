-- Keep PostGIS implementation objects outside the PostgREST-exposed public schema.
-- AfroTools currently has no application geometry/geography columns, so this is
-- a namespace-only relocation of extension-owned objects.

create schema if not exists extensions;

drop extension postgis;
create extension postgis with schema extensions;
