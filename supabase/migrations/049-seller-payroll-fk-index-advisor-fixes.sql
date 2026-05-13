-- Live Supabase migration applied 2026-05-13 as seller_payroll_fk_index_advisor_fixes.
-- Adds leading indexes for seller and payroll portal foreign keys flagged by
-- Supabase performance advisors.

create index if not exists idx_payroll_employee_portal_invites_company_id_fk on public.payroll_employee_portal_invites (company_id);
create index if not exists idx_payroll_employee_portal_invites_created_by_fk on public.payroll_employee_portal_invites (created_by);
create index if not exists idx_payroll_employee_portal_invites_employee_id_fk on public.payroll_employee_portal_invites (employee_id);

create index if not exists idx_seller_businesses_created_by_fk on public.seller_businesses (created_by);
create index if not exists idx_seller_businesses_updated_by_fk on public.seller_businesses (updated_by);
create index if not exists idx_seller_customer_labels_created_by_fk on public.seller_customer_labels (created_by);
create index if not exists idx_seller_customer_labels_updated_by_fk on public.seller_customer_labels (updated_by);
create index if not exists idx_seller_customers_created_by_fk on public.seller_customers (created_by);
create index if not exists idx_seller_customers_updated_by_fk on public.seller_customers (updated_by);
create index if not exists idx_seller_deliveries_business_id_fk on public.seller_deliveries (business_id);
create index if not exists idx_seller_deliveries_created_by_fk on public.seller_deliveries (created_by);
create index if not exists idx_seller_deliveries_customer_id_fk on public.seller_deliveries (customer_id);
create index if not exists idx_seller_deliveries_updated_by_fk on public.seller_deliveries (updated_by);
create index if not exists idx_seller_exports_created_by_fk on public.seller_exports (created_by);
create index if not exists idx_seller_exports_exported_by_fk on public.seller_exports (exported_by);
create index if not exists idx_seller_exports_updated_by_fk on public.seller_exports (updated_by);
create index if not exists idx_seller_message_templates_created_by_fk on public.seller_message_templates (created_by);
create index if not exists idx_seller_message_templates_updated_by_fk on public.seller_message_templates (updated_by);
create index if not exists idx_seller_order_items_business_id_fk on public.seller_order_items (business_id);
create index if not exists idx_seller_order_items_created_by_fk on public.seller_order_items (created_by);
create index if not exists idx_seller_order_items_product_id_fk on public.seller_order_items (product_id);
create index if not exists idx_seller_order_items_updated_by_fk on public.seller_order_items (updated_by);
create index if not exists idx_seller_order_items_variant_id_fk on public.seller_order_items (variant_id);
create index if not exists idx_seller_orders_created_by_fk on public.seller_orders (created_by);
create index if not exists idx_seller_orders_updated_by_fk on public.seller_orders (updated_by);
create index if not exists idx_seller_payments_created_by_fk on public.seller_payments (created_by);
create index if not exists idx_seller_payments_customer_id_fk on public.seller_payments (customer_id);
create index if not exists idx_seller_payments_updated_by_fk on public.seller_payments (updated_by);
create index if not exists idx_seller_product_variants_created_by_fk on public.seller_product_variants (created_by);
create index if not exists idx_seller_product_variants_updated_by_fk on public.seller_product_variants (updated_by);
create index if not exists idx_seller_products_created_by_fk on public.seller_products (created_by);
create index if not exists idx_seller_products_updated_by_fk on public.seller_products (updated_by);
create index if not exists idx_seller_stock_movements_created_by_fk on public.seller_stock_movements (created_by);
create index if not exists idx_seller_stock_movements_updated_by_fk on public.seller_stock_movements (updated_by);
create index if not exists idx_seller_stock_movements_variant_id_fk on public.seller_stock_movements (variant_id);
create index if not exists idx_seller_team_members_created_by_fk on public.seller_team_members (created_by);
create index if not exists idx_seller_team_members_invited_by_fk on public.seller_team_members (invited_by);
create index if not exists idx_seller_team_members_updated_by_fk on public.seller_team_members (updated_by);
create index if not exists idx_seller_team_members_user_id_fk on public.seller_team_members (user_id);
