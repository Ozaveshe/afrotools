-- AfroTools only: zpclagtgczsygrgztlts.
-- RLS restricts profile ownership, but ownership must not grant billing/admin access.
-- Preserve client profile edits and existing rows; only trusted server roles may
-- change access fields. Do not infer that existing roles/subscriptions are audited.
begin;

create schema if not exists private;

create or replace function private.protect_profile_access_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  -- auth.role() retains the request role inside a nested SECURITY DEFINER call.
  -- Checking current_user alone would trust a client-called definer owned by postgres.
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
     and coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.tier, 'free') <> 'free'
       or coalesce(new.subscription_tier, 'free') <> 'free'
       or coalesce(new.role, 'user') <> 'user'
       or new.subscription_expires_at is not null
       or new.paystack_customer_id is not null
       or new.paystack_subscription_code is not null then
      raise exception using
        errcode = '42501',
        message = 'Account access fields are managed by AfroTools.';
    end if;
  elsif tg_op = 'UPDATE' then
    if row(new.tier, new.subscription_tier, new.subscription_expires_at,
           new.paystack_customer_id, new.paystack_subscription_code, new.role)
       is distinct from
       row(old.tier, old.subscription_tier, old.subscription_expires_at,
           old.paystack_customer_id, old.paystack_subscription_code, old.role) then
      raise exception using
        errcode = '42501',
        message = 'Account access fields are managed by AfroTools.';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.protect_profile_access_fields()
  from public, anon, authenticated;

drop trigger if exists profiles_protect_access_fields on public.profiles;
create trigger profiles_protect_access_fields
before insert or update on public.profiles
for each row execute function private.protect_profile_access_fields();

comment on function private.protect_profile_access_fields() is
  'Reject client changes to billing/admin fields; allow ordinary profile edits and trusted server lifecycle writes. No payload values are logged.';

commit;
