# Design review: Yoruba mobile navigation and invoice contrast

- Fixed the invoice hero's light-mode dark text over a dark gradient by using a neutral light surface and explicit paired dark colors.
- Browser investigation found that the generated language notice preceded the navbar. Its height displaced the navbar while the mobile menu still opened at a fixed top offset. Clicking the apparent menu-close button hit the overlapping theme toggle instead.
- Updated the fallback generator to insert the notice after the navbar where present. Regenerated 23 pages; routes without a navbar retain the body insertion fallback.
- Added a regression assertion for navbar-before-notice order and idempotence.

## Evidence

Local in-app Chromium, 390 x 844, built-in synthetic invoice defaults only.

- Light: white hero, heading rgb(15,23,42); document scroll width and client width both 384px.
- After repair: selected dark mode, closed menu, and confirmed the theme remained dark. Hero rgb(11,21,36), heading rgb(238,245,255).
- Add-line control increases item count from 2 to 3 after closing the menu.
- Fallback synchronization tests pass, including invalid destinations, unavailable-state behavior, insertion order and idempotence.

No availability claims, invoice formulas, account requirements or live data changed. The broader goal remains active. Remaining work includes document/export checks, additional shared contrast and accent review, CSS/dynamic image checks, cache regeneration and build/security/dist validation before release.
