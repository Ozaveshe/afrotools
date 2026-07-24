# Day 4 Document & PDF VIP receipt

Branch: `codex/day4-document-pdf`

Baseline SHA: `4544d89142efdbd1eeb67e5f4a30e5d1696f16b4`

Scope: `/document-pdf/` plus 31 English canonical free app routes. Paid `/pro/` apps and localized output routes are excluded.

## Inventory reconciliation

- Registry: 32 English `document-pdf` rows, consisting of 31 `/tools/` apps plus the `/document-pdf/` hub row.
- Hub ItemList: 31 app entries.
- Local route existence: 31/31 app routes present.
- Hub catalog: eight popular tools render initially; filters and search expose all 31 when JavaScript is available.
- No-JavaScript baseline defect: the catalog container was empty even though the page advertised 31 tools.
- Hub repair: a complete 31-link `<noscript>` catalog now preserves user access and crawlable route discovery without changing the interactive registry-backed catalog.
- Post-repair browser proof: the no-JavaScript catalog exposes 31 links with 31 unique `href` values; JavaScript mode renders 8 Popular cards and exactly 31 cards after selecting All 31.

## Acceptance dimensions

Each route is reviewed for:

- responsive rendering at 320, 360, 375, and 768 CSS pixels;
- manual and operating-system dark mode;
- canonical, title, description, structured data, and AI-search contract;
- primary workflow, invalid input, empty state, stale state, and export state;
- local-file privacy, network boundaries, logging, storage, and explicit AI consent;
- generated PDF or document validity, parser/reopen proof where applicable;
- labels, keyboard flow, focus, live status, contrast, and 44px primary controls;
- performance, offline/degraded behavior, console errors, and unexpected network requests.

## Serial route ledger

| Route | Inventory | Review state | Improvement or no-change evidence |
| --- | --- | --- | --- |
| `/document-pdf/` | Hub; 31 ItemList entries | IMPROVED | Added a semantic, compact 31-link no-JS catalog; raised all six filter buttons from 38px to 44px. Browser proof: 31 unique no-JS routes, 8 Popular/31 All interactive cards, one H1, no horizontal overflow at 320/360/375/768/1440, and no local console/network failures. |
| `/tools/pdf-workspace/` | Canonical app | IMPROVED | Added the missing main landmark and command-search accessible name; shortened the title from 70 to 54 characters and description from 164 to 159; raised Fast Start, AI helper, disabled-consent, and mobile controls to 44px; repaired severe light-card/dark-text conflicts in system/manual dark mode. Browser proof at 320/360/375/768/1440: one H1/main, no overflow or local errors, 200% text reflow clean. Removed the account/email gate from the primary local export. A signed-out user downloaded a 737-byte PDF with no modal, registration, email capture, or document-content request; it reopened as one page. The local helper also remained usable after going offline. |
| `/tools/pdf-merge-split/` | Canonical app | IMPROVED | Added the missing main landmark; shortened the 66-character title to 43; repaired severe dark-mode contrast in the hero, workflow cards, upload target, result/download state, tips, and FAQ. At 320/360/375/768/1440, including dark and 200% text stress: one H1/main, no overflow, local errors, or document-content requests. Removed the account/email gate. A signed-out user merged two distinct synthetic PDFs, downloaded the 1,493-byte two-page result without a modal or capture, and reopened it as exactly two pages. Invalid `2-1` on a one-page input remained disabled with the visible “Pages must be between 1 and 1” error. |
| `/tools/pdf-compress/` | Canonical app | IMPROVED | Added the missing main landmark; shortened the title from 62 to 37 characters; repaired dark-mode hero, workflow, upload, guidance, and FAQ contrast. Responsive + 200% text proof at 320/360/375/768/1440: one H1/main, no overflow or local errors. Removed the account/email gate. Clean mode reduced the synthetic one-page fixture from 599 B to 591 B; a signed-out user downloaded it without a modal, capture, or document-content request, and it reopened as one page. |
| `/tools/pdf-image-convert/` | Canonical app | IMPROVED | Added the missing main landmark and repaired dark hero/badge contrast without changing the already concise 58-character title. At 320/360/375/768/1440 plus 200% text stress: one H1/main, no overflow or local errors. Removed the account/email gate. A signed-out user rendered the synthetic PDF to a valid 12,819-byte PNG (`89504e470d0a1a0a` signature) without a modal, capture, or document-content request. The two-way test converted that PNG back to a 5,433-byte PDF, which reopened as one page. |
| `/tools/pdf-watermark/` | Canonical app | IMPROVED | Existing title (59), description (150), main landmark, labels, and canonical were retained. Repaired dark-mode hero/badge contrast plus previously unreadable field labels, values, preview status, guidance, and result/download states. At 320/360/375/768/1440 plus 200% text stress: one H1/main, no overflow or local errors. Removed the account/email gate. A signed-out user applied the default text watermark and downloaded a 1,089-byte PDF without a modal, capture, or document-content request; it reopened as one page. Page `2` against a one-page PDF correctly failed with a visible out-of-range error. |
| `/tools/pdf-password/` | Canonical app | IMPROVED | Retained the concise SEO metadata, single H1/main, real labels, and canonical; repaired severe dark-mode hero, badge, field-label, hint, security-card, and list contrast. Removed the account/email gate from the primary local export and aligned the verification copy. With a strict PDFLib-generated fixture, a signed-out user created a 2,299-byte AES-256 protected PDF and then unlocked it to a 1,442-byte PDF; no modal, registration, email capture, document-content request, console error, or unnamed control appeared, and the unlocked file reopened as exactly one page. A mismatched confirmation produced “Password confirmation does not match”; a wrong unlock password produced no download action. Browser proof at 375px dark mode and 200% text: no horizontal overflow. |
| `/tools/pdf-page-numbers/` | Canonical app | PENDING | |
| `/tools/pdf-sign/` | Canonical app | PENDING | |
| `/tools/pdf-ocr/` | Canonical app | PENDING | |
| `/tools/pdf-form-filler/` | Canonical app | PENDING | |
| `/tools/pdf-redact/` | Canonical app | PENDING | |
| `/tools/pdf-header-footer/` | Canonical app | PENDING | |
| `/tools/pdf-editor/` | Canonical app | PENDING | |
| `/tools/pdf-convert/` | Canonical app | PENDING | |
| `/tools/pdf-reorder/` | Canonical app | PENDING | |
| `/tools/pdf-chat/` | Canonical app | PENDING | |
| `/tools/pdf-translate/` | Canonical app | PENDING | |
| `/tools/pdf-compare/` | Canonical app | PENDING | |
| `/tools/pdf-to-audio/` | Canonical app | PENDING | |
| `/tools/pdf-bates/` | Canonical app | PENDING | |
| `/tools/html-to-pdf/` | Canonical app | PENDING | |
| `/tools/pdf-find-replace/` | Canonical app | PENDING | |
| `/tools/pdf-repair/` | Canonical app | PENDING | |
| `/tools/pdf-workflow/` | Canonical app | PENDING | |
| `/tools/cv-builder/` | Canonical app | PENDING | Confirmed baseline defect: two `h1` elements; repair in serial pass. |
| `/tools/invoice-generator/` | Canonical app | PENDING | |
| `/tools/cover-letter-generator/` | Canonical app | PENDING | |
| `/tools/meeting-minutes/` | Canonical app | PENDING | |
| `/tools/receipt-generator/` | Canonical app | PENDING | |
| `/tools/business-plan/` | Canonical app | PENDING | |
| `/tools/freelance-invoice/` | Canonical app | PENDING | |

## Evidence locations

- Hub before screenshots: `artifacts/day4-document-pdf/hub-before/`
- Hub after screenshots: `artifacts/day4-document-pdf/hub-after/`
- Per-app screenshots: `artifacts/day4-document-pdf/apps/`
- Hub workflow contract: `npm run document-pdf:verify` — PASS (31 registry tools, report sync, public planner boundary, dashboard workspace).
- PDF gate/category contract: `npm run pdf:verify` — PASS (31 registry tools, 34 HTML/app surfaces, gate coverage).
- PDF Workspace AI/privacy contracts: `node tests/ai-pdf-workspace-assist.test.js` and `node tests/ai-consent-server.test.js` — PASS.
- Source whitespace: `git diff --check` — PASS.

## Remaining risks

- Serial app audit is in progress.
- Export parser/reopen evidence must be recorded per app; a browser download event alone is not sufficient.
- Every export-capable app requires explicit signed-out direct-download proof with no modal, registration, email capture, document-content request, or parser/reopen failure.
