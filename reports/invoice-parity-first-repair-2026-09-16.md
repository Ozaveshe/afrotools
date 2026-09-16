# Invoice parity audit — 2026-09-16, first repair

Base: 6183e6395a8168a55fdb1c1591113c368179edac (fetched origin/main). No deployment or acceptance changes.

## Confirmed repair
Ordinary freelance data-bind change events rebuilt every line-item input after blur. Moving from payment instructions to a line input could detach the receiving input and append intended line text/numbers to the previous field, retaining the default billed item. EN, FR and SW reproduced this. The shared runtime now recalculates ordinary changes without rebuilding editable controls; country/payment-method changes retain their dependent control refresh. French runtime regenerated through build-french-document-pdf-page-runtimes.js; only the matching runtime changed.

Three Chromium tests pass: EN/FR/SW actual editing, input-node identity, independent arithmetic (3 × 19.99, 10% discount, 7.5% tax, 5% withholding, 10 paid: total58.020975, balance45.322325), saved record, reload, JSON import and reopened PDF/DOC/TXT/CSV/JSON. Sensitive synthetic markers absent from captured network requests. Desktop workflow, 390px overflow check. No formula changes.

## Remaining confirmed audit findings
- French invoice-generator lacks EN/SW document-type, payment-method, saved-item, save-invoice, print, JSON export/import and reminder controls.
- French/Swahili freelance parsed PDF remains English. CSV is English; TXT is largely English. TXT omits discount, withholding and paid breakdown.
- Freelance supports higher-precision raw rates, but PDF displays 19.995 as20.00 while line3×19.995 displays59.99. Currency-specific rounding policy remains unreviewed.
- SW mobile pointer actions can miss Save/review checkbox at320/390 despite keyboard workflow working. Trace shows pointer target becomes toolbar parent; needs separate repair. Current regression deliberately proves desktop workflow, not mobile pointer acceptance.
- Nigeria/NGN presets exist on all six surfaces; tax presets are not verified statutory rates by this audit.
- All six initial routes loaded without page errors and fit390px. Invoice-generator common PDF audit remains incomplete; tax controls require expanded details, and French observed tax total needs a controlled follow-up.

Evidence: sibling exports-audit.jsonl (before), exports-after.jsonl (after), freelance-focus-proof (3passed), freelance-sw-repeat / freelance-390-proof (mobile failures). Synthetic fixtures only. Source/SEO/hreflang and full-build checks are not claimed by this first runtime-only repair.

## Follow-up: Swahili pointer repair
The shared integrity helper moved the active a11y stylesheet when late footer/assistant assets entered the head. Removing/reinserting the link temporarily removed its styles between pointerdown and mousedown (Save y398→-380), causing mouseup/click to hit its parent. The helper now leaves that sheet attached and inserts later style owners before it. No script or metadata reordering.

11 Chromium checks pass: the three full EN/FR/SW workflows now use real mobile pointer Save/review/export at320px; eight targeted cases cover both invoice apps at320/390px and light/dark. Tests assert the original a11y link is never removed, its CSSStyleSheet identity remains stable, style priority remains last, pointer geometry changes under2px, and the clicked action actually completes. Existing real footer/assistant loading remains active; an additional late style insertion makes the ordering test deterministic. No keyboard substitution or sleep-based readiness workaround.

## Follow-up: native freelance exports
Source-owned labels now render in FR/SW inside PDF, TXT, CSV and DOC rather than depending on a visible-DOM translator. Document titles/status, date formatting, adjustment labels and new-draft default note/terms follow the page language. Arbitrary entered content and portable JSON field names remain unchanged. TXT includes all adjustments; CSV identifies its currency. Unit rates preserve entered fractional precision while monetary totals keep their existing display rounding (19.995 is printed as19.995, not20.00). Calculation/line/number functions T/I/y are byte-identical to the previous candidate.

Three strengthened mobile Chromium workflows pass in50.1s: all five export formats reopened, native heading/adjustment assertions, no leftover selected English labels/default note, saved/import state unchanged, invoice plus parsed estimate/receipt PDF titles, precision19.995 and expected total/balance. Tests do not certify national tax presets, all currencies, all template defaults, or every layout/contrast combination.
