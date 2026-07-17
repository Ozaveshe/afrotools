# Change Classification V2

Capture date: 2026-05-19

## Baseline Result

The v2 sprint started from a clean checkout in `C:\Users\Oza\Documents\afrotools`.

- `git status --short`: 0 pre-existing dirty entries.
- `git diff --stat`: no pre-existing source diff.
- `git diff --name-only`: no pre-existing modified tracked files.
- `git diff --check`: passed with no whitespace errors.

This differs from the earlier release-readiness pass cited in the prompt. The earlier 1,811 dirty entries were not present in this checkout at v2 start.

## Current Dirty Status Capture

`audit-results/git-status-after-v2.txt` captured 8,506 dirty entries after this repair sprint, required build/regeneration commands, and final v2 audit report creation.

Top path groups in that capture:

| Path group | Entries | Classification |
|---|---:|---|
| `tools/` | 2,513 | Mostly generated/post-processed HTML plus a small number of direct tool fixes |
| `fr/` | 1,704 | Localization and hreflang reciprocity output |
| `cars/` | 1,582 | Generated/post-processed page output |
| `sw/` | 854 | Localization and hreflang reciprocity output |
| `agriculture/` | 645 | Generated/post-processed page output |
| `jamb/` | 255 | Generated/post-processed page output |
| `blog/` | 193 | Generated/post-processed output plus a few direct copy edits |
| `widgets/` | 141 | Generated/post-processed output |
| `ha/` | 92 | Localization and hreflang reciprocity output |
| `audit-results/` | 65 | Required audit evidence |
| `yo/` | 45 | Localization and hreflang reciprocity output |
| `pro/` | 31 | Generated/post-processed output; remaining mobile risk family |
| `docs/` | 20 | Generated/post-processed or report-adjacent output |
| `assets/` | 10 | Shared CSS/JS source and minified assets |
| `reports/` | 4 | Generated audit reports |

## Release Classification

| Category | Keep / revert / regenerate / review | Notes |
|---|---|---|
| Source code changes | Keep, but review separately | Includes shared CSS/theme fixes, copy scanner, dark-mode audit script, tool-functionality audit script, Playwright product-quality tests, and targeted tool/page fixes. |
| Content changes | Keep after editorial review | Homepage, AfroPrices, agent commission, and two blog copy edits remove hype language and make user-facing copy clearer. |
| Generated build output | Regenerate in a clean release branch before commit | `npm run build:deploy`, sitemap generation, cache-busting, related-tool data, hreflang reciprocity, and minification changed thousands of HTML/static files. These are expected generated outputs, not hand-authored edits. |
| Audit output | Keep for this sprint; exclude from production deploy unless the repo intentionally tracks audit evidence | All `audit-results/*v2*` files are required deliverables for this pass. |
| Localization files | Keep only the hreflang reciprocity output that the release process expects | `node scripts/fix-hreflang-reciprocity.js` added 836 reciprocal tags across 791 files and reduced hreflang warnings from 836 to 0. This is valuable but creates broad generated churn. |
| Accidental or suspicious changes | Review manually before shipping | No malicious or obviously accidental edits were found, but the dirty tree is too large to ship without splitting source fixes from generated output. |
| Unrelated changes outside this release | None pre-existing | The checkout was clean at v2 start. Any current dirty entries came from this sprint, build regeneration, or required audit outputs. |

## Hygiene Decision

Do not ship this dirty tree as-is. The safe release path is:

1. Review and commit the small source/test/script/content fixes first.
2. Regenerate build/i18n/hreflang/sitemaps from that source in a clean release branch.
3. Decide explicitly whether generated HTML and deploy artifacts belong in the release commit.
4. Keep audit artifacts out of the public deploy surface.
5. Treat the remaining 614 mobile issue-bearing pages and mobile network WARN as product blockers, not release trivia.
