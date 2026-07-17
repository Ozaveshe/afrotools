# AfroTools Pro Suite — Assessment & Codex Prompt Playbook (July 2026)

This document has three parts:

1. **Assessment** of the current 10 Pro apps.
2. **Pack A — 10 prompts** that turn the keepers into state-of-the-art products people will pay for.
3. **Pack B — 10 prompts** for new business tools (SEO, marketing, "popular app" territory) that map to what small businesses actually search for and use daily.

Every prompt in Packs A and B assumes the **Global Engineering Contract** (Prompt 0). Paste Prompt 0 plus one product prompt into your coding agent per session.

---

## Part 1 — Assessment of the current 10 Pro apps

Current registry (`assets/js/lib/pro-app-registry.js`):

| App | Readiness | Reality |
|---|---|---|
| Payroll | 84 | Only real, account-backed product. Genuine engine + country packs. |
| Books | 74 | Big local-only CRUD workspace (203KB single file). |
| HR | 68 | Local-only preview, overlaps Payroll heavily. |
| Tax Compliance | 64 | "Review packet only" — checklists + device save. |
| Property Projects | 44 | Preview shell. |
| Trade Desk | 34 | Preview shell. |
| Grants & Tenders | 34 | Preview shell, no data feed. |
| Creator Studio | 34 | Preview shell. |
| Legal Desk | 30 | Preview shell. |
| Stream Intelligence | 14 | Barely started. |

**Your instinct is correct, on both counts:**

- **Too financial.** Six of ten (Payroll, Books, HR, Tax, Trade Desk, Grants) are money-ops/back-office. Worse, four of them — Books, Payroll, HR, Tax — are really *one* product (a small-business back office) shipped as four competing SKUs. A user who runs a salon has to figure out which of four finance apps to open.
- **All over the place.** The other four (Legal, Property, Creator, Stream) share nothing with the finance six and nothing with each other. There is no suite story, no shared data, no reason to stay subscribed.

**Structural problems beneath the roster problem:**

- Almost everything is a "workspace preview": forms + tables + localStorage + export. That's honest labeling (good), but nobody pays for CRUD-with-local-save — Notion and a notebook do that for free. Paid conversion needs at least one of: **sync across devices, a public/shareable surface, live data nobody else has, automation, or AI that does real work.** Only Payroll has any of these today.
- 50–200KB single-file HTML apps with inline JS are at the edge of maintainability. Fine for calculators; painful for products you'll iterate on weekly.
- Nothing in the Pro roster matches AfroTools' actual acquisition engine. Traffic arrives via free calculators, SEO pages, and utility tools — small merchants, freelancers, creators, agencies. Then the Pro shelf offers them… tax compliance packets. The Daily-OS list (Seller, Beauty, Events…) is far better matched to the audience, and Seller/Events are already substantially built (171KB/52KB).

**Recommended consolidation before any new build:**

- **Keep and elevate (5):** Payroll (flagship), Books → absorb Tax + HR into one **AfroBusiness OS**, Seller, Events, Legal Desk (as an AI document product, not a filing cabinet).
- **Park (5):** Trade Desk, Property Projects, Grants & Tenders (until there's a live data feed), Stream Intelligence, Creator Studio (fold into the new marketing suite in Pack B).
- **Fill the shelf** with Pack B: SEO, marketing, booking, review, link-in-bio — the "popular apps" businesses already pay Linktree/Fresha/Buffer/Semrush for.

---

## Prompt 0 — Global Engineering Contract (prepend to every prompt below)

```
You are building a production feature for AfroTools (afrotools.com), a pan-African
tools platform. Read and obey these constraints before writing any code.

STACK — NON-NEGOTIABLE
- Plain HTML + CSS + vanilla JS only. NO React, NO frameworks, NO build-time JSX.
  Small IIFE modules like the existing engines/*.js are the pattern.
- Hosting: Netlify (publish dir dist/). Serverless: netlify/functions/*.js
  (CommonJS, exports.handler). Shared helpers live in netlify/functions/_shared/.
- Auth + profiles: Supabase zpclagtgczsygrgztlts via assets/js/supabase-auth.js
  (AfroAuth global). Tool data: Supabase jbmhfpkzbgyeodsqhprx.
- Entitlements: use netlify/functions/_shared/entitlements.js server-side and
  assets/js/pro-gate.js + assets/js/ai/pro-monetization.js + usage-limits.js
  client-side. Never invent a parallel plan system.
- AI: call /.netlify/functions/ai-advisor (two-tier routing already built —
  Haiku fast default, Opus smart tier). Add a TOOL_CONTEXT entry for the new
  tool; never call Anthropic directly from the browser.

DESIGN — NON-NEGOTIABLE
- Brand is BLUE: --color-primary #0062CC, dark/link #0063D1, pale #E8F2FF,
  bg #F8FAFD, text #0f172a. Use tokens.min.css variables. Fonts: DM Sans body,
  Instrument Serif display. Use <afro-navbar> and <afro-footer> web components.
- NO colored top/left border accent bars on cards. No looping animations on
  card grids. will-change only on :hover.
- Mobile-first: controls min 44px tall / 16px font, grid minmax(0,1fr),
  tables scroll inside overflow-x:auto wrappers, verify at 375px.
- Dark mode: dark-mode.js injects the authoritative theme layer — test both.

ARCHITECTURE FOR PRO APPS
- App shell page at /pro/apps/<slug>/index.html gated with pro-gate.js
  (meta name="pro-required" content="afrotools-pro", robots noindex, canonical
  to itself is NOT allowed for noindex utility pages — canonicalize to the
  public landing page).
- A PUBLIC, indexable landing page at /tools/<slug>/index.html using
  assets/css/tool-landing.css that sells the app (features, screenshots,
  FAQ JSON-LD, pricing note) and links into the gated app.
- Logic in engines/<slug>-engine.js or assets/js/lib/<slug>/*.js — NOT one
  giant inline <script>. Keep pages under ~40KB by externalizing JS/CSS.
- Data layer: offline-first. IndexedDB (or localStorage for small records)
  with an explicit "Save to account" sync path to Supabase when signed in.
  Every record carries {id, updated_at, device_id} so sync is last-write-wins
  with a visible conflict note. Never silently lose local data.
- Update assets/js/lib/pro-app-registry.js (status/readiness/dataSurface)
  when the app's real capability changes. Keep labels honest — no fake
  "synced" or "filed" claims.

QUALITY GATES BEFORE YOU FINISH
- Add/extend a Node test in tests/ for every pure engine function
  (pattern: existing tests/*.test.js run with node --test or npm test).
- Run the relevant npm scripts (npm test at minimum; npm run check-links if
  routes changed). Fix what breaks.
- Windows/OneDrive gotcha: in Node scripts write files via temp file +
  fs.renameSync, never ftruncate in place.
- Escape all user content with an escapeHtml helper before innerHTML —
  the codebase already does this pattern everywhere; match it.
- No raw internal quality scores or debug data on public pages.
- French/Swahili: do not hand-author translations; English lane only unless
  the prompt says otherwise. Never author unaccented French copy.
```

---

## Pack A — Elevate the keepers (10 prompts)

### A1 — AfroBusiness OS: merge Books + Tax + HR into one back office

```
GOAL: Collapse three overlapping Pro apps (Books /pro/apps/books/, Tax
Compliance /pro/apps/tax-compliance/, HR /pro/apps/hr/) into ONE flagship:
AfroBusiness OS at /pro/apps/books/ (keep the route; 301! the other two in
_redirects — place ABOVE the catch-alls, which must stay last).

WHY: Four finance SKUs confuse users and split retention. One back office
with modules beats three previews.

BUILD:
1. Shell: left sidebar with modules — Overview, Money In (invoices/receipts),
   Money Out (expenses/bills), People (customers/vendors/staff), Compliance
   Calendar, Month Close, Reports, Vault. Migrate existing Books data
   (localStorage keys) with a one-time importer that preserves every record
   and shows a migration report.
2. Double-entry core: a real posting engine in engines/afrobooks-core.js —
   accounts, journals, trial balance. Every invoice/expense/payroll event
   posts journal lines. Unit-test debits==credits invariants.
3. Bank/momo statement import: CSV upload → column mapper → dedupe →
   AI-assisted categorization via ai-advisor (batch rows, return category +
   confidence; below 0.7 goes to a review queue). Support common NG/KE/GH/ZA
   bank CSV shapes plus M-Pesa statement export.
4. Compliance calendar: absorb the Tax app's obligation tracker. Country
   packs (start NG, KE, GH, ZA, TZ) with VAT/PAYE/CIT filing dates as data
   files in data/business-os/, each entry carrying source URL + last-reviewed
   date. Deadlines render as a calendar + "what's due in 30 days" card.
5. HR-lite module: absorb employee records, leave balances, and letters from
   the HR app; wire "payroll-ready" employees straight into the existing
   Payroll OS handoff instead of duplicating payroll.
6. Month close: a guided checklist (unreconciled rows, unsent invoices,
   unposted payroll) ending in an "Accountant Pack" — one branded PDF +
   CSV bundle (trial balance, ledgers, VAT summary) generated client-side.
7. Sync: account save to Supabase (businesses, records tables, RLS by
   user_id) with offline queue and visible sync-state chip per record set.
MONETIZATION: Free = 1 business, 15 documents/month, watermarked PDFs.
Pro = unlimited docs, clean PDFs, compliance calendar, AI categorization.
Team = multi-user with roles (owner/accountant read-write, staff submit-only).
ACCEPTANCE: engine tests green; migration keeps 100% of seeded legacy data;
Lighthouse mobile ≥ 90 on the public landing page; registry updated honestly.
```

### A2 — Payroll OS: from working to flagship

```
GOAL: Make /pro/apps/payroll/ + /tools/afropayroll-os/ the obvious "best
payroll for African SMEs" product.

BUILD:
1. Payslip delivery: per-employee payslip PDFs (existing generator) plus a
   share sheet — WhatsApp deep link with a short-lived signed URL served by
   a Netlify function (netlify/functions/payslip-share.js, tokens stored in
   Supabase, 72h expiry, single employee scope). No payslip data in URLs.
2. Statutory calendar: surface each country pack's remittance deadlines
   (PAYE, pension, NHF/NSSF/NHIF...) as a "remit by" board after each run,
   with amounts pulled from the run and a printable remittance summary.
3. Anomaly review: before a run is approved, diff it against the previous
   run and flag: new employees, >20% net change, missing statutory numbers,
   duplicate bank accounts. Pure function in the engine + tests.
4. Bulk onboarding: paste-from-spreadsheet grid (textarea → parser →
   validation table) to add 50 employees in one go.
5. Proof surfaces: run history timeline with approval signatures (who/when),
   and an auditor export (all runs + changes, CSV).
6. Public landing refresh: comparison table vs manual spreadsheets and vs
   generic payroll SaaS, country-pack confidence display, 3 realistic demo
   walkthroughs (GIF or stepped screenshots).
MONETIZATION: Free = 3 employees, 1 country. Pro = 25 employees, all packs,
WhatsApp payslips. Team = unlimited + approvals + auditor export.
ACCEPTANCE: anomaly rules unit-tested; share tokens expire (test the
function); run npm test + the payroll test suite.
```

### A3 — AfroSeller: give the shop a public face

```
GOAL: /pro/apps/seller/ is a solid private workspace. What sellers actually
want is a LINK they can drop in WhatsApp/Instagram bio. Add a public
storefront + order flow.

BUILD:
1. Public catalog: seller publishes selected products to a public page at
   /shop/<handle>/ rendered by a Netlify function (or pre-rendered static +
   API hydrate) from Supabase — name, photo, price in local currency, stock
   badge. Design: clean product grid, brand-blue accents, seller's own
   accent color choice from a safe palette. Indexable, Product JSON-LD.
2. Order intent flow: "Order on WhatsApp" builds a prefilled wa.me message
   with cart lines + total + order code; simultaneously logs an order-intent
   row so the seller's Orders board shows it as "awaiting confirmation".
3. Handle claiming: unique handles in Supabase with reserved-words list,
   profanity filter, and case-insensitive uniqueness.
4. Share kit: QR code for the storefront (client-side QR lib, logo center),
   IG-story-sized product cards generated on canvas for any product.
5. Inventory truth: stock decrements only on seller confirmation; oversell
   guard warns when intents exceed stock.
6. Analytics: page views + product clicks via the existing beacon pattern
   (widget-track style), shown as a 30-day sparkline per product.
MONETIZATION: Free = 10 published products, AfroTools badge on storefront.
Pro = unlimited products, no badge, custom accent, analytics, QR kit.
ACCEPTANCE: storefront works logged-out on mobile 375px; XSS-test product
names/descriptions; order intent appears in the seller workspace within one
refresh; JSON-LD validates.
```

### A4 — AfroEvents: RSVP links + QR check-in

```
GOAL: Turn the events workspace into the tool every African wedding/funeral/
owambe planner shares with guests.

BUILD:
1. Public RSVP page: /rsvp/<code>/ — event card (names, date, venue map
   link, dress code/aso-ebi note), guest replies attending/declining with
   party size and side/table preference. Writes to Supabase; planner's guest
   board updates counts live (poll or Supabase realtime).
2. Guest passes: per-guest QR pass (PNG download / WhatsApp share) encoding
   a signed guest token. Day-of check-in mode: full-screen scanner page
   (BarcodeDetector API with jsQR fallback) that marks arrival, shows table
   assignment, and flags duplicates in red.
3. Contribution tracker: family contribution ledger with pledged vs received
   and a printable thank-you list. NO payment processing — records only,
   labeled clearly.
4. Vendor scorecard: vendor list gains payment schedule + day-of contact
   sheet export (one PDF the coordinator prints).
5. Running order: minute-by-minute program builder with per-item owner and
   a "now/next" live view for the MC (large type, dark, phone-friendly).
MONETIZATION: Free = 1 event, 50 guests, AfroTools badge on RSVP page.
Pro = unlimited guests/events, QR check-in, no badge, exports.
ACCEPTANCE: RSVP page loads <2s on 3G throttle; scanner works on Android
Chrome; duplicate pass rejected; all guest input escaped.
```

### A5 — Legal Desk: AI documents, not a filing cabinet

```
GOAL: Nobody pays to store notes about contracts. They pay for CONTRACTS.
Rebuild /pro/apps/legal-desk/ around generation + review.

BUILD:
1. Template library: 20 launch templates as structured JSON in
   data/legal-desk/templates/ (employment offer, freelance/service agreement,
   NDA, tenancy, sale of goods, loan between individuals, invoice terms,
   demand letter, MOU, website privacy policy...) each with jurisdiction
   variants for NG/KE/GH/ZA and placeholders typed (party, date, money,
   clause-toggle).
2. Guided assembly: interview-style form (one question group per screen)
   fills the template; live preview pane; clause toggles show plain-language
   explanations of what each optional clause does.
3. AI assist via ai-advisor (add legal-desk TOOL_CONTEXT): (a) "explain this
   clause simply", (b) "review this pasted contract and list unusual or
   missing clauses" returning structured findings, (c) tone-adjust a demand
   letter. Every AI output carries the existing disclaimer pattern + "not
   legal advice" banner. Smart-tier routing for review tasks.
4. Output: clean DOCX-style PDF with numbered clauses, signature blocks,
   and a version footer. Documents saved device-first with account sync.
5. Renewal radar: any saved document with a term/expiry gets a reminder row
   in a renewals board.
MONETIZATION: Free = 3 documents/month from 5 basic templates, watermark.
Pro = full library, AI review (counts against aiDocumentsPerMonth), clean
export, renewals.
ACCEPTANCE: templates render with zero unresolved placeholders (test);
AI review returns structured JSON findings; disclaimer present on every
generated doc.
```

### A6 — Grants & Tenders: live feed or park it

```
GOAL: This app is only worth shipping if it has DATA. Build the ingestion
first; the workspace already exists.

BUILD:
1. Source ledger: data/grants/official-sources.json listing public tender
   portals and grant pages (national procurement portals, AfDB, development
   agencies, foundation calls) with country, category, fetch strategy, and
   robots/ToS notes. Only sources that permit fetching; blocked portals go
   in a manual-review queue like the transport/government ledgers.
2. Scraper: scripts/sync-grant-opportunities.js on the scraper-base.js
   pattern, run by scheduled function/cron, writing normalized opportunities
   {title, funder, country[], sector, deadline, url, amount?, first_seen}
   to Supabase with dedupe on url+deadline.
3. Feed UI: inside /pro/apps/grants-tenders/, an Opportunities tab —
   filter by country/sector/deadline window, freshness stamp per source,
   "save to pipeline" pushes into the existing tracker.
4. Deadline digest: Pro users opt into a weekly email digest (Netlify
   scheduled function + existing email path if present; otherwise an
   in-app "new this week" view only — do not fake email).
5. Eligibility pre-check: rule-based checklist per opportunity type +
   AI summary of the opportunity page (fetch server-side, summarize via
   ai-advisor, cache the summary).
MONETIZATION: Free = browse 7-day-old opportunities. Pro = fresh feed,
saved pipeline, digests, AI summaries.
ACCEPTANCE: scraper idempotent (re-run adds nothing new), respects robots,
per-source failure isolation; feed renders 200 rows smoothly on mobile.
```

### A7 — Creator Studio: the media kit is the product

```
GOAL: Creators pay for one thing here: a beautiful, always-current media kit
they can send to sponsors. Rebuild around that.

BUILD:
1. Media kit builder: sections (bio, audience stats, platform cards,
   past collaborations, packages/rate card, contact) edited in a form,
   rendered as a stunning public page /kit/<handle>/ — Instrument Serif
   display type, stat tiles, platform brand marks, print-perfect CSS.
2. Stats with receipts: manual stat entry is fine but every number carries
   "as of <date>"; nudge to refresh monthly. If AfroStream public data
   exists for the creator, offer one-click import.
3. Rate card intelligence: benchmark ranges by follower band × platform ×
   region from a transparent data file (data/creator/rate-benchmarks.json,
   sourced + dated); show "your package vs typical range" privately.
4. Sponsor pipeline: existing brief/campaign tracker stays, gains stages
   (pitched → negotiating → live → paid) and a follow-up reminder board.
5. One-click exports: kit as PDF, and a pitch email/DM draft generated via
   ai-advisor from kit data + target brand name.
MONETIZATION: Free = 1 kit, AfroTools badge, 3 AI pitches/month.
Pro = no badge, custom handle, unlimited pitches, rate benchmarks, pipeline.
ACCEPTANCE: public kit scores ≥95 Lighthouse a11y; PDF export paginates
cleanly; handle rules shared with Seller storefront (one lib).
```

### A8 — Trade Desk: wire it to the real duty engines

```
GOAL: Trade Desk is a shell sitting NEXT TO real assets (car import cost
packs, forex API, customs data). Make it the landed-cost workbench that
uses them.

BUILD:
1. Landed cost engine: engines/trade-landed-cost.js — CIF build-up
   (FOB + freight + insurance) → duties/levies/VAT per country pack →
   clearing/agent/transport lines → per-unit landed cost + margin table.
   Reuse data/trade/car-import-cost-*.json structures; add general-goods
   packs for NG/KE/GH/ZA with sourced duty bands in data/trade/.
2. Scenario compare: save a shipment, clone it, vary FX rate / duty band /
   freight; side-by-side diff table with the delta highlighted.
3. Live FX: /api/forex?base=USD (existing) with /data/forex/latest.json
   fallback; show rate timestamp; local currency first, USD as audit
   reference (matches the cars rule).
4. FX exposure: for unpaid supplier balances in foreign currency, show
   revaluation at today's rate vs booked rate.
5. Document checklist: per-country import doc checklist (Form M, IDF, PVoC
   etc.) as data files with source URLs; renders as a progress checklist
   per shipment.
MONETIZATION: Free = 2 scenarios, 1 country. Pro = unlimited scenarios,
compare, all packs, checklist exports.
ACCEPTANCE: engine unit tests cover every pack's duty math with worked
examples; directory-estimate labels preserved where packs aren't full-rule.
```

### A9 — Property Projects: the build-abroad trust machine

```
GOAL: The killer diaspora use case: funding a build back home and not
getting eaten. Sharpen /pro/apps/property-projects/ around accountability.

BUILD:
1. Milestone escrow-style ledger (records only, no payments): each milestone
   has budget, evidence requirement, and status; money-sent records attach
   to milestones; a variance bar shows sent vs budget vs verified progress.
2. Photo evidence: per-milestone photo uploads (Supabase storage, signed
   URLs, EXIF date surfaced) with a before/after gallery; a shareable
   read-only progress page for family members (/project/<code>/, unlisted,
   revocable).
3. Contractor scorecard: promised vs delivered dates per task; a printable
   site-visit checklist generator per project stage (foundation, DPC,
   roofing, finishing) from data files.
4. Cost sanity: material price reference table per country (cement, blocks,
   rebar, roofing) from data/property/material-prices.json with sourced,
   dated entries; flag line items >25% above reference.
5. FX drip planner: plan transfers against milestones using the forex API;
   show what last month's FX movement did to the remaining budget.
MONETIZATION: Free = 1 project, 3 milestones. Pro = unlimited, evidence
gallery, share page, price references.
ACCEPTANCE: share page is read-only and revocable (token invalidation
tested); uploads capped and validated by type/size; variance math tested.
```

### A10 — Pro Home: one workspace that sells the suite

```
GOAL: /pro/workspace/ and /pro/apps/ read like an internal admin panel
(routes, gaps, registries). Rebuild the Pro home as a product.

BUILD:
1. "Today" dashboard: cross-app cards — payroll due, invoices unpaid,
   compliance deadlines in 14 days, RSVP count movement, low stock — each
   card deep-links into its app. Data via each engine's summary function;
   apps without data show a single tasteful setup card, not a table row.
2. Universal search (Ctrl+K): indexes app names, records (client-side across
   local stores), and free tools; keyboard navigable.
3. Suite nav: persistent app switcher (9-dot style) shared component
   assets/js/components/pro-switcher.js used by every Pro app shell.
4. Honest status, humane words: replace "Route-ready / shell / schema"
   vocabulary with user language ("Ready", "Early preview") — keep the
   engineering truth in the registry, not in the UI copy.
5. Onboarding: first-run picks business type (seller, salon, school,
   freelancer, planner, builder...) and arranges the shelf accordingly;
   stores choice in profile.
ACCEPTANCE: dashboard renders <1s from local data; zero registry jargon
visible; works signed-out (marketing state) and signed-in (live state).
```

---

## Pack B — 10 new business tools ("popular apps" shelf)

Ordering = build priority. B1–B3 are the highest-leverage: they create public,
shareable surfaces that market AfroTools by themselves.

### B1 — AfroSEO Studio

```
GOAL: A real SEO web app for African SMEs at /tools/seo-studio/ (public
landing) + /pro/apps/seo-studio/ (workspace). This is the anchor of the new
business shelf.

BUILD:
1. Site audit: user enters a URL → netlify/functions/seo-audit.js fetches
   the page server-side (10s timeout, 2MB cap, same-origin redirect follow)
   and returns a structured audit: title/meta/OG/canonical/robots/hreflang,
   H1 structure, image alt coverage, internal/external link counts, mixed
   content, viewport, favicon, JSON-LD blocks parsed + validated against
   expected types, llms.txt/robots.txt presence, sitemap reachability,
   response time + size + compression. Grade each category A–F with concrete
   fix-it text (not generic advice). Crawl mode (Pro): up to 25 pages via
   the sitemap, queued, with a per-page issues table and site-level rollup.
2. Keyword workbench: user-entered keyword list with intent tagging (AI via
   ai-advisor), grouping into clusters, and a rank-check LATER note — do NOT
   fake volume/rank data we don't have; label estimates as estimates.
3. Meta & schema generators: SERP-preview-driven title/description editor
   (pixel-width bars, emoji warning), and JSON-LD generators for
   LocalBusiness, Product, FAQ, Article, Event with copy-paste output and
   validation.
4. Local SEO checklist: Google Business Profile optimization checklist
   tailored by business category + African market notes (NAP consistency,
   WhatsApp click-to-chat links, local directories from the existing
   backlink directory data in reports/backlinks/ knowledge).
5. Reports: branded PDF audit report (agency-ready), re-run history with
   score deltas per site.
MONETIZATION: Free = 3 single-page audits/day, generators with watermarked
PDF. Pro = crawl mode, history, unlimited audits, clean agency PDF, AI
keyword clustering. Team = client folders + white-label report header.
DATA HONESTY: every check is computed from the fetched page — no invented
metrics, no fake "domain authority".
ACCEPTANCE: audit function unit-tested against 5 fixture HTML files
(perfect page, missing everything, broken JSON-LD, huge page, redirect);
SSRF-guard the fetcher (block private IPs/localhost); audit of afrotools.com
itself completes <8s.
```

### B2 — AfroBio: link-in-bio + QR studio

```
GOAL: The Linktree of Africa at /bio/<handle>/ — the single most viral
"popular app" category, and it cross-sells every other AfroTools surface.

BUILD:
1. Page builder: profile (photo, name, tagline), unlimited link blocks
   (title, URL, icon), special blocks — WhatsApp chat button with prefilled
   message, phone/USSD dial block, AfroSeller storefront embed, AfroEvents
   RSVP embed, Creator media-kit embed, payment-details display block
   (bank/momo details as TEXT, no processing). Drag to reorder (pointer
   events, no library). 8 curated themes (light/dark × 4 palettes that stay
   on-brand-adjacent but user-selectable), custom accent for Pro.
2. Rendering: server-rendered by a Netlify function from Supabase for
   instant load + OG tags per page; hydrate analytics beacon only. Target
   <30KB first load, zero webfonts on the public page (system stack) for
   speed on cheap Android.
3. QR studio: for any AfroBio page (or arbitrary URL), generate QR with
   center logo, color (contrast-checked), frame + CTA text, download PNG/SVG,
   print sheet (business card 10-up, poster A5/A4). Client-side generation.
4. Analytics: views + per-link clicks (existing beacon pattern), 30-day
   chart, top referrer class (WhatsApp/IG/direct via referrer+utm).
5. Handles: same shared handle lib as Seller/Creator (one namespace or
   clearly separate — decide and document).
MONETIZATION: Free = 1 page, 8 links, AfroTools badge, basic QR.
Pro = unlimited links/pages, no badge, custom accent + button styles,
analytics, QR logo/frames, scheduled links (show between dates).
ACCEPTANCE: public page Lighthouse ≥95 all categories on mobile; URL
validation blocks javascript:/data: schemes; handle takeover impossible
(case-insensitive unique, reserved list); QR scans reliably at print size.
```

### B3 — AfroBook: public booking pages

```
GOAL: Calendly-meets-Fresha for African service businesses at
/book/<handle>/ + workspace /pro/apps/bookings/. Generalizes the Beauty OS
plan to every appointment business (salons, barbers, tutors, clinics-admin,
consultants, photographers, mechanics).

BUILD:
1. Services & availability: service menu (name, duration, price, deposit
   note), weekly availability grid per staff member, buffer times, closed
   dates, timezone = business local (Africa/* zones), slot generation as a
   pure tested function.
2. Public booking flow: pick service → staff (optional) → day/slot → name +
   phone (+optional note) → confirmation screen + .ics download + "add
   reminder to WhatsApp" (wa.me self-message trick). Writes booking to
   Supabase; double-booking prevented server-side (function checks slot
   atomically).
3. Deposit culture: booking can display "deposit required: X to momo/bank Y"
   with a "I have paid" checkbox that flags the booking for merchant
   confirmation — records only, no processing, honest labels.
4. Merchant board: day/week calendar view, booking states (pending →
   confirmed → done → no-show), client history cards (visits, notes,
   no-show count), daily WhatsApp summary text generator ("Tomorrow: 6
   bookings...").
5. Reminders: reminder queue view + one-tap wa.me prefilled reminder per
   booking (automation later; never fake auto-send).
MONETIZATION: Free = 1 staff, 20 bookings/month, badge. Pro = unlimited,
staff members, deposits, history, no badge. Team = multi-staff roles.
ACCEPTANCE: slot engine tested (DST-free zones, buffers, overlaps);
race-condition test on double booking; booking flow completes in <60s on
mobile; all phone inputs accept local formats.
```

### B4 — AfroSocial Studio: content planner + AI copywriter

```
GOAL: The daily-use marketing app at /pro/apps/social-studio/: plan a week
of content in 20 minutes.

BUILD:
1. Content calendar: month/week grid of post cards (platform, caption,
   media note, status draft/ready/posted). Drag between days. "Posted" is
   manually marked — we do NOT claim auto-publishing.
2. AI caption engine (ai-advisor, new TOOL_CONTEXT): brand voice setup
   (business type, tone, audience, banned words, sample captions) stored
   per workspace and injected into every generation. Generators: product
   post, promo, testimonial reframe, educational thread, event countdown —
   each returns 3 variants + hashtag set + best-time note. African context
   switches (market day, payday cycles, Ramadan/Easter/Detty-December
   seasonal hooks from a data file).
3. Hashtag research: curated hashtag sets by niche × country in
   data/social/hashtags.json (sourced, dated) + AI expansion; copy groups
   with one tap.
4. Image studio: canvas-based post image maker — templates (quote card,
   price list, promo flyer, before/after) with brand colors + logo upload,
   correct export sizes per platform (IG post/story, X, Facebook, WhatsApp
   status), all client-side.
5. Recycling: "rewrite this old post" and a content-mix report (how much
   promo vs value in the last 30 days).
MONETIZATION: Free = 10 AI generations/month, 2 templates, calendar.
Pro = full AI (usage-limits buckets), all templates, brand kit, multi-brand.
ACCEPTANCE: generations respect brand banned-words (test the prompt
scaffold); canvas exports exact pixel sizes; calendar persists offline.
```

### B5 — AfroReviews: reputation manager

```
GOAL: Review collection + response engine at /pro/apps/reviews/ — the tool
that fills a business's Google/WhatsApp with 5-star proof.

BUILD:
1. Collection links: business creates a review funnel page /r/<handle>/ —
   "How was your experience?" star tap → 4-5 stars: deep-link buttons to
   the business's Google review URL / Facebook page (configured by owner)
   + optional public testimonial form; 1-3 stars: private feedback form
   routed to the owner's inbox board (complaint recovery, not review
   gating dark-pattern — show ALL users the public option too, keep it
   compliant with Google policy).
2. QR + NFC-ready cards: print sheet of "Rate us" QR cards (table tent,
   receipt slip, sticker) via the B2 QR lib.
3. Testimonial wall: approved testimonials render as an embeddable widget
   (existing widgets/embed.js pattern — register camelCase alias!) and a
   /r/<handle>/wall page with Review JSON-LD.
4. AI response studio: paste any review (or pick from testimonials) →
   ai-advisor drafts a response in the brand voice; templates for the hard
   ones (refund demand, unfair review, mixed review).
5. Review health: counts, average, response-rate tracking from manually
   logged reviews + funnel data; weekly "ask 5 customers" nudge list pulled
   from AfroBook/AfroSeller customer records where present.
MONETIZATION: Free = funnel page + 10 logged reviews, badge. Pro = QR kit,
widget, AI responses, unlimited, no badge.
ACCEPTANCE: funnel page loads <1.5s on 3G; policy-compliant flow (public
review option always visible); widget sandbox-safe; JSON-LD validates.
```

### B6 — AfroCRM: follow-up machine

```
GOAL: A WhatsApp-native lightweight CRM at /pro/apps/crm/ for the "my
customers live in my chats" merchant.

BUILD:
1. Contact base: quick-add (name, phone, tags, source, value band), CSV +
   Google-contacts-export import with dedupe on normalized phone (libphonenumber-
   style normalization for African country codes as a small tested util —
   no heavy dependency).
2. Pipeline: kanban (new → talking → quoted → won → repeat) with drag,
   per-card next-action date; overdue actions surface in a Today queue.
3. Follow-up engine: sequence templates (day-1 thanks, day-7 check-in,
   day-30 reorder) that generate a daily checklist of prefilled wa.me
   messages — one tap per contact, mark done. Never claim auto-send.
4. Broadcast composer: segment by tag/spend/last-contact → personalized
   message preview per contact ({firstname}, {lastproduct}) → guided
   copy-paste flow batched in 10s (WhatsApp broadcast reality) or export
   to WhatsApp Business labels CSV.
5. Cross-suite: AfroSeller orders and AfroBook bookings auto-create/update
   contacts (shared contact store contract in assets/js/lib/afro-contacts.js).
MONETIZATION: Free = 50 contacts, 1 pipeline. Pro = unlimited, sequences,
broadcasts, cross-app sync, import.
ACCEPTANCE: phone normalization tested for NG/KE/GH/ZA/EG/FR formats;
import of 1,000-row CSV stays responsive (chunked); Today queue correct
across timezones.
```

### B7 — AfroSites: one-page website builder

```
GOAL: A business website in 10 minutes at /pro/apps/sites/, published to
/site/<handle>/ (and custom-domain instructions for Pro).

BUILD:
1. Section-based builder (no freeform drag): hero, about, services/menu
   grid, gallery, testimonials (pulls AfroReviews wall), opening hours,
   map embed link, contact/WhatsApp CTA, footer. Each section is a form +
   live preview; reorder/hide sections.
2. Themes: 6 typography+palette systems (respect contrast AA), all
   mobile-first; hero images from user upload (Supabase storage, resized
   client-side to sane dimensions before upload).
3. Publishing: static HTML generated and stored, served via function route
   with edge-cache headers; each publish is a version (rollback list).
   Full SEO head: title/desc from business info, LocalBusiness JSON-LD,
   OG image auto-generated from hero (canvas), sitemap ping via IndexNow
   (existing pattern).
4. AI copywriter: "write my about section / service descriptions" from a
   3-question brief via ai-advisor.
5. Cross-suite blocks: booking button (AfroBook), storefront section
   (AfroSeller), bio-page link (AfroBio) — the suite compounds.
MONETIZATION: Free = 1 site, subpath URL, badge footer. Pro = no badge,
gallery, versions/rollback, OG studio, priority render. (Custom domains =
documented manual path, only if honestly supportable.)
ACCEPTANCE: published site ≥95 Lighthouse mobile; user HTML injection
impossible (all content escaped, no raw HTML blocks); publish→live <10s.
```

### B8 — AfroForms: forms, surveys & registrations

```
GOAL: The Google-Forms-but-yours utility at /pro/apps/forms/ + public
/f/<code>/ — feeds every other app (leads → CRM, registrations → Events,
feedback → Reviews).

BUILD:
1. Builder: field palette (text, phone with country prefix, email, choice,
   multi, dropdown, date, number, rating, file upload Pro-only, section
   break, consent checkbox), required/validation rules, conditional show
   (if answer X show section Y) as a small tested rules engine.
2. Public form: single-column mobile-perfect page; offline-tolerant (queue
   submission in localStorage and retry); thank-you screen with optional
   redirect or WhatsApp-us button; submission writes to Supabase with
   per-form token, honeypot + time-trap spam guards (no CAPTCHA).
3. Responses: table with filters, individual response view, CSV export,
   response charts (choice fields → bar/donut via existing chart approach),
   webhook per form (Pro) POSTing JSON to a user URL with signature header.
4. Templates: registration, lead capture, feedback/NPS, job application,
   school admission, church/community membership, order form.
5. Routing: map form fields → CRM contact fields to auto-create contacts.
MONETIZATION: Free = 3 forms, 100 responses/month, badge. Pro = unlimited,
uploads, logic, webhooks, charts, no badge.
ACCEPTANCE: conditional logic engine unit-tested; spam guards drop obvious
bots in a fixture test; 5,000-response table stays usable (virtualized or
paginated); file uploads validated type/size server-side.
```

### B9 — AfroMetrics: privacy-first site analytics

```
GOAL: Plausible-style analytics at /pro/apps/metrics/ — for AfroSites,
AfroBio, storefronts AND any external site via one script tag. Deeply
differentiating for the African web (data-cheap, no cookies).

BUILD:
1. Collector: netlify/functions/metrics-collect.js accepting tiny beacons
   (<1KB script served from /js/am.js): pageview {site, path, ref class,
   utm, screen band, country via Netlify geo header}. No cookies, no
   fingerprinting, no PII — hash (site+ip+ua+day, salt rotated daily)
   for unique-ish visitor counting, document this honestly.
2. Storage: aggregate tables in Supabase (hourly rollups written by the
   collector or a rollup cron) — never store raw IPs.
3. Dashboard: visitors/pageviews sparkline, top pages, referrer classes,
   countries map-list, UTM campaign table, live "now" count (last 5 min),
   date compare. Fast: one aggregate fetch per panel.
4. Auto-wiring: every AfroSites/AfroBio/storefront page gets metrics with
   zero setup; external sites get a copy-paste snippet + domain
   verification (meta tag check).
5. Weekly digest card in Pro Home ("Your bio page: 412 views, +38%").
MONETIZATION: Free = 1 internal property. Pro = external sites, 5
properties, UTM + compare, CSV export. Team = 20 properties, API.
ACCEPTANCE: beacon <1KB gzipped and non-blocking; collector load-tested
to burst 50 rps (queue/batch writes); GDPR/NDPR-friendly wording reviewed
on the landing page; rollups idempotent.
```

### B10 — AfroHire: job posts & applicant tracking

```
GOAL: Small-business hiring at /pro/apps/hire/ + public /jobs/<code>/ —
completes the suite (hire → HR-lite → payroll is one funnel).

BUILD:
1. Job composer: role templates (shop assistant, tailor, driver, developer,
   teacher, nurse-admin...) with AI-assist description writer via
   ai-advisor; salary display with local-currency band + "negotiable"
   toggle; JobPosting JSON-LD on the public page for Google Jobs.
2. Public job page + apply flow: AfroForms-powered application form
   (auto-generated from the job's requirements: CV upload Pro, questions,
   consent), WhatsApp-share card for the vacancy.
3. Applicant tracker: kanban (applied → shortlist → interview → offer →
   hired/declined), side-by-side compare of 2-3 candidates, interview
   scheduler that creates AfroBook slots, bulk regret-message generator
   (mail-merge text, guided send).
4. Screening assist: AI summary of an application against the job's
   requirements (structured verdict: meets/misses/unclear per requirement)
   — labeled as assistance, human decides.
5. Hired → handoff: one click creates the employee record draft in
   AfroBusiness OS HR-lite / Payroll onboarding.
MONETIZATION: Free = 1 open job, 25 applicants. Pro = unlimited, CV
uploads, AI screening, compare, handoff.
ACCEPTANCE: JobPosting JSON-LD passes validation; application flow works
on 375px 3G; screening output structured + tested against fixtures; regret
generator never auto-sends.
```

---

## Suggested sequencing

1. **A10 (Pro Home)** + **A1 (consolidation)** — fix the shelf before adding to it.
2. **B2 (AfroBio)** + **B1 (SEO Studio)** — fastest acquisition wins; B2 is viral, B1 matches high-intent search traffic.
3. **A3 (Seller storefronts)** + **B3 (Bookings)** — public surfaces that make Free users recruit other users.
4. **B4/B5/B6** (Social, Reviews, CRM) — the daily-use retention layer.
5. **A2, A5, B7–B10** — flagship depth and suite completion.
6. Park Trade Desk / Property / Grants prompts (A6, A8, A9) until the above earn revenue, unless a partner opportunity appears.

## One shared principle

Every app above wins on the same three moats, so enforce them in review:
**(1) a public shareable surface** (storefront/bio/booking/RSVP/kit/site — Free users market you), **(2) WhatsApp-native workflows** (prefilled messages, share kits, QR — meet users where African commerce happens), and **(3) honest offline-first data** (device-first, visible sync state, no fake claims — the existing labeling discipline is a genuine trust asset; keep it).
