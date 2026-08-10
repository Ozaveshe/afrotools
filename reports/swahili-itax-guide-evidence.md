# Swahili iTax Guide parity evidence

Checked: 2026-08-09

Frozen lane base: `009ef9185cecf32b239f057a28212499d6f3f984`

English id: `itax-guide`

## Route ownership

- Authoritative English owner: `/tools/itax-guide/` (`tools/itax-guide/index.html`).
- Exact native Swahili owner: `/sw/zana/mwongozo-wa-itax/` (`sw/zana/mwongozo-wa-itax/index.html`). The route had no physical page on the frozen base.
- Existing French owner: `/fr/tools/guide-d-itax-de-la-kra/`.
- English, French, and Swahili owners declare the same reciprocal English/French/Swahili/x-default cluster. The English route remains x-default.
- The Swahili page uses the same real `assets/img/og-default.png` social image as the English guide; no missing or fabricated artwork path was introduced.

## Product contract

This is an independent preparation guide, not a calculator and not a KRA integration. It never signs in, files a return, pays tax, accesses an account, or collects a PIN, password, OTP, ID number, income, or tax record.

The native workspace covers six exact guide tasks:

1. PIN registration.
2. Login or account recovery.
3. Return preparation.
4. NIL-return eligibility check.
5. Previous-return retrieval.
6. Official KRA support.

For each task the DOM-free engine produces a four-step checklist, official route, source-review state, privacy boundary, and fail-closed reasons. The UI supports local save/load, reset, progress tracking, copy, JSON/TXT/PDF export, and JSON import/reopen. Primary exports are ungated and local. There is no AI or other network send.

NIL preparation stops when the active obligation is unknown, when `PIN Without Obligation` is selected, or when no-income status is unconfirmed. Source-dependent output expires 90 days after the reviewed date unless the user confirms they reopened the current official pages.

## Official source review

All facts were rechecked against Kenya Revenue Authority primary pages on 2026-08-09:

- Current return-filing guidance: https://www.kra.go.ke/file-my-returns
- PIN and PIN Without Obligation distinction: https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin
- Individual PIN registration steps: https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/how-to-register-for-a-kra-pin-individual
- PIN registration requirements: https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/requirements-for-kra-pin-registration
- Filing-return FAQ: https://www.kra.go.ke/helping-tax-payers/faqs/filing-returns-on-itax
- Official iTax portal: https://itax.kra.go.ke/KRA-Portal/

The corrected contract distinguishes a PIN with an active Income Tax obligation from a PIN Without Obligation. It does not repeat the unsafe blanket claim that every PIN holder must file a return or NIL return.

## Surface preservation

| Surface | Bytes | Visible words | H2 | H3 | Controls | Actions | Links |
|---|---:|---:|---:|---:|---:|---:|---:|
| English frozen owner | 21,417 | 833 | 5 | 8 | 0 | 0 | 24 |
| English repaired owner | 26,344 | 1,021 | 6 | 9 | 20 | 8 | 26 |
| Native Swahili owner | 15,298 | 825 | 5 | 8 | 20 | 8 | 17 |

The English guide was expanded in place: its existing editorial guide, FAQ/schema, internal links, and official-source panel remain. The native Swahili owner reproduces the six-task guide and full interactive workflow without an iframe or English runtime transplant.

## Proof

- `node --test tests/itax-guide-parity.test.js`: **7/7 passed**.
- `node scripts/build-source-registry.js --only-source-ids=kra-itax-guide-source --as-of=2026-08-09 --check`: **passed**.
- `node scripts/build-i18n.js --validate`: **French, Swahili, Yoruba, and Hausa key contracts passed**.
- `npm run lint`: **passed**.
- `npm run type-check`: **passed**.
- `tests/e2e/sw-itax-guide.spec.js`, Chromium, one worker: **5/5 passed**.
  - Full English and Swahili preparation workflows.
  - JSON parsed and reopened with completed checklist state preserved.
  - TXT decoded and content-checked.
  - PDF signature and extracted text parsed with `pdf-parse`.
  - NIL/PWO/unknown-obligation fail-closed behavior.
  - Local save/load.
  - No unexpected network egress, console errors, or page errors.
  - 320px and 375px, 200% root text, light/dark themes, reduced motion, keyboard focus, accessible control names, and no horizontal overflow.
- `git diff --check`: **passed**.
- `git diff --diff-filter=D --summary`: **zero physical deletions**.

## Scope boundary

No coordinator acceptance ledger, AI route map, locale coverage artifact, sitemap, redirect, service worker, broad generated output, push, PR, merge, deploy, Supabase state, or live system was changed. Central locale coverage will be reconciled by the coordinator after lane integration.
