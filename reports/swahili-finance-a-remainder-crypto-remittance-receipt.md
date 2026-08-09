# Swahili Finance remainder — crypto-remittance

- Exact remaining Finance ID `crypto-remittance`; native owner `/sw/zana/ulinganisho-nukuu-za-kutuma-fedha/`.
- Candidate delta +1; no central acceptance credit is claimed here.
- Reuses the unchanged maintained DOM-free receipt comparator. It compares only non-expired user-entered receipts with exactly matching send currency, receive currency and total debit; it makes no provider, rate, ranking or recommendation claim.
- CSV, JSON and parser-readable PDF were downloaded and reopened. Generic receipt fields remained local, were not stored and did not enter URLs or external requests.

## Verification

- Engine and Swahili static tests: 4/4 passed.
- Focused Swahili Chromium: 4/4 passed for exact comparison/fail-closed mismatch, parsed CSV/JSON/PDF, privacy, 320/375px, 200% reflow, themes, keyboard, metadata and artwork.
- Existing English/French browser regression: 10/10 passed.
- Reciprocal hreflang (33,576 / 5,351), links (138,352), registry audit, lint, type-check and diff checks passed.
