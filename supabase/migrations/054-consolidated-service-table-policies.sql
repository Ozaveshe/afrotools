-- Make the service-only boundary explicit for tables created by migration 053.
-- service_role bypasses RLS; anon and authenticated clients are denied.
-- Target: zpclagtgczsygrgztlts (AUTH / canonical AfroTools project)

drop policy if exists "Service only search queries" on public.search_queries;
create policy "Service only search queries"
  on public.search_queries for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only CreatorMind voice profiles" on public.creator_voice_profiles;
create policy "Service only CreatorMind voice profiles"
  on public.creator_voice_profiles for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only CreatorMind projects" on public.creator_mind_projects;
create policy "Service only CreatorMind projects"
  on public.creator_mind_projects for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only CreatorMind outputs" on public.creator_mind_outputs;
create policy "Service only CreatorMind outputs"
  on public.creator_mind_outputs for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only JAMB subscribers" on public.jamb_daily_subscribers;
create policy "Service only JAMB subscribers"
  on public.jamb_daily_subscribers for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only WhatsApp conversations" on public.wb_conversations;
create policy "Service only WhatsApp conversations"
  on public.wb_conversations for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "Service only WhatsApp usage" on public.wb_usage_log;
create policy "Service only WhatsApp usage"
  on public.wb_usage_log for all to anon, authenticated
  using (false) with check (false);
