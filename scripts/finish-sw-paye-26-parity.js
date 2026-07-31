#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/localization/sw-paye-26-parity.json"), "utf8"),
);

const GLOBAL_REPLACEMENTS = [
  [
    "Bure accounts can save up to ",
    "Akaunti za bure zinaweza kuhifadhi hadi ",
  ],
  [
    " tools. Upgrade to Pro for unlimited saves.",
    " zana. Boresha hadi Pro ili uhifadhi bila kikomo.",
  ],
  [
    "Be concise, specific, practical.",
    "Jibu kwa ufupi, kwa usahihi na kwa vitendo.",
  ],
  [
    "Be concise, specific, and practical.",
    "Jibu kwa ufupi, kwa usahihi na kwa vitendo.",
  ],
  ["My Mshahara Halisi", "Mshahara Wangu Halisi"],
  ["Tax (", "Kodi ("],
  ["IUTS Tax", "Kodi ya IUTS"],
  ["IRPP Tax", "Kodi ya IRPP"],
  ["DGID Tax", "Kodi ya DGID"],
  ["Income Tax", "Kodi ya Mapato"],
  ["Tax Before Rebate", "Kodi Kabla ya Punguzo"],
  ["Tax Rebate", "Punguzo la Kodi"],
  ["ENPF Pension", "Pensheni ya ENPF"],
  ["Pension Fund", "Mfuko wa Pensheni"],
  ["Emp Pension", "Pensheni ya Mwajiri"],
  ["Tax + Tozo ya AIDS", "Kodi pamoja na Tozo ya AIDS"],
  ["Gross → Net", "Ghafi → Halisi"],
  ["Net → Gross", "Halisi → Ghafi"],
  ["Monthly Take-Home Pay", "Mshahara Halisi wa Mwezi"],
  ["Annual Take-Home Pay", "Mshahara Halisi wa Mwaka"],
  ["CFA Franc", "Faranga ya CFA"],
  ["Franc CFA", "Faranga ya CFA"],
  [" per mabanda", " kwa kutumia mabanda"],
  ["Mseja / divorced / widowed", "Mseja / ametalikiwa / mjane"],
  ["family quotient", "mgawo wa familia"],
  ["Business Tax Act", "Sheria ya Kodi ya Biashara"],
  ["Individual Tax Return", "Tamko la Kodi la Mtu Binafsi"],
  ["Local Service Tax", "Kodi ya Huduma za Mitaa"],
  ["Public Service Social Security Fund", "Mfuko wa Hifadhi ya Jamii wa Watumishi wa Umma"],
  ['aria-label="GrossSalary"', 'aria-label="Mshahara Ghafi"'],
  ['aria-label="SalarySlider"', 'aria-label="Kitelezeshi cha Mshahara"'],
  ['aria-label="DependentChildren"', 'aria-label="Watoto Wategemezi"'],
  ['aria-label="Breadcrumb"', 'aria-label="Njia ya kurudi"'],
  ["PAYE analysis", "uchambuzi wa PAYE"],
  ["IUTS analysis", "uchambuzi wa IUTS"],
  ["IRPP analysis", "uchambuzi wa IRPP"],
  ["ITS analysis", "uchambuzi wa ITS"],
  ["Family parts", "Sehemu za familia"],
  ["Family Parts", "Sehemu za Familia"],
  [">1.0 part<", ">Sehemu 1.0<"],
  [">1.5 parts<", ">Sehemu 1.5<"],
  [">2.0 parts<", ">Sehemu 2.0<"],
  [">2.5 parts<", ">Sehemu 2.5<"],
  [">3.0 parts<", ">Sehemu 3.0<"],
  [">3.5 parts<", ">Sehemu 3.5<"],
  [">4.0 parts<", ">Sehemu 4.0<"],
  [">4.5 parts<", ">Sehemu 4.5<"],
  [">5.0 parts<", ">Sehemu 5.0<"],
  ["Family status", "Hali ya familia"],
  ["Dependent children", "Watoto wategemezi"],
  ["Sector", "Sekta"],
  [" sector", " sekta"],
  ["chargeable income estimate", "makadirio ya mapato yanayotozwa kodi"],
  ["before tozo ya AIDS", "kabla ya tozo ya AIDS"],
  ["throw new hitilafu(", "throw new Error("],
];

const COUNTRY_REPLACEMENTS = {
  angola: [
    ["3% — tax-deductible", "3% — inapunguzwa kwenye kodi"],
    ["- INSS employee (", "- INSS ya mfanyakazi ("],
    [
      "AGT progressive tax, INSS",
      "kodi ya hatua ya AGT, INSS",
    ],
  ],
  "burkina-faso": [
    ["CNSS (employee)", "CNSS (mfanyakazi)"],
    ["- CNSS employee (", "- CNSS ya mfanyakazi ("],
    [
      "DGI progressive tax, CNSS 5.5% with yenye kikomo mchango msingi",
      "kodi ya hatua ya DGI, CNSS 5.5% yenye msingi wa mchango ulio na kikomo",
    ],
    [
      "civil-service note selected; CNSS employee msingi hesabu used",
      "maelezo ya utumishi wa umma yamechaguliwa; msingi wa hesabu wa CNSS ya mfanyakazi umetumika",
    ],
    [
      "Civil-service note selected; hesabu still uses Mfano wa kawaida wa mfanyakazi wa CNSS",
      "Maelezo ya utumishi wa umma yamechaguliwa; hesabu bado inatumia mfano wa kawaida wa mfanyakazi wa CNSS",
    ],
  ],
  cameroon: [
    ["Employer baseline CNPS", "Makadirio ya msingi ya CNPS ya mwajiri"],
    ["Makato Before IRPP", "Makato Kabla ya IRPP"],
    ["CNPS employee pension (4.2%)", "Pensheni ya CNPS ya mfanyakazi (4.2%)"],
    ["CAC (10% of IRPP)", "CAC (10% ya IRPP)"],
    [
      "<strong>Baseline Gharama ya Mwajiri: ${fmt(RESULT.empCost)}/mwaka</strong><br>Gross + capped CNPS baseline ${fmt(empCNPS)}/mwaka. Accident-at-work premiums vary by risk group.",
      "<strong>Makadirio ya Gharama ya Mwajiri: ${fmt(RESULT.empCost)}/mwaka</strong><br>Ghafi pamoja na makadirio ya CNPS yenye kikomo ${fmt(empCNPS)}/mwaka. Malipo ya ajali kazini hutofautiana kulingana na kundi la hatari.",
    ],
    ["CNPS (employee 4.2%)", "CNPS (mfanyakazi 4.2%)"],
  ],
  "central-african-republic": [
    ["XAF gross →", "Ghafi XAF →"],
    ["    + '\n</body></html>';", "    + '</body></html>';"],
  ],
  chad: [
    ["- CNPS employee (", "- CNPS ya mfanyakazi ("],
    [
      "DGI IRPP progressive tax, CNPS (3.5% ya mfanyakazi / 16.5% employer)",
      "kodi ya hatua ya DGI IRPP, CNPS (3.5% ya mfanyakazi / 16.5% ya mwajiri)",
    ],
  ],
  "cote-divoire": [
    [
      "Côte d'Ivoire payroll tax, ITS, RICF na CNPS contributions",
      "kodi ya mishahara ya Côte d'Ivoire, ITS, RICF na michango ya CNPS",
    ],
    [
      "Employer baseline social cost",
      "Makadirio ya gharama za kijamii za mwajiri",
    ],
    [
      "Côte d'Ivoire uses the XOF (West African CFA franc), fixed to the euro at 655.957. This kikokotoo shows a",
      "Côte d'Ivoire hutumia XOF (faranga ya CFA ya Afrika Magharibi), iliyofungwa kwa euro kwa 655.957. Kikokotoo hiki kinaonyesha",
    ],
    ["</a> and <a", "</a> na <a"],
    [
      "CNPS employee retirement: 6.3% ya ghafi and deductible before ITS. RICF is applied by family parts. Employer cost shown on this page is a baseline estimate using the default 2% accident-at-work rate.",
      "Pensheni ya CNPS ya mfanyakazi: 6.3% ya ghafi na inapunguzwa kabla ya ITS. RICF hutumika kwa sehemu za familia. Gharama ya mwajiri kwenye ukurasa huu ni makadirio ya msingi yanayotumia kiwango cha kawaida cha ajali kazini cha 2%.",
    ],
    [
      "<strong>Baseline Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Gross + baseline social cost ${fmt(empCNPS)}/mwezi. Uses the default 2% accident-at-work rate.",
      "<strong>Makadirio ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Ghafi pamoja na gharama za kijamii za msingi ${fmt(empCNPS)}/mwezi. Kiwango cha kawaida cha ajali kazini cha 2% kimetumika.",
    ],
    ["- CNPS employee (", "- CNPS ya mfanyakazi ("],
  ],
  egypt: [
    [
      "High earners progressively lose access to lower bands. Zaidi ya EGP 600,000 the 0% band is lost. Zaidi ya EGP 1,200,000 only the 25%/27.5% bands apply. This is unique to Egypt — most tools ignore it.",
      "Wenye mapato ya juu hupoteza mabanda ya chini hatua kwa hatua. Zaidi ya EGP 600,000 bendi ya 0% huondolewa. Zaidi ya EGP 1,200,000 mabanda ya 25% na 27.5% pekee hutumika. Hii ni kanuni maalum ya Misri ambayo vikokotoo vingi huikosa.",
    ],
    [
      "National Organization for Social Insurance (NOSI) ni mfumo wa hifadhi ya jamii wa Misri.",
      "NOSI (National Organization for Social Insurance) ni mfumo wa hifadhi ya jamii wa Misri.",
    ],
    ["insurable salary", "mshahara unaokatiwa bima"],
    ["minimum EGP 2,300", "kiwango cha chini EGP 2,300"],
    [
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(totalEmployerCost / 12)}/mwezi</strong><br>Gross + NOSI ${fmt(employerNosi / 12)}/mwezi + health ins. ${fmt(employerHealth / 12)}/mwezi.",
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(totalEmployerCost / 12)}/mwezi</strong><br>Ghafi pamoja na NOSI ${fmt(employerNosi / 12)}/mwezi na bima ya afya ${fmt(employerHealth / 12)}/mwezi.",
    ],
    ["Net Taxable Income (NATI)", "Mapato Halisi Yanayotozwa Kodi (NATI)"],
    ["Kodi ya mapato (progressive, ETA)", "Kodi ya mapato (hatua, ETA)"],
    ["Bracket exclusion applied:", "Utaratibu wa kuondoa bendi umetumika:"],
    [" lower brackets have been removed.", " bendi za chini zimeondolewa."],
    [" lower bracket has been removed.", " bendi ya chini imeondolewa."],
    [
      "Extra tax vs. standard progressive:",
      "Kodi ya ziada dhidi ya hesabu ya kawaida ya hatua:",
    ],
    [
      "Extra tax vs. hesabu ya kawaida ya hatua:",
      "Kodi ya ziada dhidi ya hesabu ya kawaida ya hatua:",
    ],
    ["Most calculators miss this.", "Vikokotoo vingi huikosa kanuni hii."],
  ],
  "equatorial-guinea": [
    ["<strong>Disclaimer:</strong>", "<strong>Tahadhari:</strong>"],
  ],
  eswatini: [
    ["5% ya mfanyakazi (capped E215/mwezi)", "5% ya mfanyakazi (kikomo E215/mwezi)"],
    [
      "Kokotoa mshahara wako kwanza — nitachambua your ERA PAYE position and kueleza ENPF and rebate implications for Eswatini.",
      "Kokotoa mshahara wako kwanza — nitachambua hali yako ya PAYE ya ERA na kueleza athari za ENPF na punguzo la kodi nchini Eswatini.",
    ],
    [
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCost)}/mwaka</strong><br>Gross salary + employer ENPF (5%)",
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCost)}/mwaka</strong><br>Mshahara ghafi pamoja na ENPF ya mwajiri (5%)",
    ],
    ["ENPF Pension (5%, capped)", "Pensheni ya ENPF (5%, yenye kikomo)"],
    ["Taxable Income", "Mapato Yanayotozwa Kodi"],
    ["ENPF (Employee)", "ENPF (Mfanyakazi)"],
    ["ENPF (Employer)", "ENPF (Mwajiri)"],
    ["ENPF Pension (employee)", "Pensheni ya ENPF (mfanyakazi)"],
    ["- ENPF deduction (", "- Punguzo la ENPF ("],
    [
      "ERA progressive tax, ENPF pension, tax rebate",
      "kodi ya hatua ya ERA, pensheni ya ENPF na punguzo la kodi",
    ],
  ],
  ethiopia: [
    ["\n- Mwajiri Pension (11%): ETB ", "\n- Pensheni ya Mwajiri (11%): ETB "],
    ["18% (7% employee + 11% employer)", "18% (7% mfanyakazi + 11% mwajiri)"],
    [
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Gross + Employer Pension ${fmt(empPension)}/mwezi (11%).",
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Ghafi pamoja na pensheni ya mwajiri ${fmt(empPension)}/mwezi (11%).",
    ],
    ["Employee Pension", "Pensheni ya Mfanyakazi"],
    ["Employer Pension", "Pensheni ya Mwajiri"],
    [
      "Jumla 18% of salary: 7% employee + 11% employer.",
      "Jumla ni 18% ya mshahara: 7% ya mfanyakazi na 11% ya mwajiri.",
    ],
    ["- Pension Fund employee (", "- Mfuko wa Pensheni wa mfanyakazi ("],
    [" pensheni deduction:", " punguzo la pensheni:"],
    [
      "Ethiopian PAYE — ERCA progressive tax",
      "PAYE ya Ethiopia — kodi ya hatua ya ERCA",
    ],
  ],
  gabon: [
    [" dependent children)", " watoto wategemezi)"],
    [
      "CNSS employee (${pct(R.socialRate)}, subject to CNSS ceiling)",
      "CNSS ya mfanyakazi (${pct(R.socialRate)}, chini ya kikomo cha CNSS)",
    ],
    [
      "Mapato yanayotozwa kodi before quotient",
      "Mapato yanayotozwa kodi kabla ya mgawo",
    ],
    ["CNSS Employee", "CNSS ya Mfanyakazi"],
    ["CNSS Employer", "CNSS ya Mwajiri"],
    ["CNSS (employee 2.5%)", "CNSS (mfanyakazi 2.5%)"],
    [
      "19.1% of gross: 16.6% employer + 2.5% ya mfanyakazi.",
      "19.1% ya ghafi: 16.6% ya mwajiri na 2.5% ya mfanyakazi.",
    ],
    [
      "declared remuneration is plafonnée na filed on the rasmi quarterly timetable.",
      "malipo yaliyotangazwa yana kikomo na huwasilishwa kwa ratiba rasmi ya kila robo mwaka.",
    ],
    ["My Gabon IRPP breakdown:", "Muhtasari wangu wa IRPP wa Gabon:"],
    ["- CNSS employee (", "- CNSS ya mfanyakazi ("],
    [" CNSS deduction:", " punguzo la CNSS:"],
    ["- CNSS employer (", "- CNSS ya mwajiri ("],
    [
      "2) Two practical payroll checks to confirm with HR or DGI/CNSS 3) Jambo moja la kuzingatia la ufuataji to know 4) One thing most Gabonese employees get wrong about CNSS, the family quotient, or IRPP.",
      "2) Ukaguzi mbili za mishahara za kuthibitisha na HR au DGI/CNSS 3) Jambo moja la kuzingatia la ufuataji 4) Kosa moja la kawaida kuhusu CNSS, mgawo wa familia au IRPP.",
    ],
    [
      "DGI progressive tax, CNSS",
      "kodi ya hatua ya DGI, CNSS",
    ],
    ["${R.sector} sector", "sekta ya ${R.sector}"],
  ],
  guinea: [
    ["<strong>5%</strong> on GNF 1M-3M", "<strong>5%</strong> kwa GNF 1M-3M"],
    ["<strong>8%</strong> on GNF 3M-5M", "<strong>8%</strong> kwa GNF 3M-5M"],
    ["<strong>10%</strong> on GNF 5M-10M", "<strong>10%</strong> kwa GNF 5M-10M"],
    ["<strong>15%</strong> on GNF 10M-20M", "<strong>15%</strong> kwa GNF 10M-20M"],
    [", and <strong>20%</strong>", ", na <strong>20%</strong>"],
    ["CNSS (employee)", "CNSS (mfanyakazi)"],
    ["CNSS (employer)", "CNSS (mwajiri)"],
    [" on covered salary)", " kwa mshahara unaokatiwa bima)"],
    [
      "Article 63 sets the monthly 0%-20% salary-tax table na Article 58 allows deduction of mandatory social insurance from taxable salary.",
      "Kifungu cha 63 kinaweka jedwali la kila mwezi la kodi ya mshahara la 0%-20%, na Kifungu cha 58 kinaruhusu kupunguza bima ya jamii ya lazima kutoka mshahara unaotozwa kodi.",
    ],
  ],
  lesotho: [
    ["Punguzo la kodi (tax credit)", "Punguzo la kodi"],
    ["punguzo la mapato (tax deduction)", "punguzo la mapato"],
  ],
  malawi: [
    ["/mwezi · Pension: ", "/mwezi · Pensheni: "],
    [
      "<strong>Jumla ya Gharama ya Mwajiri: MWK\\u00A0' + Math.round(RESULT.totalEmployerCost / d).toLocaleString('en-MW') + '/' + (PERIOD==='monthly'?'mo':'yr') + '</strong><br>Gross salary plus mandatory employer pension contribution of 10%.",
      "<strong>Jumla ya Gharama ya Mwajiri: MWK\\u00A0' + Math.round(RESULT.totalEmployerCost / d).toLocaleString('en-MW') + '/' + (PERIOD==='monthly'?'mwezi':'mwaka') + '</strong><br>Mshahara ghafi pamoja na mchango wa lazima wa pensheni wa mwajiri wa 10%.",
    ],
    ["Employee pension (5%)", "Pensheni ya mfanyakazi (5%)"],
    ["Employee Pension", "Pensheni ya Mfanyakazi"],
    ["Employer Pension", "Pensheni ya Mwajiri"],
    [
      "Four progressive bands effective Januari 2026: 0% kwa first MWK 170,000; 30% kwa MWK 170,001–1,570,000; 35% kwa MWK 1,570,001–10,000,000; 40% above MWK 10,000,000. Kikokotoo hiki pia kinakadiria the kawaida 5% ya mfanyakazi pension deduction na 10% pensheni ya mwajiri mchango under Malawi's pension framework.",
      "Mabanda manne ya hatua yanatumika kuanzia Januari 2026: 0% kwa MWK 170,000 za kwanza; 30% kwa MWK 170,001–1,570,000; 35% kwa MWK 1,570,001–10,000,000; na 40% zaidi ya MWK 10,000,000. Kikokotoo hiki pia kinakadiria punguzo la kawaida la pensheni la mfanyakazi la 5% na mchango wa pensheni wa mwajiri wa 10% chini ya mfumo wa pensheni wa Malawi.",
    ],
    [
      "Toa: 1) Muhtasari wa wazi kwa Kiswahili of Malawi PAYE position 2) Two specific payroll or pension points that affect mapato yanayotozwa kodi 3) Jambo moja muhimu la uzingatiaji to know",
      "Toa: 1) Muhtasari wazi kwa Kiswahili wa hali ya PAYE ya Malawi 2) Hoja mbili mahususi za mishahara au pensheni zinazoathiri mapato yanayotozwa kodi 3) Jambo moja muhimu la uzingatiaji",
    ],
    [
      "MRA progressive tax",
      "kodi ya hatua ya MRA",
    ],
  ],
  mali: [
    ["Standard DGI family reduction", "Punguzo la kawaida la familia la DGI"],
    [
      "INPS (Institut National de Prévoyance Sociale) mchango wa mfanyakazi is unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi before ITS is calculated. Administered by DGI Mali.",
      "Mchango wa mfanyakazi wa INPS (Institut National de Prévoyance Sociale) unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi kabla ya ITS kuhesabiwa. Unasimamiwa na DGI Mali.",
    ],
    [
      "Mali's payroll income tax, known as ITS (Impôt sur les Traitements et Salaires), is administered by DGI (Direction Générale des Impôts). The system uses five kila mwezi progressive bands ranging from 0% to 36%, calculated on taxable income after the INPS mchango wa mfanyakazi (3.6%) is deducted. Employers withhold ITS each month and remit to DGI by the 7th of the following month.",
      "Kodi ya mapato ya mishahara ya Mali, inayojulikana kama ITS (Impôt sur les Traitements et Salaires), inasimamiwa na DGI (Direction Générale des Impôts). Mfumo hutumia mabanda matano ya hatua ya kila mwezi kutoka 0% hadi 36%, yakikokotolewa kwa mapato yanayotozwa kodi baada ya mchango wa mfanyakazi wa INPS wa 3.6% kupunguzwa. Waajiri hukata ITS kila mwezi na kuiwasilisha DGI ifikapo tarehe 7 ya mwezi unaofuata.",
    ],
    [
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Gross + INPS employer ${fmt(empSocial)}/mwezi (12%). No SDL or WCF in Mali.",
      "<strong>Jumla ya Gharama ya Mwajiri: ${fmt(RESULT.totalEmployerCostMonthly)}/mwezi</strong><br>Ghafi pamoja na INPS ya mwajiri ${fmt(empSocial)}/mwezi (12%). Hakuna SDL wala WCF nchini Mali.",
    ],
    ["INPS (employee, 3.6%)", "INPS (mfanyakazi, 3.6%)"],
    ["- INPS employee (", "- INPS ya mfanyakazi ("],
    [" INPS deduction:", " punguzo la INPS:"],
    [
      "DGI progressive tax, kawaida punguzo la familias, INPS social security",
      "kodi ya hatua ya DGI, punguzo la kawaida la familia na hifadhi ya jamii ya INPS",
    ],
    [
      "${R.familyStatus} status, ${R.dependentChildren} dependent children",
      "hali ya ${R.familyStatus}, watoto wategemezi ${R.dependentChildren}",
    ],
    ["ITS before unafuu wa familia", "ITS kabla ya unafuu wa familia"],
  ],
  mauritius: [
    [
      "/mwezi\n- kila mwezi chargeable income estimate:",
      "/mwezi\n- makadirio ya mapato yanayotozwa kodi kwa mwezi:",
    ],
    [
      "Mauritian PAYE — MRA progressive tax",
      "PAYE ya Morisi — kodi ya hatua ya MRA",
    ],
    ["${R.sector} sector", "sekta ya ${R.sector}"],
  ],
  niger: [
    [
      "0% employee; 10.15% employer-only detached case",
      "0% ya mfanyakazi; 10.15% ya mwajiri pekee kwa mtumishi aliyehamishwa",
    ],
    [
      "(${pct(empSocialRate)} on capped XOF 500,000 base). No SDL or WCF in Niger.",
      "(${pct(empSocialRate)} kwa msingi wenye kikomo cha XOF 500,000). Hakuna SDL wala WCF nchini Nijeri.",
    ],
    [
      "CNSS retirement (${pct(R.socialRate)}, capped at ${fmt(R.socialCap)})",
      "Pensheni ya CNSS (${pct(R.socialRate)}, kikomo ${fmt(R.socialCap)})",
    ],
    ["Employer Social", "Michango ya Kijamii ya Mwajiri"],
    ["CNSS (employee)", "CNSS (mfanyakazi)"],
    ["- CNSS employee (", "- CNSS ya mfanyakazi ("],
    [
      "DGI progressive tax na CNSS payroll charges, including yenye kikomo salary-worker contributions na the detached-civil-servant employer-only case.",
      "kodi ya hatua ya DGI na tozo za mishahara za CNSS, ikijumuisha michango yenye kikomo ya mfanyakazi na hali ya mwajiri pekee kwa mtumishi wa umma aliyehamishwa.",
    ],
    [
      "${R.sector === 'private' ? 'salary-worker CNSS case' : 'detached civil-servant case'}",
      "${R.sector === 'private' ? 'hali ya mfanyakazi wa mshahara wa CNSS' : 'hali ya mtumishi wa umma aliyehamishwa'}",
    ],
  ],
  senegal: [
    ["CSS (5.6%, tax-deductible)", "CSS (5.6%, inapunguzwa kwenye kodi)"],
    ["CSS (employee)", "CSS (mfanyakazi)"],
    ["- CSS employee (", "- CSS ya mfanyakazi ("],
    [
      "DGID — progressive tax, CSS contributions",
      "DGID — kodi ya hatua na michango ya CSS",
    ],
  ],
  seychelles: [
    ["standard SPF-covered payroll", "mshahara wa kawaida unaosimamiwa na SPF"],
    ["Ghafi + pensheni ya SPF ${fmt(empSocial)}/mwezi (5% employer).", "Ghafi pamoja na pensheni ya SPF ${fmt(empSocial)}/mwezi (5% ya mwajiri)."],
    ["Pensheni ya SPF (employer)", "Pensheni ya SPF (mwajiri)"],
    ["- Pensheni ya SPF employee (", "- Pensheni ya SPF ya mfanyakazi ("],
    [
      "SRC progressive tax, SPF pension",
      "kodi ya hatua ya SRC na pensheni ya SPF",
    ],
  ],
  tanzania: [
    [" (progressive taxation)", ""],
  ],
  uganda: [
    [" (progressive taxation)", ""],
  ],
  zambia: [
    ["NAPSA · Capped", "NAPSA · Yenye kikomo"],
    ["- NAPSA employee (", "- NAPSA ya mfanyakazi ("],
    [
      "Zambian PAYE — ZRA progressive tax, NAPSA with capping",
      "PAYE ya Zambia — kodi ya hatua ya ZRA na NAPSA yenye kikomo",
    ],
  ],
  zimbabwe: [
    ["Tax + tozo ya AIDS", "Kodi pamoja na tozo ya AIDS"],
    ["NSSA (4.5%, capped)", "NSSA (4.5%, yenye kikomo)"],
    ["- NSSA employee (", "- NSSA ya mfanyakazi ("],
    [
      "2) Two payroll points that affect mapato yanayotozwa kodi or tozo ya AIDS",
      "2) Hoja mbili za mishahara zinazoathiri mapato yanayotozwa kodi au tozo ya AIDS",
    ],
    [" about NSSA.", " kuhusu NSSA."],
    ["Kodi ya mapato before tozo ya AIDS", "Kodi ya mapato kabla ya tozo ya AIDS"],
    [
      "Zimbabwean PAYE — ZIMRA progressive tax",
      "PAYE ya Zimbabwe — kodi ya hatua ya ZIMRA",
    ],
  ],
};

const MODE_LOCALIZER = `<script data-sw-paye-mode-localizer>
(function () {
  "use strict";
  const replacements = new Map([
    ["Gross → Net", "Ghafi → Halisi"],
    ["Net → Gross", "Halisi → Ghafi"],
    ["Monthly Take-Home Pay", "Mshahara Halisi wa Mwezi"],
    ["Annual Take-Home Pay", "Mshahara Halisi wa Mwaka"],
    ["Required Monthly Gross", "Mshahara Ghafi wa Mwezi Unaohitajika"],
    ["Required Annual Gross", "Mshahara Ghafi wa Mwaka Unaohitajika"],
    ["Desired Monthly Take-Home", "Mshahara Halisi wa Mwezi Unaolengwa"],
    ["Desired take-home amount", "Kiasi cha Mshahara Halisi Kinacholengwa"]
  ]);
  function localizeModeCopy() {
    document.querySelectorAll(".mode-toggle .mode-btn, #resLabel, .res-hero-label, .slider-label, .f-label-text")
      .forEach(function (element) {
        const current = (element.textContent || "").trim();
        if (replacements.has(current)) element.textContent = replacements.get(current);
      });
    const grossLine = document.getElementById("resGross") || document.querySelector(".res-hero-gross");
    if (grossLine && /Gross:|Take-home:/.test(grossLine.textContent || "")) {
      grossLine.textContent = grossLine.textContent
        .replace(/Gross:/g, "Ghafi:")
        .replace(/Take-home:/g, "Halisi:")
        .replace(/\\/month/g, "/mwezi")
        .replace(/\\/year/g, "/mwaka");
    }
  }
  document.addEventListener("DOMContentLoaded", localizeModeCopy);
  new MutationObserver(localizeModeCopy).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
  setTimeout(localizeModeCopy, 150);
}());
</script>`;

function applyReplacements(source, replacements) {
  let next = source;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  return next;
}

function removeResolvedFallbackMarkers(source) {
  return source
    .replace(/\s*<meta name="afrotools-language-fallback(?:-owner)?"[^>]*>\s*/g, "\n")
    .replace(/\s*<aside data-language-fallback-notice="[^"]+"[\s\S]*?<\/aside>\s*/g, "\n")
    .replace(
      /\s+lang="en"(?=[^>]*\bdata-explicit-language-fallback="true")/g,
      "",
    )
    .replace(/\s+data-explicit-language-fallback="true"/g, "");
}

function ensureModeLocalizer(source) {
  const withoutExisting = source.replace(
    /\s*<script data-sw-paye-mode-localizer>[\s\S]*?<\/script>/,
    "",
  );
  const bodyClose = withoutExisting.lastIndexOf("</body>");
  if (bodyClose < 0) throw new Error("Missing closing body tag");
  return `${withoutExisting.slice(0, bodyClose)}${MODE_LOCALIZER}\n${withoutExisting.slice(bodyClose)}`;
}

let stale = 0;
for (const entry of CONTRACT.entries) {
  const file = path.join(ROOT, entry.swahiliFile);
  if (!fs.existsSync(file)) throw new Error(`Missing Swahili PAYE owner: ${entry.swahiliFile}`);
  const before = fs.readFileSync(file, "utf8");
  let after = applyReplacements(before, GLOBAL_REPLACEMENTS);
  after = applyReplacements(after, COUNTRY_REPLACEMENTS[entry.countrySlug] || []);
  after = removeResolvedFallbackMarkers(after);
  after = ensureModeLocalizer(after);
  after = after.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
  if (after !== before) {
    stale += 1;
    if (WRITE) fs.writeFileSync(file, after, "utf8");
  }
}

if (!WRITE && stale) {
  throw new Error(`${stale}/${CONTRACT.entries.length} Swahili PAYE pages are stale. Run with --write.`);
}

console.log(
  `${WRITE ? "Updated" : "Verified"} ${CONTRACT.entries.length} source-owned Swahili PAYE pages${WRITE ? ` (${stale} changed)` : ""}.`,
);
