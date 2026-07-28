# French Free App Parity Ledger

Baseline date: 2026-07-28  
Baseline commit: `8483eaa65e53ad3ce7d0e95e6d119830816de7cf` (`origin/main`)  
Programme status: **0 of 32 categories accepted**

## Goal

Bring the public French product to the same acceptance standard as the English free-app product:

- every free canonical English app has an intentional French counterpart;
- the French app is a real French workflow, not an English iframe or a handoff page;
- calculations and outputs match the accepted English engine for the same fixture;
- labels, errors, results, sharing, PDF/export, privacy text and source warnings are French;
- mobile, dark mode, keyboard, accessibility and console checks pass;
- French SEO, geographic targeting and AI-search discovery are first-class;
- no category is accepted by implication or by registry count.

## Source-of-truth accounting

The release denominator is `data/tool-directory.json`, reconciled with
`assets/js/components/tool-registry.js`.

| Measure | Count | Meaning |
|---|---:|---|
| Canonical published English rows | 1,258 | Current canonical English app inventory |
| Paid canonical rows | 1 | `/pro/`, excluded from this free-app programme |
| **Free canonical English apps** | **1,257** | Programme denominator |
| Expanded English experiences | 2,612 | Country/family instances; not a canonical-app count |
| French registry rows | 1,452 | Discovery records; not completion proof |
| French HTML pages | 3,753 | Physical pages; not completion proof |

An SEO route scan can find 1,262 English-like app URLs because it includes route
aliases and non-directory surfaces. That number is useful for route diagnostics,
but it is not the release denominator.

## Honest structural baseline

| French state | Apps | Share of 1,257 | Completion credit |
|---|---:|---:|---|
| Native French-page candidate | 347 | 27.6% | **Not yet accepted**; requires full workflow proof |
| French page embedding the English app | 442 | 35.2% | No |
| French bridge/handoff to English | 314 | 25.0% | No |
| No mapped French counterpart | 154 | 12.3% | No |

There are **910 definite product-build gaps** before verification even begins.
The remaining 347 native candidates still need app-by-app acceptance. Therefore
the current accepted count is **0/1,257**, not 347/1,257.

## Category baseline

“Native candidate” means the page appears structurally French. It does not mean
the formula, workflow, exports or UX have passed.

| Category | English free apps | Native candidate | English iframe | Bridge/handoff | Missing | Accepted |
|---|---:|---:|---:|---:|---:|---:|
| Diaspora | 2 | 0 | 0 | 1 | 1 | 0 |
| Career & Development | 4 | 0 | 2 | 2 | 0 | 0 |
| Security & Safety | 7 | 0 | 0 | 7 | 0 | 0 |
| Personal Finance | 5 | 0 | 0 | 5 | 0 | 0 |
| Small Business & SME | 28 | 0 | 0 | 26 | 2 | 0 |
| Fintech & Banking | 31 | 0 | 9 | 19 | 3 | 0 |
| Finance, Tax & Market Data | 132 | 121 | 3 | 6 | 2 | 0 |
| HR & Payroll | 6 | 0 | 0 | 6 | 0 | 0 |
| VAT & Business Tax | 63 | 62 | 0 | 0 | 1 | 0 |
| Document & PDF | 32 | 2 | 26 | 4 | 0 | 0 |
| Image & Design | 19 | 19 | 0 | 0 | 0 | 0 |
| Developer Tools | 32 | 17 | 8 | 6 | 1 | 0 |
| Education | 42 | 18 | 7 | 16 | 1 | 0 |
| Health & Wellness | 42 | 2 | 16 | 24 | 0 | 0 |
| Language & Translation | 11 | 9 | 2 | 0 | 0 | 0 |
| Agriculture | 447 | 3 | 328 | 0 | 116 | 0 |
| Transport & Logistics | 18 | 1 | 1 | 12 | 4 | 0 |
| Trade & Import | 22 | 11 | 8 | 3 | 0 | 0 |
| Government & Civic | 15 | 1 | 0 | 14 | 0 | 0 |
| Insurance | 16 | 4 | 0 | 12 | 0 | 0 |
| Mortgage & Property | 66 | 25 | 8 | 29 | 4 | 0 |
| Engineering & Construction | 26 | 15 | 0 | 6 | 5 | 0 |
| Climate & Environment | 13 | 0 | 0 | 13 | 0 | 0 |
| Mining & Extractives | 6 | 0 | 0 | 0 | 6 | 0 |
| Creative Economy | 46 | 0 | 7 | 37 | 2 | 0 |
| Sports & Entertainment | 15 | 0 | 0 | 15 | 0 | 0 |
| Travel & Tourism | 9 | 0 | 0 | 7 | 2 | 0 |
| Uniquely African | 34 | 16 | 13 | 5 | 0 | 0 |
| Religious & Cultural | 22 | 2 | 0 | 20 | 0 | 0 |
| Business & ROI | 12 | 8 | 4 | 0 | 0 | 0 |
| Telecom & Mobile | 14 | 10 | 0 | 0 | 4 | 0 |
| Energy & Utilities | 20 | 1 | 0 | 19 | 0 | 0 |
| **Total** | **1,257** | **347** | **442** | **314** | **154** | **0** |

## Discovery and navigation baseline

French discovery is not yet a coherent 32-category product:

- the live French category directory presents 12 categories while English has 32;
- 15 French category URLs currently serve an English hub with an English
  canonical instead of a real French hub;
- the French all-tools directory mixes French and English controls and exposes
  conflicting counts;
- 755 weak routes in `sitemap-fr.xml` are English iframes or generated handoff
  shells;
- 33 French-only routes, 79 aliases and 12 duplicate English mappings need an
  explicit owner decision;
- 40 English `app.html` workspaces exist, but only seven have French
  counterparts; indexability policy is inconsistent.

The 15 false French hub surfaces are Government, Small Business, Engineering,
Insurance, Fintech, HR & Payroll, Personal Finance, Diaspora,
Religious & Cultural, Climate, Sports, Mining, Creative, Security and Career.

## SEO, GEO and AI-search baseline

Basic tag presence is generally strong. Content quality and French discovery are
not yet at the English standard.

| Signal | Current finding |
|---|---:|
| Effectively indexable French pages | about 3,630 |
| Indexable pages without a static H1 | 623 |
| Indexable pages with fewer than 150 static words | 1,398 |
| Pages linking into English surfaces | 2,168 |
| Pages with at least three French internal links | 1,068 |
| Pages with any external citation | 276 |
| Pages with a freshness signal | 1,408 |
| Pages with valid schema `inLanguage: "fr"` | 2,221 |
| Pages with invalid URL-valued `inLanguage` | 789 |
| Pages with no schema `inLanguage` | 634 |
| Long titles over 65 characters | 724 |
| Long descriptions over 165 characters | 391 |
| Generic template descriptions | 295 |
| Descriptions with English-product signals | 189 |
| French URLs in `llms.txt` / `llms-full.txt` | 0 / 0 |
| French query markers in 206 router/eval prompts | 0 |

Passing `validate:hreflang` proves declared syntax, not semantic country
equivalence. Current generated agriculture mappings include country errors such
as Burundi, Kenya and Senegal alternates pointing to Algeria.

## P0 correctness findings

These defects block category acceptance even before full sampling:

1. `/fr/tools/risque-paludisme/` uses a homemade geographic risk score and can
   show reassuring risk labels. The accepted English product uses a safer
   deterministic testing-urgency workflow and emergency hierarchy. French must
   reuse that engine and safety contract.
2. French Senegal salary/PAYE currently exposes stale contribution and tax
   assumptions, an unsupported salary AI flow and an email-gated PDF. The
   underlying shared English route also needs correction, so the source owner
   must be fixed once and both locales proved.
3. PDF, invoice, medical-report, transcription and many agriculture routes
   present English interfaces inside French pages.
4. Some nominally native routes fetch English HTML at runtime. One electrical
   load route omits dependencies and points to a non-existent French fallback.
5. `evaluateur-offre-emploi-fr` points to the wrong `africa-tools.com` domain.
6. Existing French Playwright expectations are stale and do not prove the
   1,257-app contract.

## Why the old numbers looked better

The current French generators intentionally create two kinds of incomplete
surface:

- `iframeEmbed` pages mount `/tools/{english-slug}/`;
- `handoffOnly` pages provide French preparation copy and send the user to the
  English tool.

Those routes increased page totals, sitemap entries and registry coverage
without delivering native app parity. The checked-in French ledger is also
stale and its current checks measure a maintained sample rather than every app.

## App acceptance contract

An app receives French completion credit only when all applicable checks pass.

### Product and calculation

- real French workflow, with no silent English iframe, transplant or handoff;
- same engine or documented equivalent to the accepted English owner;
- identical output for shared deterministic fixtures;
- French labels, help, validation, errors, results and empty states;
- all intended in-app features work;
- reset, copy, share, save and local draft behavior works;
- PDF, print, CSV, JSON, image or document exports work and reopen correctly;
- local-first and consent behavior matches the English privacy contract;
- official sources, checked date, assumptions, confidence and planning warnings
  appear where the answer can change.

### UX and accessibility

- 320px and 375px layouts without horizontal overflow;
- 200% reflow without clipped controls;
- light mode, manual dark mode and system dark mode;
- keyboard completion, visible focus and correct accessible names;
- status/error messages use appropriate live regions;
- no blocking console or network errors;
- French typography, accents, punctuation and spacing are reviewed by a human.

### SEO, GEO and AI discovery

- native French title, description, H1 and answer-first summary;
- self canonical, reciprocal semantic hreflang and aligned OG URL;
- valid `inLanguage: "fr"` and visible content matching any FAQ schema;
- correct sitemap/indexability decision;
- at least three relevant French internal links;
- no generic generated description or unlabelled English fallback;
- named sources and freshness where factual claims can change;
- French AI/LLM catalog entry;
- French intent fixture resolves to the correct route.

### Evidence

- per-app route and English owner recorded;
- source files and generated owners recorded separately;
- focused automated test result recorded;
- browser proof recorded;
- known limitations recorded;
- category accepted only when every canonical app row has evidence.

## Execution order

### Foundation wave — no category credit

1. Make this 1,257-row ledger machine-checkable.
2. Classify every French counterpart as native, iframe, bridge, missing, alias
   or non-indexable utility.
3. Fix generator ownership and semantic country mapping before generating more
   pages.
4. Correct French directory/category counts and the 15 false French hubs.
5. Remove weak iframe/handoff shells from completion accounting and decide
   whether they should be `noindex` until replaced.
6. Add acceptance tests that fail when an iframe or bridge is marked complete.

### Product Wave 1

Run three serialized integration lanes:

1. **Safety and money correctness:** malaria/medical safety, Senegal and Côte
   d’Ivoire payroll, VAT, employer cost, invoicing and currency workflows.
2. **French discovery and UI foundation:** homepage, all-tools, categories,
   language selector, shared French navigation, hubs and internal links.
3. **SEO/GEO/AI foundation:** schema language, semantic hreflang, French LLM
   directory, router lexicon/evals, source/freshness blocks and metadata owners.

The stale French Wave 1 PR must be salvaged file-by-file. It is not safe to
merge as a 10,000-page generated diff.

### Category waves

After the foundation gates pass, work category-by-category and app-by-app. Use
parallel worktrees for independent categories, but merge shared generators,
registries, route maps and SEO outputs through one coordinator.

Agriculture must be divided into country/family sub-waves because its 447 apps
cannot honestly receive one-day category credit.

## Verification commands

Minimum programme-level gates:

```text
npm run fr:surface:check
npm run fr:tools:verify-gap-pages
npm run build:i18n:validate
npm run validate:hreflang
npm run localization:check
npm run test:localization
npm run seo:report
npm run check-links
npm run audit
npm run category-workflow:verify
npm run pdf:verify
npm run test:privacy-ai-consent
npm run lint
npm run type-check
git diff --check
```

Focused browser tests and same-fixture output oracles are still required for
each accepted app. A green sitewide command alone cannot grant app credit.

## Current proof boundary

This baseline is a read-only structural, source, SEO and representative-browser
audit of the exact commit above. No French app has yet received full acceptance
under this ledger. No source changes, generated rebuild, merge or deployment are
claimed by this baseline.
