# Public claim review · November 7, 2026

Reviewed the three expired entries against source base `91dc9e91273607c2b7b97fc134f1b7b1479f4024` and the publisher recovery checkout. The existing wording, exceptions and seven-day review cadence remain in effect. The next review is due November 14.

## Performance and compatibility

Ran the repository mobile-network measurement in Chromium against the local recovery checkout. The off-tree adapter blocked service workers and other origins. The profile used a 390 × 844 viewport, 900 Kbps download, 350 Kbps upload, 220 ms latency and 4× CPU throttling.

| Route | HTTP | Load (ms) | LCP (ms) | CLS | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| / | 200 | 18618 | 8032 | 0.284 | WARN |
| /search/ | 200 | 12313 | 3768 | 0.054 | WARN |
| /salary-tax/ | 200 | 6473 | 5952 | 0.003 | WARN |
| /nigeria/ng-salary-tax | 200 | 12283 | 7104 | 0.314 | WARN |
| /tools/mobile-money-fees/ | 200 | 12050 | 3420 | 0.373 | WARN |
| /telecom/airtime-value/ | 200 | 10775 | 5012 | 1.931 | WARN |

All six routes responded without a navigation timeout. The load and layout warnings remain visible. This local measurement supports evidence scoped to the named routes and profile. It provides no carrier, production, offline, 2G or universal device benchmark. The run measurement SHA-256 is `547ab2dca41dce97bfddbfee2dc740ef7c0d5b2ba44938ec274dd2d55e8a8421`.

## Account sync and vault upload

The workspace client, authenticated API, session verifier, vault client and vault migration matched the source reviewed on October 18. The current synthetic CV consent suite passed. Workspace requests use the verified account ID and the client keeps local drafts when cloud operations are unavailable. The vault client requires sign-in and uses an explicit upload into the account folder.

The AfroTools Supabase MCP confirmed project `zpclagtgczsygrgztlts`. A metadata-only read confirmed user-scoped authenticated SELECT, INSERT, UPDATE and DELETE on workspace items and vault documents. The vault bucket is private with a 10,485,760-byte limit and a PDF, PNG and JPEG allowlist. Storage access uses authenticated account folder checks.

The review used repository and synthetic evidence plus live policy metadata. It read no customer rows and performed no cloud write, upload or cross-device sync.
