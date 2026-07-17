# Upside-100 Audit — African Scholarship Finder

- **Live URL:** https://afrotools.com/tools/scholarship-finder/
- **Source:** `tools/scholarship-finder/index.html`
- **Category:** education
- **Audited:** 2026-07-13

## 1. What it does

A profile-aware scholarship eligibility/match tool for African students. Users run a "Quick Check" (grade band, level, field, destination) or a "Full Match Explorer" (GPA + scale, IELTS, level, field, destination). It scores each scholarship (GPA 40%, IELTS 25%, field 15%, destination 10%, level 10% via `engines/scholarship-matcher.js`) into Strong/Good/Possible/Unlikely, explains fit, lets users shortlist/save (local or account-synced), attach deadline reminders (signed-in), and export an "application pack" TXT. It has a genuinely strong deadline-trust layer.

## 2. Data source & freshness (accuracy matters — there are `scholarship-deadline-trust` tests)

- **Feed:** `/api/scholarships` → `netlify/functions/api-scholarships.js` → `_shared/scholarship-platform.js`. Primary source is a Supabase data catalog (`afrotools-data-catalog`) with `PUBLIC_MIN_SCHOLARSHIP_COUNT` default 50; degrades to cached snapshot, then to a curated backup. Scheduled functions (`scheduled-verify-scholarships`, `scheduled-discover-scholarships`, `scheduled-reconcile-scholarship-deadlines`, `scheduled-send-scholarship-reminders`) keep it fresh — good hygiene.
- **Feed status is surfaced honestly:** live / cached / curated / fallback labels, "last checked" timestamps, and a degraded warning banner (`#feedStatus`). The page deliberately shows the exact loaded count instead of a marketing number. This is a strong, defensible trust posture.
- **Deadline trust (`scholarship-deadline-trust.js`) is excellent:** per-card status (Open / Closing soon / Urgent / Closed / Rolling / Deadline month only / Research queue), confidence tier (Verified source / Needs source confirmation / In research), "Source" + "Official provider" links, last-checked date, and a "Report deadline / Submit official source" flow. It refuses to compute days-left without an exact sourced date. This is best-in-class and should be protected.

### Data-trust red flags
1. **Duplicated hardcoded fallback lists** — the 10-item `FALLBACK` array is hardcoded twice: `index.html` (~lines 588–599) and `assets/js/education-scholarship-feed.js`. They can drift (min_gpa, deadline_text). Single-source them.
2. **Fallback deadlines are month/word-only** (`"Nov (annual)"`, `"Jul-Oct"`, `"Varies"`) with no source URL / last-checked. The deadline-trust module correctly downgrades these to "In research"/"Deadline month only", so it does NOT overclaim — but when the live feed is down, users see thin, undated guidance. Acceptable but worth noting.
3. **GPA thresholds in the fallback are hand-set claims** (e.g. Chevening `min_ielts:6.5`) with no per-field source; keep them conservative and dated in the catalog, not the HTML.
No overclaiming detected in the shipped copy — disclaimers ("verify on the official provider page before applying") are present in body, FAQ JSON-LD, and the application pack.

## 3. Competitors & feature gaps

Real competitors for "scholarships for African students": **Scholar.africa** (350+ verified, matcher scores eligibility/deadline/field, filter by level/award/country/urgency), **AfterShoolAfrica** (browse by country of origin), **ScholarshipTab / Scholars4Dev / ScholarshipSet** (large volume, deadline-forward), plus **DAAD / Chevening / Studyportals** for authority.

| Feature users expect | AfroTools | Notes |
|---|---|---|
| Filter by **country of ORIGIN / nationality** | ❌ | Biggest gap — see below |
| Filter by destination | ✅ | |
| Filter by level / field / funding | ✅ | |
| Match/eligibility scoring | ✅ (strong) | Better than most competitors |
| Deadline countdown + status | ✅ (best-in-class trust layer) | But rarely dated in fallback |
| Save / shortlist | ✅ | Competitive edge |
| Email deadline alerts | ✅ (signed-in) | Competitive edge |
| Volume/breadth | ⚠️ | Fallback shows 10; live feed ≥50. Competitors advertise 350–400+ |
| Browse pages (per country/level SEO) | ❌ | Competitors rank via listing pages |

**Top 3 competitor-gap features to build:**
1. **Country-of-origin / nationality filter + eligibility gate.** Many awards are nationality-restricted (Commonwealth eligible list, DAAD by country, Mastercard Foundation). The tool scores destination but never asks the student's African country — so it can surface awards they're ineligible for and can't filter the way Scholar.africa/AfterSchoolAfrica do. Requires an `eligible_countries` field in the catalog + a select in Quick Check and Full Explorer.
2. **Dated, sortable deadlines with "closing this month" browse.** Push the catalog toward `deadline_date` + verified source so the countdown, "Closing soon" sort, and reminders actually fire; competitors win on "July 2026 deadlines" freshness.
3. **Breadth + SEO listing/browse pages** (e.g. `/scholarships/nigeria/`, `/scholarships/masters/`) — competitors rank on volume and indexable listings; this page's cards are client-only (see SEO).

## 4. SEO audit

- **Title:** `African Scholarship Finder & Eligibility Check | AfroTools` — 57 chars, keyword-strong. ✅
- **Meta description:** ~172 chars — slightly over ~160 truncation point; trim to lead with "scholarships for African students". ⚠️
- **H1:** "Find scholarships open to African students" — good intent, single H1. ✅
- **Canonical + hreflang** (en/fr/sw/ha/x-default): present and correct. ✅
- **JSON-LD present:** `BreadcrumbList`, `FAQPage`. ✅
- **JSON-LD missing:** no `WebApplication`/`SoftwareApplication` for the tool itself, and **no `ItemList`** of scholarships. ❌
- **BIGGEST SEO GAP — listings are 100% client-rendered.** The `#scholarshipGrid` ships only skeleton divs; scholarship cards are injected by JS. Crawlers see the intro paragraphs + FAQ only — thin vs competitors who rank on visible listings. The related-tools block IS server-rendered, proving the SSR pattern exists here. **Server-render the curated fallback (~10–50) as static `.sch-card`s** (progressive enhancement over-writes them live) for indexable content + `ItemList` schema + no-JS support.
- Internal linking (Education Hub, GPA, IELTS, University Rankings, JAMB, Study Abroad) is strong. ✅

## 5. UI/UX audit

- **Loading/empty/degraded states:** all handled well (skeletons, empty-state helper, degraded feed banner, aria-live regions). ✅ Empty-state icon is a literal `'0'` (`renderGrid` → `renderEmptyState({icon:'0'})`) — looks like a bug/placeholder. ⚠️
- **Filter usability:** two overlapping input surfaces (Quick Check card + Full Explorer card + separate Search/Filter card + Sort row) is a lot of vertical real estate before any result. Consider collapsing Quick Check into the filter bar once results exist.
- **Deadline display:** excellent trust row per card. But sort-by-deadline uses `deadline_month` heuristics that are absent from the fallback data, so nearest-deadline sort is a no-op offline.
- **Save/alert flow:** clear; reminders correctly gated behind sign-in and behind a dated deadline (won't promise alerts it can't send). ✅
- **Accessibility:** buttons are `type="button"`, aria-labels on selects, aria-live on status. Inline `onclick` handlers throughout (works, but CSP/maintainability). Colored funding/match badges rely partly on color — text labels present, OK. ✅ mostly.
- **Mobile 375px:** grids collapse to 1-col at 480px; filter row to 2-col at 768px then 1-col; looks safe.
- **Trust signals:** source links, "verify on official site" disclaimers, report-deadline flow — strong. ✅

## 6. Prioritized fixes

### A. Quick wins (exact file → change)
1. `tools/scholarship-finder/index.html` (`renderGrid`/`renderEmptyState` call, ~line 1084) → replace `icon:'0'` with a real empty-state glyph/SVG; `'0'` renders as a literal zero.
2. `tools/scholarship-finder/index.html` `<meta name="description">` (line 8) → trim to ≤160 chars, front-load "Scholarships for African students".
3. Add `WebApplication` + `ItemList` JSON-LD blocks in `<head>` (near existing FAQ/Breadcrumb LD) listing the curated scholarships (server-rendered set).
4. De-duplicate the `FALLBACK` array — import/share the one in `assets/js/education-scholarship-feed.js` instead of re-declaring in `index.html` (~588–599) to prevent drift. Verify no `scholarship-*` test snapshots depend on the inline copy first.
5. `tools/scholarship-finder/index.html` deadline-sort branch (~line 1559) → guard/hide "Nearest Deadline" sort when no card has a real `deadline_date`/`deadline_month`, so it isn't a silent no-op.

### B. Feature upgrades vs competitors
1. **Country-of-origin filter + `eligible_countries` eligibility gate** (catalog schema in `_shared/scholarship-platform.js` + selects in both profile cards + filter logic in `applyFilters`). Highest-leverage gap.
2. **Push dated, sourced deadlines** through the discovery/verify scheduled functions so countdown + "Closing soon" sort + reminders are real, not fallback-blank.
3. **SSR the scholarship grid** (static curated cards) — doubles as the #4 SEO fix; consider country/level browse landing pages for programmatic SEO (respect `.claude/rules/seo-pages.md` — use generators, not hand edits).
4. Surface breadth: show live count prominently and paginate/browse the full ≥50 feed, not just 12/page from a thin default.

### C. Watch-outs — generated / SEO-managed / test-guarded (do NOT hand-edit blindly)
- **`scholarship-deadline-trust.js` / `.css`** and the catalog deadline fields are covered by `tests/scholarship-deadline-trust.test.js`, `scholarship-api-metadata.test.js`, `scholarship-save-reminder-contract.test.js`, `scholarship-detail-view.test.js`, `scholarship-study-context-bridge.test.js`, `scholarship-discovery-leads.test.js`. Run these after any change.
- Minified upgrade/feed bundles (`scholarship-finder-upgrade.js`, `education-scholarship-feed.js`, `scholarship-matcher.js`) are built artifacts — edit source, then rebuild; `dist/` copies are generated.
- `_redirects` / `netlify.toml` route `/api/scholarships`; sitemap files are generated (`.claude/rules/seo-pages.md`).
- Netlify publishes `dist/`; changes to functions need a real `build:deploy` (`.claude/rules/netlify-functions.md`).
- The page renders via the `AfroScholarshipFinderUpgradeEnabled` path (upgrade JS), which disables the inline IIFE's event bindings — test live behaviour, not just the inline script.

## Fixes applied 2026-07-14

Edited only `tools/scholarship-finder/index.html` (surgical, non-behavioral for data):

1. **Empty-state icon** (`renderGrid` → `renderEmptyState`) — replaced literal `icon:'0'` with `icon:'🎓'` (rendered in an `aria-hidden` `.apb-empty-icon` span, so decorative-only).
2. **Meta description** (L8) — trimmed to ~154 chars, front-loaded "Scholarships for African students".
3. **JSON-LD** — added `WebApplication` (`applicationCategory: EducationalApplication`, free Offer, AfroTools publisher) and an `ItemList` of the 10 curated fallback scholarships (name + official `url`, reflecting the rendered curated set). Existing `BreadcrumbList` + `FAQPage` untouched; all 4 blocks validated as parseable JSON. Visible FAQ (`<details>` ×3) confirmed matching the FAQPage schema.
4. **H1** — already a single, unique, keyword-rich "Find scholarships open to African students"; left as-is.
5. **Deadline-trust layer** — untouched; `df` blocks and `scholarship-deadline-trust.*` not modified.

Deferred (appended to `_shared-fixes.md`): (a) nationality/country-of-origin eligibility filter; (b) SSR of curated cards; (c) de-duplicating the shared FALLBACK array.
