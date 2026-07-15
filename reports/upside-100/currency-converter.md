# Currency Converter (AfroFX) — upside-100

## Fixes applied 2026-07-14

- **Meta description**: replaced the 209-char over-length description with a 151-char version containing all four flagged African currency keywords (Naira, Cedi, Shilling, Rand): "Convert 42 African currencies with the latest rates: Naira, Cedi, Shilling, Rand and more. Free forex dashboard with charts, heatmap and crypto prices."
- **Source/freshness note**: added a static `.converter-source-note` line directly under the converter result — "Rates: AfroTools FX API — indicative only. Verify with your bank before high-value transfers." (plus a small scoped CSS rule). The live freshness badge (`fxBadgeConverter`) and df/state components were left untouched.
- **H1 / JSON-LD**: verified single keyword-rich H1 ("AfroFX — Latest African Currency Rates") already present; no change needed. Confirmed all 4 JSON-LD blocks (WebApplication/FinanceApplication, WebPage, BreadcrumbList, FAQPage) parse valid and that WebApplication + WebPage `name` match the H1.

## Deferred / not touched
- Stale-age formatter fix (already done — out of scope).
- FX logic, freshness/state components, df blocks.
- Shared components untouched (none required here).
