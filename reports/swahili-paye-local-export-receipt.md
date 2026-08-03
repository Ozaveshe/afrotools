# Swahili PAYE local-export checkpoint

Date: 2026-07-30

This is an implementation checkpoint, not a category acceptance receipt.

## Scope

- Explicit country routes reviewed: **26**
- Routes with an existing local `generatePdf()` implementation: **26/26**
- Lead-capture export layers removed: **26/26**
- Country tax engines changed: **0**
- Newly accepted free-app rows: **0**

The exact route owner is `scripts/normalize-sw-paye-local-exports.js`. It fails
closed if a route loses its local generator, regains an email lead form, or
drifts away from the direct local export contract.

## Browser evidence

`tests/e2e/swahili-paye-local-exports-vip.spec.js` passed **26/26** routes in
one-worker Chromium. Every route proved:

- a real gross-salary calculation and numeric result mutation;
- a generated local report Blob, or the explicit local print path for
  Equatorial Guinea;
- no email field, lead form, or mutation request;
- no horizontal overflow at 320px after calculation;
- self-canonical and resolved OG image metadata;
- keyboard focus on the primary salary input;
- light and dark theme state;
- zero page and console errors.

Eight routes received explicit 320px containment repairs after the first sweep:
Burundi, Central African Republic, Chad, Equatorial Guinea, Gabon, Rwanda,
Tanzania, and Uganda.

All 26 routes now fail closed when Chart.js is unavailable, so a delayed or
blocked chart CDN cannot break calculation or export.

## Acceptance boundary

These 26 routes retain **zero new acceptance credit**. Functional, privacy, and
mobile proof is complete, but a reviewed Swahili language oracle for every
generated report is still pending. Several report templates contain known
English labels. The acceptance registry remains unchanged until each report
payload is translated, regenerated, reopened, and reviewed individually.
