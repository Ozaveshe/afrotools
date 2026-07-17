-- Security advisor hardening for public SECURITY DEFINER RPC exposure.
-- Applied live on 2026-05-12 as migration security_definer_rpc_exposure_hardening.
--
-- These functions are trigger-only helpers or unused legacy public RPCs in the
-- current repo surface. Keep service_role/postgres access, but remove anon and
-- authenticated direct execution via PostgREST /rpc.

revoke execute on function public.increment_view_count(text) from public, anon, authenticated;
revoke execute on function public.seller_audit_row_change() from public, anon, authenticated;
revoke execute on function public.seller_create_owner_membership() from public, anon, authenticated;
revoke execute on function public.seller_validate_business_links() from public, anon, authenticated;
revoke execute on function public.vote_community_idea(uuid, text) from public, anon, authenticated;
revoke execute on function public.vote_community_price(uuid, text) from public, anon, authenticated;
