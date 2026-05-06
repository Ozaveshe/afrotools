# AfroSeller Supabase Schema

Updated: 2026-05-06

## Scope

This is schema preparation for AfroSeller Social Commerce OS. It does not turn on live sync, payment provider collection, storefront publishing, delivery-provider integration, or WhatsApp API sending.

Primary local source: `pro/apps/seller/index.html`

Local browser key: `afroseller_social_commerce_os_v1`

Migration: `supabase/migrations/047-afroseller-social-commerce-schema.sql`

## Tables

- `seller_businesses`: one seller workspace, owned by a Supabase auth user.
- `seller_team_members`: owner/admin/staff/accountant access for a business.
- `seller_products`: base catalog rows for product name, SKU, supplier, location, price, stock, and photo URL.
- `seller_product_variants`: size/color/variant-specific SKU, price, location, and stock records.
- `seller_stock_movements`: sale, restock, adjustment, damage, and return ledger rows.
- `seller_customers`: customer identity, phone, address, balance, and follow-up state.
- `seller_customer_labels`: normalized labels such as VIP, repeat buyer, owes balance, wholesale, and delivery issue.
- `seller_orders`: order header, totals, status, payment summary, and delivery summary.
- `seller_order_items`: product and variant snapshots per order line.
- `seller_payments`: manual payment records only, including method and proof note.
- `seller_deliveries`: manual delivery tracker with address, fee, rider/contact, dispatch note, and proof-of-delivery note.
- `seller_message_templates`: manual WhatsApp/SMS/internal templates and wa.me preview text.
- `seller_exports`: export audit records for CSV, Markdown, JSON, or future PDF packets.
- `seller_audit_events`: event stream for record changes, stock movement, payment/status changes, delivery changes, and exports.

## RLS Model

All seller records are scoped by `business_id`. Access is granted when the user is the business owner or has an active `seller_team_members` row for that business.

Roles:

- `owner`: full access, including member management and deletes.
- `admin`: full operational access, member management, and deletes.
- `staff`: operational create/update for products, customers, orders, stock movements, deliveries, and templates.
- `accountant`: read-mostly access with export creation, but no operational or payment-record mutation.

Private helper functions:

- `private.seller_user_role(business_id)`
- `private.seller_can_access(business_id)`
- `private.seller_can_manage(business_id)`
- `private.seller_is_owner(business_id)`
- `private.seller_can_edit_ops(business_id)`
- `private.seller_can_write_finance(business_id)`
- `private.seller_can_export(business_id)`

Owner safeguards:

- the business owner membership row is created automatically when a seller business is inserted
- admins can manage staff and accountant members, but only the real business owner can create, update, or delete `owner` membership rows

Cross-business integrity:

- child tables with both `business_id` and parent references are guarded by `public.seller_validate_business_links()`
- the guard rejects product variants, labels, orders, order items, stock movements, payments, and deliveries when a referenced product, variant, customer, or order belongs to another seller business

## Audit Events

The migration adds a trigger-backed audit layer for:

- create, update, and delete on core seller tables
- stock movement records
- order status, payment status, and delivery status changes
- payment changes and proof note changes through `seller_payments`
- export generation through `seller_exports`

Audit rows are readable by business members. Direct writes are restricted to service role or trigger execution.

## Storage Bucket Plan

Recommended bucket: `afroseller-media`

Bucket posture:

- Private bucket.
- Authenticated access only.
- Object paths must include the business id so policies can reuse the same team-membership model.

Path convention:

- `businesses/{business_id}/products/{product_id}/{file_name}`
- `businesses/{business_id}/payments/{payment_id}/{file_name}`
- `businesses/{business_id}/deliveries/{delivery_id}/{file_name}`

Record mapping:

- Product photo files attach to `seller_products.photo_url` or `seller_product_variants.photo_url`.
- Payment proof images attach to `seller_payments.metadata->proof_storage_path`.
- Delivery proof images attach to `seller_deliveries.metadata->proof_storage_path`.

Storage policy direction:

- owners/admins/staff can upload product and delivery media.
- owners/admins/staff/accountants can upload payment proof media.
- all active team members can read business media.
- only owners/admins can delete media.

The migration does not create the bucket yet. Keep storage rollout as a separate step after the table/RLS migration is applied and verified.

## LocalStorage Mapping

`state.business` maps to `seller_businesses`:

- `name` -> `name`
- `country` -> `country`
- `currency` -> `currency_code`
- `language` -> `language_lane`
- `channel` -> `seller_channel`
- `phone` -> `phone_whatsapp`

`state.products[]` maps to `seller_products`:

- `sku` -> `sku`
- `name` -> `name`
- `category` -> `category`
- `supplier` -> `supplier`
- `stockLocation` -> `stock_location`
- `photoUrl` -> `photo_url`
- `costPrice` -> `cost_price`
- `sellingPrice` -> `selling_price`
- `stock` -> `stock_on_hand`
- `reorderLevel` -> `reorder_level`
- `status` -> `status`

Product `variant` can be imported as a first `seller_product_variants` row when it needs independent stock, price, image, or SKU behavior.

`state.customers[]` maps to `seller_customers`:

- `name` -> `name`
- `phone` -> `phone_whatsapp`
- `lastOrder` -> `last_order_note`
- `totalBalance` -> `total_balance`
- `followStatus` -> `follow_status`

`customer.labels[]` maps to `seller_customer_labels`, one row per label.

`state.orders[]` maps to `seller_orders` plus child tables:

- order header and totals -> `seller_orders`
- product, quantity, and price snapshot -> `seller_order_items`
- `paymentMethod`, `amountPaid`, and `paymentProofNote` -> `seller_payments`
- `customerAddress`, `deliveryFee`, `riderContact`, `dispatchNote`, `podNote`, and `deliveryStatus` -> `seller_deliveries`

`state.stockMovements[]` maps to `seller_stock_movements`:

- `type` -> `movement_type`
- `quantity` -> `quantity_delta`
- `stockAfter` -> `stock_after`
- `note` -> `reason_note`
- order-created movements should use `source_type = 'order_item'` once order item ids exist

Template UI state maps to `seller_message_templates`:

- `templateType` -> `template_type`
- generated text -> `body`
- wa.me generated URL -> `last_wa_link_preview`
- channel stays `whatsapp_manual`

Export actions map to `seller_exports`:

- product catalog CSV -> `product_catalog`
- order summary CSV -> `order_summary`
- customer balances CSV -> `customer_balance`
- stock movement CSV -> `stock_movement`
- daily close CSV -> `daily_close`
- branded receipt Markdown -> `branded_receipt`

## Still Not Implemented

- Browser-to-Supabase sync
- Supabase storage bucket creation
- payment provider collection or verification
- WhatsApp Business API sending
- live storefront publishing
- delivery-provider booking or tracking
- background jobs for daily close or receipts
