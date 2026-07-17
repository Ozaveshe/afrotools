# Logo Maker — Audit (upside-100)

Live: https://afrotools.com/tools/logo-maker/
File: tools/logo-maker/index.html

## What it does
Client-side text-logo builder. User picks an "African Starter Kit" preset
(Fintech, Fashion, Food, Agri, Education, Logistics), types brand text, chooses
one of 6 fonts, text/background colours, a layout (text-only, icon-left,
icon-top) and an optional icon. A live SVG preview updates on every change and
exports to SVG (vector) and PNG (400x300 canvas). Everything runs in-browser;
nothing is uploaded. Honestly positioned as a "local draft" tool and cross-sells
CreatorBrand for full identity systems. No AI is claimed or used — accurate.

## Competitors & gaps
- Canva / Looka / Hatchful: template galleries, real icon/shape libraries,
  auto-generated concepts, brand kits, multi-size export.
- Gaps here: only 6 fonts; "icon" library is a handful of emoji, not vector
  marks; no size/letter-spacing/logo-scale controls; PNG export is fixed
  400x300 (no transparent-bg or hi-res option); no undo/history; no saved
  projects. Positioned correctly as a quick-draft tool, so gaps are acceptable
  for scope but limit "professional quality" claim in the Tips card.

## Verify it works / export
Preview logic, preset application, colour sync, and SVG+PNG download handlers
are all present and sound (null guards, error alerts). Export works.

## Defects found
- OVERCLAIM (fixed): hero badge said "10+ Fonts" but the Font dropdown has 6.
- OVERCLAIM (fixed): "How It Works" copy claimed size + letter-spacing controls
  that do not exist in the UI.
- JSON-LD (fixed): WebApplication and WebPage blocks had placeholder
  name/description/url values ("https://afrotools.com/") — junk for rich results.
- BROKEN ICONS (DEFERRED): emoji are mojibake throughout the file — icon
  <option> labels render as "??"/"?", the hero ::after decoration, Tips bullets,
  download-button prefixes, and JS PRESET `icon` values. The icon feature is
  effectively unusable (options show literal "?"). Not fixed here: requires
  careful UTF-8 emoji re-encoding across ~15 spots (option values, PRESETS map,
  CSS content), higher-risk than this surgical SEO/overclaim pass and better
  done as a dedicated encoding fix. Flagged for follow-up.

## SEO
- Title (fixed): now keyword + African intent.
- Meta (fixed): 157 chars, within 120-160.
- H1 (fixed): unique keyword "Logo Maker for African Brands".
- JSON-LD: WebApplication (DesignApplication), WebPage, BreadcrumbList, FAQPage
  all valid (node-parsed). FAQPage mirrors the 5 visible <details> exactly.
- hreflang en/fr/sw + canonical present and correct.

## UX / a11y
- Inputs/selects carry aria-label; visual .f-label-text labels lack `for` but
  aria-labels cover SR users. role="main" present. Heading order sane.
- Mobile: grid collapses to single column at 768px; action row stacks. OK at 375px.

## Fixes applied 2026-07-14
- <title> -> "Logo Maker for African Brands | Free Text Logo Creator | AfroTools".
- Meta description rewritten to 157 chars with African SMB intent.
- H1 -> "Logo Maker for African Brands" (unique keyword).
- Hero badge "10+ Fonts" -> "6 Fonts" (corrected count overclaim).
- Removed non-existent "size, letter spacing" controls from How-It-Works copy.
- Fixed WebApplication + WebPage JSON-LD placeholder name/description/url.
- All 4 ld+json blocks re-validated with node: parse OK.
- Deferred: sitewide emoji mojibake (icon dropdown/presets/decor) — needs
  dedicated UTF-8 re-encode.
