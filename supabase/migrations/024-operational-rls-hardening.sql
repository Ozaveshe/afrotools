-- Hardens older operational tables so public submissions go through Netlify
-- functions instead of direct anonymous PostgREST writes.

do $$
begin
  if to_regclass('public.email_leads') is not null then
    alter table public.email_leads enable row level security;

    drop policy if exists "anon_insert_leads" on public.email_leads;
    drop policy if exists "service_select_leads" on public.email_leads;
    drop policy if exists "service_all_leads" on public.email_leads;
    drop policy if exists "Service role manages email leads" on public.email_leads;

    create policy "Service role manages email leads"
    on public.email_leads
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;

  if to_regclass('public.search_queries') is not null then
    alter table public.search_queries enable row level security;

    drop policy if exists "anon_insert_search_queries" on public.search_queries;
    drop policy if exists "service_role_select_search_queries" on public.search_queries;
    drop policy if exists "Service role manages search queries" on public.search_queries;

    create policy "Service role manages search queries"
    on public.search_queries
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;

  if to_regclass('public.alerts') is not null then
    alter table public.alerts enable row level security;

    drop policy if exists "Service role manages alerts" on public.alerts;
    create policy "Service role manages alerts"
    on public.alerts
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;

  if to_regclass('public.fuel_prices') is not null then
    alter table public.fuel_prices enable row level security;

    drop policy if exists "Service role manages fuel prices" on public.fuel_prices;
    create policy "Service role manages fuel prices"
    on public.fuel_prices
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;

  if to_regclass('public.mw_alert_subscriptions') is not null then
    alter table public.mw_alert_subscriptions enable row level security;

    drop policy if exists "Service role manages minimum wage alert subscriptions" on public.mw_alert_subscriptions;
    create policy "Service role manages minimum wage alert subscriptions"
    on public.mw_alert_subscriptions
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;

  if to_regclass('public.mw_crowdsource_reports') is not null then
    alter table public.mw_crowdsource_reports enable row level security;

    drop policy if exists "Service role manages minimum wage crowdsource reports" on public.mw_crowdsource_reports;
    create policy "Service role manages minimum wage crowdsource reports"
    on public.mw_crowdsource_reports
    for all
    to service_role
    using ((select auth.role()) = 'service_role')
    with check ((select auth.role()) = 'service_role');
  end if;
end $$;
