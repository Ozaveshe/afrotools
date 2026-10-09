-- Allow ordinary cron jitter without drifting a weekly edition into the next week.
create or replace function public.reserve_marketing_email(p_email text, p_type text, p_key text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  address text := lower(trim(p_email));
  last_sent timestamptz;
  eligible boolean := false;
begin
  perform pg_advisory_xact_lock(hashtextextended(address, 0));
  if exists(select 1 from marketing_email_suppressions where email=address) then return 'suppressed'; end if;
  if p_type like 'newsletter_%' then
    select exists(select 1 from newsletter_subscribers where email=address and unsubscribed_at is null) into eligible;
  elsif p_type like 'pdf_lead_%' then
    select exists(select 1 from email_leads where lower(email)=address and opt_in_digest=true) into eligible;
  else
    select exists(select 1 from profiles where lower(email)=address and email_digest_enabled=true
      and (p_type <> 'weekly_brief' or email_weekly_enabled=true)) into eligible;
  end if;
  if not eligible then return 'not_subscribed'; end if;
  if exists(select 1 from marketing_email_deliveries where delivery_key=p_key and status <> 'failed') then return 'duplicate'; end if;
  select max(at) into last_sent from (
    select reserved_at as at from marketing_email_deliveries where email=address and status <> 'failed'
    union all select greatest(email_welcome_sent_at,email_last_weekly_at,email_last_digest_at,email_onboarding_nudge_sent_at,email_activity_milestone_sent_at,email_last_signin_reminder_at) from profiles where lower(email)=address
    union all select last_email_sent_at from email_leads where lower(email)=address
    union all select greatest(welcome_sent_at,last_weekly_at) from newsletter_subscribers where email=address
  ) timestamps;
  if last_sent > now() - interval '7 days' + interval '5 minutes' then return 'frequency_capped'; end if;
  insert into marketing_email_deliveries(delivery_key,email,email_type,status)
    values(p_key,address,p_type,'reserved')
    on conflict(delivery_key) do update set status='reserved', reserved_at=now();
  return 'reserved';
end $$;
