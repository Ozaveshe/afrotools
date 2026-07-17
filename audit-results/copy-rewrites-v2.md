# Copy Rewrites V2

## Audit Boundary

The first copy scan was intentionally broad and noisy. It found 4,396 phrase hits, but many were from local agent skills, docs, generated reports, and technical contexts such as "Benedict's solution." The scanner was corrected to skip non-product directories such as `.agents`, `.claude`, `dist`, `reports`, `audit-results`, and local toolchain folders, then rerun against visible HTML and shared JS/JSON templates.

After boundary correction and copy fixes, the user-facing scan reports 1,463 remaining phrase hits. Many of the remaining `solution` hits are legitimate chemistry, seed-treatment, or answer-solution contexts. The remaining high-value copy debt is concentrated in old "coming soon" status text, "AI-powered" labels, and some Pro/creator/product surfaces.

## Source Copy Fixed

| File | Change |
|---|---|
| `index.html` | Replaced visible "AI-powered" positioning with clearer practical copy about tools, local context, and plain-English explanations. |
| `assets/js/components/tool-registry.js` | Softened repeated registry descriptions for creator, business, study, price, and medical tools. Removed unnecessary hype where the product value can be stated directly. |
| `tools/afroprices/index.html` | Rewrote "AI-powered insights" style copy into practical buying and price-check language. |
| `tools/agent-commission/index.html` | Changed "Smart Insights" tone into "Practical notes" and made the helper copy more direct. |
| `blog/best-free-pdf-tools-online/index.html` | Replaced "comprehensive suite" with plainer language. |
| `blog/free-json-formatter-developer-tools/index.html` | Replaced "comprehensive suite" with practical tool wording. |

## Principles Applied

- Prefer "calculate", "estimate", "check", and "compare" over vague value claims.
- Say what the tool does before explaining how impressive it is.
- Keep disclaimers adult and practical: estimate first, confirm important decisions with a professional.
- Avoid making AI the headline unless the user benefit depends on it.
- Keep African user context concrete: local currency, salary, tax, rent, business cost, transport, and informal-work realities.

## Remaining Copy Debt

- 148 visible/shared `AI-powered` hits remain, mostly older tool pages and product surfaces.
- 187 `coming soon` hits remain. Some are legitimate status labels, but category pages should distinguish unavailable tools from shipped functionality more clearly.
- `solution` remains too broad as an audit phrase because it catches legitimate education/science/math contexts. Future scanner versions should classify context before counting it as poor copy.
- `about/index.html` and `afrowork/whatsapp/index.html` still contain visible AI-forward language and should get a focused editorial pass.
