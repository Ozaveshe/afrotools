#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const TARGETS = [
  'angola',
  'botswana',
  'burkina-faso',
  'burundi',
  'cameroon',
  'central-african-republic',
  'chad',
  'cote-divoire',
  'egypt',
  'equatorial-guinea',
  'eswatini',
  'ethiopia',
  'gabon',
  'guinea',
  'lesotho',
  'malawi',
  'mali',
  'mauritius',
  'niger',
  'rwanda',
  'senegal',
  'seychelles',
  'tanzania',
  'uganda',
  'zambia',
  'zimbabwe',
];

const PHRASES = [
  ["Africa's Everything Platform", 'Jukwaa la Zana za Afrika'],
  ["Africa\\'s Everything Platform", 'Jukwaa la Zana za Afrika'],
  ["Africa\\'s Financial Calculator Platform", 'Jukwaa la Vikokotoo vya Fedha la Afrika'],
  ['Income Tax Act', 'Sheria ya Kodi ya Mapato'],
  ['Income Tax Law', 'Sheria ya Kodi ya Mapato'],
  ['NOSI Pension Law', 'Sheria ya Pensheni ya NOSI'],
  ['Employee Pension Fund', 'Mfuko wa Pensheni wa Mfanyakazi'],
  ['Employer Pension Fund', 'Mfuko wa Pensheni wa Mwajiri'],
  ['Employee pension', 'Pensheni ya mfanyakazi'],
  ['Employer pension', 'Pensheni ya mwajiri'],
  ['employee pension', 'pensheni ya mfanyakazi'],
  ['employer pension', 'pensheni ya mwajiri'],
  ['employee retirement', 'pensheni ya mfanyakazi'],
  ['Employer social charges', 'Michango ya kijamii ya mwajiri'],
  ['employer social charges', 'michango ya kijamii ya mwajiri'],
  ['Employer baseline', 'Msingi wa mwajiri'],
  ['employer baseline', 'msingi wa mwajiri'],
  ['baseline employer', 'msingi wa mwajiri'],
  ['Baseline employer social gharama', 'Makadirio ya msingi ya gharama za kijamii za mwajiri'],
  ['Secondary employment', 'Ajira ya pili'],
  ['secondary employment', 'ajira ya pili'],
  ['Standard progressive calculation', 'hesabu ya kawaida ya hatua'],
  ['standard progressive calculation', 'hesabu ya kawaida ya hatua'],
  ['Progressive tax on employment income', 'Kodi ya hatua kwa mapato ya ajira'],
  ['progressive tax on employment income', 'kodi ya hatua kwa mapato ya ajira'],
  ['Legal Basis &amp; Sources', 'Msingi wa Kisheria na Vyanzo'],
  ['Legal Basis & Sources', 'Msingi wa Kisheria na Vyanzo'],
  ['Legal Basis &amp; Marejeo', 'Msingi wa Kisheria na Marejeo'],
  ['Legal Basis & Marejeo', 'Msingi wa Kisheria na Marejeo'],
  ['Monthly Income &amp; Makato', 'Mapato na Makato ya Mwezi'],
  ['Monthly Income & Makato', 'Mapato na Makato ya Mwezi'],
  ['Annual Income &amp; Makato', 'Mapato na Makato ya Mwaka'],
  ['Annual Income & Makato', 'Mapato na Makato ya Mwaka'],
  ['Monthly Income', 'Mapato ya Mwezi'],
  ['Annual Income', 'Mapato ya Mwaka'],
  ['Taxable Income', 'Mapato Yanayotozwa Kodi'],
  ['taxable income', 'mapato yanayotozwa kodi'],
  ['Monthly IRPP', 'IRPP ya Mwezi'],
  ['Annual IRPP', 'IRPP ya Mwaka'],
  ['Monthly ITS payable', 'ITS ya Mwezi Inayolipwa'],
  ['ITS payable', 'ITS inayolipwa'],
  ['ITS Computation', 'Hesabu ya ITS'],
  ['DGID Computation', 'Hesabu ya DGID'],
  ['no ITS due', 'hakuna ITS inayodaiwa'],
  ['no DGID due', 'hakuna DGID inayodaiwa'],
  ['Monthly ITS', 'ITS ya Mwezi'],
  ['Annual PAYE', 'PAYE ya Mwaka'],
  ['Monthly PAYE', 'PAYE ya Mwezi'],
  ['Tax Before Rebate', 'Kodi Kabla ya Punguzo'],
  ['Less: Tax Rebate', 'Ondoa: Punguzo la Kodi'],
  ['Total Employer Cost', 'Jumla ya Gharama ya Mwajiri'],
  ['Total Gharama ya Mwajiri', 'Jumla ya Gharama ya Mwajiri'],
  ['Monthly Net Pay Summary', 'Muhtasari wa Mshahara Halisi wa Mwezi'],
  ['Annual Net Pay Summary', 'Muhtasari wa Mshahara Halisi wa Mwaka'],
  ['Employer cost', 'Gharama ya mwajiri'],
  ['employer cost', 'gharama ya mwajiri'],
  ['salary base', 'msingi wa mshahara'],
  ['capped base', 'msingi wenye kikomo'],
  ['capped at', 'yenye kikomo cha'],
  ['no cap', 'hakuna kikomo'],
  ['tax-deductible', 'inayopunguzwa kwenye kodi'],
  ['fully deductible', 'inayopunguzwa kikamilifu'],
  ['deductible before', 'inayopunguzwa kabla ya'],
  ['before tax', 'kabla ya kodi'],
  ['before PAYE', 'kabla ya PAYE'],
  ['before IRPP', 'kabla ya IRPP'],
  ['before ITS', 'kabla ya ITS'],
  ['after tax', 'baada ya kodi'],
  ['after pension', 'baada ya pensheni'],
  ['flat 30% applied', '30% tambarare imetumika'],
  ['Flat 15%', '15% tambarare'],
  ['flat 15%', '15% tambarare'],
  ['Income in 0% band', 'Mapato katika bendi ya 0%'],
  ['no tax due', 'hakuna kodi inayodaiwa'],
  ['no PAYE due', 'hakuna PAYE inayodaiwa'],
  ['no IRPP due', 'hakuna IRPP inayodaiwa'],
  ['Rate ', 'Kiwango '],
  ['% on ', '% kwa '],
  ['Administered by', 'Inasimamiwa na'],
  ['administered by', 'inasimamiwa na'],
  ['This page models', 'Ukurasa huu unakadiria'],
  ['This calculator also models', 'Kikokotoo hiki pia kinakadiria'],
  ['This calculator', 'Kikokotoo hiki'],
  ['This page', 'Ukurasa huu'],
  ['Official 2025', 'Rasmi 2025'],
  ['Official monthly', 'Rasmi ya mwezi'],
  ['Annual reconciliation', 'Usawazishaji wa mwaka'],
  ['New employee registration', 'Usajili wa mfanyakazi mpya'],
  ['per year', 'kwa mwaka'],
  ['per month', 'kwa mwezi'],
  ['/year', '/mwaka'],
  ['/month', '/mwezi'],
  ['/mo', '/mwezi'],
  ['/yr', '/mwaka'],
  ['My Mshahara Halisi', 'Mshahara Wangu Halisi'],
  ['My Botswana PAYE', 'PAYE Yangu ya Botswana'],
  ['Botswana PAYE analysis', 'Uchambuzi wa PAYE wa Botswana'],
  ['Effective tax rate', 'Kiwango halisi cha kodi'],
  ['You are AfroTools', 'Wewe ni'],
  ['User:', 'Mtumiaji:'],
  ['Be concise, practical.', 'Jibu kwa ufupi na kwa vitendo.'],
  ['Concise.', 'Jibu kwa ufupi.'],
  ['Summary of', 'Muhtasari wa'],
  ['Two tax reduction strategies', 'Njia mbili za kisheria za kupunguza kodi'],
  ['Two tax strategies', 'Njia mbili za kisheria za kupanga kodi'],
  ['One compliance point', 'Jambo moja la kuzingatia la ufuataji'],
  ['One common mistake', 'Kosa moja la kawaida'],
  ['no markdown', 'bila markdown'],
  ['No SDL or WCF', 'Hakuna SDL wala WCF'],
  ['Gross +', 'Ghafi +'],
  [' to gross ', ' kwenye ghafi '],
  [' of PAYE position', ' wa hali ya PAYE'],
  [' of IUTS position', ' wa hali ya IUTS'],
  [' of IRPP position', ' wa hali ya IRPP'],
  ['No markdown, no asterisks, no bullet symbols.', 'Bila markdown, nyota, au alama za orodha.'],
  ['YES â€”', 'NDIYO â€”'],
  ["'No'", "'Hapana'"],
  [' gross ', ' ghafi '],
  [' family reduction', ' punguzo la familia'],
  [' accident-at-work rates vary by sector', ' viwango vya ajali kazini hutofautiana kwa sekta'],
  [' and ', ' na '],
  ['Ref:', 'Kumb:'],
  ['NAPSA Capped', 'NAPSA yenye kikomo'],
  [' for Botswana PAYE', ' wa PAYE ya Botswana'],
  ['specialising in', 'anayebobea katika'],
  ['Summarize position in 150 words.', 'Fupisha hali hii kwa maneno yasiyozidi 150.'],
  ['Generating analysis...', 'Inatengeneza uchambuzi...'],
  ['Analysis unavailable.', 'Uchambuzi haupatikani.'],
  ['Ask follow-up â†’', 'Uliza swali la kufuatilia â†’'],
  ['Ask follow-up →', 'Uliza swali la kufuatilia →'],
  ['Brief tax advisor for Equatorial Guinea PAYE.', 'Mshauri mfupi wa kodi wa PAYE ya Guinea ya Ikweta. Jibu kwa Kiswahili.'],
  ['Summarize this hesabu briefly in 2 sentences.', 'Fupisha hesabu hii kwa Kiswahili katika sentensi mbili.'],
  ['Two practical payroll planning points for Zambia', 'Hoja mbili za vitendo za kupanga mishahara nchini Zambia'],
  ['One thing most Zambian employees get wrong about NAPSA capping', 'Jambo moja ambalo wafanyakazi wengi wa Zambia hukosea kuhusu kikomo cha NAPSA'],
];

const WORDS = [
  [/\bSummary\b/g, 'Muhtasari'],
  [/\bSection\b/g, 'Sehemu'],
  [/\bMonthly\b/g, 'Mwezi'],
  [/\bAnnual\b/g, 'Mwaka'],
  [/\bGross\b/g, 'Ghafi'],
  [/\bNet\b/g, 'Halisi'],
  [/\bEmployee\b/g, 'Mfanyakazi'],
  [/\bEmployer\b/g, 'Mwajiri'],
  [/\bIncome\b/g, 'Mapato'],
  [/\bTax\b/g, 'Kodi'],
  [/\bRate\b/g, 'Kiwango'],
  [/\bSources\b/g, 'Vyanzo'],
  [/\bLegal\b/g, 'Kisheria'],
  [/\bReference\b/g, 'Marejeo'],
  [/\bTotal\b/g, 'Jumla'],
  [/\bContribution\b/g, 'Mchango'],
  [/\bcontribution\b/g, 'mchango'],
  [/\bdeductions\b/g, 'makato'],
  [/\bdeductible\b/g, 'inayopunguzwa kwenye kodi'],
  [/\bcapped\b/g, 'yenye kikomo'],
  [/\bbefore\b/g, 'kabla ya'],
  [/\bafter\b/g, 'baada ya'],
  [/\bflat\b/g, 'tambarare'],
  [/\bapplied\b/g, 'imetumika'],
  [/\bbase\b/g, 'msingi'],
  [/\bemployment\b/g, 'ajira'],
  [/\bPrivate\b/g, 'Binafsi'],
  [/\bPublic\b/g, 'Umma'],
  [/\bcost\b/g, 'gharama'],
  [/\bofficial\b/g, 'rasmi'],
  [/\bstandard\b/g, 'kawaida'],
  [/\bcalculation\b/g, 'hesabu'],
  [/\bcalculated\b/g, 'iliyokokotolewa'],
];

const PAGE_REPLACEMENTS = {
  angola: [
    ['3% â€” tax-deductible', '3% â€” inapunguzwa kwenye kodi'],
    ['INSS mchango wa mfanyakazi (3%) is fully deductible.', 'Mchango wa INSS wa mfanyakazi (3%) unapunguzwa kikamilifu.'],
  ],
  botswana: [
    ['const gross = isMonthly ? R.monthlyGross : R.annual;', 'const gross = isMonthly ? R.monthlyGhafi : R.annual;'],
    ['const paye = isMonthly ? R.monthlyTax : R.annualPAYE;', 'const paye = isMonthly ? R.monthlyKodi : R.annualPAYE;'],
    ['netPay: RESULT.netMonthly || RESULT.net,', 'netPay: RESULT.monthlyNet || RESULT.net,'],
    ['tax: RESULT.monthlyPAYE || RESULT.tax || RESULT.paye,', 'tax: RESULT.monthlyKodi || RESULT.tax || RESULT.paye,'],
    ["fmt(RESULT.netMonthly || RESULT.net) + '/mwezi'", "fmt(RESULT.monthlyNet || RESULT.net) + '/mwezi'"],
    ["fmt(RESULT.monthlyPAYE || RESULT.tax || RESULT.paye) + '/mwezi'", "fmt(RESULT.monthlyKodi || RESULT.tax || RESULT.paye) + '/mwezi'"],
    ["_bmWidget.setAttribute('user-net', RESULT.netMonthly || RESULT.net);", "_bmWidget.setAttribute('user-net', RESULT.monthlyNet || RESULT.net);"],
    ["throw new hitilafu('HTTP '+res.status)", "throw new Error('HTTP '+res.status)"],
    ['Wewe ni Mshauri wa Kodi wa AI for Botswana PAYE.', 'Wewe ni Mshauri wa Kodi wa AI wa PAYE ya Botswana.'],
    ['Mtumiaji: gross P', 'Mtumiaji: ghafi P'],
  ],
  cameroon: [
    ['CNPS employee pension contribution is 4.2% of pensionable salary, capped at XAF 750,000/mwezi. The kikokotoo also applies the kila mwaka XAF 500,000 professional allowance before IRPP.', 'Mchango wa pensheni wa CNPS wa mfanyakazi ni 4.2% ya mshahara unaostahili pensheni, ukiwa na kikomo cha XAF 750,000 kwa mwezi. Kikokotoo pia kinatumia posho ya kitaaluma ya XAF 500,000 kwa mwaka kabla ya IRPP.'],
    ['4.2% of capped salary base', '4.2% ya msingi wa mshahara wenye kikomo'],
    ['11.2% of capped salary base', '11.2% ya msingi wa mshahara wenye kikomo'],
    ['CNPS uses a capped salary base of XAF 750,000/mwezi for pensions and family benefits. Employer accident-at-work premiums vary by risk group and are not included in this baseline estimate.', 'CNPS hutumia msingi wa mshahara wenye kikomo cha XAF 750,000 kwa mwezi kwa pensheni na mafao ya familia. Malipo ya mwajiri ya ajali kazini hutofautiana kwa kundi la hatari na hayajajumuishwa katika makadirio haya ya msingi.'],
    ['Cameroon PAYE 2025: Gross XAF ', 'PAYE ya Kameruni 2025: Ghafi XAF '],
    ['assessable income XAF ', 'mapato yanayokokotolewa XAF '],
    ['AfroTools Kodi Advisor - Cameroon payroll tax. Concise, practical, bila markdown.', 'Wewe ni mshauri wa kodi wa AfroTools wa mishahara ya Kameruni. Jibu kwa Kiswahili, kwa ufupi na kwa vitendo, bila markdown.'],
    ['Cameroon tax advisor. Jibu kwa ufupi.', 'Wewe ni mshauri wa kodi wa Kameruni. Jibu kwa Kiswahili na kwa ufupi.'],
    ["throw new hitilafu('HTTP')", "throw new Error('HTTP')"],
  ],
  'cote-divoire': [
    ['Pensheni ya CNPS ya Mfanyakazi contribution (6.3%) is deducted before the ITS bands are applied. Employer-side payroll costs vary by sector because the accident-at-work rate ranges from 2% to 5%.', 'Mchango wa pensheni wa CNPS wa mfanyakazi (6.3%) hukatwa kabla ya mabanda ya ITS kutumika. Gharama za mishahara za mwajiri hutofautiana kwa sekta kwa sababu kiwango cha ajali kazini ni kati ya 2% na 5%.'],
    ['6.3% of gross', '6.3% ya ghafi'],
    ['15.45% of gross', '15.45% ya ghafi'],
    ['baseline employer social-cost estimate', 'makadirio ya msingi ya gharama za kijamii za mwajiri'],
    ['using 7.7% retirement, 5% family benefits, 0.75% maternity and a default 2% accident-at-work rate. Verify specialized employer classifications directly with', 'kwa kutumia pensheni 7.7%, mafao ya familia 5%, uzazi 0.75%, na kiwango cha kawaida cha ajali kazini cha 2%. Thibitisha uainishaji maalum wa mwajiri moja kwa moja na'],
    ['CNPS employee retirement: 6.3% of gross and deductible before ITS. RICF is applied by family parts. Employer cost shown on this page is a baseline estimate using the default 2% accident-at-work rate.', 'Pensheni ya CNPS ya mfanyakazi: 6.3% ya ghafi na inapunguzwa kabla ya ITS. RICF hutumika kwa sehemu za familia. Gharama ya mwajiri kwenye ukurasa huu ni makadirio ya msingi yanayotumia kiwango cha kawaida cha ajali kazini cha 2%.'],
    ['ITS Computation (2025)', 'Hesabu ya ITS (2025)'],
    ['no ITS due', 'hakuna ITS inayodaiwa'],
    ['Impôt brut kabla ya RICF', 'Kodi ghafi kabla ya RICF'],
    ['RICF family reduction', 'Punguzo la familia la RICF'],
    [" part${R.familyParts > 1 ? 's' : ''}", " sehemu${R.familyParts > 1 ? '' : ''}"],
    ['ITS payable', 'ITS inayolipwa'],
    ['Baseline employer social gharama', 'Makadirio ya msingi ya gharama za kijamii za mwajiri'],
    ["Thibitisha na DGI and CNPS Côte d'Ivoire. Mwajiri accident-at-work rates vary by sector.", "Vyanzo: DGI na CNPS Côte d'Ivoire. Viwango vya ajali kazini vya mwajiri hutofautiana kwa sekta; thibitisha hali yako moja kwa moja na mamlaka hizo."],
    ["navigator.share({title:'My Côte d\\'Ivoire PAYE'", "navigator.share({title:'PAYE Yangu ya Côte d\\'Ivoire'"],
  ],
  'central-african-republic': [
    ['Central African Republic PAYE:', 'PAYE ya Jamhuri ya Afrika ya Kati:'],
    ['Effective ', 'Kiwango halisi '],
    ['Give 1) summary 2) two tax optimization tips 3) one compliance point.', 'Toa 1) muhtasari 2) vidokezo viwili vya kupanga kodi kisheria 3) jambo moja la kuzingatia.'],
    ['anayebobea katika Central African Republic PAYE. Concise, specific, practical.', 'anayebobea katika PAYE ya Jamhuri ya Afrika ya Kati. Jibu kwa ufupi, kwa usahihi na kwa vitendo.'],
    ['for Central African Republic. Answer concisely.', 'wa Jamhuri ya Afrika ya Kati. Jibu kwa ufupi.'],
  ],
  'equatorial-guinea': [
    ['Verify with Ministry of Finance or a qualified tax advisor.', 'Thibitisha na Wizara ya Fedha au mshauri wa kodi mwenye sifa.'],
    ['The IRPF applies seven progressive kila mwaka bands. kila mwaka income up to XAF 1,000,000 is fully msamaha from income tax. From XAF 1,000,001 to 3,000,000 a 10% rate applies, rising through 15%, 20%, 25%, and 30% bands before reaching 35% on income above XAF 25,000,000 per year. Oil-sector workers earning above the threshold face the full band structure, while many lower-paid workers in the formal sector pay minimal income tax.', 'IRPF hutumia mabanda saba ya hatua kwa mwaka. Mapato ya mwaka hadi XAF 1,000,000 yamesamehewa kodi ya mapato. Kiwango cha 10% hutumika kwa XAF 1,000,001 hadi 3,000,000, kisha 15%, 20%, 25%, na 30% kabla ya kufikia 35% kwa mapato zaidi ya XAF 25,000,000 kwa mwaka. Wafanyakazi wa sekta ya mafuta wenye mapato juu ya kizingiti hutumia muundo kamili wa mabanda, huku wafanyakazi wengi wa kipato cha chini katika sekta rasmi wakilipa kodi ndogo ya mapato.'],
  ],
  gabon: [
    ['Standard case only, capped at 6 children', 'Hali ya kawaida pekee, hadi watoto 6'],
    ['<th>Contribution</th>', '<th>Mchango</th>'],
    ['CNSS base', 'Msingi wa CNSS'],
  ],
  chad: [
    ['Hakuna skills levy wala workers compensation fund nchini Chad.', 'Hakuna tozo ya ujuzi wala mfuko tofauti wa fidia kwa wafanyakazi nchini Chad.'],
  ],
  egypt: [
    ['Mfanyakazi: 11% (social ins.) + 1% (health) = 12%. Mwajiri: 18.75% + 3.25% = 22%. 2025 insurable cap: EGP 14,500/mwezi. Caps rise 15%/mwaka until 2027.', 'Mfanyakazi: 11% (bima ya jamii) + 1% (afya) = 12%. Mwajiri: 18.75% + 3.25% = 22%. Kikomo cha mapato yanayokatiwa bima mwaka 2025 ni EGP 14,500 kwa mwezi. Kikomo huongezeka 15% kwa mwaka hadi 2027.'],
    ['Egypt Salary Kodi', 'Kodi ya Mshahara ya Misri'],
    ['Law No. 7 of 2024', 'Sheria Na. 7 ya 2024'],
    ['Law 91/2005', 'Sheria 91/2005'],
    ['Law 148/2019', 'Sheria 148/2019'],
    ['Mapato &amp; Allowable Makato', 'Mapato na Makato Yanayokubalika'],
    [" (disability — 1.5×)", " (ulemavu — mara 1.5)"],
    ['insurable cap EGP 14,500/mwezi', 'kikomo cha mapato yanayokatiwa bima EGP 14,500 kwa mwezi'],
    ['NATI below EGP 40,000 — in 0% band', 'NATI chini ya EGP 40,000 — katika bendi ya 0%'],
    ['Marekebisho ya kuondoa bendi', 'Marekebisho ya kuondoa bendi'],
    [" band${R.excludedBands.length>1?'s':''} removed", " bendi zimeondolewa"],
    ['Bracket exclusion imetumika:', 'Utaratibu wa kuondoa bendi umetumika:'],
    ["NATI of EGP ", "NATI ya EGP "],
    [" triggers Egypt's tiering rule — ", " inatumia kanuni ya mabanda ya Misri — "],
    [" lower tax bracket${R.excludedBands.length>1?'s':''} removed.", " bendi za chini za kodi zimeondolewa."],
    ['Most salary calculators miss this, understating actual tax liability.', 'Vikokotoo vingi vya mshahara hukosa kanuni hii na kupunguza kiasi halisi cha wajibu wa kodi.'],
    ['Daily equivalent (÷ 365)', 'Kiasi sawa kwa siku (÷ 365)'],
    ['Progressive 0%–27.5% kwa salary income. Amended by Sheria Na. 7 ya 2024 — 0% threshold raised to EGP 40,000, personal msamahaion to EGP 20,000.', 'Viwango vya hatua vya 0%–27.5% kwa mapato ya mshahara. Sheria Na. 7 ya 2024 iliongeza kizingiti cha 0% hadi EGP 40,000 na msamaha binafsi hadi EGP 20,000.'],
    ['Mwezi withheld tax due by 15th of following month. Usawazishaji wa mwaka by Januari 31. Usajili wa mfanyakazi mpya within 15 days of hiring.', 'Kodi iliyokatwa kwa mwezi inawasilishwa ifikapo tarehe 15 ya mwezi unaofuata. Usawazishaji wa mwaka unafanywa ifikapo Januari 31. Mfanyakazi mpya anasajiliwa ndani ya siku 15 baada ya kuajiriwa.'],
    ['Informational purposes only. Not professional tax advice.', 'Kwa taarifa tu. Si ushauri wa kitaalamu wa kodi.'],
    ['Egypt salary tax analysis', 'Uchambuzi wa kodi ya mshahara ya Misri'],
    [" (disability)", " (ulemavu)"],
    ['Bracket exclusion extra tax', 'Kodi ya ziada ya kuondoa bendi'],
    ['jumla income tax', 'Jumla ya kodi ya mapato'],
    ['Excluded brackets', 'Mabanda yaliyoondolewa'],
    ['bracket exclusion rule triggered', 'utaratibu wa kuondoa bendi umetumika'],
    ['not triggered', 'haujatumika'],
    ['Mwajiri extra gharama', 'Gharama ya ziada ya mwajiri'],
    ['of their tax position including bracket exclusion impact if applicable', 'wa hali ya kodi, ukijumuisha athari ya kuondoa bendi inapohusika'],
    ['Egyptian personal income tax — ETA progressive tax, NOSI ya bima ya jamii, Law No. 91 of 2005 as amended by Sheria Na. 7 ya 2024. Be concise, specific, na practical.', 'kodi ya mapato ya watu binafsi ya Misri — kodi ya hatua ya ETA, bima ya jamii ya NOSI, na Sheria Na. 91 ya 2005 iliyorekebishwa na Sheria Na. 7 ya 2024. Jibu kwa ufupi, kwa usahihi na kwa vitendo.'],
    ['AfroTools Mshauri wa Kodi wa AI, Egypt.', 'AfroTools Mshauri wa Kodi wa AI wa Misri.'],
    ["throw new hitilafu('HTTP ' + res.status)", "throw new Error('HTTP ' + res.status)"],
  ],
  ethiopia: [
    ['Pension Fund mchango wa mfanyakazi', 'Mchango wa Mfuko wa Pensheni wa mfanyakazi'],
    ['Pension Fund (employee)', 'Mfuko wa Pensheni (mfanyakazi)'],
  ],
  guinea: [
    ['The official kila mwezi RTS table applies', 'Jedwali rasmi la RTS la kila mwezi hutumia'],
    ['above GNF 20M after deduction of mandatory social-security contributions. This page follows that current CGI structure.', 'juu ya GNF milioni 20 baada ya makato ya lazima ya hifadhi ya jamii. Ukurasa huu unafuata muundo wa sasa wa CGI.'],
    ['Guinea is rich in bauxite, iron ore, and gold. The government has been reforming the tax administration as part of economic diversification efforts. Employers should verify current DNI bands and CNSS mchango wa mwajiri rates with the DNI, as rates may be updated through kila mwaka Finance Laws.', 'Guinea ina utajiri wa bauxite, madini ya chuma, na dhahabu. Serikali imekuwa ikiboresha usimamizi wa kodi kama sehemu ya juhudi za kupanua uchumi. Waajiri wanapaswa kuthibitisha mabanda ya sasa ya DNI na viwango vya michango ya mwajiri ya CNSS na DNI, kwa kuwa viwango vinaweza kubadilishwa kupitia Sheria za Fedha za kila mwaka.'],
    ['CNSS employee: 5% and employer: 18% on salary subject to cotisation. Currency: GNF. Employer cost on this page intentionally excludes the separate 6% versement forfaitaire sur les salaires because its exact base can vary with family-benefit treatment.', 'CNSS ya mfanyakazi ni 5% na ya mwajiri ni 18% ya mshahara unaotozwa michango. Sarafu ni GNF. Gharama ya mwajiri kwenye ukurasa huu haijumuishi versement forfaitaire sur les salaires ya 6% kwa sababu msingi wake halisi unaweza kutofautiana kulingana na mafao ya familia.'],
    ['Guinea PAYE analysis', 'Uchambuzi wa PAYE wa Guinea'],
    ['CNSS employee', 'CNSS ya mfanyakazi'],
    ['jumla gharama ya mwajiri shown', 'Jumla ya gharama ya mwajiri inayoonyeshwa'],
    ['CNSS only; excludes the separate 6% payroll levy', 'CNSS pekee; haijumuishi tozo tofauti ya mishahara ya 6%'],
    ['of DNI tax position', 'wa hali ya kodi ya DNI'],
    ['Two practical payroll planning points', 'Hoja mbili za vitendo za kupanga mishahara'],
    ['Jambo moja muhimu la uzingatiaji to know', 'Jambo moja muhimu la uzingatiaji la kujua'],
    ['One thing most Guinean employees get wrong about CNSS.', 'Jambo moja ambalo wafanyakazi wengi wa Guinea hukosea kuhusu CNSS.'],
    ['Guinean salary tax under the CGI na CNSS payroll rules. Be concise, specific, practical.', 'kodi ya mshahara ya Guinea chini ya kanuni za mishahara za CGI na CNSS. Jibu kwa ufupi, kwa usahihi na kwa vitendo.'],
    ['${R.sector} sector', 'sekta ya ${R.sector}'],
    ["throw new hitilafu('HTTP '+res.status)", "throw new Error('HTTP '+res.status)"],
  ],
  lesotho: [
    ['Lesotho PAYE analysis', 'Uchambuzi wa PAYE wa Lesotho'],
    ['baada ya M11,640 credit', 'baada ya punguzo la M11,640'],
    ['Muhtasari wa LRA tax position', 'Muhtasari wa hali ya kodi ya LRA'],
    ['Lesotho PAYE — LRA progressive tax, tax credit. Be concise, specific, practical.', 'PAYE ya Lesotho — kodi ya hatua ya LRA na punguzo la kodi. Jibu kwa ufupi, kwa usahihi na kwa vitendo.'],
    ["throw new hitilafu('HTTP '+res.status)", "throw new Error('HTTP '+res.status)"],
  ],
  mali: [
    ['INPS mchango wa mfanyakazi (3.6%) is fully unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi before ITS is calculated. INPS ya mwajiri (12%) is an additional cost. No SDL or WCF in Mali.', 'Mchango wa INPS wa mfanyakazi (3.6%) unakubaliwa kikamilifu kama punguzo kutoka mapato yanayotozwa kodi kabla ya ITS kukokotolewa. INPS ya mwajiri (12%) ni gharama ya ziada. Hakuna SDL wala WCF nchini Mali.'],
    ['Imehesabiwa kwa mwezi kwa mapato yanayotozwa kodi (ghafi ukiondoa INPS). kila mwaka Kizingiti kisichotozwa kodi: XOF 400,000. INPS mchango wa mfanyakazi (3.6%) deductible before ITS calculation.', 'Imehesabiwa kwa mwezi kwa mapato yanayotozwa kodi (ghafi ukiondoa INPS). Kizingiti kisichotozwa kodi cha mwaka ni XOF 400,000. Mchango wa INPS wa mfanyakazi (3.6%) unapunguzwa kabla ya hesabu ya ITS.'],
    ['3.6% of gross salary', '3.6% ya mshahara ghafi'],
    ['12% of gross salary', '12% ya mshahara ghafi'],
    ['INPS (Institut National de PrÃ©voyance Sociale) mchango wa mfanyakazi is unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi before ITS is calculated. Administered by DGI Mali.', 'Mchango wa INPS wa mfanyakazi unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi kabla ya ITS kukokotolewa. Inasimamiwa na DGI Mali.'],
    ["Mali's payroll income tax, known as ITS (ImpÃ´t sur les Traitements et Salaires), is administered by DGI (Direction GÃ©nÃ©rale des ImpÃ´ts). The system uses five kila mwezi progressive bands ranging from 0% to 36%, calculated on taxable income after the INPS mchango wa mfanyakazi (3.6%) is deducted. Employers withhold ITS each month and remit to DGI by the 7th of the following month.", 'Kodi ya mapato ya mishahara ya Mali, inayojulikana kama ITS (ImpÃ´t sur les Traitements et Salaires), inasimamiwa na DGI (Direction GÃ©nÃ©rale des ImpÃ´ts). Mfumo hutumia mabanda matano ya hatua ya kila mwezi kutoka 0% hadi 36%, yanayokokotolewa kwenye mapato yanayotozwa kodi baada ya mchango wa INPS wa mfanyakazi (3.6%) kukatwa. Waajiri hukata ITS kila mwezi na kuiwasilisha kwa DGI ifikapo tarehe 7 ya mwezi unaofuata.'],
  ],
  malawi: [
    ["Four progressive bands effective Januari 2026: 0% kwa first MWK 170,000; 30% kwa MWK 170,001â€“1,570,000; 35% kwa MWK 1,570,001â€“10,000,000; 40% above MWK 10,000,000. Kikokotoo hiki pia kinakadiria the kawaida 5% ya mfanyakazi pension deduction and 10% pensheni ya mwajiri mchango under Malawi's pension framework.", 'Mabanda manne ya hatua yanatumika kuanzia Januari 2026: 0% kwa MWK 170,000 za kwanza; 30% kwa MWK 170,001â€“1,570,000; 35% kwa MWK 1,570,001â€“10,000,000; na 40% juu ya MWK 10,000,000. Kikokotoo hiki pia kinakadiria punguzo la kawaida la pensheni la mfanyakazi la 5% na mchango wa pensheni wa mwajiri wa 10% chini ya mfumo wa pensheni wa Malawi.'],
  ],
};

const BOTSWANA_REPORT = `function generatePdf() {
  if (!RESULT) return;
  const R = RESULT;
  const dateStr = new Date().toLocaleDateString('sw-TZ',{day:'numeric',month:'long',year:'numeric'});
  const refNo = 'AFT-BW-PAYE-SW-' + Date.now().toString(36).toUpperCase().slice(-6);
  const bandRows = R.bandBreakdown.filter(b => b.tax > 0).map(b =>
    \`<tr><td>Kiwango \${Math.round(b.rate * 100)}% kwa P\${Math.round(b.income).toLocaleString()}</td><td class="num red">(P\${Math.round(b.tax).toLocaleString()})</td></tr>\`
  ).join('');
  const html = \`<!DOCTYPE html><html lang="sw"><head><meta charset="UTF-8">
<title>Muhtasari wa PAYE wa Botswana — \${refNo}</title>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;line-height:1.5;margin:0}.cover{background:#0f2b20;color:#fff;padding:28px 36px}.brand{font-weight:800}.meta{font-size:12px;color:#d1fae5}.body{padding:24px 36px}h1{margin:12px 0 4px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.metric{background:#f3f4f6;border-radius:8px;padding:12px}.metric small{display:block;color:#64748b}.metric strong{font-size:18px}h2{font-size:13px;text-transform:uppercase;color:#475569;border-bottom:1px solid #dbe3eb;padding-bottom:5px;margin-top:22px}table{width:100%;border-collapse:collapse}td{padding:7px 4px;border-bottom:1px solid #eef2f7}.num{text-align:right;font-weight:700}.red{color:#b42318}.notice{margin-top:22px;padding:12px;background:#f8fafc;color:#475569;font-size:12px}@media(max-width:520px){.summary{grid-template-columns:1fr}.cover,.body{padding-left:18px;padding-right:18px}}</style>
</head><body>
<div class="cover"><div class="brand">AFROTOOLS — Jukwaa la Zana za Afrika</div><h1>Muhtasari wa PAYE wa Botswana 2025/26</h1><div class="meta">Imetengenezwa \${dateStr} · Kumbukumbu \${refNo}</div></div>
<main class="body">
  <div class="summary">
    <div class="metric"><small>Mshahara ghafi wa mwaka</small><strong>P\${Math.round(R.gross).toLocaleString()}</strong></div>
    <div class="metric"><small>PAYE ya mwaka</small><strong class="red">P\${Math.round(R.annualPAYE).toLocaleString()}</strong></div>
    <div class="metric"><small>Mshahara halisi wa mwaka</small><strong>P\${Math.round(R.netAnnual).toLocaleString()}</strong></div>
  </div>
  <h2>Sehemu ya 1 — Hesabu ya PAYE</h2>
  <table>\${bandRows || '<tr><td>Mapato katika bendi ya 0% — hakuna PAYE inayodaiwa</td><td class="num">P0</td></tr>'}<tr><td>Jumla ya PAYE ya mwaka</td><td class="num red">P\${Math.round(R.annualPAYE).toLocaleString()}</td></tr></table>
  <h2>Sehemu ya 2 — Muhtasari wa mshahara halisi</h2>
  <table><tr><td>Mshahara ghafi wa mwaka</td><td class="num">P\${Math.round(R.gross).toLocaleString()}</td></tr><tr><td>PAYE ya mwaka</td><td class="num red">(P\${Math.round(R.annualPAYE).toLocaleString()})</td></tr><tr><td>Mshahara halisi wa mwaka</td><td class="num">P\${Math.round(R.netAnnual).toLocaleString()}</td></tr><tr><td>Mshahara halisi wa mwezi</td><td class="num">P\${Math.round(R.monthlyNet).toLocaleString()}</td></tr></table>
  <h2>Sehemu ya 3 — Msingi wa kisheria na vyanzo</h2>
  <p>BURS · Sheria ya Kodi ya Mapato ya Botswana · viwango vya PAYE vya 2025/26. Botswana haina mchango wa lazima wa hifadhi ya jamii wa mwajiri katika modeli hii.</p>
  <div class="notice">Makadirio ya kupanga tu. Huu si waraka rasmi wa BURS wala ushauri wa kodi. Thibitisha viwango, misamaha, na wajibu wa uwasilishaji na BURS au mshauri wa kodi mwenye sifa.</div>
</main></body></html>\`;
  const blob = new Blob([html],{type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const w = window.open(url,'_blank');
  if(w){ w.addEventListener('load',()=>{setTimeout(()=>{w.print();setTimeout(()=>URL.revokeObjectURL(url),3000)},600)}); setTimeout(()=>{try{w.print()}catch(e){}},1200); }
}`;

const EQUATORIAL_GUINEA_REPORT = `function generatePdf(){
  if(!RESULT)return;
  const R=RESULT;
  const dateStr=new Date().toLocaleDateString('sw-TZ',{day:'numeric',month:'long',year:'numeric'});
  const refNo='AFT-GQ-PAYE-SW-'+Date.now().toString(36).toUpperCase().slice(-6);
  const bandRows=(R.bandBreakdown||[]).filter(b=>b.tax>0).map(b=>\`<tr><td>Kiwango \${Math.round(b.rate*100)}% kwa XAF \${Math.round(b.income).toLocaleString()}</td><td class="num red">(XAF \${Math.round(b.tax).toLocaleString()})</td></tr>\`).join('');
  const annualGross=R.annualGross||R.gross*12;
  const annualTax=R.annualTax||R.monthlyPAYE*12;
  const annualNet=R.annualNet||R.netMonthly*12;
  const html=\`<!DOCTYPE html><html lang="sw"><head><meta charset="UTF-8"><title>Muhtasari wa IRPF wa Guinea ya Ikweta — \${refNo}</title>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;line-height:1.5;margin:0}.cover{background:#183153;color:#fff;padding:28px 36px}.body{padding:24px 36px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metric{background:#f3f4f6;border-radius:8px;padding:12px}.metric small{display:block;color:#64748b}.metric strong{font-size:18px}h2{font-size:13px;text-transform:uppercase;color:#475569;border-bottom:1px solid #dbe3eb;padding-bottom:5px;margin-top:22px}table{width:100%;border-collapse:collapse}td{padding:7px 4px;border-bottom:1px solid #eef2f7}.num{text-align:right;font-weight:700}.red{color:#b42318}.notice{margin-top:22px;padding:12px;background:#f8fafc;color:#475569;font-size:12px}@media(max-width:520px){.summary{grid-template-columns:1fr}.cover,.body{padding-left:18px;padding-right:18px}}</style>
</head><body><div class="cover"><strong>AFROTOOLS — Jukwaa la Zana za Afrika</strong><h1>Muhtasari wa IRPF wa Guinea ya Ikweta 2025/26</h1><small>Imetengenezwa \${dateStr} · Kumbukumbu \${refNo}</small></div><main class="body">
<div class="summary"><div class="metric"><small>Mshahara ghafi wa mwezi</small><strong>XAF \${Math.round(R.gross).toLocaleString()}</strong></div><div class="metric"><small>IRPF ya mwezi</small><strong class="red">XAF \${Math.round(R.monthlyPAYE).toLocaleString()}</strong></div><div class="metric"><small>Mshahara halisi wa mwezi</small><strong>XAF \${Math.round(R.netMonthly).toLocaleString()}</strong></div></div>
<h2>Sehemu ya 1 — Mapato na makato ya mwezi</h2><table><tr><td>Mshahara ghafi wa mwezi</td><td class="num">XAF \${Math.round(R.gross).toLocaleString()}</td></tr><tr><td>Hifadhi ya jamii ya mfanyakazi</td><td class="num red">(XAF \${Math.round(R.socSec||0).toLocaleString()})</td></tr><tr><td>IRPF ya mwezi</td><td class="num red">(XAF \${Math.round(R.monthlyPAYE).toLocaleString()})</td></tr><tr><td>Mshahara halisi wa mwezi</td><td class="num">XAF \${Math.round(R.netMonthly).toLocaleString()}</td></tr></table>
<h2>Sehemu ya 2 — Hesabu ya IRPF ya mwaka</h2><table>\${bandRows||'<tr><td>Mapato katika bendi ya 0% — hakuna IRPF inayodaiwa</td><td class="num">XAF 0</td></tr>'}<tr><td>Mshahara ghafi wa mwaka</td><td class="num">XAF \${Math.round(annualGross).toLocaleString()}</td></tr><tr><td>IRPF ya mwaka</td><td class="num red">XAF \${Math.round(annualTax).toLocaleString()}</td></tr><tr><td>Mshahara halisi wa mwaka</td><td class="num">XAF \${Math.round(annualNet).toLocaleString()}</td></tr></table>
<h2>Sehemu ya 3 — Msingi wa kisheria na vyanzo</h2><p>Wizara ya Fedha ya Guinea ya Ikweta · IRPF ya 2025/26 · INSESO. Viwango na misamaha vinaweza kubadilika kupitia sheria ya fedha.</p>
<div class="notice">Makadirio ya kupanga tu. Huu si waraka rasmi wa kodi wala ushauri wa kitaalamu. Thibitisha viwango, misamaha, na wajibu wa uwasilishaji na Wizara ya Fedha au mshauri wa kodi mwenye sifa.</div>
</main></body></html>\`;
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,'_blank');
  if(w){w.addEventListener('load',()=>{setTimeout(()=>{w.print();setTimeout(()=>URL.revokeObjectURL(url),3000)},600)});setTimeout(()=>{try{w.print()}catch(e){}},1200);}
}`;

const SW_AI_CONSENT = `let SW_AI_CONSENTED = false;
function ensureSwAiConsent(){
  if(SW_AI_CONSENTED) return true;
  const accepted = window.confirm('Msaidizi wa AI ni wa hiari. Ukikubali, kiasi cha mshahara ghafi, mshahara halisi, kodi, michango ya kijamii na swali lako vitatumwa kwa seva za AfroTools na mtoa huduma wa AI. Usijumuishe jina, barua pepe, namba ya simu, namba ya kodi, akaunti ya benki au taarifa nyingine zinazokutambulisha. Endelea?');
  if(accepted) SW_AI_CONSENTED = true;
  return accepted;
}

`;

function replaceFunction(html, name, replacement, file) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function ${name}: ${file}`);
  const braceStart = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let templateExpressionDepth = 0;
  for (let index = braceStart; index < html.length; index += 1) {
    const char = html[index];
    const next = html[index + 1];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (char === '\\') {
        escaped = true;
      } else if (char === quote && !(quote === '`' && templateExpressionDepth > 0)) {
        quote = '';
      } else if (quote === '`' && char === '$' && next === '{') {
        templateExpressionDepth += 1;
        index += 1;
      } else if (quote === '`' && char === '}' && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return `${html.slice(0, start)}${replacement}${html.slice(index + 1)}`;
    }
  }
  throw new Error(`Unbalanced function ${name}: ${file}`);
}

function runtimeRange(html) {
  const start = html.indexOf('function generatePdf');
  if (start < 0) throw new Error('Missing generatePdf');
  const endCandidates = [
    html.indexOf('\ndocument.getElementById(\'grossSalary\')', start),
    html.indexOf('\n// Net-to-Ghafi', start),
    html.indexOf('\n</script>', start),
  ].filter((value) => value > start);
  return { start, end: Math.min(...endCandidates) };
}

function ensureFunctionGuard(source, name, file) {
  const start = source.indexOf(`async function ${name}()`);
  if (start < 0) throw new Error(`Missing ${name}: ${file}`);
  const braceStart = source.indexOf('{', start);
  const bodyStart = braceStart + 1;
  const opening = source.slice(bodyStart, bodyStart + 180);
  if (opening.includes('ensureSwAiConsent()')) {
    return source.replace(
      `if (!ensureSwAiConsent()) return;  `,
      'if (!ensureSwAiConsent()) return;\n  ',
    );
  }
  return `${source.slice(0, bodyStart)}\n  if (!ensureSwAiConsent()) return;\n  ${source.slice(bodyStart)}`;
}

function normalizeRuntime(html, country, file) {
  if (country === 'botswana') html = replaceFunction(html, 'generatePdf', BOTSWANA_REPORT, file);
  if (country === 'equatorial-guinea') {
    html = replaceFunction(html, 'generatePdf', EQUATORIAL_GUINEA_REPORT, file);
  }
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
  const englishMatch = html.match(/<link rel="alternate" hreflang="en" href="([^"]+)"/i);
  if (!canonicalMatch || !englishMatch) throw new Error(`Missing canonical/hreflang: ${file}`);

  const { start, end } = runtimeRange(html);
  let runtime = html.slice(start, end);
  runtime = runtime.replace(
    /toLocaleDateString\(['"](?:en|fr)-[A-Z]{2}['"]/g,
    "toLocaleDateString('sw-TZ'",
  );
  runtime = runtime.replace(/(<html\b[^>]*\blang=["'])en(["'])/g, '$1sw$2');
  runtime = runtime.split(englishMatch[1]).join(canonicalMatch[1]);
  runtime = runtime.split(englishMatch[1].replace(/\/$/, '')).join(canonicalMatch[1].replace(/\/$/, ''));
  const englishHostless = englishMatch[1].replace(/^https?:\/\//, '').replace(/\/$/, '');
  const canonicalHostless = canonicalMatch[1].replace(/^https?:\/\//, '').replace(/\/$/, '');
  runtime = runtime.split(englishHostless).join(canonicalHostless);
  runtime = runtime.replace(
    /navigator\.share\(\{title:'My ([^']+) PAYE'/g,
    "navigator.share({title:'PAYE Yangu ya $1'",
  );
  for (const [from, to] of PHRASES) runtime = runtime.split(from).join(to);
  for (const [pattern, replacement] of WORDS) runtime = runtime.replace(pattern, replacement);
  if (!runtime.includes('function ensureSwAiConsent()')) {
    const aiStart = runtime.indexOf('async function getAI()');
    if (aiStart < 0) throw new Error(`Missing getAI: ${file}`);
    runtime = `${runtime.slice(0, aiStart)}${SW_AI_CONSENT}${runtime.slice(aiStart)}`;
  }
  runtime = ensureFunctionGuard(runtime, 'getAI', file);
  runtime = ensureFunctionGuard(runtime, 'sendChat', file);
  html = `${html.slice(0, start)}${runtime}${html.slice(end)}`;

  for (const [from, to] of PAGE_REPLACEMENTS[country] || []) html = html.split(from).join(to);
  return html.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
}

let stale = 0;
for (const country of TARGETS) {
  const file = path.join(ROOT, 'sw', country, 'kikokotoo-kodi-mshahara', 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing target: ${file}`);
  const before = fs.readFileSync(file, 'utf8');
  const after = normalizeRuntime(before, country, file);
  if (before !== after) {
    stale += 1;
    if (WRITE) fs.writeFileSync(file, after, 'utf8');
  }
}

if (!WRITE && stale) {
  throw new Error(`${stale}/${TARGETS.length} Swahili PAYE report-language pages are stale. Run with --write.`);
}
console.log(`${WRITE ? 'Normalized' : 'Verified'} ${TARGETS.length} Swahili PAYE report-language routes${WRITE ? ` (${stale} changed)` : ''}.`);
