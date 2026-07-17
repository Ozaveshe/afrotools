# Swahili Release Candidate Proof

Date: 2026-05-16

Prompt: 119 - Swahili Release Candidate Proof Pass

## Verdict

Swahili release candidate with carried debt.

The Swahili beta surface is not blocked. The only failing command in the proof stack is `git diff --check`, and the current failure is an unrelated Hausa report EOF blank-line issue. The Swahili release surface has 0 broken Swahili registry hrefs, 0 broken internal links by `check-links`, and 0 hreflang warnings after the captured full i18n build.

## Proof Stack

| Command | Result | Notes |
| --- | --- | --- |
| `npm run build:i18n:full` | passed | Captured rerun completed in about 304s. Built 20 French pages, 0 Swahili pages, generated `sitemap-i18n.xml`, injected hreflang, fixed reciprocity, and validated hreflang with 0 errors. |
| `npm run validate:hreflang` | passed | 7861 pages scanned, 7859 pages with hreflang tags, 19946 pairs, 0 errors. |
| `npm run check-links` | passed | 8494 HTML files, 80958 internal links, 0 broken internal links. |
| `npm run audit` | passed | 2394 registry rows, 2389 live/new rows with pages, 0 missing pages. |
| `npm run seo:report` | passed with carried candidates | 20 JSON-LD auto-fix candidates, all previously classified as French/non-Swahili. 0 missing canonical/title/meta descriptions and 0 hreflang violations. |
| `git diff --check` | failed, unrelated | `reports/hausa-visible-copy-ledger.md:160: new blank line at EOF`; CRLF warning on `docs/MOBILE-FIRST-STANDARDS.md`. Not a Swahili blocker. |

## Recomputed Metrics

- Total Swahili HTML routes: `852`.
- Indexable Swahili routes: `850`.
- Noindex Swahili routes: `2`.
- Direct one-level `/sw/zana/` routes: `465`.
- Unique Swahili registry hrefs: `700`.
- Resolving Swahili registry hrefs: `700/700`.
- Broken Swahili registry hrefs: `0`.
- Unique `/sw/zana/` registry hrefs, including nested TIN routes: `469`.
- Resolving `/sw/zana/` registry hrefs: `469/469`.
- Broken `/sw/zana/` registry hrefs: `0`.
- Direct one-level `/sw/zana/` registry hrefs: `415`.
- Resolving direct `/sw/zana/` registry hrefs: `415/415`.
- Direct `/sw/zana/` registry coverage: `415/465`, or `89.25%`.
- Hreflang warnings after full build: `0`.
- Broken internal links by `check-links`: `0`.
- Search QA status: `21` query buckets reviewed in Prompt 117; `0` broken or English-only results reported.

## What Improved

- Search now leads with Swahili hubs for `mshahara`, `kazi`, `ujenzi`, `internet`, `tafsiri`, `mkopo`, and `sarafu`.
- Registry coverage increased through Wave 9 without adding broken Swahili hrefs.
- The full i18n build cleared the previously carried French/blog hreflang warnings in the validator output.
- Blog/API bridge debt is explicit and routed to Swahili fallback surfaces.
- Specialist-risk pages are separated from promotion candidates.

## Carried Debt

- Specialist queue remains active: `22` routes across health, religious/cultural, legal, education, HR, government-admin, and finance risk categories.
- `npm run seo:report` still reports `20` JSON-LD auto-fix candidates, but Prompt 103 classified them as French/non-Swahili.
- Source-layer migration remains blocked: dry-run route planning is alias-aware, but real Swahili page-pack writes are not yet safe.
- Blog/API bridges intentionally retain English-only destinations for article/API docs/pricing links.
- Dirty-tree non-Swahili debt remains broad, including French, Hausa, cars, generated output, and reports.
- `git diff --check` currently fails on `reports/hausa-visible-copy-ledger.md`, not on a Swahili release file.

## Swahili Blocker Assessment

No Swahili release blocker found.

The release candidate should not be called clean because the checkout is dirty and `git diff --check` is red, but the red proof is unrelated to the Swahili release surface. Treat this as Swahili release candidate with carried debt.
