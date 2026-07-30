# English and French Final Design Polish Contract

Status: prepared, implementation gated

Sequence: begin product edits only after Swahili parity is accepted

Locales: English (`en`) and French (`fr`)

Baseline reviewed: French integration candidate `4d006564a72e6af25c93338841f54907e8af575c`

## Purpose

This programme is the final product-design pass for the English and French free-tool surfaces. It removes recurring decorative patterns that make pages feel generated, preserves the usefulness and correctness of every app, and brings both locales back to one calm, precise AfroTools design language.

This is not a global repaint. Changes must be made at the real source owner—shared CSS, component, generator, registry, or hand-authored page—and then verified on every affected physical route.

## Sequence Gate

No English or French product page is changed under this programme until the Swahili parity programme has reached its documented acceptance boundary. Preparatory inventory, source-owner reconciliation, and design-contract work may happen before that boundary.

The release coordinator must record the accepted Swahili commit before starting Wave 1 below.

## Design Direction

The binding source of truth remains `docs/design-doctrine.md`:

- precise, modern, trust-first, and authored;
- calm financial-product density rather than campaign-page decoration;
- DM Sans for product UI, Instrument Serif only for intentional editorial moments, and JetBrains Mono only for operational metadata;
- blue for action and focus, gold as a rare accent, and neutral surfaces for structure;
- one coherent type, spacing, button, form, card, badge, radius, shadow, and page-shell system;
- dark mode is a first-class product state.

The `ui-ux-pro-max` recommendation was used for hierarchy, whitespace, contrast, mobile-first composition, restrained motion, and minimal visual noise. Its proposed OLED-black palette, green primary action, and IBM Plex typeface are rejected because they conflict with the existing AfroTools brand and design doctrine.

“Vercel-quality” is used only as a bar for precision: crisp hierarchy, deliberate whitespace, strong typography, fast interaction, and disciplined restraint. It does not authorize a framework migration, a monochrome copy, or removal of AfroTools’ African product identity.

## What “AI Slop” Means Here

The term describes repeated presentation patterns that add decoration or promotional language without helping a user complete the task. It does not describe AI features themselves, nor does it authorize removing required trust, safety, privacy, legal, source, or confidence information.

| Pattern | Default treatment | Allowed exception |
| --- | --- | --- |
| Decorative left or top accent rail | Remove and use spacing, type, or a neutral divider | Error, warning, success, selected state, progress, or comparison diff when a text/icon label also conveys the state |
| Card around every section or nested cards | Flatten into a page section or grouped fieldset | A true interactive module, bounded result, plan comparison, modal, or separately actionable object |
| Gradients, glow shadows, radial decoration | Replace with a solid token surface and restrained shadow | Data visualization, media artwork, or one intentional brand moment with contrast proof |
| Feature copy rendered as pills or badges | Convert to plain metadata or concise copy | Real status, tier, availability, confidence, freshness, or category state |
| Repeated uppercase eyebrow copy | Use sentence case or remove if redundant | Short codes, statutory abbreviations, or compact operational status |
| Generic campaign phrases | Rewrite around the task, output, constraint, source, and next action | A verified product claim with a registry-backed public-claim contract |
| Decorative emoji, flags, or mixed icon styles | Remove or use the shared SVG system | Country identity, input meaning, or state where accessible text is also present |
| Oversized radii, floating panels, and heavy shadows | Return to shared tokens | Modal/dialog separation or a genuinely elevated interactive surface |
| Repeated trust/privacy/source cards | Consolidate into one compact, readable disclosure area | Separate disclosures required by law or materially different data boundaries |
| Control-like elements without behavior | Remove or keep hidden until wired | None; visible controls must work |

## Non-Negotiable Product Preservation

Every change must preserve or improve:

- calculation formulas, rounding, currencies, units, and country-specific rules;
- user inputs, validation, reset behavior, result states, and useful next actions;
- export/download behavior, including parser or reopen proof for supported formats;
- privacy boundaries and explicit consent before any sensitive network or AI send;
- source, freshness, assumption, confidence, and planning-estimate disclosures;
- legal, medical, tax, immigration, and financial safety wording;
- canonical, metadata, schema, OG, internal-link, and reciprocal hreflang behavior;
- AI intent routing, deterministic prefill contracts, fallback behavior, and output safety;
- keyboard access, visible focus, labels, live status, reduced motion, and contrast;
- light mode, dark mode, 320px and 375px layouts, and 200% reflow.

Removing a panel never means deleting its necessary content. Necessary content must be retained in a calmer, more appropriate structure.

## Source-Ownership Rules

1. Classify each candidate before editing: decorative, semantic state, navigation, data visualization, or required disclosure.
2. Find the actual owner before changing output. Prefer shared tokens, CSS, components, controllers, and generators.
3. Do not hand-edit a generated English or French page when its owner exists.
4. When an owner cannot be found, create or reconcile a maintained owner and add a freshness/check contract before regenerating routes.
5. Review the source diff separately from generated-output churn.
6. Count and verify every physical route affected by a shared source change.
7. Keep the final Netlify deployment batched as one coordinated release.

## Candidate Baseline

These are detection counts, not confirmed violations. They intentionally overcount legitimate semantic uses and exist to prevent a cosmetic search-and-replace. The reproducible scope is every English/French registry app plus top-level hub candidates; run `npm run ui:polish:inventory` against the exact integration commit to refresh it. The existing `npm run ui:accent-check` remains the narrow fail-closed guard for specifically disallowed decorative bars; the inventory complements it and does not replace it.

| Locale | Physical files scanned | Accent-rail signals | Gradient signals | Glow-shadow signals | Uppercase signals | Card-class signals | Badge-class signals | Generic-copy signals | Emoji signals |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| English | 1,400 | 899 in 499 files | 2,266 in 942 | 2,319 in 873 | 4,208 in 965 | 29,435 in 1,297 | 6,761 in 1,121 | 206 in 133 | 2,256 in 295 |
| French | 1,610 | 810 in 798 files | 1,030 in 717 | 2,084 in 910 | 1,604 in 839 | 9,219 in 1,165 | 1,853 in 477 | 34 in 15 | 1,496 in 504 |

High-priority owner families found during the preparatory scan:

- repeated French country/finance output rails (`fr-country-brief`, `fr-finance-output`, and `data-fr-proof-output`) whose maintained source owner must be reconciled before edits;
- repeated privacy/basis notice rails in French prepaid-meter and security-tool surfaces;
- category CSS with decorative gradients, glow, hover rails, badge density, and card mosaics, including the Religious & Cultural family;
- `assets/css/ke-stamp-duty-vip.css`, which currently fails the existing accent guard and also contains a decorative hero gradient, inset rail, metric rails, uppercase labels, and mixed typography;
- semantic diff, warning, success, and platform-state rails that must not be removed mechanically.

The baseline already contains the narrow `npm run ui:accent-check` introduced by the earlier decorative-accent cleanup. It currently reports one carried failure in `assets/css/ke-stamp-duty-vip.css`. This programme must repair that source owner after the Swahili gate opens; it must not disguise the failure by weakening the guard.

## Implementation Waves

### Wave 0 — Ownership and classification

- Record the accepted Swahili baseline.
- Refresh the candidate scan against that exact integration base.
- Map each repeated candidate to its CSS, component, controller, or generator.
- Mark every retained semantic exception and the non-colour cue that makes it accessible.

### Wave 1 — Shared system

- Reconcile tokens, shared cards, badges, notices, result actions, form controls, and disclosure patterns.
- Remove fake or unwired affordances at the shared-component layer.
- Establish one compact source/privacy/freshness presentation that can be reused without hiding material facts.

### Wave 2 — Hubs

- Review English and French category hubs serially.
- Improve discovery, hierarchy, filters, empty states, locale navigation, artwork behavior, and mobile density.
- Verify that hub counts and links match registry and physical-route truth.

### Wave 3 — Apps

- Give every app a route-level VIP review; do not grant acceptance by category implication.
- Verify the task, inputs, formula/data engine, results, errors, exports, privacy, sources, SEO, AI handoff, accessibility, themes, and mobile behavior.
- Create a narrow missing-artwork queue instead of using decorative placeholders.

### Wave 4 — Locale equivalence

- Compare English and French owners for feature, engine, export, source, AI, SEO, and design equivalence.
- Keep native French copy and information architecture; equivalence does not mean literal English transplantation.

### Wave 5 — Coordinated release

- Rebuild generated owners and review deleted-file summaries before integration.
- Run the complete release gate.
- Ship one coordinated production deployment and verify its exact commit live.

## Per-App Acceptance

An app is accepted only when all applicable items below have evidence:

- the primary user job is obvious without reading promotional copy;
- all visible controls are real, labelled, keyboard reachable, and correctly stateful;
- valid, boundary, invalid, reset, and empty-result flows behave correctly;
- formula/data/source behavior matches the English/French product contract;
- every advertised export is downloaded and parsed or reopened;
- local-first and AI/network consent behavior is accurate;
- sources, dates, assumptions, confidence, and disclaimers remain readable;
- no horizontal overflow at 320px or 375px and no loss of function at 200% reflow;
- light, manual dark, and system dark states pass contrast and visibility review;
- focus, live status, modal behavior, and reduced-motion behavior pass;
- canonical, OG, schema, indexability, internal links, and reciprocal hreflang pass;
- console and local-resource checks are clean;
- decorative candidates have either been removed or recorded as justified semantic exceptions.

## Release Gate

At minimum, run the narrow owner tests plus:

- `git diff --check`
- `npm run ui:accent-check`
- `npm run ui:polish:inventory`
- `npm run lint`
- `npm run type-check`
- `npm run audit`
- `npm run check-links`
- `npm run tools:quality`
- `npm run localization:check`
- `npm run test:localization`
- `npm run validate:hreflang`
- `npm run test:privacy-ai-consent`
- applicable category, formula, source, PDF, and export suites
- browser coverage for every changed physical route
- `npm run security:scan`
- `npm run build:deploy`
- `npm run audit:dist`

Local proof, CI proof, preview proof, production-deploy proof, and live-route proof must be reported separately. The programme is complete only after the exact released commit is green in CI, successfully deployed, and verified on the live English and French routes.
