# Swahili Language Free-App Parity Receipt

Reviewed: 2026-07-31

## Decision

- English denominator: 11 Language free apps.
- Swahili owners reconciled: 11/11.
- Accepted: 11/11.
- Blocked: 0.
- Physical routes deleted: 0.
- Deployment or merge: not performed.

## Product proof

Every accepted route has a native Swahili interface, a working local workflow, reciprocal English/Swahili ownership metadata, a Swahili canonical and schema language, dedicated artwork, keyboard focus, light/dark presentation, 320px or 375px mobile reflow, 200% reflow, and a clean browser console.

The browser suite exercises all eleven owners:

- Swahili, Yoruba, Hausa, Igbo, Amharic, Zulu and African French phrase search.
- Arabic-Indic digit conversion.
- Ge'ez transliteration from a Latin-script sample.
- Nigerian Pidgin phrase search and the explicit-consent boundary for external translation.
- African name search and the name-suggestion workflow.

Eight apps advertise the shared local Language Workbench export. Their TXT files were downloaded, reopened and parsed for the entered text and safety note. The remaining three routes do not advertise a primary export and were not assigned invented export requirements.

## Privacy boundary

- No route made an unexpected non-GET request.
- Pidgin external translation remained disabled without explicit consent.
- Translation requests retain `no-store`, same-origin credentials and no-referrer handling.
- User-entered language text was not written to analytics or local storage by this lane.

## Artwork

All eleven owners resolve a local dedicated social image. Four pages that still referenced the generic site image now use the existing assets for Arabic numerals, transliteration, Nigerian Pidgin and African French.

See `reports/swahili-language-parity-missing-artwork.md`.

## Evidence

- Static contract: `tests/swahili-language-parity.test.js` — 5/5 passed.
- Consent/generator contract: `tests/swahili-translation-consent-generator.test.js` — 5/5 passed.
- Browser contract: `tests/e2e/swahili-language-vip.spec.js` — 11/11 passed with Chromium, one worker, isolated local server.
- Parity inventory: 1,257 English free apps, 16 total accepted after this lane.
- Whitespace validation: `git diff --check` passed.

## Source ownership

The eleven routes and the four artwork corrections are owned by `scripts/build-swahili-product-surface.js`. The generator preserves valid later build post-processing when its source hash remains current, so a source rebuild does not strip route metadata, analytics or hashed assets.
