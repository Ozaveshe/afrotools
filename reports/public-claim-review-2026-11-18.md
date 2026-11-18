# Qualified public claim review — 18 November 2026

Reviewed only performance.measured-support, account.optional-sync and vault.explicit-cloud-upload against preparation source 7be65a43e6b5b8e1129f1ebd82a2cb33467285c8 and unchanged main baseline 91204d67. Their existing meanings, permitted wording, five translations, exceptions and prohibition rules remain unchanged. Retained seven-day cadence: next review 25 November.

## Named-route local measurement

The off-tree adapter of scripts/mobile-network-smoke.js used installed Edge/Playwright, the owned source checkout, a 390×844 viewport, 900 Kbps download, 350 Kbps upload, 220 ms latency and 4× CPU throttle. It blocked other origins and service workers; original routes, thresholds and measurements were unchanged. Results remain local evidence, not a production/carrier benchmark, 2G/offline guarantee or universal device claim.

| Route | HTTP | Load ms | LCP ms | CLS | Result |
|---|---:|---:|---:|---:|---|
| / | 200 | 19640 | 7676 | 0.284 | WARN |
| /search/ | 200 | 10856 | 3736 | 0.054 | PASS |
| /salary-tax/ | 200 | 4850 | 4676 | 0.003 | WARN |
| /nigeria/ng-salary-tax | 200 | 11932 | 6552 | 0.342 | WARN |
| /tools/mobile-money-fees/ | 200 | 12945 | 2908 | 0.373 | WARN |
| /telecom/airtime-value/ | 200 | 13118 | 4752 | 0.001 | WARN |

All six documents loaded without navigation timeout; one PASS and five WARN results remain. All measured routes had zero horizontal overflow and no sub-16px form controls. Load/LCP/CLS warnings remain actionable. The local static server did not supply the telecom and data-freshness Functions. No failed measurement is represented as a pass.

## Conditional account synchronization and vault upload

Five account/vault source files match the previous reviewed bytes: workspace-sync.js, api-workspace.js, browser-session-auth.js, afro-vault.js and 005-user-vault.sql. Current inspection retains explicit selected-item requests, verified-user API scoping, local drafts and explicit signed-in vault uploads. The current synthetic CV cloud-consent suite passed all 16 tests, including permission withdrawal during token lookup, failed-service handling and private-data logging boundaries.

The configured AfroTools Supabase MCP verified project zpclagtgczsygrgztlts before each read. Metadata-only reads confirmed RLS on workspace_items and vault_documents and authenticated own-user SELECT/INSERT/UPDATE/DELETE policies. The vault bucket is private, limited to 10,485,760 bytes and PDF/PNG/JPEG. All four storage-object policies require authenticated own-folder access; vault INSERT/SELECT additionally identify the vault bucket.

No customer rows, credentials or files were read. No cloud write, upload or cross-device transaction was performed. This review supports the existing conditional wording only; actual service success, deletion, retention, quota atomicity and full account UI remain separate acceptance claims. No auth boundary or storage policy changed.

## Reproducibility

Run evidence: daily-5pm-publish-deploy-gate/runs/20261118-visitor-backlog. Current live references: live-read:afrotools-2026-11-18-workspace-rls and live-read:afrotools-2026-11-18-vault-bucket-and-rls. Historical reports remain preserved.

- performance-review/mobile-network-smoke.json — SHA256 96f1c0a56878c910f9c02c673a9afa9a1cb92cf55983fe7942b1f7be02346182
- performance-adapter.json — SHA256 10398b63b152225131abc9372b1515c16e68ffeb11182ef28eb28af86430fd05
- claims-live-metadata.json — SHA256 92adf617b5eaeafde4030fd00bd64f69e0dc6a73f3eeb9f506f99b2048875cd3
- claims-storage-policies.json — SHA256 c7db0f0c6f5192fb974328e9a555428e3c85d55b362470416109cd782493c730
- claims-metadata-validation.json — SHA256 3d572265b3670dcc69819f433d8e0faea637ccbd3c8007dc6871f4093cdf9624
- claims-source-comparison.json — SHA256 ed152bf53f171765e45e0cf760efc56a2f8012fa3d7274d1907d8e42bf0e34df
- claim-cv-consent.log — SHA256 e75337e79df8fb2e97557cec13e1a29e91a813ecfc96500b264c7afd38d1b1b1
