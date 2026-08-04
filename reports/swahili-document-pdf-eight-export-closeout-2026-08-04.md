# Swahili Document/PDF eight-export closeout

Date: 2026-08-04

Scope: the eight previously blocked export owners only. No route, registry, locale coverage, AI routing, sitemap, redirect, deployment, or product-engine source was changed.

## Acceptance

Accepted: 8/8. Blocked: 0/8.

| Owner | Swahili route | Parsed or reopened proof | Download contract |
| --- | --- | --- | --- |
| `pdf-merge-split` | `/sw/zana/unganisha-na-gawanya-pdf/` | merged PDF and ZIP containing two reopened PDFs | free account |
| `pdf-watermark` | `/sw/zana/watermark-pdf/` | changed PDF and ZIP containing reopened PDFs | free account |
| `pdf-page-numbers` | `/sw/zana/namba-za-kurasa-pdf/` | changed PDF and ZIP containing reopened PDFs | free account |
| `pdf-redact` | `/sw/zana/kuficha-taarifa-pdf/` | changed flattened PDF reopened after full-page redaction | free account |
| `pdf-header-footer` | `/sw/zana/kichwa-na-kijachini-pdf/` | PDF reopened and configured header/footer text recovered | free account |
| `pdf-to-audio` | `/sw/zana/pdf-kwenda-sauti/` | truthful local TXT output parsed; no nonexistent audio download claimed | free account |
| `pdf-bates` | `/sw/zana/namba-bates-pdf/` | changed PDF, ZIP containing reopened PDFs, and parsed CSV manifest | free account |
| `invoice-generator` | `/sw/zana/kizalishaji-ankara/` | synthetic invoice PDF reopened; sensitive guest export remained ungated | sensitive guest |

Every route receipt records `status: accepted`, no missing advertised format, and no raw synthetic fixture leak.

## Verifier repairs

- The route-isolated export test now waits for disabled asynchronous PDF actions and activates hydration-sensitive controls by keyboard. This avoids clicking an action node that late localization replaces after upload while still exercising the public control.
- The visual verifier now recognizes the owned accessibility stylesheet when its URL contains the repository's cache-busting query string.

No calculator, PDF engine, export engine, or public route source needed a product change.

## Verification

Passed:

- Eight independent route-isolated export runs: 8/8; each run parsed or reopened every advertised format.
- `SW_DOCUMENT_PDF_IDS=<eight owners> npx playwright test tests/e2e/swahili-document-pdf-visual-contract.spec.js --project=chromium --workers=1 --trace=off`: 8/8. This covered four light/dark modes, real keyboard traversal, visible text/control/focus contrast, and 320px/375px at 200% reflow.
- `npx playwright test tests/e2e/swahili-document-pdf-gate-contract.spec.js --project=chromium --workers=1 --trace=off`: 2/2. Guest merge/split downloads were blocked; a registered runtime downloaded a parsed merged PDF and a ZIP with reopened PDF members.
- `node scripts/build-swahili-document-pdf-parity.js --check`: 31/31 owner rows reconciled.
- `npm run pdf:verify`: 31 registry tools and 34 surfaces passed.
- `npm run document-pdf:verify`: passed.
- `npm run test:privacy-ai-consent`: 3/3 browser cases plus server contract passed.
- `npm run validate:hreflang`: 11,288 pages, 33,400 relationships, 5,351 equivalence groups; reciprocal and locale-correct.
- `npm run lint`: passed.
- `npm run type-check`: passed.

## Carried shared blockers

- The full 32-route visual receipt cannot be regenerated on this branch because the Swahili Document/PDF hub currently loads the accessibility stylesheet twice. The eight scoped routes independently passed the exhaustive visual contract. The existing 32-route receipt was restored rather than overwritten with a false blocked aggregate.
- The broader parity suite detects Google Tag Manager/Analytics requests after the test records declined consent. No synthetic document marker appeared in console or network traffic, and all export-specific privacy checks passed. This is a shared analytics-consent regression, not an eight-route export failure, and requires coordinator-level remediation.
- `node scripts/build-swahili-document-pdf-export-receipts.js --write` remains fail-closed because the full-surface 32-route visual digest is stale; no aggregate acceptance file was rewritten.

## Scope integrity

- Zero physical deletions.
- No English, French, Hausa, Yoruba, or other Swahili product page changed.
- No central registry, localization coverage, AI manifest, sitemap, redirect, `dist`, or deployment output changed.
