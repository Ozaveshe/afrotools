# Mobile-money native dependency review — 26 September 2026

CI run 36219097173 examined 1,146 test files and failed only the French native-owner fixture check. Its complete drift set contained one dependency: assets/js/pages/mobile-money-quote-parity.js. The browser smoke job passed; the build job was still running when this correction was prepared. This is not a full-suite pass.

Reviewed the complete dependency diff from publisher main b9591cd19424eee477db576b6d95459da686e4ec to candidate d5fdb6764f2c556919f4b42a46d6eb4b23c2f7af. The change adds native transaction labels, comparison participation, calculation/expiry timestamps and timezone context to visible/copied summaries. Quote inputs, validation, engine invocation, numeric calculations and JSON schema are unchanged. The quote engine and tariff data have no diff.

Only the reviewed dependency fingerprint is renewed, from a1f1aca3b9ce0c8cb9aec2ac39c5f0da7308f55a9e718cc471e4e934909bd1d9 to ec8a7b1ac342c699704622448f63432fe297eb2702cb9b5cf522f663095588bd, using the existing CRLF-to-LF normalization. Dependency-level provenance points here. Historical capturedFrom, page fingerprints, other dependencies, numeric oracle fixtures and strict drift assertions remain unchanged.

Behavioral evidence: reports/mobile-money-output-context-2026-09-26.md and reports/language-free-app-release-2026-09-26.md record the focused output cases and 62/62 optimized-artifact batch, including expiry, copy feedback and native context. The fixture repair requires the complete 20 extracted/14 native contract check plus focused mobile-money engine, fee finder, tariff-source, runtime-config and French editorial checks before commit. No product payload changes, new rate freshness claims or production verification are implied.

Validation completed: French extracted/native contracts 20/20 + 14/14 passed; focused Node checks 15/15 passed; whitespace check passed. No assertion was relaxed.
