# Qualified public claim review — 2 October 2026

The GSC/API release encountered three expired policy reviews. This review renews their existing conditional meanings through 9 October 2026 without broadening wording or changing product behavior.

| Claim | Current evidence | Limits |
| --- | --- | --- |
| `performance.measured-support` | `npm run mobile:network` completed on six local routes at 390px, 900 Kbps down, 350 Kbps up, 220ms RTT and 4x CPU throttle. All returned 200, with one PASS and five WARN results. No horizontal overflow or controls below 16px were reported. | Home load was 16.7s and LCP 6.3s; several routes had layout shifts. This supports retaining route-specific measurement requirements, not blanket speed, offline, 2G or device claims. See `reports/mobile-network-smoke.md` and its JSON evidence. |
| `account.optional-sync` | Source review confirmed sign-in/token-dependent optional synchronization and authenticated own-user request scoping in `assets/js/lib/workspace-sync.js` and `netlify/functions/api-workspace.js`. Read-only Supabase metadata confirmed `workspace_items` RLS with authenticated own-user SELECT, INSERT, UPDATE and DELETE policies. | No customer records, authenticated end-to-end transaction or cross-device sync was exercised. Wording continues to require a supported item and a successful request. |
| `vault.explicit-cloud-upload` | Source review of `assets/js/afro-vault.js` confirmed sign-in-dependent explicit upload, file limits and own-user storage paths. Read-only metadata confirmed a private `vault` bucket, own-user RLS on `vault_documents` and authenticated own-prefix storage SELECT/INSERT policies. | No upload, download or deletion occurred. Storage DELETE permission and retention guarantees were not established. Local downloads remain separate. |

The metadata query used `supabase_afrotools` MCP after verifying its project URL as `https://zpclagtgczsygrgztlts.supabase.co`. It read only table RLS flags, policy definitions and the vault bucket privacy flag. No user rows, files, tokens or credentials were read; no live writes occurred.

`lastVerifiedAt` represents this policy/evidence review, not production end-to-end account verification. API header, source build, artifact audit and deployed-commit verification remain separate release checks.
