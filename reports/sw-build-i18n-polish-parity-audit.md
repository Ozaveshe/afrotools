# Swahili Build-I18n Polish Parity Audit

Generated: 2026-05-16

## Verdict

Audit-only. I did not edit `scripts/build-i18n.js` because the repeated Swahili problems are not a one-line parity fix. They need route-output tests and a small implementation sequence.

## Repeated Issues That Should Become Script-Owned

- Swahili route precedence and alias-safe output (high): build-i18n.js maps existing Swahili pages for hreflang via SW_SLUG_TO_EN/existingSwPages, but buildOutputPath still writes to /sw/<English pagePath> for page packs. Prompt 97 found this blocks safe lang/pages/**/sw.json pilots. Recommended owner: scripts/build-i18n.js plus tests for Swahili alias output.
- Country subpage source ownership beyond PAYE (high): Prompt 71 ledger: PAYE has fix-sw-paye-custom-ui.js, but VAT, employer-cost, work-permit, gratuity, retrenchment and contractor-vs-employee repeated Swahili country families have no tracked generator. Recommended owner: new country-family source-owner script or documented generated/static ledger.
- Swahili PAYE share/PDF/runtime strings (medium): build-i18n.js includes French exact pairs and a French share override. Swahili PAYE pages still show mixed runtime share text patterns such as English ?My <country> PAYE? and fallback ?Share? in some country pages. Recommended owner: Swahili PAYE runtime/share normalizer, probably adjacent to fix-sw-paye-custom-ui.js.
- Search fallback labels and synonyms (medium): Prompts 70, 79, 94 relied on registry/search QA and manual registry rows. Swahili search health is good, but query synonyms like PAYE, VAT, PDF, TIN, USSD, CV, forodha and tafsiri should be maintained as data rather than ad hoc page copy. Recommended owner: shared navbar/search synonym map or registry metadata rule.
- Translated reserved attributes and slug artifacts (medium): Prompt 96 fixed a concrete artifact: meta view-transition content="same-asili" on /sw/sarafu/. These machine-translated reserved values should be linted. Recommended owner: i18n/static lint for reserved HTML attribute values.
- Canonical/hreflang aliases for hand-authored Swahili (medium): validate:hreflang is currently clean, but getAvailableLangs/getSwahiliUrl and buildOutputPath use different concepts of Swahili route ownership. This is stable only while pages remain manually maintained. Recommended owner: build-i18n route-map contract and hreflang/source tests.
- Repeated calculator safety notices (medium): Prompts 84-90 repeatedly added or verified planning-aid language for HR/legal/religion/health/environment. The pattern should be a shared snippet per risk class, not reworded manually per lane. Recommended owner: shared Swahili safety notice registry/snippet helper.
- Developer utility local-processing labels (low): Prompts 67, 74, 83 and 96 all touched developer/API bridge honesty and local-only wording. Many tool pages use localizer maps in-page. Recommended owner: shared utility/tool template strings for local-processing and English-only bridge notices.

## Recommended Implementation Prompts

1. Prompt 101: Add Swahili alias-safe output resolver and dry-run path reporting to build-i18n.js, with tests proving ghana/gh-paye targets /sw/ghana/kikokotoo-kodi-mshahara/ before any page pack is added.
2. Prompt 102: Create a Swahili PAYE runtime/share normalizer that fixes share text, PDF labels, dashboard labels and copied URLs across country PAYE pages without changing formulas.
3. Prompt 103: Create a country VAT/TIN source-owner design and decide whether to restore a generator or keep explicit static ownership reports.
4. Prompt 104: Add a reserved-attribute localization lint for values like view-transition, rel, target, method and input types so translation passes cannot create same-asili-style artifacts.
5. Prompt 105: Move Swahili specialist safety notices into reusable snippets/data keyed by risk class: legal/HR, health, religious/cultural, finance, government/admin and environment.

## Validation

Audit-only. No source HTML or script changed, so no broad build was run.
