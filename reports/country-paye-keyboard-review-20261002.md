# Country PAYE keyboard review — 2 October 2026

## Confirmed issue

Native browser inspection of the public Zimbabwe and Zambia PAYE pages found that the deduction control and two tax-band disclosures were clickable `div` elements without keyboard roles or tab stops. They could not be reached through the normal keyboard sequence.

## Changes

- Use native buttons for NSSA/NAPSA deductions and the two existing disclosures on each English page.
- Expose pressed/expanded state, associate each disclosure with its panel, hide decorative arrows from the accessible name, and show a visible keyboard focus outline.
- Increase the deduction label/rate text size and fix its low light-mode contrast, with explicit dark-mode colors.
- Preserve the existing labels, appearance, route metadata, calculation functions, analytics events and exports. All inline script contents are byte-identical to baseline `4f1eb4ec903ec5378561aa3106de6998fcfb9eef`.

## Source checks

- 36 browser cases passed: Chromium, Firefox and WebKit; 320/390/1280px; light/dark. Checks include tab order, Enter/Space, pressed state, deduction effect and restoration, disclosure visibility/state, visible focus, text contrast of at least 4.5:1, 44px targets, no horizontal overflow and no page errors.
- Calculation-quality validation passed: 798 artifacts, 417/417 fixtures and zero stale dataset warnings.
- Salary/PAYE workflow validation passed.
- Link validation passed: 151,416 links across 11,930 HTML files.
- Focused CI lint, type/import checks and `git diff --check` passed.
- Native local browser activation confirmed the deduction change and expanded disclosure with visible focus.

## Release and audit limits

The publisher must run the combined build, security and artifact gates before shipping these sources, then verify the exact production revision and live browser behavior. Source checks do not prove deployment. This change does not re-certify current tax law or translated-page keyboard behavior. The broader static audit flags require runtime confirmation before further page changes.
