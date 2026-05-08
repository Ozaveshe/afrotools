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

Current implementation note (2026-05-05):

- `/pro/apps/seller/` is now a local-only Pro workspace, not just the shared Daily OS shell.
- The workspace covers business setup, product catalog with SKU/variant/supplier/location/photo placeholders, order book, payment and proof notes, delivery tracker, stock movement ledger, customer labels, daily close panel, dashboard metrics, CSV exports, branded Markdown receipt, and WhatsApp copy plus wa.me deep links.
- Browser persistence uses localStorage key `afroseller_social_commerce_os_v1`.
- `assets/js/lib/afroseller-sync.js` adds the first schema-aware bridge for signed-in Pro users. It uses the browser Supabase anon/RLS session from `AfroAuth`, can import the local snapshot to one account-backed seller business, and can pull an account snapshot back into localStorage.
- The localStorage flow remains the fallback. Import/pull are manual actions, not automatic sync.
- Still deliberately absent: Supabase storage for photos/proofs, connected payments, storefront publishing, delivery integrations, WhatsApp API sending, background sync, conflict resolution, and automatic cloud history.

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
