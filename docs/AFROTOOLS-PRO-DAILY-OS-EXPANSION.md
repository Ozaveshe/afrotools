# AfroTools Pro Daily OS Expansion

Updated: 2026-05-02

## Product Thesis

The first Pro batch is serious but too concentrated around payroll, finance, compliance, and formal business operations. AfroTools Pro also needs daily operating systems that people use to run work and life: sellers, events, salons, food businesses, technicians, schools, clinics, faith groups, farms, and family administration.

The paid wedge is not another calculator. It is saved workflows, records, reminders, approvals, document packets, portals, WhatsApp templates, payment notes, exports, and team handoff from one AfroTools account.

## Shared Engine

Every daily Pro app should reuse the same core engine:

- Records
- Reminders
- Approvals
- Document vault
- Client or member portal
- PDF packets
- WhatsApp templates
- Payments
- Reports

This keeps the path toward 100 plus Pro apps realistic. Each vertical should be a specialized workflow skin on top of common primitives, not a completely separate product.

## Routes

| Priority | App | Route | First build slice |
| --- | --- | --- | --- |
| 1 | AfroSeller Social Commerce OS | `/pro/apps/seller/` | Catalog, orders, stock alerts, customer balances, WhatsApp templates, local exports |
| 2 | AfroEvents & Ceremony OS | `/pro/apps/events/` | Event profile, guest list, vendor tracker, budget board, running order, WhatsApp templates, local exports |
| 3 | AfroBeauty Booking OS | `/pro/apps/beauty/` | Service menu, booking board, client cards, deposits, commission summary |
| 4 | AfroFood & Kitchen OS | `/pro/apps/food-kitchen/` | Menu items, recipe costing, stock count, prep board, daily close |
| 5 | AfroFix Field Service OS | `/pro/apps/field-service/` | Customer intake, job board, quote builder, parts log, service report |
| 6 | AfroSchool & Academy OS | `/pro/apps/school-academy/` | Student list, attendance sheet, fee board, report template, parent export |
| 7 | AfroClinic Desk Pro | `/pro/apps/clinic-desk/` | Appointment desk, patient card shell, queue board, billing draft, follow-up reminders |
| 8 | AfroFaith & Community OS | `/pro/apps/faith-community/` | Member list, giving ledger, volunteer rota, event board, welfare notes |
| 9 | AfroAgri FarmOps & Co-op OS | `/pro/apps/agri-farmops/` | Farm profile, season tasks, input log, livestock log, harvest board |
| 10 | AfroLife Admin & Diaspora OS | `/pro/apps/life-admin/` | Family profiles, document vault index, renewal board, school tracker, travel packet |

## Registry And Shell Contract

- Daily app specs live in `assets/js/lib/pro-daily-os-registry.js`.
- Shared shell rendering lives in `assets/js/lib/pro-daily-os-shell.js`.
- The hub route is `/pro/apps/daily-os/`.
- Each route is Pro-gated with `meta name="pro-required" content="afrotools-pro"`.
- Shells are intentionally honest: local shell, route ready, no database claim yet.

## Agent Prompts

### Agent 1: AfroSeller Social Commerce OS

```text
You are the dedicated AfroTools Pro agent for AfroSeller Social Commerce OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/seller/ from a shell into a usable paid SaaS workflow for WhatsApp sellers, Instagram boutiques, market traders, cosmetics sellers, phone shops, fashion brands, and home bakers.
Owned files: pro/apps/seller/index.html, assets/js/lib/pro-daily-os-registry.js for app id seller only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the seller section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: product catalog, stock counts, order book, customer CRM, delivery tracker, receipts, unpaid-balance reminders, WhatsApp templates, and local export packet.
Read competitor product pages before implementation: Bumpa, Shopify, Ecwid, Lightspeed, WhatsApp Business.
Keep the UI mobile-first, Africa-first, WhatsApp-friendly, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/seller/index.html; npm run audit; npm run check-links.
```

Current implementation note (2026-05-09):

- `/pro/apps/seller/` is now a paid shop workspace for WhatsApp sellers, Instagram sellers, market traders, boutiques, cosmetics sellers, home bakers, phone shops, and small retailers.
- The first-run path starts with Shop setup: business name, country, currency, seller phone/WhatsApp, business category, default delivery area, receipt name/color, and accepted payment methods.
- The setup score tracks six practical steps: shop profile, first product, first customer, first order, payment method, and delivery option.
- The selling workflow is explicit: Add product, Add customer, Create order, Record payment, Prepare delivery, and Share receipt.
- The workspace covers Products, Orders, Customers, Payment records, Delivery notes, Receipts, Daily close, stock movements, dashboard metrics, CSV downloads, branded Markdown receipt, WhatsApp copy, and wa.me deep links.
- Products must feel like a paid catalog/inventory workflow: product name, category, SKU, variant, selling price, cost price, stock quantity, reorder level, supplier note, location/bin, status, and a product photo placeholder. Do not imply supplier integration, storage upload, or barcode scanning until those are built.
- Inventory actions use customer-facing labels: Stock in, Stock out, Adjustment, Damaged/lost, Return to stock, and Cancel/restock. The stock movement ledger should show date, product/variant, movement type, quantity, reason, linked order when available, and balance after movement.
- Inventory alerts should include out of stock, low stock, negative stock, no cost price, no selling price, and margin warning. Margin/profit copy must stay a preview from saved cost and selling prices.
- Export coverage should include product catalog CSV, inventory valuation CSV, stock movement CSV, reorder list CSV, order summary CSV, customer balances CSV, daily close CSV, and branded receipt Markdown.
- Catalog preview should let sellers prepare a customer-facing catalog from saved products without claiming live ecommerce publishing. Use labels such as "catalog preview", "shareable catalog draft", and "customer catalog export".
- Catalog preview settings should cover shop name, shop phone/WhatsApp, country/currency, brand color, show/hide prices, show/hide stock, and categories to include.
- Customer catalog exports should include catalog Markdown, customer catalog CSV, printable catalog HTML, and a WhatsApp catalog message for manual copy. Product cards should show product image placeholder, name, category, variant, price when enabled, availability, and an inquiry CTA.
- Catalog warnings should flag products without price, out-of-stock products, missing WhatsApp/contact, and missing shop name.
- Daily close should be valuable at end of day: sales today, payments received, unpaid balances, delivery fees, discounts, refunds/cancellations, stock sold, low stock, and estimated gross margin.
- Payment method summary should separate cash, mobile money, bank transfer, card/POS, credit/unpaid, and other payment records. These are review records only; do not describe them as verified settlement or bank reconciliation.
- Daily close checklist should cover: all order statuses reviewed, payment references added, deliveries updated, stock exceptions reviewed, unpaid balances noted, and exports downloaded.
- Finance handoff should include accountant summary note, cash count, cash difference note, owner review note, saved local close history, and draft export records when the seller downloads handoff files. If an account save exists, the local close history may include the account business id and last account-save timestamp, but do not claim remote accountant filing or verified settlement.
- Daily close reports should include daily close CSV, daily close Markdown, sales by product CSV, sales by customer CSV, unpaid balances CSV, and inventory movement CSV.
- Pro dashboard metrics for Seller should stay operational: today sales, orders needing action, unpaid balance, low stock, and close status.
- Delivery and fulfillment should feel like a real seller board for local courier, rider, pickup, bus park, market pickup, and customer collection. Use fulfillment statuses: not packed, packed, ready for pickup, assigned to rider, out for delivery, delivered, failed delivery, and returned.
- Delivery fields should use customer-facing labels: delivery method, rider/courier name, rider phone, delivery area, delivery address/note, delivery fee, expected date, dispatch checklist, rider handoff, and proof note.
- Fulfillment warnings should flag paid but not fulfilled, fulfilled but unpaid, missing address, missing rider contact, and failed delivery needs follow-up.
- Fulfillment exports should include packing list CSV, rider handoff CSV, delivery note Markdown, and failed delivery report CSV. These are local seller records, not courier booking or tracking records.
- Browser persistence still uses `afroseller_social_commerce_os_v1` as the technical storage key, but customer-facing UI must say "Saved on this device".
- `assets/js/lib/afroseller-sync.js` remains the account-save bridge for signed-in Pro users. Customer-facing UI must say "Save to account" and "Load from account".
- Manual account save/load remains intentional. Do not describe it as automatic backup, automatic sync, or cloud history. The current account bridge preserves the existing delivery fields and contact summary; new fulfillment labels remain local-first until the account delivery enum and mapping are expanded.
- Still deliberately absent: storage upload for photos/proofs, hosted public storefront, checkout, payment collection, delivery quote engine, delivery integrations, WhatsApp API sending, background sync, conflict resolution, and automatic cloud history.

Customer-facing wording rules:

- Use shop-owner language: Shop setup, Products, Orders, Customers, Payments, Delivery, Receipts, Daily close, Saved on this device, Save to account, Copy WhatsApp message, Payment record, Delivery note.
- Do not expose implementation language in visible UI: localStorage, Supabase, schema, sync helper, shell, debug, internal, or local-only app.
- Keep limits clear without sounding broken: "AfroSeller records payments; it does not collect money", "Copy WhatsApp message", "Delivery note", and "Receipts and downloads".
- Never imply connected payments, live storefront publishing, WhatsApp API sending, delivery-provider booking, GPS tracking, or automatic SMS/WhatsApp sending until those integrations are actually built and verified.
- Never imply that a catalog preview is live ecommerce hosting. It is a shareable catalog draft and customer catalog export until a real hosted storefront, checkout, payment collection, and safe order intake are built.
- Never claim bank reconciliation, verified payment settlement, or tax compliance from daily close outputs. Use "daily close", "cash count", "payment record", and "finance handoff"; keep every finance output framed as a draft/review record.

### Agent 2: AfroEvents & Ceremony OS

```text
You are the dedicated AfroTools Pro agent for AfroEvents & Ceremony OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/events/ from a shell into a usable paid SaaS workflow for wedding planners, funeral planners, birthday planners, churches, mosques, DJs, caterers, venues, and corporate event teams.
Owned files: pro/apps/events/index.html, assets/js/lib/pro-daily-os-registry.js for app id events only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the events section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: event profile, guest list, RSVP states, vendor list, budget board, contribution tracker, seating groups, running order, vendor payment schedule, and handoff packet.
Read competitor product pages before implementation: Eventbrite, Cvent, Planning Pod, HoneyBook.
Keep the UI mobile-first, Africa-first, WhatsApp-friendly, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/events/index.html; npm run audit; npm run check-links.
```

Current implementation note (2026-05-05):

- `/pro/apps/events/` is now a local-only Pro workspace, not just the shared Daily OS shell.
- The workspace covers event setup, guest list and RSVP states, vendor payment schedule, budget board, contribution totals, running order, attention queue, CSV exports, Markdown ceremony handoff note, and WhatsApp copy templates.
- Browser persistence uses localStorage key `afroevents_ceremony_os_v1`.
- Still shell-only or deliberately absent: account sync, Supabase storage, ticket sales, connected payments, live RSVP forms, vendor booking, delivery or logistics integrations, and WhatsApp API sending.

### Agent 3: AfroBeauty Booking OS

```text
You are the dedicated AfroTools Pro agent for AfroBeauty Booking OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/beauty/ from a shell into a usable paid SaaS workflow for salons, barbers, nail techs, makeup artists, spas, lash artists, bridal stylists, and massage businesses.
Owned files: pro/apps/beauty/index.html, assets/js/lib/pro-daily-os-registry.js for app id beauty only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the beauty section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: service menu, booking board, deposits, no-show rules, client cards, stylist commission summary, product inventory, before/after gallery slots, and WhatsApp reminders.
Read competitor product pages before implementation: Fresha, Booksy, Square Appointments, Salonist.
Keep the UI mobile-first, Africa-first, WhatsApp-friendly, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/beauty/index.html; npm run audit; npm run check-links.
```

### Agent 4: AfroFood & Kitchen OS

```text
You are the dedicated AfroTools Pro agent for AfroFood & Kitchen OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/food-kitchen/ from a shell into a usable paid SaaS workflow for restaurants, caterers, food trucks, cloud kitchens, bakeries, cafes, and school canteens.
Owned files: pro/apps/food-kitchen/index.html, assets/js/lib/pro-daily-os-registry.js for app id food-kitchen only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the food section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: menu costing, recipe costing, ingredient stock, kitchen prep list, supplier notes, wastage tracker, daily sales close, delivery reconciliation, and export packet.
Read competitor product pages before implementation: Toast, Square for Restaurants, Loyverse, Foodics.
Keep the UI mobile-first, Africa-first, food-margin focused, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/food-kitchen/index.html; npm run audit; npm run check-links.
```

### Agent 5: AfroFix Field Service OS

```text
You are the dedicated AfroTools Pro agent for AfroFix Field Service OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/field-service/ from a shell into a usable paid SaaS workflow for electricians, plumbers, generator technicians, mechanics, cleaners, AC repairers, solar installers, and borehole teams.
Owned files: pro/apps/field-service/index.html, assets/js/lib/pro-daily-os-registry.js for app id field-service only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the field-service section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: customer intake, job cards, quotes, before/after photo slots, technician schedule, parts used, route list, warranty reminders, and service report export.
Read competitor product pages before implementation: Jobber, Housecall Pro, ServiceM8, Workiz.
Keep the UI mobile-first, Africa-first, WhatsApp-friendly, field-proof, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/field-service/index.html; npm run audit; npm run check-links.
```

### Agent 6: AfroSchool & Academy OS

```text
You are the dedicated AfroTools Pro agent for AfroSchool & Academy OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/school-academy/ from a shell into a usable paid SaaS workflow for private schools, lesson teachers, exam-prep centres, coding academies, language schools, and vocational schools.
Owned files: pro/apps/school-academy/index.html, assets/js/lib/pro-daily-os-registry.js for app id school-academy only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the school section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: student records, attendance, class roster, fee reminders, timetable, report card builder, parent note packet, certificates, and term export.
Read competitor product pages before implementation: Fedena, EDVES, PowerSchool, Classe365, Moodle, Teachable.
Keep the UI mobile-first, Africa-first, school-admin focused, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/school-academy/index.html; npm run audit; npm run check-links.
```

### Agent 7: AfroClinic Desk Pro

```text
You are the dedicated AfroTools Pro agent for AfroClinic Desk Pro.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/clinic-desk/ from a shell into an administrative paid SaaS workflow for small clinics, dental practices, opticians, therapists, labs, and pharmacies with consultation desks.
Owned files: pro/apps/clinic-desk/index.html, assets/js/lib/pro-daily-os-registry.js for app id clinic-desk only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the clinic section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build admin-only flows: appointment book, patient card shell, queue board, visit note template, prescription template, billing draft, stock note, and follow-up reminders. Do not build diagnosis, medical advice, or treatment recommendations.
Read competitor product pages before implementation: Cliniko, SimplePractice, Helium Health, Halemind.
Keep the UI mobile-first, Africa-first, admin-only, privacy-aware, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/clinic-desk/index.html; npm run audit; npm run check-links.
```

### Agent 8: AfroFaith & Community OS

```text
You are the dedicated AfroTools Pro agent for AfroFaith & Community OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/faith-community/ from a shell into a usable paid SaaS workflow for churches, mosques, fellowships, religious schools, community associations, neighbourhood groups, and charities.
Owned files: pro/apps/faith-community/index.html, assets/js/lib/pro-daily-os-registry.js for app id faith-community only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the faith section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: member database, attendance, giving or zakat records, volunteer rosters, event calendar, welfare cases, certificate packet, outreach templates, and export report.
Read competitor product pages before implementation: Planning Center, ChurchTrac, Tithe.ly.
Keep the UI mobile-first, Africa-first, inclusive of church and mosque workflows, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/faith-community/index.html; npm run audit; npm run check-links.
```

### Agent 9: AfroAgri FarmOps & Co-op OS

```text
You are the dedicated AfroTools Pro agent for AfroAgri FarmOps & Co-op OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/agri-farmops/ from a shell into a usable paid SaaS workflow for poultry farmers, crop farmers, livestock keepers, cooperatives, agro-dealers, and extension officers.
Owned files: pro/apps/agri-farmops/index.html, assets/js/lib/pro-daily-os-registry.js for app id agri-farmops only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the agri section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: farm profile, season calendar, input records, livestock health logs, feed tracker, harvest records, buyer and supplier CRM, co-op member ledger, market price notes, and task reminders.
Read competitor product pages before implementation: Farmbrite, AgriWebb, Conservis, Apollo Agriculture.
Keep the UI mobile-first, Africa-first, farmer-friendly, co-op aware, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/agri-farmops/index.html; npm run audit; npm run check-links.
```

### Agent 10: AfroLife Admin & Diaspora OS

```text
You are the dedicated AfroTools Pro agent for AfroLife Admin & Diaspora OS.
Workspace: C:\Users\Oza\Documents\afrotools.
Goal: deepen /pro/apps/life-admin/ from a shell into a usable paid SaaS workflow for families, students, diaspora households, caregivers, travellers, and parents managing documents.
Owned files: pro/apps/life-admin/index.html, assets/js/lib/pro-daily-os-registry.js for app id life-admin only, docs/AFROTOOLS-PRO-DAILY-OS-EXPANSION.md for the life-admin section only.
Do not edit Payroll, Tax, Books, HR, Trade, or another daily OS route unless explicitly told.
Build: family profiles, document vault index, passport and ID renewal reminders, school application tracker, emergency info, household tasks, travel checklist, and expiry dashboard.
Read competitor product pages before implementation: Notion, Evernote, Todoist, Trustworthy, Atlys.
Keep the UI mobile-first, Africa-first, diaspora-aware, privacy-aware, local/export-ready, and honest about local-only state.
Validation: node --check assets/js/lib/pro-daily-os-registry.js assets/js/lib/pro-daily-os-shell.js; parse inline scripts for pro/apps/life-admin/index.html; npm run audit; npm run check-links.
```

## Validation

After changing this layer:

```powershell
node --check assets/js/lib/pro-daily-os-registry.js
node --check assets/js/lib/pro-daily-os-shell.js
npm run audit
npm run check-links
```

Also parse inline scripts for any touched Pro pages. The daily route pages should remain thin loaders unless a future agent is deliberately deepening one app.
