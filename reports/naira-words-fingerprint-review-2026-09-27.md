# Naira-to-Words owner fingerprint review - 27 September 2026

PR #154 changes six FAQ answer colors in tools/naira-to-words/index.html from fixed #555 to the shared muted text token. At 390px, the expanded answer measured about 2.5:1 contrast on the live dark page and 11.01:1 on the changed local page.

The French native-oracle gate hashes the complete normalized English owner HTML. Against origin/main af973eaa33e4c10b4b053c16a5e63497a16e940f, its complete drift set contains only naira-to-words: old SHA-256 adb60fa204260faf0970b7e5168a340620bbedc2f42f8023bae199522801138a; new SHA-256 bd8e9865f2b72234c82177af6d72e2d9a97b4a56680f7fdf4671f2982648e76e.

The reviewed diff does not change amountToWords, the decimal parser, wording fixtures, the French page, or the dependency fingerprint. The fixture's source hash and review metadata were recaptured; its behavior contract was left intact.

Validation after recapture: node tests/fr-uniquely-african-engine.test.js passed (20/20 extracted contracts, 14/14 native owner fixtures); node tests/amount-words-input.test.js passed (4/4); git diff --check passed.