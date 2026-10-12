-- AfroTools only: zpclagtgczsygrgztlts. Apply through the publisher before the webhook change.
-- Delivery receipts contain a hash of the provider message id, never phone numbers or message text.
create table public.wb_delivery_receipts (
  message_key text primary key check (message_key ~ '^[a-f0-9]{64}$'),
  state text not null check (state in ('processing','sending','sent','retryable','uncertain')),
  attempt_token uuid not null,
  lease_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.wb_delivery_receipts enable row level security;
revoke all on public.wb_delivery_receipts from public, anon, authenticated;
grant select on public.wb_delivery_receipts to service_role;

create function public.claim_whatsapp_delivery(p_message_key text, p_attempt_token uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare current_state text;
begin
  if p_message_key is null or p_message_key !~ '^[a-f0-9]{64}$' or p_attempt_token is null then
    raise exception 'Invalid delivery receipt key';
  end if;
  insert into public.wb_delivery_receipts(message_key,state,attempt_token,lease_expires_at)
  values(p_message_key,'processing',p_attempt_token,clock_timestamp()+interval '2 minutes')
  on conflict (message_key) do nothing;
  if found then return 'claimed'; end if;

  update public.wb_delivery_receipts
  set state='processing',attempt_token=p_attempt_token,
      lease_expires_at=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp()
  where message_key=p_message_key and
    (state='retryable' or (state='processing' and lease_expires_at<clock_timestamp()));
  if found then return 'claimed'; end if;

  -- A crashed send may have reached Meta. Never automatically replay an ambiguous send.
  update public.wb_delivery_receipts set state='uncertain',updated_at=clock_timestamp()
  where message_key=p_message_key and state='sending' and lease_expires_at<clock_timestamp();
  select state into current_state from public.wb_delivery_receipts where message_key=p_message_key;
  if current_state='sent' then return 'done'; end if;
  if current_state='uncertain' then return 'uncertain'; end if;
  return 'busy';
end;
$$;

create function public.transition_whatsapp_delivery(p_message_key text, p_attempt_token uuid, p_state text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.wb_delivery_receipts set state=p_state,updated_at=clock_timestamp(),
    lease_expires_at=clock_timestamp()+interval '2 minutes'
  where message_key=p_message_key and attempt_token=p_attempt_token and (
    (p_state='sending' and state='processing' and lease_expires_at>=clock_timestamp()) or
    (p_state='sent' and state in ('sending','uncertain')) or
    (p_state='retryable' and state in ('processing','sending')) or
    (p_state='uncertain' and state='sending')
  );
  return found;
end;
$$;
revoke all on function public.claim_whatsapp_delivery(text,uuid) from public,anon,authenticated;
revoke all on function public.transition_whatsapp_delivery(text,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_whatsapp_delivery(text,uuid) to service_role;
grant execute on function public.transition_whatsapp_delivery(text,uuid,text) to service_role;
comment on table public.wb_delivery_receipts is 'Operational message delivery state. No phone, salary, message body or conversation identifier. Uncertain outcomes require reconciliation before retry.';
