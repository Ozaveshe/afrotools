# Tunisia PAYE source contract

Scope: standard private non-agricultural employee, salary as sole income, no family or other individual relief. Annualize monthly inputs, calculate annually, then divide display values by12. Zero is valid. All locale pages must use the same engine.

## Primary evidence reviewed 15 September2026

- Tax administration2026 consolidated IRPP/IS code: https://jibaya.tn/wp-content/uploads/2026/03/11.pdf . Article26 physicalp21/printed45 requires mandatory pension/social deductions first, followed by10% of the remainder, capped atTND2000/year. Article44 physicalp48/printed72 retains eight bands: thresholds5000/10000/20000/30000/40000/50000/70000; rates0/15/25/30/33/36/38/40%. This2026 edition includes LF2026 amendments elsewhere.
- CNSS standard non-agricultural employer page: https://www.cnss.tn/fr/web/employeur/emp_asset_services/-/asset_publisher/sYQ8/content/emp_secteur-non_agr6_assiette . Full HTML retrieved via PowerShell after browser retrieval failed. Baseline9.18% employee and16.57% employer; employer-only accident/occupational disease contribution varies0.4–4% by activity and is excluded here.
- LF2025: https://www.finances.gov.tn/sites/default/files/2024-12/LF2025.pdf . Article17 physicalp5/printed6421 imposes additional0.5% on each employer and employee on wages declared toCNSS for economic job-loss insurance. Article84 physicalp37/printed6453 sets1January2025 commencement except contrary provisions. No separate commencement appears inarticle17. This establishes statutory commencement, not observation of actualCNSS collection. No collection notice was located.
- Tax administration note1/2026: https://jibaya.tn/wp-content/uploads/2026/01/مذكرة-عامة-عدد-1.pdf . Physicalp1 andp5–6 extend CSS0.5% to salaries paid1January–31December2026. Difference between schedule with every rate increased0.5points and normal schedule; equivalent0.5% of taxable income once exemption is exceeded. Sole salary/pension recipients with qualifying net annual income≤5000 after only family/situation relief remain exempt. Page4: CSS is not income-tax deductible.

Employee mandatory deduction9.68% is split9.18%CNSS plus0.5%job-loss. Employer contribution subtotal17.07% is split16.57% plus0.5%; it is not total employment cost. Exclude public/agricultural/special regimes, complementary pension, variable accident contribution, employerTFP/FOPROLOS, family relief, benefits/exemptions and irregular remuneration. No actual collection or official filing claim.

## Source owners before replacement

- English: `tunisia/tn-paye.html`, inline wrong-countryCNPS2.5% and tax-free300000 engine.
- Legacy French: `fr/tunisia/tn-paye.html`, generici18n from English plus `lang/pages/tunisia/tn-paye/fr.json`.
- Public French: `fr/tunisie/calculateur-salaire-net.html`, separate five-band inline engine; editorial overlay `scripts/upgrade-fr-payroll-trust-batch.js`.
- Swahili: `engines/src/sw-final-paye-engine.js` Tunisia profile; `scripts/build-sw-final-paye.js` owner; `assets/js/pages/sw-final-paye.js` runtime. Five obsolete bands, professional deduction incorrectly based on gross, noCSS. Generator injects misleading matches-English and reviewed9August claims.

Replacement owner must cover all four existing routes and retain their canonicals. Preserve annual/monthly, reverse calculation, breakdown, employer subtotal, local save/load/reset/copy/print, ungatedJSON/CSV/TXT/PDF, explicit-consent optionalAI and local explanation. No other country changes or acceptance-ledger edits.

## Interpretation and exact excerpts

Article26, printed45: “pour la couverture de régimes obligatoires de sécurité sociale”; professional expenses use “10% du reliquat après déduction de ces retenues”. The job-loss contribution is treated as such social insurance by default because its statutory purpose is compulsory coverage of unemployment risk. No explicit tax-administration confirmation of this particular deduction was located. The UI exposes both treatments; engine metadata and every export carry the unresolved interpretation. The cash withholding remains payable in both scenarios.

LF2025 article84, printed6453: “تطبق أحكام هذا القانون بداية من غرة جانفي 2025”. Article17 separately establishes the0.5% contribution for each party. Statutory commencement is not evidence of actual collection.

CSS note1/2026 physicalp6: “بعد طرح التخفيضات بعنوان الحالة والأعباء العائلية فحسب”. The exemption threshold is net salary underarticle26 minus only family/situation allowances; it is not necessarily the IRPP base after other personal relief. Since this calculator excludes all such relief, `cssExemptionBasis` equals `taxable`; the separate field and comment prevent future accidental reuse after adding deductions.

## Independently derived fixtures (TND)

- IRPP cumulative tax at taxable5000/10000/20000/30000/40000/50000/70000:0/750/3250/6250/9550/13150/20750. Test either side by0.001 at the adjoining marginal rate.
- Annual gross12000: cash deductions1161.6; default deductible remainder10838.4; professional1083.84; taxable9754.56; IRPP713.184; CSS48.7728; annual net10076.4432 and monthly839.7036.
- Same gross, job-loss contribution not tax-deductible: professional1089.84; taxable9808.56; IRPP721.284; CSS49.0428; annual net10068.0732. Cash contributions unchanged.
- Annual gross36000: mandatory3484.8; professional capped2000; taxable30515.2; IRPP6250+515.2×0.33=6420.016; CSS152.576; net25942.608.
- CSS threshold default gross =5000/(0.9032×0.9), before the professional cap. It has a small downward net jump immediately above it. Reverse solver searches each monotonic segment separately on a0.001TND input grid; it must return the lowest gross satisfying the requested net.

Base: fetch observed origin/main70d05731ef7175d7a4283e85a381bab599aff0f6; coordinator explicitly requested branch from45d2539063ae7753e57d4b997754afc94f2c2887. No actualCNSS collection, live provider or deployment verification.
