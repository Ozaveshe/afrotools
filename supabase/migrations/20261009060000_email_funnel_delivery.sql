-- Service-only newsletter consent and cross-journey send reservations.
create table public.newsletter_subscribers (
  email text primary key check (email = lower(trim(email))),
  source text not null check (source in ('newsletter','blog-newsletter','blog-newsletter-fr','newsletter-sw')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  welcome_sent_at timestamptz,
  last_weekly_at timestamptz
);
create table public.marketing_email_deliveries (
  delivery_key text primary key,
  email text not null,
  email_type text not null,
  status text not null check (status in ('reserved','accepted','failed')),
  reserved_at timestamptz not null default now(),
  provider_id text
);
create index marketing_delivery_recipient_time on public.marketing_email_deliveries(email, reserved_at desc);
create table public.marketing_email_suppressions (
  email text primary key,
  reason text not null,
  suppressed_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
alter table public.marketing_email_deliveries enable row level security;
alter table public.marketing_email_suppressions enable row level security;
revoke all on public.newsletter_subscribers, public.marketing_email_deliveries, public.marketing_email_suppressions from anon, authenticated;
grant all on public.newsletter_subscribers, public.marketing_email_deliveries, public.marketing_email_suppressions to service_role;

create function public.reserve_marketing_email(p_email text, p_type text, p_key text)
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
  if last_sent > now() - interval '7 days' then return 'frequency_capped'; end if;
  insert into marketing_email_deliveries(delivery_key,email,email_type,status)
    values(p_key,address,p_type,'reserved')
    on conflict(delivery_key) do update set status='reserved', reserved_at=now();
  return 'reserved';
end $$;
revoke all on function public.reserve_marketing_email(text,text,text) from public, anon, authenticated;
grant execute on function public.reserve_marketing_email(text,text,text) to service_role;

create function public.suppress_marketing_email(p_email text, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare address text := lower(trim(p_email));
begin
  perform pg_advisory_xact_lock(hashtextextended(address, 0));
  insert into marketing_email_suppressions(email,reason) values(address,p_reason)
    on conflict(email) do update set reason=excluded.reason, suppressed_at=now();
  update profiles set email_digest_enabled=false,email_weekly_enabled=false where lower(email)=address;
  update email_leads set opt_in_digest=false,email_status=p_reason,updated_at=now() where lower(email)=address;
  update newsletter_subscribers set unsubscribed_at=coalesce(unsubscribed_at,now()) where email=address;
end $$;
revoke all on function public.suppress_marketing_email(text,text) from public, anon, authenticated;
grant execute on function public.suppress_marketing_email(text,text) to service_role;

-- Preserve all existing opt-outs when a subscriber occurs in multiple stores.
insert into marketing_email_suppressions(email,reason)
select lower(trim(email)), 'existing_opt_out' from profiles where email_digest_enabled=false and email is not null
union select lower(trim(email)), 'existing_opt_out' from email_leads where opt_in_digest=false
on conflict(email) do nothing;
