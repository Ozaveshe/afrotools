# Sierra Leone PAYE consent ordering repair

Base: 45d2539063ae7753e57d4b997754afc94f2c2887. Fetch completed before creating isolated branch codex/consent-analytics-20260915; origin/main was 70d05731ef7175d7a4283e85a381bab599aff0f6.

## Finding and boundary

The site intentionally allows limited cookieless measurement after rejection (`cookies/index.html` and `assets/js/components/analytics-consent-v2.js`). `assets/js/lazy-analytics.js` establishes denied defaults before its sole config, keeps advertising permissions denied, and disables Google signals. A blanket no-POST assertion is not the privacy contract.

However, the Sierra Leone generated page retained a legacy inline gtag config before the shared loader. Fresh Chromium contexts at exact base with stored declined consent produced `_gcl_au`, `_ga`, and `_ga_D859CGF391` cookies and early Google/DoubleClick measurement requests before the later denied-state request. This was an actual ordering defect, not just a test-domain mismatch. Synthetic salary was absent from captured requests.

Removed the duplicate inline config from the generated page and added its removal to the shared PAYE generator's existing unsafe-runtime cleanup. No shared analytics policy, consent settings, tax rates, or acceptance ledger changed. No request allowlist was expanded.

The generator was run, but its frozen-source rebuild also reverted unrelated postprocessing across all 13 pages. Only the intended Sierra script removal was retained against the base output; unrelated churn was discarded.

## Verification

- `node -c scripts/build-sw-final-paye.js`: PASS.
- `node tests/analytics-consent.test.js`: PASS.
- `node tests/analytics-library.test.js`: PASS.
- `node tests/sw-paye-analytics-consent.browser.test.js` against isolated server port4196: PASS for declined and accepted fresh contexts, twice. The test uses the actual Google tag/network, verifies one config after the explicit default, denied advertising permissions, no salary in requests, no analytics/ad cookies under rejection, and analytics cookies in the accepted control. It does not save raw request payloads.
- Declined candidate: no cookies; accepted candidate: `_ga` and `_ga_D859CGF391`. Denied measurement POSTs still occur as disclosed.
- `git diff --check`: PASS.

The browser probe requires network access to Google and an available Playwright installation; provider/network outage can fail the accepted-storage control. No production or legal-compliance claim is made. No deployment performed.
