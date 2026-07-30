# Swahili Parity Rejected Lanes

Reviewed: 2026-07-31

This register prevents a technically green replacement surface from being credited as product parity. Rejected commits remain preserved for review but are not eligible for the acceptance ledger or coordinated release.

## Consumer and culture — rejected

- Branch: `codex/sw-consumer-culture-parity-20260731`
- Commit: `6fc11ac8`
- Claimed scope: 107 apps across Telecom, Security, Career, Diaspora, Religious & Cultural, Sports, Travel and Uniquely African.
- Coordinator credit: 0/107.

Reasons:

1. The implementation replaces distinct app workflows with seven generic workflow kinds and one generic calculation engine.
2. Browser proof exercises the replacement form, generic result, and newly added JSON/TXT exports; it does not prove parity with each English app's original formula, source data, output model, or advertised exports.
3. A single generic calculator fixture is used to credit materially different products such as Lobola, telecom pricing, religious calculations, travel planning, security checks and sports tools.
4. Seventy-two acceptance entries are therefore unsupported by route-specific product oracles even though the replacement pages render and the generic exports reopen.
5. The remaining 35 routes are correctly marked blocked, but their implementation cannot be reused as product proof.

Required redo:

- Split the 107 rows into coherent app families with their original English engine or data owner.
- Preserve app-specific inputs, formulas, validation, results, sources and exports.
- Add route-specific or family-specific deterministic oracles before browser acceptance.
- Treat artwork, metadata, reflow and generic export proof as supporting evidence, not product-correctness proof.
