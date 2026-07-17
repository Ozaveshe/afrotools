-- Pins mutable function search paths reported by Supabase security advisors.
-- This keeps function name resolution stable without changing table data or
-- public API behavior. The guards keep the migration replay-safe across
-- branches where one of the advised functions has not been created yet.

do $$
begin
  if to_regprocedure('public.normalize_scholarship_source_defaults()') is not null then
    alter function public.normalize_scholarship_source_defaults()
      set search_path = public;

    comment on function public.normalize_scholarship_source_defaults() is
      'Normalizes scholarship source default fields; search_path pinned for security advisor compliance.';
  end if;

  if to_regprocedure('public.parse_afrostream_money_value(text)') is not null then
    alter function public.parse_afrostream_money_value(text)
      set search_path = public;

    comment on function public.parse_afrostream_money_value(text) is
      'Parses AfroStream money labels into numeric values; search_path pinned for security advisor compliance.';
  end if;
end
$$;
