# Market-day fallback provenance review — 2026-09-16

Base: `6183e6395a8168a55fdb1c1591113c368179edac`.

The initial HTML previously claimed that today was Nkwo on 17 April 2026. The change replaces that stale date and result with honest loading text and adds guidance when JavaScript is disabled. The live calculator still supplies the current Nigeria/device date and market day.

All executable script blocks are byte-for-byte identical to the base. The engine, source dependencies, fixture inputs, mutation cases and invalid cases are unchanged.

The full normalized English-page fingerprint changes from `f22035a0f8c777067dc8a2dd430ede548711a271621322e09b84439effc04d7b` to `ae0f294f36c234db63331dae32b34f92db64774c70d7e61b3dff79ff848bb63f` because the fixture includes initial HTML copy. Only this reviewed fingerprint and provenance were refreshed. All semantic assertions remain enabled.

Validation: the French owner-contract test passed. Three source-browser tests passed: exact English/French semantic parity, JavaScript-disabled fallback, and fixed-clock live lookup at 375px with no overflow or runtime errors. Deployment and traffic impact remain unverified.
