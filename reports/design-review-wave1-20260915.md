# Design review: first repair batch

## Goal and working copy

The active Codex goal covers design, mobile usability, night mode, decorative margin accents, images, and tool workflows. This batch is the start of that review, not site-wide acceptance.

- Branch: `codex/design-mobile-review-20260915`
- Worktree: `C:/Users/Oza/.codex/worktrees/design-mobile-20260915/afrotools`
- Verified remote base: `e2a41182ab087e2c540207049fbfc1fa1571d9e8`
- Canonical checkout and its unrelated modified report were preserved.
- Local browser server: port 4186, serving this worktree.

## Changes

- Homepage: readable blue headline, helper text, selected prompt states, and recommendation CTA in night mode; separate grid space for the mobile signup banner close button.
- Shared navbar: dark backgrounds for the mobile menu, language, and sign-in controls, preserving readable icons and labels.
- PDF hub: theme-aware local surface/text tokens replace fixed white panels; action-button blue stays separate from the lighter link/headline blue; visible dark focus rings.
- Decorative borders: removed the homepage trust-grid side rail and the PDF quote rail from their source rules. The broader accent review remains open.
- Generated navbar CSS/JS were rebuilt with the repository owner. Changed page-specific stylesheet hashes were refreshed.

## Browser evidence

Reviewed the live homepage first, then the isolated local source with the in-app browser. No production mutation or deployment was performed.

- Homepage and PDF hub: measured document scroll widths 314/384/762/1434 at viewport widths 320/390/768/1440, respectively; no horizontal document overflow in those observations.
- Visually checked homepage light and dark mobile/desktop layouts and PDF dark mobile/tablet/desktop layouts.
- Verified explicit mobile-menu switch to light mode on the PDF hub; the light hero, panels, and navigation remain readable.
- PDF planner: selecting Merge & organize changed the primary action to Start bundle route and showed the merge/page-manager sequence.
- PDF catalog: searching compress returned two results across the 31-tool catalog; observed tool images loaded.
- PDF current-page console: no captured error entries.
- An initial amount-to-words check returned One Thousand Two Hundred and Fifty Naira and Fifty Kobo Only for synthetic input 1250.50. That check preceded reconciliation with the remote base. Remote already contained improved amount labels and removed the generic duplicate summary form; those changes were preserved and were not authored in this batch.

## Validation

- PASS: document-pdf:verify (31 registry tools, public planner, report sync, dashboard boundary).
- PASS: five focused UI polish contract/inventory tests.
- PASS: lint (49 JavaScript files).
- PASS: type-check (AI manifest and prompt contracts).
- PASS: git diff --check.
- PASS: accent-pattern audit on the initial checkout (17,111 source files); this heuristic does not cover every kind of decorative border.
- Completed a focused static mobile audit of three pages; retained two late-collapse heuristic findings for comparison with browser evidence. See design-mobile-wave1-20260915.json and .md.
- Stopped the full mobile audit after sustained execution without a report; use bounded page-family batches next.

## Remaining work

1. Continue browser and static review on tools directory, salary-tax, country hubs, and localized entry pages. Prioritize shared night-mode surface mismatches and decorative margin rails.
2. Check actual tool interactions using synthetic fixtures and image loading after scroll. Keep calculator/export correctness separate from visual acceptance.
3. Test keyboard focus across the final assets and theme persistence across representative page transitions.
4. Refresh navbar asset references through the normal build/cache-bust owners before release. Run broader release/security/dist checks before any deployment claim.
5. Expand to additional browser engines/device coverage; Chromium/in-app checks alone do not establish Safari or Firefox compatibility.

No claim is made that all pages, all tools, or all images have been reviewed. No merge, push, or deployment has occurred.
