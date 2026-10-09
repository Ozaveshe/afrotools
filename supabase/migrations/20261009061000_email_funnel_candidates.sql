-- Filter eligibility before batch limits so old inactive rows do not starve
-- recent actions or newly eligible inactivity check-ins.
create view public.marketing_signin_candidates with (security_invoker=true) as
select p.id,p.email,p.name,p.email_unsubscribe_token,p.email_digest_enabled,
  p.email_welcome_sent_at,p.email_last_signin_reminder_at,p.created_at
from public.profiles p join auth.users u on u.id=p.id
where p.email_digest_enabled=true and p.email_last_signin_reminder_at is null
and coalesce(u.last_sign_in_at,u.created_at) between now()-interval '60 days' and now()-interval '30 days';

create view public.marketing_activity_candidates with (security_invoker=true) as
select p.id,p.email,p.name,p.email_unsubscribe_token,p.email_digest_enabled,
  p.email_welcome_sent_at,p.email_activity_milestone_sent_at,p.created_at
from public.profiles p where p.email_digest_enabled=true and p.email_activity_milestone_sent_at is null
and p.id in (
  select user_id from public.calculation_history where created_at between now()-interval '10 days' and now()-interval '1 hour'
  union select user_id from public.favorites where created_at between now()-interval '10 days' and now()-interval '1 hour'
  union select user_id from public.saved_calculations where created_at between now()-interval '10 days' and now()-interval '1 hour'
  union select user_id from public.saved_tools where saved_at between now()-interval '10 days' and now()-interval '1 hour'
  union select user_id from public.workspace_items where updated_at between now()-interval '10 days' and now()-interval '1 hour'
  union select user_id from public.contributions where submitted_at between now()-interval '10 days' and now()-interval '1 hour'
);
revoke all on public.marketing_signin_candidates,public.marketing_activity_candidates from public,anon,authenticated;
grant select on public.marketing_signin_candidates,public.marketing_activity_candidates to service_role;
