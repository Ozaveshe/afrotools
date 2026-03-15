# CHANGELOG - Phase 7: Calculator Accuracy & Testing

**Date:** March 2026
**Goal:** Guarantee that every tax calculator is correct and stays correct.

---

## New Files Created

### `/tests/run.js`
Zero-dependency Node.js test runner:
- Loads IIFE engines via `vm.runInNewContext` with mock `window` object
- Provides `assert()`, `assertEqual()`, `assertClose()` helpers
- Colored output, grouped by engine
- Summary with total/passed/failed counts
- Exit code 1 on failure (suitable for CI/CD)
- Run: `node tests/run.js`

### `/tests/engines/ng-paye.test.js` — 41 tests
Nigeria PAYE engine tests covering:
- PITA 2025 and NTA 2026 regimes
- Exempt threshold (₦840,000)
- CRA calculation (higher of ₦200K+20% or 1%)
- Band progression at ₦5M and ₦20M
- Rent relief (NTA only)
- Pension, NHF, all deductions combinations
- Reverse calc round-trip
- Input validation

### `/tests/engines/ke-paye.test.js` — 31 tests
Kenya PAYE engine tests covering:
- NSSF Tier I/II with caps
- SHIF 2.75% calculation
- AHL 1.5% (not tax-deductible)
- Personal relief KES 2,400/month
- Disability exemption (KES 150,000/month)
- ₦100K and ₦1M salary scenarios
- Employer cost calculations
- Reverse calc round-trip

### `/tests/engines/gh-paye.test.js` — 32 tests
Ghana PAYE engine tests covering:
- SSNIT 5.5% with insurable cap (GHS 61,000)
- 7-band GRA tax progression
- Tier 3 voluntary pension optimization
- Bonus tax (resident 5%, non-resident 10%)
- Marriage/child reliefs with caps
- Reverse calc round-trip

### `/tests/engines/za-paye.test.js` — 36 tests
South Africa PAYE engine tests covering:
- SARS 2025/26 7-band tax tables
- Age-based rebates (under-65, 65+, 75+)
- Tax-free thresholds (R95,750 / R148,217 / R165,689)
- Medical tax credits (member + dependents)
- UIF with annual ceiling (R212,544)
- Retirement deduction cap (27.5%, max R350,000)
- Employer SDL and UIF
- Reverse calc round-trip

### `/tests/engines/eg-paye.test.js` — 37 tests
Egypt PAYE engine tests covering:
- Personal exemption (EGP 20,000 normal / 30,000 disabled)
- Bracket exclusion (tiering) at all 6 thresholds
- NOSI 11% with annual cap (EGP 174,000)
- Standard tax vs exclusion extra
- Employer NOSI calculation
- Reverse calc round-trip

### `/tests/engines/tz-paye.test.js` — 35 tests
Tanzania PAYE engine tests covering:
- TRA 5-band monthly tax progression
- Private sector (10%+10% NSSF) vs public sector (5%+15% PSSSF)
- Secondary employment flat 30% rate
- No-NSSF option
- Employer cost calculations
- Reverse calc for both sectors

### `/docs/tax-sources.md`
Source of truth documentation for all 6 Tier 1 engines:
- Revenue authority name and URL
- Legislation reference
- Tax table specification
- Social security details
- Last verified date

---

## Test Results

```
=== AfroTools PAYE Engine Tests ===
  Nigeria PAYE  (ng-paye.js) — 41 ✓
  Kenya PAYE    (ke-paye.js) — 31 ✓
  Ghana PAYE    (gh-paye.js) — 32 ✓
  South Africa  (za-paye.js) — 36 ✓
  Egypt PAYE    (eg-paye.js) — 37 ✓
  Tanzania PAYE (tz-paye.js) — 35 ✓

  Total:  214
  Passed: 214
  Failed: 0
```
