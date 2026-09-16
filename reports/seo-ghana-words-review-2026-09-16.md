# Ghana amount-in-words SEO provenance review — 2026-09-16

Base: `6183e6395a8168a55fdb1c1591113c368179edac`.

The SEO owner adds three query-backed amount examples, a cedis-versus-dollars clarification, and a link to the existing currency converter. The canonical calculator route remains unchanged.

All executable script blocks are byte-for-byte identical to the base. All 11 reference-table examples match the existing amount parser and converter. No parser dependency, arithmetic, native fixture inputs, mutation cases, or invalid cases changed.

The native parity fixture hashes the complete normalized HTML page, including SEO copy. Its Ghana fingerprint was refreshed from `5f120a60ae93d9fff736ef15a65825c42f1ff8e398387589c2cc07b5196af108` to `7d381b300ef050a285cfffffaef96e89a5293c9eb295b91680ef1e8324f3406e` after reviewing the generated diff.

Validation: `node --test tests/fr-uniquely-african-engine.test.js tests/gsc-recovery-wave-1.test.js` passed 10 tests. The `amount-words-gh physical route` Playwright acceptance test passed, including exact English/French semantic result equality, varied inputs, invalid-state handling, and export checks. Fingerprint checks and semantic assertions remain enabled.

This is repository validation; it does not establish deployment or traffic growth.
