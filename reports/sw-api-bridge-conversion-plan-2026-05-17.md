# Swahili API Bridge Conversion Plan - 2026-05-17

Prompt 132 is plan-only. No website pages were edited.

## Current State

`/sw/api/` is already an honest bridge: it explains that the full API docs and pricing pages remain English-only, while local developer tools remain available in Swahili. The right next step is not a full docs translation. The safe next step is a stronger Swahili overview on the existing `/sw/api/` page.

Important route detail: pricing is the `.html` backed route `/api/pricing`, with source file `api/pricing.html`.

## Recommended Content

| Content | File | Priority | Risk | Notes |
| --- | --- | --- | --- | --- |
| Swahili API overview bridge | `sw/api/index.html` | First | Low | Clarify API purpose, docs/pricing boundaries, local browser utilities, and production cautions. |
| Pricing explainer | Section inside `sw/api/index.html` or later stub | Second | Medium | Explain free key, paid pilots, rate limits and billing terms, but send final verification to `/api/pricing`. |
| Authentication glossary | Section inside `sw/api/index.html` | Second | Low-medium | Define API key, token, endpoint, header, request, response, JSON, webhook, SDK and rate limit. |
| Example request glossary | Later | Medium | Only after confirming endpoint examples against `/api/docs/`. |
| Full docs translation | None in this wave | High | Needs a dedicated API-doc localization plan and source ownership. |

## Prompt 133 Recommendation

Upgrade `sw/api/index.html` only. Do not create a second API overview page yet, and do not translate `/api/docs/` or `/api/pricing`.

Validation for the next implementation:

- `npm run check-links`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run seo:report`
