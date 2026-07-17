-- AfroSeller Social Commerce OS account-backed workspace schema.
-- Target instance: AUTH project.
--
-- This migration creates the durable Supabase foundation for the current
-- local-only AfroSeller workspace: businesses, team roles, products, variants,
-- stock movements, customers, customer labels, orders, manual payments,
-- deliveries, message templates, exports, and audit events.
--
-- It deliberately does not create live payment collection, WhatsApp API
-- sending, storefront publishing, or delivery-provider integrations.

create extension if not exists pgcrypto;

create schema if not exists private;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function public.seller_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

create table if not exists public.seller_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text,
  currency_code text not null default 'NGN',
  language_lane text not null default 'English'
    check (language_lane in ('English', 'French', 'Kiswahili', 'Pidgin')),
  seller_channel text not null default 'WhatsApp'
    check (seller_channel in ('WhatsApp', 'Instagram', 'Shop', 'Market', 'Mixed')),
  phone_whatsapp text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text,
  role text not null
    check (role in ('owner', 'admin', 'staff', 'accountant')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  permissions_override jsonb not null default '{}'::jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_team_member_user_or_email
    check (user_id is not null or invited_email is not null)
);

create unique index if not exists uq_seller_team_members_business_user
  on public.seller_team_members (business_id, user_id)
  where user_id is not null;

create unique index if not exists uq_seller_team_members_business_email
  on public.seller_team_members (business_id, lower(invited_email))
  where invited_email is not null;

create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  supplier text,
  stock_location text,
  photo_url text,
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14, 2) not null default 0 check (selling_price >= 0),
  stock_on_hand numeric(14, 2) not null default 0,
  reorder_level numeric(14, 2) not null default 0 check (reorder_level >= 0),
  status text not null default 'ready'
    check (status in ('ready', 'low stock', 'out of stock', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists public.seller_product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  product_id uuid not null references public.seller_products(id) on delete cascade,
  sku text,
  variant_name text not null,
  size_label text,
  color_label text,
  barcode text,
  supplier text,
  stock_location text,
  photo_url text,
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14, 2) not null default 0 check (selling_price >= 0),
  stock_on_hand numeric(14, 2) not null default 0,
  reorder_level numeric(14, 2) not null default 0 check (reorder_level >= 0),
  status text not null default 'ready'
    check (status in ('ready', 'low stock', 'out of stock', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists public.seller_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  name text not null,
  phone_whatsapp text,
  email text,
  default_address text,
  last_order_note text,
  total_balance numeric(14, 2) not null default 0 check (total_balance >= 0),
  follow_status text not null default 'New lead'
    check (follow_status in ('New lead', 'Send payment reminder', 'Confirm delivery address', 'Ready for repeat order', 'Closed')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_customer_labels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  customer_id uuid not null references public.seller_customers(id) on delete cascade,
  label text not null
    check (label in ('VIP', 'Repeat buyer', 'Owes balance', 'Wholesale', 'Delivery issue')),
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_id, label)
);

create table if not exists public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  customer_id uuid references public.seller_customers(id) on delete set null,
  order_no text,
  order_date date not null default current_date,
  channel text not null default 'WhatsApp'
    check (channel in ('WhatsApp', 'Instagram', 'Shop', 'Market', 'Mixed', 'Other')),
  subtotal_amount numeric(14, 2) not null default 0 check (subtotal_amount >= 0),
  delivery_fee numeric(14, 2) not null default 0 check (delivery_fee >= 0),
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  balance_due numeric(14, 2) not null default 0 check (balance_due >= 0),
  latest_payment_method text
    check (latest_payment_method is null or latest_payment_method in ('cash', 'bank transfer', 'mobile money', 'POS', 'unpaid')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'refunded', 'void')),
  order_status text not null default 'draft'
    check (order_status in ('draft', 'confirmed', 'packed', 'delivered', 'paid', 'cancelled')),
  delivery_status text not null default 'Pickup pending'
    check (delivery_status in ('Pickup pending', 'Ready for dispatch', 'Rider assigned', 'In transit', 'Delivered', 'Cancelled')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_no)
);

create table if not exists public.seller_order_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  order_id uuid not null references public.seller_orders(id) on delete cascade,
  product_id uuid references public.seller_products(id) on delete set null,
  variant_id uuid references public.seller_product_variants(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  variant_snapshot text,
  quantity numeric(14, 2) not null default 1 check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(14, 2) not null default 0 check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  product_id uuid references public.seller_products(id) on delete set null,
  variant_id uuid references public.seller_product_variants(id) on delete set null,
  movement_type text not null
    check (movement_type in ('sale', 'restock', 'adjustment', 'damage', 'return')),
  quantity_delta numeric(14, 2) not null check (quantity_delta <> 0),
  stock_after numeric(14, 2),
  reason_note text,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'order', 'order_item', 'return', 'import')),
  source_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  order_id uuid references public.seller_orders(id) on delete cascade,
  customer_id uuid references public.seller_customers(id) on delete set null,
  payment_method text not null default 'unpaid'
    check (payment_method in ('cash', 'bank transfer', 'mobile money', 'POS', 'unpaid')),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  payment_status text not null default 'recorded'
    check (payment_status in ('pending', 'recorded', 'void', 'refunded')),
  proof_note text,
  reference_note text,
  is_manual_record boolean not null default true,
  received_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_deliveries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  order_id uuid not null references public.seller_orders(id) on delete cascade,
  customer_id uuid references public.seller_customers(id) on delete set null,
  customer_address text,
  delivery_fee numeric(14, 2) not null default 0 check (delivery_fee >= 0),
  rider_contact text,
  dispatch_note text,
  proof_of_delivery_note text,
  delivery_status text not null default 'Pickup pending'
    check (delivery_status in ('Pickup pending', 'Ready for dispatch', 'Rider assigned', 'In transit', 'Delivered', 'Cancelled')),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  template_type text not null
    check (template_type in ('confirmation', 'payment', 'delivery', 'restock', 'custom')),
  title text not null,
  body text not null,
  channel text not null default 'whatsapp_manual'
    check (channel in ('whatsapp_manual', 'sms_manual', 'internal_note')),
  last_wa_link_preview text,
  language_lane text not null default 'English'
    check (language_lane in ('English', 'French', 'Kiswahili', 'Pidgin')),
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_exports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  export_type text not null
    check (export_type in ('product_catalog', 'order_summary', 'customer_balance', 'stock_movement', 'daily_close', 'branded_receipt')),
  format text not null
    check (format in ('csv', 'markdown', 'json', 'pdf')),
  file_name text,
  row_count integer not null default 0 check (row_count >= 0),
  filters jsonb not null default '{}'::jsonb,
  payload_summary jsonb not null default '{}'::jsonb,
  is_local_download boolean not null default true,
  exported_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.seller_businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('create', 'update', 'delete', 'export', 'payment_change', 'status_change')),
  entity_table text not null,
  entity_id uuid,
  action_summary text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function private.seller_user_role(target_business_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.seller_businesses businesses
      where businesses.id = target_business_id
        and businesses.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select members.role
      from public.seller_team_members members
      where members.business_id = target_business_id
        and members.user_id = (select auth.uid())
        and members.status = 'active'
      order by case members.role
        when 'owner' then 1
        when 'admin' then 2
        when 'staff' then 3
        when 'accountant' then 4
        else 99
      end
      limit 1
    )
  end;
$$;

create or replace function private.seller_can_access(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.seller_user_role(target_business_id) is not null;
$$;

create or replace function private.seller_can_manage(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.seller_user_role(target_business_id), '') in ('owner', 'admin');
$$;

create or replace function private.seller_is_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.seller_businesses businesses
    where businesses.id = target_business_id
      and businesses.owner_id = (select auth.uid())
  );
$$;

create or replace function private.seller_can_edit_ops(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.seller_user_role(target_business_id), '') in ('owner', 'admin', 'staff');
$$;

create or replace function private.seller_can_write_finance(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.seller_user_role(target_business_id), '') in ('owner', 'admin', 'staff');
$$;

create or replace function private.seller_can_export(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.seller_user_role(target_business_id), '') in ('owner', 'admin', 'staff', 'accountant');
$$;

grant execute on function private.seller_user_role(uuid) to authenticated;
grant execute on function private.seller_can_access(uuid) to authenticated;
grant execute on function private.seller_can_manage(uuid) to authenticated;
grant execute on function private.seller_is_owner(uuid) to authenticated;
grant execute on function private.seller_can_edit_ops(uuid) to authenticated;
grant execute on function private.seller_can_write_finance(uuid) to authenticated;
grant execute on function private.seller_can_export(uuid) to authenticated;

create or replace function public.seller_create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seller_team_members (
    business_id,
    user_id,
    role,
    status,
    display_name,
    created_by,
    updated_by
  )
  values (
    new.id,
    new.owner_id,
    'owner',
    'active',
    'Owner',
    new.owner_id,
    new.owner_id
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_seller_business_owner_membership on public.seller_businesses;
create trigger trg_seller_business_owner_membership
after insert on public.seller_businesses
for each row execute function public.seller_create_owner_membership();

create or replace function public.seller_validate_business_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'seller_product_variants' then
    if not exists (
      select 1 from public.seller_products products
      where products.id = new.product_id
        and products.business_id = new.business_id
    ) then
      raise exception 'seller_product_variants product_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_customer_labels' then
    if not exists (
      select 1 from public.seller_customers customers
      where customers.id = new.customer_id
        and customers.business_id = new.business_id
    ) then
      raise exception 'seller_customer_labels customer_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_orders' then
    if new.customer_id is not null and not exists (
      select 1 from public.seller_customers customers
      where customers.id = new.customer_id
        and customers.business_id = new.business_id
    ) then
      raise exception 'seller_orders customer_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_order_items' then
    if not exists (
      select 1 from public.seller_orders orders
      where orders.id = new.order_id
        and orders.business_id = new.business_id
    ) then
      raise exception 'seller_order_items order_id must belong to the same business';
    end if;

    if new.product_id is not null and not exists (
      select 1 from public.seller_products products
      where products.id = new.product_id
        and products.business_id = new.business_id
    ) then
      raise exception 'seller_order_items product_id must belong to the same business';
    end if;

    if new.variant_id is not null and not exists (
      select 1 from public.seller_product_variants variants
      where variants.id = new.variant_id
        and variants.business_id = new.business_id
    ) then
      raise exception 'seller_order_items variant_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_stock_movements' then
    if new.product_id is not null and not exists (
      select 1 from public.seller_products products
      where products.id = new.product_id
        and products.business_id = new.business_id
    ) then
      raise exception 'seller_stock_movements product_id must belong to the same business';
    end if;

    if new.variant_id is not null and not exists (
      select 1 from public.seller_product_variants variants
      where variants.id = new.variant_id
        and variants.business_id = new.business_id
    ) then
      raise exception 'seller_stock_movements variant_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_payments' then
    if new.order_id is not null and not exists (
      select 1 from public.seller_orders orders
      where orders.id = new.order_id
        and orders.business_id = new.business_id
    ) then
      raise exception 'seller_payments order_id must belong to the same business';
    end if;

    if new.customer_id is not null and not exists (
      select 1 from public.seller_customers customers
      where customers.id = new.customer_id
        and customers.business_id = new.business_id
    ) then
      raise exception 'seller_payments customer_id must belong to the same business';
    end if;

  elsif tg_table_name = 'seller_deliveries' then
    if not exists (
      select 1 from public.seller_orders orders
      where orders.id = new.order_id
        and orders.business_id = new.business_id
    ) then
      raise exception 'seller_deliveries order_id must belong to the same business';
    end if;

    if new.customer_id is not null and not exists (
      select 1 from public.seller_customers customers
      where customers.id = new.customer_id
        and customers.business_id = new.business_id
    ) then
      raise exception 'seller_deliveries customer_id must belong to the same business';
    end if;
  end if;

  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'seller_product_variants',
    'seller_customer_labels',
    'seller_orders',
    'seller_order_items',
    'seller_stock_movements',
    'seller_payments',
    'seller_deliveries'
  ]
  loop
    execute format('drop trigger if exists trg_%I_validate_business_links on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_validate_business_links before insert or update on public.%I for each row execute function public.seller_validate_business_links()', table_name, table_name);
  end loop;
end;
$$;

create or replace function public.seller_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_business_id uuid;
  target_entity_id uuid;
  actor uuid;
  event_name text;
  summary text;
begin
  if tg_op = 'INSERT' then
    target_entity_id := new.id;
    if tg_table_name = 'seller_businesses' then
      target_business_id := new.id;
    else
      target_business_id := new.business_id;
    end if;
    actor := coalesce(new.updated_by, new.created_by, (select auth.uid()));
    event_name := 'create';
    summary := tg_table_name || ' create';
  elsif tg_op = 'UPDATE' then
    target_entity_id := new.id;
    if tg_table_name = 'seller_businesses' then
      target_business_id := new.id;
    else
      target_business_id := new.business_id;
    end if;
    actor := coalesce(new.updated_by, new.created_by, old.updated_by, old.created_by, (select auth.uid()));
    event_name := 'update';
    summary := tg_table_name || ' update';
  else
    target_entity_id := old.id;
    if tg_table_name = 'seller_businesses' then
      target_business_id := old.id;
    else
      target_business_id := old.business_id;
    end if;
    actor := coalesce(old.updated_by, old.created_by, (select auth.uid()));
    event_name := 'delete';
    summary := tg_table_name || ' delete';
  end if;

  if tg_table_name = 'seller_exports' and tg_op = 'INSERT' then
    event_name := 'export';
    summary := 'Export generated: ' || coalesce(new.export_type, 'unknown');
  elsif tg_table_name = 'seller_payments' and tg_op in ('INSERT', 'UPDATE') then
    event_name := 'payment_change';
    summary := 'Manual payment record changed';
  elsif tg_table_name = 'seller_orders' and tg_op = 'UPDATE'
    and (
      old.order_status is distinct from new.order_status
      or old.payment_status is distinct from new.payment_status
      or old.delivery_status is distinct from new.delivery_status
    ) then
    event_name := 'status_change';
    summary := 'Order status changed';
  end if;

  if target_business_id is not null then
    insert into public.seller_audit_events (
      business_id,
      actor_id,
      event_type,
      entity_table,
      entity_id,
      action_summary,
      old_data,
      new_data,
      metadata
    )
    values (
      target_business_id,
      actor,
      event_name,
      tg_table_name,
      target_entity_id,
      summary,
      case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
      jsonb_build_object('schema', tg_table_schema, 'operation', tg_op)
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'seller_businesses',
    'seller_team_members',
    'seller_products',
    'seller_product_variants',
    'seller_customers',
    'seller_customer_labels',
    'seller_orders',
    'seller_order_items',
    'seller_stock_movements',
    'seller_payments',
    'seller_deliveries',
    'seller_message_templates',
    'seller_exports'
  ]
  loop
    execute format('drop trigger if exists trg_%I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_set_updated_at before update on public.%I for each row execute function public.seller_set_updated_at()', table_name, table_name);
    execute format('drop trigger if exists trg_%I_audit on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.seller_audit_row_change()', table_name, table_name);
  end loop;
end;
$$;

create index if not exists idx_seller_businesses_owner_id
  on public.seller_businesses (owner_id, updated_at desc);
create index if not exists idx_seller_team_members_business_id
  on public.seller_team_members (business_id, role, status);
create index if not exists idx_seller_products_business_id
  on public.seller_products (business_id, status, updated_at desc);
create index if not exists idx_seller_product_variants_product_id
  on public.seller_product_variants (product_id, status);
create index if not exists idx_seller_customers_business_id
  on public.seller_customers (business_id, updated_at desc);
create index if not exists idx_seller_customer_labels_business_id
  on public.seller_customer_labels (business_id, label);
create index if not exists idx_seller_customer_labels_customer_id
  on public.seller_customer_labels (customer_id);
create index if not exists idx_seller_orders_business_date
  on public.seller_orders (business_id, order_date desc, order_status);
create index if not exists idx_seller_orders_customer_id
  on public.seller_orders (customer_id, order_date desc);
create index if not exists idx_seller_order_items_order_id
  on public.seller_order_items (order_id);
create index if not exists idx_seller_stock_movements_business_id
  on public.seller_stock_movements (business_id, occurred_at desc);
create index if not exists idx_seller_stock_movements_product_id
  on public.seller_stock_movements (product_id, occurred_at desc);
create index if not exists idx_seller_payments_business_id
  on public.seller_payments (business_id, created_at desc);
create index if not exists idx_seller_payments_order_id
  on public.seller_payments (order_id);
create index if not exists idx_seller_deliveries_order_id
  on public.seller_deliveries (order_id);
create index if not exists idx_seller_message_templates_business_id
  on public.seller_message_templates (business_id, template_type);
create index if not exists idx_seller_exports_business_id
  on public.seller_exports (business_id, created_at desc);
create index if not exists idx_seller_audit_events_business_id
  on public.seller_audit_events (business_id, occurred_at desc);
create index if not exists idx_seller_audit_events_actor_id
  on public.seller_audit_events (actor_id, occurred_at desc);
create index if not exists idx_seller_audit_events_entity
  on public.seller_audit_events (entity_table, entity_id);

alter table public.seller_businesses enable row level security;
alter table public.seller_team_members enable row level security;
alter table public.seller_products enable row level security;
alter table public.seller_product_variants enable row level security;
alter table public.seller_customers enable row level security;
alter table public.seller_customer_labels enable row level security;
alter table public.seller_orders enable row level security;
alter table public.seller_order_items enable row level security;
alter table public.seller_stock_movements enable row level security;
alter table public.seller_payments enable row level security;
alter table public.seller_deliveries enable row level security;
alter table public.seller_message_templates enable row level security;
alter table public.seller_exports enable row level security;
alter table public.seller_audit_events enable row level security;

drop policy if exists "Users can create own seller businesses" on public.seller_businesses;
create policy "Users can create own seller businesses"
on public.seller_businesses
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Users can read accessible seller businesses" on public.seller_businesses;
create policy "Users can read accessible seller businesses"
on public.seller_businesses
for select
to authenticated
using ((select private.seller_can_access(id)));

drop policy if exists "Managers can update seller businesses" on public.seller_businesses;
create policy "Managers can update seller businesses"
on public.seller_businesses
for update
to authenticated
using ((select private.seller_can_manage(id)))
with check ((select private.seller_can_manage(id)));

drop policy if exists "Managers can delete seller businesses" on public.seller_businesses;
create policy "Managers can delete seller businesses"
on public.seller_businesses
for delete
to authenticated
using ((select private.seller_can_manage(id)));

drop policy if exists "Users can read seller team members" on public.seller_team_members;
create policy "Users can read seller team members"
on public.seller_team_members
for select
to authenticated
using ((select private.seller_can_access(business_id)));

drop policy if exists "Managers can insert seller team members" on public.seller_team_members;
create policy "Managers can insert seller team members"
on public.seller_team_members
for insert
to authenticated
with check (
  (select private.seller_can_manage(business_id))
  and (
    role <> 'owner'
    or (select private.seller_is_owner(business_id))
  )
);

drop policy if exists "Managers can update seller team members" on public.seller_team_members;
create policy "Managers can update seller team members"
on public.seller_team_members
for update
to authenticated
using (
  (select private.seller_can_manage(business_id))
  and (
    role <> 'owner'
    or (select private.seller_is_owner(business_id))
  )
)
with check (
  (select private.seller_can_manage(business_id))
  and (
    role <> 'owner'
    or (select private.seller_is_owner(business_id))
  )
);

drop policy if exists "Managers can delete seller team members" on public.seller_team_members;
create policy "Managers can delete seller team members"
on public.seller_team_members
for delete
to authenticated
using (
  (select private.seller_can_manage(business_id))
  and (
    role <> 'owner'
    or (select private.seller_is_owner(business_id))
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'seller_products',
    'seller_product_variants',
    'seller_customers',
    'seller_customer_labels',
    'seller_orders',
    'seller_order_items',
    'seller_stock_movements',
    'seller_deliveries',
    'seller_message_templates'
  ]
  loop
    execute format('drop policy if exists "Users can read %s" on public.%I', table_name, table_name);
    execute format('create policy "Users can read %s" on public.%I for select to authenticated using ((select private.seller_can_access(business_id)))', table_name, table_name);

    execute format('drop policy if exists "Ops can insert %s" on public.%I', table_name, table_name);
    execute format('create policy "Ops can insert %s" on public.%I for insert to authenticated with check ((select private.seller_can_edit_ops(business_id)))', table_name, table_name);

    execute format('drop policy if exists "Ops can update %s" on public.%I', table_name, table_name);
    execute format('create policy "Ops can update %s" on public.%I for update to authenticated using ((select private.seller_can_edit_ops(business_id))) with check ((select private.seller_can_edit_ops(business_id)))', table_name, table_name);

    execute format('drop policy if exists "Managers can delete %s" on public.%I', table_name, table_name);
    execute format('create policy "Managers can delete %s" on public.%I for delete to authenticated using ((select private.seller_can_manage(business_id)))', table_name, table_name);
  end loop;
end;
$$;

drop policy if exists "Finance users can read seller payments" on public.seller_payments;
create policy "Finance users can read seller payments"
on public.seller_payments
for select
to authenticated
using ((select private.seller_can_access(business_id)));

drop policy if exists "Finance users can insert seller payments" on public.seller_payments;
create policy "Finance users can insert seller payments"
on public.seller_payments
for insert
to authenticated
with check ((select private.seller_can_write_finance(business_id)));

drop policy if exists "Finance users can update seller payments" on public.seller_payments;
create policy "Finance users can update seller payments"
on public.seller_payments
for update
to authenticated
using ((select private.seller_can_write_finance(business_id)))
with check ((select private.seller_can_write_finance(business_id)));

drop policy if exists "Managers can delete seller payments" on public.seller_payments;
create policy "Managers can delete seller payments"
on public.seller_payments
for delete
to authenticated
using ((select private.seller_can_manage(business_id)));

drop policy if exists "Users can read seller exports" on public.seller_exports;
create policy "Users can read seller exports"
on public.seller_exports
for select
to authenticated
using ((select private.seller_can_access(business_id)));

drop policy if exists "Users can create seller exports" on public.seller_exports;
create policy "Users can create seller exports"
on public.seller_exports
for insert
to authenticated
with check ((select private.seller_can_export(business_id)));

drop policy if exists "Managers can update seller exports" on public.seller_exports;
create policy "Managers can update seller exports"
on public.seller_exports
for update
to authenticated
using ((select private.seller_can_manage(business_id)))
with check ((select private.seller_can_manage(business_id)));

drop policy if exists "Managers can delete seller exports" on public.seller_exports;
create policy "Managers can delete seller exports"
on public.seller_exports
for delete
to authenticated
using ((select private.seller_can_manage(business_id)));

drop policy if exists "Users can read seller audit events" on public.seller_audit_events;
create policy "Users can read seller audit events"
on public.seller_audit_events
for select
to authenticated
using ((select private.seller_can_access(business_id)));

drop policy if exists "Service role manages seller audit events" on public.seller_audit_events;
create policy "Service role manages seller audit events"
on public.seller_audit_events
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');
