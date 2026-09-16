# Leave country batch: SN, CI, CM, GH

Read-only source review, 16 September 2026. No country is accepted as fully current or fully implemented by this report. No entitlement data was changed.

## Repository source ownership

`tools/leave-calculator/index.html` owns the English inline `LEAVE_DATA`; `data/hr/leave-entitlements.js` owns the shared values consumed by `engines/hr-engine.js`, Swahili and French. The four shared entries have no dated primary URL ledger; Ghana alone names specific sections. The government source ledger contains service references, not these labour entitlements. Existing EN/shared base values match: SN 24/14/1, CI 24/14/3, CM 18/14/3, GH 15/12/0 (annual days/maternity weeks/paternity days). Matching values do not establish matching law.

## Senegal

Read and locally parsed the [public archive Code PDF](https://www.archives.sn/api/fichiers/8214312d-ddcc-44fe-896e-0265abaf1835), linked by its [catalogue](https://www.archives.sn/docs/codes/code-travail-senegal) as including the 2020 L.69 amendment. Pages 40–42: L.143 provides 14 consecutive maternity weeks, including eight after delivery, with a medically justified extension. L.148 provides two ouvrable days per month, seniority increments under applicable instruments, and one extra day per registered child under 14 for mothers. L.150 governs effective enjoyment after twelve months. L.149 addresses exceptional family permissions without establishing the app's one-day paternity amount.

Confirmed differences: English says two extra days per child; the read Code says one. All planners use an assumed two-week prenatal start, leaving twelve weeks after the due date instead of representing the statutory eight-week post-delivery condition. Missing actual birth date and extension inputs prevent exact implementation. Next: corroborate the archive against ministry text and applicable collective instruments, establish current family permission rules, then implement explicit prenatal/postnatal conditions. Do not turn missing paternity evidence into zero.

## Côte d'Ivoire

Read [government economic portal compilation](https://www.economie-ivoirienne.ci/sites/default/files/sites/default/files/inline-files/Loi%20n%C2%B0%202015-532%20du%2020%20juillet%202015%20portant%20code%20du%20Travail.pdf), printed pages 59 and 64–65. Article 25.1 is 2.2 ouvrable days per effective service month: twelve months arithmetically gives 26.4, not the apps' 24. Article 23.6 specifies six prenatal and eight postnatal weeks; multiple birth, medical and hospitalisation extensions are conditional. The generic two-week prenatal planner does not implement this.

The [CNDJ catalogue](https://biblio.cndj.ci/search/textes?number=2015-532&type=1) identifies ordinance 2021-902; full text redirects to login. The [public university 2025 compilation](https://www.uvci.online/portail/externes/documents/textes_officiels/Le_code_du_travail_ivoirien_-_20251.pdf) was retrieved, but relevant amended clauses still need complete inspection. The April 2026 implementing-decree announcement is a freshness signal; Presidency full-text retrieval returned 502. Before correction, confirm applicable amendment/decree scope and fractional entitlement rounding. Do not copy the 1995 ministry PDF: its two-day base explains the obsolete value but does not validate it.

## Cameroon

The [Finance Ministry code page](https://minfi.gov.cm/loi-n-092-007-regissant-les-rapports-de-travail-entre-les-travailleurs-et-les-employeurs/) exposes [Law 92/007 PDF](https://minfi.gov.cm/wp-content/uploads/2023/07/LOI_N_092_007_DU_14_A0UT_1992_portant_code_du_travail.pdf). Initial PDF retrieval succeeded; targeted further reading and local download timed out. Article 1 explicitly excludes personnel governed by specified public-service statutes. CNPS compilation alternate retrievals returned 500 or stalled and were stopped.

Not yet verified: article 84 maternity start/extension conditions, article 89 annual increments, three-day paternity provenance and current implementing instruments. Existing app amounts and six-month benefit eligibility remain unproven in this lane. No calculation correction is supported solely by retrieval of the cover and scope provisions.

## Ghana

Downloaded and locally parsed the [Employment Ministry Act 651 PDF](https://www.melr.gov.gh/files/publications/Labour_Act_-_2003.pdf), 259,368 bytes. Section 20 (printed page 12) gives at least fifteen working days in a calendar year of continuous service; section 21 includes a 200-day rule for work not regularly maintained year-round. Section 57 (pages 18–19) gives at least twelve maternity weeks with full remuneration/benefits, certification and conditional extensions.

Confirmed model limits: blanket “after 12 months” omits the calendar-year/irregular-work condition; no extension inputs; no proof that default two-week prenatal start is mandatory. The Act text contains no paternity match, which is not sufficient by itself to prove present-day zero. The official 2024 Labour Bill proposes changes; enactment/commencement must be checked before replacing existing rules. Preserve current base amounts pending that check.

## Next implementation boundary

Prioritize CI annual accrual and SN/CI maternity scheduling after the specific missing legal checks. Use a shared rule record with original units, employee scope, source version, base amount, eligibility and separately identified planning assumptions. Add actual birth date and conditional extensions only when source-supported; test expected calendar dates and locale outputs. The all-country conflict report remains open, and this four-country batch does not reduce its scope.
