-- The send service does not need direct access to auth.users. Return only
-- eligible profile IDs through a service-only function with fixed SQL.
create function public.marketing_signin_profile_ids()
returns setof uuid language sql stable security definer set search_path=public,pg_temp as $$
  select p.id from public.profiles p join auth.users u on u.id=p.id
  where p.email_digest_enabled=true and p.email_last_signin_reminder_at is null
  and coalesce(u.last_sign_in_at,u.created_at) between now()-interval '60 days' and now()-interval '30 days'
$$;
revoke all on function public.marketing_signin_profile_ids() from public,anon,authenticated;
grant execute on function public.marketing_signin_profile_ids() to service_role;
create or replace view public.marketing_signin_candidates with (security_invoker=true) as
select p.id,p.email,p.name,p.email_unsubscribe_token,p.email_digest_enabled,
  p.email_welcome_sent_at,p.email_last_signin_reminder_at,p.created_at
from public.profiles p where p.id in (select public.marketing_signin_profile_ids());
