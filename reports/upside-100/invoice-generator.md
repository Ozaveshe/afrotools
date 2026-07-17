# Invoice Generator — Audit

- Live: https://afrotools.com/tools/invoice-generator/
- File: `tools/invoice-generator/index.html`
- Shared (do not edit here): `assets/js/pages/invoice-generator-enhancements.js`, `assets/vendor/jspdf/*`, `assets/js/lib/*`

## What it does
Fully client-side invoice / receipt / quote builder. Live preview + form; 22 African-first
currencies with auto VAT rate per country; VAT / per-item / no-tax modes; discount, withholding
tax, deposit (amount paid), balance due; 6 visual templates; logo upload; saved clients, reusable
line items, saved drafts, and templates (all localStorage); Africa payment block (bank / mobile
money / card link / WhatsApp / PO); share link (base64 state in URL); JSON import/export; copy
payment reminder; real PDF export via jsPDF. Signed-in users sync active draft to their account;
client lists + templates stay local. Genuinely private/local-first.

## Competitors & gaps
Invoice-generator.com, Zoho, Wave, Refrens dominate global. AfroTools' edge: African currencies +
auto per-country VAT + mobile-money/WhatsApp/withholding fields — real differentiators none of the
above surface. Gaps: no multi-currency FX; no recurring invoices; per-item tax applies on the
gross line (not discounted) while VAT applies after discount — minor inconsistency, acceptable and
documented as user-entered; withholding base = subtotal−discount (reasonable).

## Verification
- Totals/tax/withholding/balance math: verified numerically. subtotal=Σqty·price; discount=sub·d%;
  VAT=(sub−disc)·rate; per-item tax=Σ(lineSub·t%); total=sub−disc+tax; withholding=(sub−disc)·wh%;
  balance=max(0, total−withholding−paid). Cases (VAT+discount, per-item, WHT+deposit, overpaid→0)
  all correct. Inline `updatePreview` and shared `y()` agree.
- Inline JS: all 4 real inline `<script>` blocks compile (node vm). No `document.write` anywhere —
  the print/injector concern does not apply; PDF is jsPDF-generated. btnPDF has 3 click handlers
  (2 capture + 1 bubble); enhancements `D` (invoices) / middle `exportNonInvoicePdf`
  (receipt/estimate) each `stopImmediatePropagation`, so the old inline `AfroTools.pdf.generate`
  path is dead code (harmless; contains a duplicate `subtitle` key — left untouched, never runs).
- JSON-LD: BreadcrumbList, WebApplication, WebPage, FAQPage all parse. FAQPage's 10 Q&As all mirror
  visible text (8 in main FAQ + 2 in the money-seo card). Valid.

## SEO / UX / a11y
- Title: `Free Invoice Generator Africa | PDF, VAT, Receipts | AfroTools` — keyword + African intent. Good.
- Meta description ~133 chars, in range. OG/Twitter/canonical/hreflang (en/fr/sw/ha) all present.
- H1 was generic "Invoice Generator" → fixed to keyword + intent (see below).
- UX: build→preview→export flow is tight; starter cards, mobile sticky Download bar, PDF gated
  until required fields valid (aria-disabled + reason hint). 375px mobile: items table reflows to
  stacked cards. a11y: skip link, radiogroup templates, aria-labels on icon buttons, sr-only labels,
  live-region hints. Solid.

## Fixes applied 2026-07-14
- H1: `Invoice Generator` → `Free <em>Invoice Generator</em> for Africa` (unique keyword + African
  intent; reuses existing `.inv-hero h1 em` accent style; no JS depends on H1 text).
- Verified: totals/tax/withholding/balance math correct (4 node cases); all inline JS compiles;
  all 4 JSON-LD blocks valid; FAQPage mirrors only visible FAQ.
- Deferred: dead `btnPDF` inline handler with duplicate `subtitle` key (never executes — out of
  surgical scope); per-item-tax-vs-discount base inconsistency (by design, user-entered).
