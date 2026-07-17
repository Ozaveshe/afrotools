# Swahili Blog Bridge Content Plan - 2026-05-17

Prompt 130 is plan-only. No website pages were edited.

## Recommendation

The Swahili blog bridge should begin with small evergreen explainers tied to existing Swahili tools and hubs. It should not convert current-rate or official-tax articles into static Swahili pages unless the source data and update workflow are clear.

Recommended first batch:

- `/sw/blogu/kupanga-mavuno-ya-mazao-kwa-kikokotoo/`
- `/sw/blogu/ada-za-pesa-simu-afrika/`

These are lower-risk than current exchange rates or country tax tables because they can be framed as planning support rather than live official data.

## Priority Items

| English source | Current Swahili fallback | Recommendation | Target Swahili slug | Risk |
| --- | --- | --- | --- | --- |
| `/blog/how-to-calculate-paye-nigeria-2026/` | `/sw/nigeria/kikokotoo-kodi-mshahara/` | Swahili FAQ/explainer | `/sw/blogu/jinsi-ya-kutumia-kikokotoo-cha-paye-nigeria/` | Medium |
| `/blog/kenya-paye-calculator-guide-2025/` | `/sw/kenya/kikokotoo-kodi-mshahara/` | Swahili FAQ/explainer | `/sw/blogu/mwongozo-wa-kikokotoo-cha-paye-kenya/` | Medium |
| `/blog/vat-rates-africa-2026/` | `/sw/zana/kikokotoo-vat/` | Swahili FAQ/explainer | `/sw/blogu/jinsi-ya-kutumia-kikokotoo-cha-vat-afrika/` | Medium |
| `/blog/mobile-money-fees-africa-compared/` | `/sw/fintech/` | Swahili static explainer | `/sw/blogu/ada-za-pesa-simu-afrika/` | Low-medium |
| `/blog/salary-after-tax-nigeria/` | `/sw/mshahara-na-kodi/` | Swahili FAQ/explainer | `/sw/blogu/mshahara-baada-ya-kodi-nigeria/` | Medium |
| `/blog/dollar-to-naira-rate-today/` | `/sw/sarafu/` | Keep English-only bridge | None | High |
| `/blog/crop-yield-calculator-african-farming/` | `/sw/kilimo/` | Swahili static explainer | `/sw/blogu/kupanga-mavuno-ya-mazao-kwa-kikokotoo/` | Low |

## Validation Needed

When a stub is created, run:

- `npm run check-links`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run seo:report`

Each stub should link to an existing Swahili tool or hub first, and it should say clearly when an English source article remains the deeper reference.
