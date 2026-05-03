-- Backend security advisor hardening
-- Keeps internal SECURITY DEFINER helpers out of public RPC access and removes
-- a duplicate AfroStream snapshot index reported by Supabase performance advisors.

revoke all on function public.refresh_afrostream_creator_snapshots(date) from public, anon, authenticated;
grant execute on function public.refresh_afrostream_creator_snapshots(date) to service_role;

revoke all on function public.increment_api_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_api_usage(uuid, text) to service_role;

revoke all on function public.auto_confirm_user() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.increment_calculation_count() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.update_idea_save_count() from public, anon, authenticated;
revoke all on function public.update_idea_vote_count() from public, anon, authenticated;
revoke all on function public.update_mastery_after_practice() from public, anon, authenticated;

drop index if exists public.idx_snapshots_unique;
