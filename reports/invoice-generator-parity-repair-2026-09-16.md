# Invoice generator parity repair — 16 September 2026

## Scope and source

Isolated branch based on verified `origin/main` 6183e6395a8168a55fdb1c1591113c368179edac. This is repository/browser evidence, not deployment or tax-source verification.

- French invoice-generator now regenerates from the current English owner instead of preserving the older reduced page. Document types, payment details, reusable items, saved invoices, print, JSON import/export and reminders are available through the existing engine.
- The tool-specific enhancement runtime supplies native French/Kiswahili PDF headings, payment labels, statuses and reminders. User content does not pass through the label dictionary.
- All document modes use the same PDF exporter, including discount, tax, withholding, amount paid and balance. PDF amounts use ISO currency codes: actual default NGN exports previously contained NUL-separated digits because the standard PDF font could not encode the naira symbol. Entered unit-rate precision is preserved in both preview and PDF; monetary total rounding is unchanged.
- Sharing defaults to the clean tool URL. An unchecked, explicit disclosure is required before business/client contacts, items, amounts and payment instructions enter an encoded invoice link. Checking this choice is not persisted in saved data.
- Swahili invoice-generator is exempt from the generic generated-result stale guard, just like freelance-invoice. It has a live preview and its own review checkbox; there is no separate Generate action. Previously applying a saved item and then editing could permanently disable JSON/PDF exports. Its own review reset and export guard remain active.
- The existing French PDF smoke test now explicitly checks the restored review confirmation. French billing-details injection coverage includes the regenerated route.

## Verification

- All nine combined browser tests passed in 3.8 minutes in `invoice-generator-final-proof`, including EN/FR/SW current workflows: real pointer operations at 320 px; saved client/item/invoice; JSON download and import; saved invoice after reload; print invocation; clean default link and decoded opt-in link; blocked unreviewed PDF/JSON; native invoice/estimate/partial-receipt PDFs reopened with `pdf-parse`; matching USD adjustments and total; NGN/MAD/TND parsed codes and 19.995 unit rate; 320/390 px overflow; no fixture content in requests or page errors.
- Financial input reader `h()` and totals function `y()` are byte-identical to the committed predecessor. Synthetic assumptions are 3 × 19.99, 10% discount, 7.5% tax, 5% withholding, 10 paid: subtotal 59.97, total 58.02, balance 45.32. At rate 19.995, the existing rounded balance is 45.34.
- Focused FR/SW generator `--check` commands pass for invoice-generator. Syntax checks and `git diff --check` pass. `verify-document-pdf-workflow.js` passes.
- A separate browser clipboard check passes for all three native payment reminders, including greeting, client name and balance label.
- Full hreflang validation passes: 11,559 public pages, 5,288 equivalence groups.
- Full French document generator check still reports 34 other stale outputs. A read-only comparison using the original committed config produces the identical list; these unrelated outputs were not refreshed.
- Separate reserved-word export proof (`0481a236`) passes for French and Swahili freelance invoices: literal user words Invoice, Withholding, Receipt, Description and Total survive actual PDF/TXT/DOC exports.

## Remaining limits

- Existing receipt mode automatically checks Mark paid and replaces amount paid with the full total. The matched partial-payment receipt test explicitly unchecks Mark paid and restores the entered partial amount. Automatic full-payment semantics need a separate correctness review.
- Currency changes apply existing tax presets. Tests explicitly restore the synthetic 7.5% assumption; they do not certify those presets, jurisdictional tax rules, currency minor-unit rounding policy or invoice compliance.
- Long/multipage invoices, every currency, every template, logos and all visual/contrast states have not been exhaustively verified. No acceptance ledger or source-verification date was updated.
- No push or deployment was performed in this lane.
