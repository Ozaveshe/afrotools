# Susu / Esusu / Chama Group Tracker — Audit

URL: https://afrotools.com/tools/susu-tracker/
File: `tools/susu-tracker/index.html`

## What it does
Plans and tracks rotating savings groups (ROSCAs) — Susu (Ghana), Esusu/Ajo (Nigeria), Chama (Kenya), Stokvel (SA), Tontine, Ekub. Takes group type (rotating vs fixed-savings), currency, member count, contribution, frequency, optional member names, start date, collector/admin fee %, reserve fund %, grace days, late penalty and current missed payments. Generates: summary tiles (members, net payout/round, cycle length), a cycle-readiness brief with admin fee / reserve / missed-exposure / penalty-due, a dated payout schedule with recipient + status, a copyable brief, CSV export, and playful "what this saves buys" comparison cards.

## Math verification (all correct)
- potSize = contrib × members; fee = pot × fee%/100; reserve = pot × reserve%/100; netPot = max(0, pot − fee − reserve). ✓
- Rotating: each round every member pays `contrib`, recipient receives `netPot`; total paid per member = contrib × members = gross pot. ✓
- Fixed savings: running pool = contrib × (i+1); final net = netPot. ✓
- defaultExposure = missed × contrib; penaltyDue = missed × latePenalty. ✓
- Date stepping (weekly/biweekly/monthly) correct.

## Gaps found
1. **Corrupted currency symbols (live bug):** Nigeria option was `?` and Ghana `GH?` (literal `?` bytes, not ₦ / GH₵) — shown on the live site.
2. **Broken Ghana price logic:** the comparison-card code checks `cur === 'GH₵'` (GH₵) but the corrupted option value was `GH?`, so Ghana always fell through to the Nigeria default pricing.
3. **Emoji destroyed to `??`** across the four comparison cards and the "Did You Know" block.
4. **FAQ JSON-LD mismatch:** each `Question.name` carried a trailing `" ↓"` arrow absent from the visible FAQ text.
5. **No persistence:** badge says "Offline Ready" but nothing was saved; a reload wiped the group setup.
6. **No empty state:** result card was `display:none` with no guidance before generating.

## Fixes applied 2026-07-14
- Currency options corrected to `₦` (Nigeria) and `GH₵` (Ghana); the `GH₵` value now matches the `GH₵` branch so Ghana comparison pricing works.
- Restored emoji: 🌾 🏠 📱 🎓 on the cards, 💡 title and 🚶‍♂️💰 in the Did-You-Know line (the latter as valid JS `\u` escapes — verified to evaluate to the real emoji).
- Removed the stray `↓` from all four FAQ JSON-LD question names so they mirror the visible FAQ exactly.
- Added `localStorage` persistence (`afro-susu-tracker`): 12 setup fields saved on Generate and restored on load, auto-regenerating the schedule for returning users.
- Added a clear empty-state hint below the result area explaining what to do and that setup is saved on-device.

## SEO / structure (already solid, left as-is)
- `<title>` keyword + African intent; meta description 140 chars (in range); single keyword H1; canonical + hreflang (en/sw/x-default) present.
- JSON-LD: WebApplication, WebPage, FAQPage (now mirroring visible FAQ), BreadcrumbList — all 4 parse.

## Deferred
- Currency symbol repair only covers the two ASCII-corrupted options; consider a data-driven currency list to prevent recurrence.
- Inputs rely on `aria-label`; native `<label for>` association is only on Group Type. Non-blocking; left untouched to stay surgical.

## JSON-LD valid
Yes — all 4 blocks parse via `node`.
