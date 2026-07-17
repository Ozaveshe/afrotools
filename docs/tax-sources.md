# Tax Calculation Sources of Truth

Each PAYE engine references official tax legislation and government publications. This document maps each country's engine to its authoritative source.

---

## Tier 1 Engines (with AI Advisor)

### Nigeria (`engines/ng-paye.js`)
- **Authority:** Federal Inland Revenue Service (FIRS)
- **Legislation:** Personal Income Tax Act (PITA) 2011 as amended; Nigeria Tax Act (NTA) 2026
- **Tax tables:** PITA Schedule 6 (6 bands: 7%–24%); NTA (6 bands: 0%–21%)
- **CRA:** Higher of (₦200,000 + 20% of gross) or 1% of gross
- **Pension:** Pension Reform Act 2014 (8% employee mandatory)
- **NHF:** National Housing Fund Act (2.5% of basic)
- **Source URL:** https://www.firs.gov.ng
- **Last verified:** March 2026

### Kenya (`engines/ke-paye.js`)
- **Authority:** Kenya Revenue Authority (KRA)
- **Legislation:** Income Tax Act (Cap 470) as amended by Tax Laws (Amendment) Act 2024
- **Tax tables:** KRA 5-band monthly (10%–35%)
- **NSSF:** NSSF Act 2013 (Tier I: 6% up to 8,000; Tier II: 6% on 8,001–72,000)
- **SHIF:** SHA Act 2023 (2.75% of gross, min KES 300; replaced NHIF Oct 2024)
- **AHL:** Affordable Housing Levy (1.5% employee + 1.5% employer; not deductible from taxable income)
- **Personal Relief:** KES 2,400/month; insurance relief 15% of premium, max KES 5,000/month
- **Source URL:** https://www.kra.go.ke
- **Last verified:** March 2026

### Ghana (`engines/gh-paye.js`)
- **Authority:** Ghana Revenue Authority (GRA)
- **Legislation:** Income Tax Act 2015 (Act 896) as amended
- **Tax tables:** GRA 7-band monthly (0%–35%)
- **SSNIT:** National Pensions Act 2008 (5.5% employee, 13% employer; insurable cap GHS 61,000/yr)
- **Tier 3:** Voluntary deductible up to 16.5% of basic salary
- **Reliefs:** Marriage GHS 1,200; per child GHS 1,200 (max 2); disability GHS 6,000; old age (60+) GHS 1,500
- **Source URL:** https://gra.gov.gh
- **Last verified:** March 2026

### South Africa (`engines/za-paye.js`)
- **Authority:** South African Revenue Service (SARS)
- **Legislation:** Income Tax Act No. 58 of 1962 as amended
- **Tax tables:** SARS 2025/26 tax year (7 bands: 18%–45%)
- **Rebates:** Primary R17,235; Secondary (65+) R9,444; Tertiary (75+) R3,145
- **Thresholds:** Under-65: R95,750; 65+: R148,217; 75+: R165,689
- **UIF:** 1% employee, 1% employer (ceiling R212,544/yr = R17,712/month)
- **Retirement:** Deductible up to 27.5% of remuneration, max R350,000
- **Medical Credits:** R364/month (member + first dependent), R246/month (additional)
- **Source URL:** https://www.sars.gov.za
- **Last verified:** March 2026

### Egypt (`engines/eg-paye.js`)
- **Authority:** Egyptian Tax Authority (ETA)
- **Legislation:** Income Tax Law No. 91/2005 as amended by Law No. 7/2024
- **Tax tables:** ETA 7-band annual (0%–27.5%)
- **Bracket exclusion:** Tiering system at 6 thresholds (EGP 600K–1.2M) adds extra tax
- **NOSI:** 11% employee (annual cap EGP 174,000); 18.75% employer
- **Personal exemption:** EGP 20,000 (normal); EGP 30,000 (disabled)
- **Source URL:** https://www.eta.gov.eg
- **Last verified:** March 2026

### Tanzania (`engines/tz-paye.js`)
- **Authority:** Tanzania Revenue Authority (TRA)
- **Legislation:** Income Tax Act 2004 as amended by Finance Act 2024
- **Tax tables:** TRA 5-band monthly (0%–30%)
- **NSSF (private):** 10% employee + 10% employer
- **PSSSF (public):** 5% employee + 15% employer
- **Secondary employment:** Flat 30% rate (no 0% band)
- **Source URL:** https://www.tra.go.tz
- **Last verified:** March 2026

---

## Verification Notes

- All engines use **progressive tax calculation** (each band taxed at its own rate, not the entire income at the marginal rate)
- Social security caps are applied before tax calculation where applicable
- Reverse calculation uses binary search (50 iterations) for net-to-gross
- Test suite (`node tests/run.js`) verifies 214 test cases across all 6 engines
- Band boundary values are tested at exact thresholds to catch off-by-one errors
