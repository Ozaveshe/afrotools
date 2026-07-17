const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'tools', 'salary-compare', 'index.html');
const outputPath = path.join(__dirname, '..', 'sw', 'zana', 'kilinganisha-mishahara', 'index.html');

function replaceAll(input, from, to) {
  return input.split(from).join(to);
}

function applyReplacements(input, pairs) {
  return pairs.reduce((output, [from, to]) => replaceAll(output, from, to), input);
}

const replacements = [
  ['lang="en"', 'lang="sw"'],
  ['<title>African Salary Benchmarker &amp; Negotiation Calculator | AfroTools</title>', '<title>Kilinganisha Mishahara Afrika na Kikokotoo cha Majadiliano | AfroTools</title>'],
  ['content="Compare salaries across 15 African countries. Negotiation band calculator with percentile coaching, remote work premiums, city-level breakdowns, gender pay gap data, inflation trends, and career timelines."', 'content="Linganisha mishahara katika nchi 15 za Afrika. Kikokotoo cha kiwango cha majadiliano chenye mwongozo wa asilimia, malipo ya kazi za mbali, mgawanyo wa miji, data ya pengo la mishahara ya kijinsia, mwenendo wa mfumuko wa bei, na ratiba za taaluma."'],
  ['<link rel="canonical" href="https://afrotools.com/tools/salary-compare/">', '<link rel="canonical" href="https://afrotools.com/sw/zana/kilinganisha-mishahara/">'],
  ['<meta property="og:title" content="African Salary Benchmarker | AfroTools">', '<meta property="og:title" content="Kilinganisha Mishahara Afrika | AfroTools">'],
  ['<meta property="og:description" content="Compare salaries across 15 African countries. PPP-adjusted, skill premiums, total compensation, and cost-of-living comparisons.">', '<meta property="og:description" content="Linganisha mishahara katika nchi 15 za Afrika. Imebadilishwa kwa PPP, ziada za ujuzi, fidia kamili, na ulinganisho wa gharama ya maisha.">'],
  ['<meta property="og:url" content="https://afrotools.com/tools/salary-compare/">', '<meta property="og:url" content="https://afrotools.com/sw/zana/kilinganisha-mishahara/">'],
  ['<meta name="twitter:title" content="African Salary Benchmarker | AfroTools">', '<meta name="twitter:title" content="Kilinganisha Mishahara Afrika | AfroTools">'],
  ['<meta name="twitter:description" content="Compare salaries across 15 African countries by role, industry, and experience.">', '<meta name="twitter:description" content="Linganisha mishahara katika nchi 15 za Afrika kwa nafasi, sekta, na kiwango cha uzoefu.">'],
  ['"name": "African Salary Benchmarker"', '"name": "Kilinganisha Mishahara Afrika"'],
  ['"description": "Compare salaries across 15 African countries by role, industry, and experience level with PPP adjustments, skill premiums, and cost-of-living data."', '"description": "Linganisha mishahara katika nchi 15 za Afrika kwa nafasi, sekta, na kiwango cha uzoefu pamoja na marekebisho ya PPP, ziada za ujuzi, na data ya gharama ya maisha."'],
  ['"url": "https://afrotools.com/tools/salary-compare/"', '"url": "https://afrotools.com/sw/zana/kilinganisha-mishahara/"'],
  ['<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="sw_TZ">'],
  ['<meta property="og:locale:alternate" content="fr_FR">', '<meta property="og:locale:alternate" content="en_US">'],
  ['<div class="sb-bc"><a href="/">Home</a> / <a href="/tools/">Tools</a> / <span>Salary Benchmarker</span></div>', '<div class="sb-bc"><a href="/">Nyumbani</a> / <a href="/tools/">Zana</a> / <span>Kilinganisha Mishahara</span></div>'],
  ['<h1>African <em>Salary</em> Benchmarker</h1>', '<h1><em>Kilinganisha</em> Mishahara Afrika</h1>'],
  ['<p class="sb-hero-sub">What is your role actually worth? Compare salaries across 15 African countries, negotiate smarter with percentile coaching, benchmark remote work premiums, and see city-level breakdowns.</p>', '<p class="sb-hero-sub">Nafasi yako ina thamani gani hasa? Linganisha mishahara katika nchi 15 za Afrika, jadili kwa busara zaidi kwa mwongozo wa asilimia, linganisha malipo ya kazi za mbali, na ona mgawanyo wa mishahara kwa miji.</p>'],
  ['<span class="sb-badge">15 Countries</span>', '<span class="sb-badge">Nchi 15</span>'],
  ['<span class="sb-badge">23 Roles</span>', '<span class="sb-badge">Nafasi 23</span>'],
  ['<span class="sb-badge">Negotiation Coach</span>', '<span class="sb-badge">Kocha wa Majadiliano</span>'],
  ['<span class="sb-badge">Remote Premium</span>', '<span class="sb-badge">Ziada ya Kazi ya Mbali</span>'],
  ['<span class="sb-badge">City Breakdown</span>', '<span class="sb-badge">Mgawanyo wa Miji</span>'],
  ['<span class="sb-badge">Gender Gap Data</span>', '<span class="sb-badge">Data ya Pengo la Jinsia</span>'],
  ['<span class="sb-badge">Inflation Adjusted</span>', '<span class="sb-badge">Imebadilishwa kwa Mfumuko wa Bei</span>'],
  ['<span class="sb-card-title">Benchmark Your Salary</span>', '<span class="sb-card-title">Pima Mshahara Wako</span>'],
  ['<label for="selRole">Role / Job Title</label>', '<label for="selRole">Nafasi / Jina la Kazi</label>'],
  ['<label for="selExp">Experience Level</label>', '<label for="selExp">Kiwango cha Uzoefu</label>'],
  ['<label for="selIndustry">Industry</label>', '<label for="selIndustry">Sekta</label>'],
  ['<label for="inpSalary">Your Current Salary (USD/year, optional)</label>', '<label for="inpSalary">Mshahara Wako wa Sasa (USD/mwaka, hiari)</label>'],
  ['<label for="selCountry">Your Country</label>', '<label for="selCountry">Nchi Yako</label>'],
  ['<label for="selCity">City (optional)</label>', '<label for="selCity">Mji (hiari)</label>'],
  ['<label for="selSkills">Skills <span style="font-weight:400;color:var(--sb-muted)">(hold Ctrl/⌘ to multi-select)</span></label>', '<label for="selSkills">Ujuzi <span style="font-weight:400;color:var(--sb-muted)">(shikilia Ctrl/⌘ ili kuchagua zaidi ya moja)</span></label>'],
  ['<button class="sb-btn sb-btn-primary" id="btnBenchmark">Compare Salaries Across Africa</button>', '<button class="sb-btn sb-btn-primary" id="btnBenchmark">Linganisha Mishahara Barani Afrika</button>'],
  ['Local Currency', 'Sarafu ya Ndani'],
  ['Total Compensation', 'Fidia Kamili'],
  ['Remote/Diaspora Employer', 'Mwajiri wa Mbali/Diaspora'],
  ['PPP Adjusted', 'Imebadilishwa kwa PPP'],
  ['Employer country:', 'Nchi ya mwajiri:'],
  ['aria-label="Employer country for remote work"', 'aria-label="Nchi ya mwajiri kwa kazi ya mbali"'],
  ['<h2 class="sb-card-title" id="summaryTitle">Salary Comparison</h2>', '<h2 class="sb-card-title" id="summaryTitle">Ulinganisho wa Mishahara</h2>'],
  ['aria-label="Salary analysis views"', 'aria-label="Mitazamo ya uchambuzi wa mishahara"'],
  ['Country Bars', 'Mihimili ya Nchi'],
  ['Comparison Table', 'Jedwali la Ulinganisho'],
  ['Compensation', 'Fidia'],
  ['Skill Premiums', 'Ziada za Ujuzi'],
  ['Distribution', 'Usambazaji'],
  ['Cost of Living', 'Gharama ya Maisha'],
  ['City Breakdown', 'Mgawanyo wa Miji'],
  ['Gender Gap', 'Pengo la Jinsia'],
  ['Inflation', 'Mfumuko wa Bei'],
  ['Career Timeline', 'Ratiba ya Taaluma'],
  ['Negotiation Band Calculator', 'Kikokotoo cha Kiwango cha Majadiliano'],
  ['Know your percentile. Negotiate smarter.', 'Fahamu asilimia yako. Jadili kwa busara zaidi.'],
  ['Enter your target ask to see where it sits in the market distribution and get a negotiation script tailored to your position.', 'Weka kiasi unacholenga ili uone kinaposimama katika mgawanyo wa soko na upate maandishi ya majadiliano yanayolingana na hali yako.'],
  ['<label for="inpNegotAsk">Your Target Ask (USD/year)</label>', '<label for="inpNegotAsk">Kiasi Unacholenga (USD/mwaka)</label>'],
  ['<label for="selNegotCountry">Country</label>', '<label for="selNegotCountry">Nchi</label>'],
  ['-- Same as selected above --', '-- Sawa na kilichochaguliwa juu --'],
  ['<strong>Enter your target ask above</strong>See your percentile position and get a negotiation script tailored to this market.', '<strong>Weka kiasi unacholenga hapo juu</strong>Ona nafasi yako ya asilimia na upate maandishi ya majadiliano yanayolingana na soko hili.'],
  ['<span class="sb-remote-title">Remote Work Premium</span>', '<span class="sb-remote-title">Ziada ya Kazi ya Mbali</span>'],
  ['USD salary for diaspora &amp; remote-first roles', 'Mshahara wa USD kwa diaspora na nafasi zinazofanyika kwa mbali kwanza'],
  ['* Salary data is approximate based on aggregated public sources (Glassdoor, PayScale, local surveys) as of 2025/2026. Actual salaries vary by specific company, location within country, benefits package, and negotiation. USD conversion at approximate mid-market rates. PPP factors adjust for purchasing power differences.', '* Data ya mishahara ni ya makadirio kulingana na vyanzo vya umma vilivyojumlishwa (Glassdoor, PayScale, tafiti za ndani) hadi 2025/2026. Mishahara halisi hutofautiana kulingana na kampuni, eneo ndani ya nchi, pakiti ya marupurupu, na majadiliano. Ubadilishaji wa USD hutumia viwango vya soko vya katikati vinavyokadiriwa. Vigezo vya PPP hubadilisha nguvu ya ununuzi.'],
  ['<h2>Understanding Salaries Across Africa</h2>', '<h2>Kuelewa Mishahara Barani Afrika</h2>'],
  ['<h2>Frequently Asked Questions</h2>', '<h2>Maswali Yanayoulizwa Mara kwa Mara</h2>'],
  ['<span class="ai-title">AI Salary Compare Advisor</span>', '<span class="ai-title">Mshauri wa AI wa Kulinganisha Mishahara</span>'],
  ['Ask me anything about this tool &mdash; I can help explain results, suggest strategies, and answer questions.', 'Niulize chochote kuhusu zana hii &mdash; naweza kusaidia kueleza matokeo, kupendekeza mikakati, na kujibu maswali.'],
  ['placeholder="Ask a question..."', 'placeholder="Uliza swali..."'],
  ['aria-label="Message to AI advisor"', 'aria-label="Ujumbe kwa mshauri wa AI"'],
  ['Thinking\u2026', 'Inafikiri\u2026'],
  ['Sorry, the AI advisor is temporarily unavailable.', 'Samahani, mshauri wa AI kwa sasa haapatikani.'],
  ['tool-name="Salary Compare"', 'tool-name="Kulinganisha Mishahara"'],
  ['body:JSON.stringify({tool:\'salary-compare\',messages:AI_MSGS.slice(-6),context:\'\'})', 'body:JSON.stringify({tool:\'salary-compare\',messages:AI_MSGS.slice(-6),context:\'Jibu kwa Kiswahili na eleza matokeo ya zana ya kulinganisha mishahara.\'})'],
  ['Sorry, I could not get a response.', 'Samahani, sikuweza kupata jibu.'],
  ['Base Salary', 'Mshahara wa Msingi'],
  ['Total Annual Compensation', 'Fidia Kamili ya Mwaka'],
  ['Monthly gross: ', 'Jumla ya kila mwezi: '],
  ['Monthly local: ', 'Kila mwezi kwa sarafu ya ndani: '],
  ['Your Effective Skill Premium: +', 'Ziada Yako Halisi ya Ujuzi: +'],
  ['Applied with diminishing returns for stacked skills', 'Imetumika kwa faida inayopungua kadri ujuzi unavyojikusanya'],
  ['Skill Premium Analysis', 'Uchambuzi wa Ziada za Ujuzi'],
  ['How specific skills and certifications affect your pay. Premiums are cumulative with diminishing returns when stacking multiple skills.', 'Jinsi ujuzi na vyeti maalum vinavyoathiri malipo yako. Ziada hujilimbikiza lakini faida hupungua unapoongeza ujuzi mwingi.'],
  ['Salary Distribution \u2014 ', 'Usambazaji wa Mishahara \u2014 '],
  ['25th Percentile', 'Asilimia ya 25'],
  ['50th Percentile (Median)', 'Asilimia ya 50 (Wastani wa Kati)'],
  ['75th Percentile', 'Asilimia ya 75'],
  ['90th Percentile', 'Asilimia ya 90'],
  ['Junior range', 'Kiwango cha Junior'],
  ['Mid-level range', 'Kiwango cha Kati'],
  ['Senior range', 'Kiwango cha Juu'],
  ['Lead/Top earners', 'Viongozi / Wenye mapato ya juu'],
  ['Cost of Living Comparison', 'Ulinganisho wa Gharama ya Maisha'],
  ['See how salaries adjust for cost of living across major African cities. A lower cost of living index means your money goes further.', 'Ona jinsi mishahara inavyojirekebisha kulingana na gharama ya maisha katika miji mikuu ya Afrika. Fahirisi ya gharama ya maisha iliyo chini ina maana pesa yako inakwenda mbali zaidi.'],
  ['City breakdown not yet available for this country.', 'Mgawanyo wa miji bado haupatikani kwa nchi hii.'],
  ['City-Level Salary Breakdown', 'Mgawanyo wa Mishahara kwa Kiwango cha Mji'],
  ['Salary differences between major cities in ', 'Tofauti za mishahara kati ya miji mikuu katika '],
  ['PRIMARY', 'KUU'],
  [' pays approximately ', ' hulipa takriban '],
  [' for this role.', ' kwa nafasi hii.'],
  ['Gender Pay Gap \u2014 ', 'Pengo la Mishahara ya Kijinsia \u2014 '],
  ['Estimated from AfroSalary Database submissions and public research. Treat as directional, not definitive. <strong>Rwanda has the narrowest gender pay gap in Africa.</strong>', 'Imekadiriwa kutoka mawasilisho ya AfroSalary Database na utafiti wa umma. Itumie kama mwongozo, si kama ukweli wa mwisho. <strong>Rwanda ina pengo dogo zaidi la mishahara ya kijinsia Afrika.</strong>'],
  ['Men', 'Wanaume'],
  ['Women', 'Wanawake'],
  ['Inflation-Adjusted Salary Trend \u2014 ', 'Mwelekeo wa Mshahara Uliorekebishwa kwa Mfumuko wa Bei \u2014 '],
  ['Nominal Salary Change', 'Mabadiliko ya Kawaida ya Mshahara'],
  ['Inflation Rate (2025)', 'Kiwango cha Mfumuko wa Bei (2025)'],
  ['Real Salary Change', 'Mabadiliko Halisi ya Mshahara'],
  ['Despite nominal salary growth of ', 'Licha ya ukuaji wa kawaida wa mshahara wa '],
  [' due to ', ' kutokana na '],
  ['This salary has grown <strong>+', 'Mshahara huu umekua <strong>+'],
  [' above inflation (', ' juu ya mfumuko wa bei ('],
  ['One of Africa’s better-performing markets.', 'Moja ya masoko yenye utendaji bora zaidi barani Afrika.'],
  ['Has your salary kept up? If your salary has not increased by at least ', 'Je, mshahara wako umeendana? Kama mshahara wako haujaongezeka angalau '],
  [' in the past year, your real salary has fallen.', ' katika mwaka uliopita, mshahara wako halisi umeshuka.'],
  ['Career Progression Timeline', 'Ratiba ya Ukuaji wa Kazi'],
  ['Junior \u2192 Mid-Level', 'Junior \u2192 Kiwango cha Kati'],
  ['Mid-Level \u2192 Senior', 'Kiwango cha Kati \u2192 Senior'],
  ['Senior \u2192 Lead/Manager', 'Senior \u2192 Kiongozi/Meneja'],
  ['Average: <strong>', 'Wastani: <strong>'],
  [' years</strong>', ' miaka</strong>'],
  ['Benchmark: The median ', 'Kigezo: Muda wa wastani wa '],
  [' promotion for ', ' wa kupandishwa cheo kwa '],
  [' takes <strong>', ' ni <strong>'],
  ['If you’ve been at your current level longer than this, you may be overdue — or it’s time to move.', 'Ukiwa umekaa katika kiwango chako cha sasa muda mrefu zaidi ya huu, huenda umechelewa au ni wakati wa kusonga mbele.'],
  ['You’re asking below the median — ', 'Unaomba chini ya wastani wa kati — '],
  ['The market supports a higher ask. Consider targeting at least ', 'Soko linaunga mkono ombi la juu zaidi. Fikiria kulenga angalau '],
  ['Strong ask at the ', 'Ombi thabiti katika '],
  [' percentile. Defensible with the right framing. Prepare to articulate specific achievements and impact.', ' asilimia. Linaweza kutetewa ukiweka hoja sahihi. Jitayarishe kueleza mafanikio maalum na athari yako.'],
  ['The market range for ', 'Eneo la soko kwa '],
  ['Given my [X years’ experience / specific achievement], I’m targeting ', 'Kwa uzoefu wangu wa miaka [X] / mafanikio maalum, ninakusudia '],
  ['I believe that reflects my value accurately.', 'Ninaamini hilo linaonyesha thamani yangu kwa usahihi.'],
  ['Premium ask at the ', 'Ombi la juu katika '],
  ['You’ll need a strong story: specialist skills, competing offers, or demonstrated impact. Have your achievements ready.', 'Utaahitaji hoja imara: ujuzi mahususi, ofa pinzani, au athari iliyothibitishwa. Andaa mafanikio yako.'],
  ['Aggressive ask at the ', 'Ombi la juu sana katika '],
  ['You need leverage: a competing offer, rare specialization, or critical business need you uniquely solve.', 'Unahitaji nguvu ya mazungumzo: ofa pinzani, utaalamu adimu, au hitaji la biashara unalolitatua kipekee.'],
  ['I appreciate the opportunity. I’m transparent that I’m evaluating another offer at a comparable level. My ask of ', 'Ninathamini fursa hii. Niko wazi kuwa pia ninalinganisha ofa nyingine katika kiwango kinachofanana. Ombi langu la '],
  [' reflects [rare skill / unique achievement] and the business impact I’ll drive in [specific area]. I’m committed to this role and want to make it work.', ' linaonyesha [ujuzi adimu / mafanikio ya kipekee] na athari ya biashara nitakayoleta katika [eneo maalum]. Nimejitolea kwa nafasi hii na nataka tufanikishe.']
];

const countryNameReplacements = [
  ["name:'Nigeria'", "name:'Naijeria'"],
  ["name:'South Africa'", "name:'Afrika Kusini'"],
  ["name:'Morocco'", "name:'Moroko'"],
  ["name:'Senegal'", "name:'Senegali'"],
  ["name:'Cameroon'", "name:'Kameruni'"],
  ["name:'Mauritius'", "name:'Morisi'"],
  ["name:'Egypt'", "name:'Misri'"]
];

const dataReplacements = [
  ["label:'US Company'", "label:'Kampuni ya Marekani'"],
  ["label:'UK Company'", "label:'Kampuni ya Uingereza'"],
  ["label:'EU Company'", "label:'Kampuni ya Ulaya'"],
  ["label:'Canadian Company'", "label:'Kampuni ya Kanada'"],
  ["label:'Australian Company'", "label:'Kampuni ya Australia'"],
  ["label:'Housing Allowance'", "label:'Posho ya Makazi'"],
  ["label:'Transport Allowance'", "label:'Posho ya Usafiri'"],
  ["label:'Medical Insurance'", "label:'Bima ya Afya'"],
  ["label:'Pension Contribution'", "label:'Michango ya Pensheni'"],
  ["label:'Performance Bonus'", "label:'Bonasi ya Utendaji'"],
  ["'Junior (0-3 yrs)'", "'Junior (miaka 0-3)'"],
  ["'Mid-Level (3-7 yrs)'", "'Kiwango cha Kati (miaka 3-7)'"],
  ["'Senior (7-12 yrs)'", "'Senior (miaka 7-12)'"],
  ["'Lead/Manager (12+ yrs)'", "'Kiongozi/Meneja (miaka 12+)'"],
  ["'Local Market Rate'", "'Kiwango cha Soko la Ndani'"],
  ["'Typical Remote Rate'", "'Kiwango cha Kawaida cha Mbali'"],
  ["'Expected Premium'", "'Ziada Inayotarajiwa'"],
  ["'No statutory minimum wage in '", "'Hakuna kima cha chini cha kisheria katika '"],
  ["'Compliant'", "'Inaendana na sheria'"],
  ["'Below Minimum Wage — This is Illegal'", "'Chini ya Kima cha Chini cha Mshahara — Hii ni kinyume cha sheria'"],
  ["'What to do →'", "'Cha kufanya →'"],
  ["'Subscribed! We\\'ll notify you when the minimum wage changes in '", "'Umejisajili! Tutakujulisha kima cha chini cha mshahara kikibadilika katika '"],
  ["'Monthly'", "'Kila mwezi'"],
  ["'USD Equiv.'", "'Sawa na USD'"],
  ["'Daily'", "'Kila siku'"],
  ["'Hourly'", "'Kwa saa'"],
  ["'Living Wage Gap'", "'Pengo la Mshahara wa Maisha'"],
  ["'Effective'", "'Halisi'"],
  ["'Loading...'", "'Inapakia...'"],
  ["'Not set'", "'Haijawekwa'"],
  ["'N/A'", "'Haipatikani'"]
];

let html = fs.readFileSync(sourcePath, 'utf8');
html = applyReplacements(html, replacements);
html = applyReplacements(html, countryNameReplacements);
html = applyReplacements(html, dataReplacements);

html = replaceAll(html, '<option value="software-dev">Software Developer</option>', '<option value="software-dev">Msanidi Programu</option>');
html = replaceAll(html, '<option value="data-analyst">Data Analyst</option>', '<option value="data-analyst">Mchambuzi Data</option>');
html = replaceAll(html, '<option value="product-manager">Product Manager</option>', '<option value="product-manager">Meneja Bidhaa</option>');
html = replaceAll(html, '<option value="accountant">Accountant</option>', '<option value="accountant">Mhasibu</option>');
html = replaceAll(html, '<option value="marketing-manager">Marketing Manager</option>', '<option value="marketing-manager">Meneja Masoko</option>');
html = replaceAll(html, '<option value="hr-manager">HR Manager</option>', '<option value="hr-manager">Meneja Rasilimali Watu</option>');
html = replaceAll(html, '<option value="civil-engineer">Civil Engineer</option>', '<option value="civil-engineer">Mhandisi wa Ujenzi</option>');
html = replaceAll(html, '<option value="doctor">Medical Doctor</option>', '<option value="doctor">Daktari</option>');
html = replaceAll(html, '<option value="nurse">Registered Nurse</option>', '<option value="nurse">Muuguzi Aliyesajiliwa</option>');
html = replaceAll(html, '<option value="teacher">Secondary School Teacher</option>', '<option value="teacher">Mwalimu wa Shule ya Sekondari</option>');
html = replaceAll(html, '<option value="lawyer">Lawyer</option>', '<option value="lawyer">Wakili</option>');
html = replaceAll(html, '<option value="sales-exec">Sales Executive</option>', '<option value="sales-exec">Afisa Mauzo</option>');
html = replaceAll(html, '<option value="graphic-designer">Graphic Designer</option>', '<option value="graphic-designer">Mbunifu Picha</option>');
html = replaceAll(html, '<option value="bank-officer">Bank Officer</option>', '<option value="bank-officer">Afisa wa Benki</option>');
html = replaceAll(html, '<option value="project-manager">Project Manager</option>', '<option value="project-manager">Meneja Mradi</option>');
html = replaceAll(html, '<option value="ux-designer">UX/UI Designer</option>', '<option value="ux-designer">Mbunifu wa UX/UI</option>');
html = replaceAll(html, '<option value="devops-engineer">DevOps Engineer</option>', '<option value="devops-engineer">Mhandisi wa DevOps</option>');
html = replaceAll(html, '<option value="data-scientist">Data Scientist</option>', '<option value="data-scientist">Mwanasayansi wa Data</option>');
html = replaceAll(html, '<option value="pharmacist">Pharmacist</option>', '<option value="pharmacist">Mfamasia</option>');
html = replaceAll(html, '<option value="architect">Architect</option>', '<option value="architect">Mbunifu Majengo</option>');
html = replaceAll(html, '<option value="mobile-developer">Mobile Developer</option>', '<option value="mobile-developer">Msanidi Programu za Simu</option>');
html = replaceAll(html, '<option value="supply-chain">Supply Chain Manager</option>', '<option value="supply-chain">Meneja wa Mnyororo wa Ugavi</option>');
html = replaceAll(html, '<option value="social-media-mgr">Social Media Manager</option>', '<option value="social-media-mgr">Meneja wa Mitandao ya Kijamii</option>');
html = replaceAll(html, '<option value="0">Junior (0-3 years)</option>', '<option value="0">Junior (miaka 0-3)</option>');
html = replaceAll(html, '<option value="1" selected>Mid-Level (3-7 years)</option>', '<option value="1" selected>Kiwango cha Kati (miaka 3-7)</option>');
html = replaceAll(html, '<option value="2">Senior (7-12 years)</option>', '<option value="2">Senior (miaka 7-12)</option>');
html = replaceAll(html, '<option value="3">Lead / Manager (12+ years)</option>', '<option value="3">Kiongozi / Meneja (miaka 12+)</option>');
html = replaceAll(html, '<option value="tech">Technology</option>', '<option value="tech">Teknolojia</option>');
html = replaceAll(html, '<option value="banking">Banking / Financial Services</option>', '<option value="banking">Benki / Huduma za Kifedha</option>');
html = replaceAll(html, '<option value="oil-gas">Oil &amp; Gas / Energy</option>', '<option value="oil-gas">Mafuta na Gesi / Nishati</option>');
html = replaceAll(html, '<option value="telecom">Telecommunications</option>', '<option value="telecom">Mawasiliano</option>');
html = replaceAll(html, '<option value="fmcg">FMCG / Consumer Goods</option>', '<option value="fmcg">Bidhaa za Matumizi ya Haraka</option>');
html = replaceAll(html, '<option value="healthcare">Healthcare</option>', '<option value="healthcare">Afya</option>');
html = replaceAll(html, '<option value="education">Education</option>', '<option value="education">Elimu</option>');
html = replaceAll(html, '<option value="government">Government / Public Sector</option>', '<option value="government">Serikali / Sekta ya Umma</option>');
html = replaceAll(html, '<option value="ngo">NGO / International Org</option>', '<option value="ngo">Asasi Isiyo ya Kiserikali / Shirika la Kimataifa</option>');
html = replaceAll(html, '<option value="manufacturing">Manufacturing</option>', '<option value="manufacturing">Utengenezaji</option>');
html = replaceAll(html, '<option value="consulting">Consulting</option>', '<option value="consulting">Ushauri</option>');
html = replaceAll(html, '<option value="">-- Select --</option>', '<option value="">-- Chagua --</option>');
html = replaceAll(html, '<option value="">-- All cities --</option>', '<option value="">-- Miji yote --</option>');
html = replaceAll(html, '<option value="us">Ÿ‡¸ US Company</option>', '<option value="us">Ÿ‡¸ Kampuni ya Marekani</option>');
html = replaceAll(html, '<option value="uk">Ÿ‡§ UK Company</option>', '<option value="uk">Ÿ‡§ Kampuni ya Uingereza</option>');
html = replaceAll(html, '<option value="eu">Ÿ‡º EU Company</option>', '<option value="eu">Ÿ‡º Kampuni ya Ulaya</option>');
html = replaceAll(html, '<option value="canada">Ÿ‡¦ Canadian Company</option>', '<option value="canada">Ÿ‡¦ Kampuni ya Kanada</option>');
html = replaceAll(html, '<option value="aus">Ÿ‡º Australian Company</option>', '<option value="aus">Ÿ‡º Kampuni ya Australia</option>');
html = replaceAll(html, 'placeholder="e.g. 25000"', 'placeholder="mf. 25000"');
html = replaceAll(html, 'placeholder="e.g. 35000"', 'placeholder="mf. 35000"');
html = replaceAll(html, 'Monthly (Local)', 'Kila mwezi (Sarafu ya Ndani)');
html = replaceAll(html, 'Skill Premium', 'Ziada ya Ujuzi');
html = replaceAll(html, 'You earn more than approximately ', 'Unapata zaidi ya takriban ');
html = replaceAll(html, 'Average (', 'Wastani (');
html = replaceAll(html, 'Country', 'Nchi');
html = replaceAll(html, 'Your Salary', 'Mshahara Wako');
html = replaceAll(html, 'Salary levels across Africa vary dramatically between countries, sectors, company types, and urban vs rural locations. South Africa consistently offers the highest nominal salaries for most roles, reflecting its more developed economy and higher cost of living. Nigeria offers competitive salaries in tech and oil and gas but lower pay in traditional industries. Kenya has emerged as East Africa\'s salary leader, particularly in the technology sector.', 'Ngazi za mishahara barani Afrika hutofautiana sana kati ya nchi, sekta, aina ya kampuni, na maeneo ya mijini au vijijini. Afrika Kusini mara nyingi hutoa mishahara ya juu zaidi kwa nafasi nyingi, ikionyesha uchumi wake uliokomaa zaidi na gharama ya maisha iliyo juu zaidi. Naijeria hutoa mishahara shindani katika teknolojia na mafuta na gesi lakini malipo ya chini katika sekta za jadi. Kenya imejitokeza kama kiongozi wa mishahara Afrika Mashariki, hasa katika sekta ya teknolojia.');
html = replaceAll(html, 'The African tech sector has seen significant salary inflation driven by remote work opportunities with global companies, VC-funded startups competing for talent, and the expansion of multinational tech hubs in Lagos, Nairobi, Cape Town, and Cairo. Senior software engineers at well-funded African startups can now earn $50,000 to $100,000 or more annually.', 'Sekta ya teknolojia barani Afrika imeshuhudia ongezeko kubwa la mishahara linalochochewa na fursa za kazi za mbali na kampuni za kimataifa, kampuni changa zinazofadhiliwa na mtaji wa uwekezaji zikishindania vipaji, na kuongezeka kwa vituo vya teknolojia vya kimataifa katika Lagos, Nairobi, Cape Town, na Cairo. Wahandisi wakuu wa programu katika kampuni changa zenye ufadhili mzuri sasa wanaweza kupata USD 50,000 hadi 100,000 au zaidi kwa mwaka.');
html = replaceAll(html, 'Total compensation in Africa is heavily allowance-based. Many employers provide housing allowances (10-25% of base), transport allowances, medical insurance, and performance bonuses. In markets like Nigeria and Kenya, these allowances can add 30-50% on top of the base salary, making the total package significantly higher than the headline number.', 'Fidia kamili barani Afrika hutegemea sana posho. Waajiri wengi hutoa posho ya makazi (10-25% ya msingi), posho ya usafiri, bima ya afya, na bonasi za utendaji. Katika masoko kama Naijeria na Kenya, posho hizi zinaweza kuongeza 30-50% juu ya mshahara wa msingi, na kufanya kifurushi kizima kuwa kikubwa zaidi kuliko namba ya msingi inayoonekana.');
html = replaceAll(html, 'Purchasing Power Parity (PPP) adjustments reveal a more nuanced picture. A salary of $15,000 in Lagos provides roughly the same standard of living as $42,000 in a Western city, thanks to lower costs for housing, food, and services. This makes many African salaries more competitive than they appear in nominal USD terms.', 'Marekebisho ya Uwiano wa Nguvu ya Ununuzi (PPP) yanaonyesha picha yenye undani zaidi. Mshahara wa USD 15,000 Lagos hutoa takriban kiwango sawa cha maisha na USD 42,000 katika jiji la Magharibi, kutokana na gharama ndogo za makazi, chakula, na huduma. Hii hufanya mishahara mingi ya Afrika ionekane shindani zaidi kuliko inavyoonekana kwa thamani ya USD pekee.');
html = replaceAll(html, 'Which African country pays the highest salaries?', 'Ni nchi gani ya Afrika inayolipa mishahara ya juu zaidi?');
html = replaceAll(html, 'How do African tech salaries compare globally?', 'Mishahara ya teknolojia Afrika inalinganishwaje na duniani?');
html = replaceAll(html, 'What skills command the highest premium in Africa?', 'Ni ujuzi gani unaopata malipo ya ziada zaidi Afrika?');
html = replaceAll(html, 'How does total compensation work in Africa?', 'Fidia kamili hufanyaje kazi barani Afrika?');
html = replaceAll(html, 'How accurate is this salary data?', 'Data hii ya mishahara ni sahihi kiasi gani?');
html = replaceAll(html, 'What is PPP-adjusted salary?', 'Mshahara uliorekebishwa kwa PPP ni nini?');
html = replaceAll(html, 'Benchmark: The median ', 'Kigezo: Muda wa wastani wa ');
html = replaceAll(html, 'Career timeline data not available for this role.', 'Data ya ratiba ya kazi haipatikani kwa nafasi hii.');
html = replaceAll(html, 'Mfumuko wa Bei-Adjusted Salary Trend \u2014 ', 'Mwelekeo wa Mshahara Uliorekebishwa kwa Mfumuko wa Bei \u2014 ');
html = replaceAll(html, 'Mfumuko wa Bei-Adjusted Salary Trend - ', 'Mwelekeo wa Mshahara Uliorekebishwa kwa Mfumuko wa Bei — ');
html = replaceAll(html, 'Median months to wa kupandishwa cheo kwa ', 'Wastani wa miezi hadi kupandishwa cheo kwa ');

html = replaceAll(html, "body:JSON.stringify({tool:'salary-compare',messages:AI_MSGS.slice(-6),context:''})", "body:JSON.stringify({tool:'salary-compare',messages:AI_MSGS.slice(-6),context:'Jibu kwa Kiswahili na eleza matokeo ya zana ya kulinganisha mishahara.'})");
html = replaceAll(html, 'tool-name="Salary Compare"', 'tool-name="Kulinganisha Mishahara"');

html = replaceAll(html, "const EXP_LABELS = ['Junior (0-3 yrs)','Mid-Level (3-7 yrs)','Senior (7-12 yrs)','Lead/Manager (12+ yrs)'];", "const EXP_LABELS = ['Junior (miaka 0-3)','Kiwango cha Kati (miaka 3-7)','Senior (miaka 7-12)','Kiongozi/Meneja (miaka 12+)'];");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
