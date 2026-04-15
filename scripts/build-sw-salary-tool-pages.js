const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function write(relPath, content) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function replaceAll(content, replacements) {
  let result = content;
  replacements.forEach(([from, to]) => {
    result = result.split(from).join(to);
  });
  return result;
}

function replaceRegex(content, replacements) {
  let result = content;
  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });
  return result;
}

function swFlagCode(code) {
  return code ? code.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0))) : '';
}

const SW_COUNTRY_NAMES = {
  AO: 'Angola',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  BJ: 'Benin',
  BW: 'Botswana',
  CD: 'DR Congo',
  CF: 'Jamhuri ya Afrika ya Kati',
  CG: 'Congo',
  CI: "Cote d'Ivoire",
  CM: 'Kameruni',
  CV: 'Cabo Verde',
  DJ: 'Jibuti',
  DZ: 'Algeria',
  EG: 'Misri',
  ER: 'Eritrea',
  ET: 'Ethiopia',
  GA: 'Gabon',
  GH: 'Ghana',
  GM: 'Gambia',
  GN: 'Guinea',
  GQ: 'Guinea ya Ikweta',
  GW: 'Guinea-Bissau',
  KE: 'Kenya',
  KM: 'Komoro',
  LR: 'Liberia',
  LS: 'Lesotho',
  LY: 'Libya',
  MA: 'Moroko',
  MG: 'Madagascar',
  ML: 'Mali',
  MR: 'Mauritania',
  MU: 'Morisi',
  MW: 'Malawi',
  MZ: 'Msumbiji',
  NA: 'Namibia',
  NE: 'Niger',
  NG: 'Nigeria',
  RW: 'Rwanda',
  SC: 'Shelisheli',
  SD: 'Sudan',
  SL: 'Sierra Leone',
  SN: 'Senegal',
  SO: 'Somalia',
  SS: 'Sudan Kusini',
  ST: 'Sao Tome na Principe',
  SZ: 'Eswatini',
  TD: 'Chad',
  TG: 'Togo',
  TN: 'Tunisia',
  TZ: 'Tanzania',
  UG: 'Uganda',
  ZA: 'Afrika Kusini',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

function buildOvertimePage() {
  let html = read('tools/overtime-calc/index.html');

  html = replaceRegex(html, [
    [/<html([^>]*?)lang="en"/, '<html$1lang="sw"'],
    [/<title>[\s\S]*?<\/title>/, '<title>Kikokotoo cha Muda wa Ziada Afrika 2026 - Nchi 54 | AfroTools</title>'],
    [/<meta name="description" content="[^"]*">/, '<meta name="description" content="Kokotoa malipo ya muda wa ziada kwa kutumia sheria za kazi za nchi yako barani Afrika. Viwango vya siku ya kazi, wikendi, sikukuu za umma na zamu ya usiku kwa nchi zote 54.">'],
    [/<link rel="canonical" href="https:\/\/afrotools\.com\/tools\/overtime-calc\/">/, '<link rel="canonical" href="https://afrotools.com/sw/zana/kikokotoo-muda-wa-ziada/">'],
    [/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Kikokotoo cha Muda wa Ziada Afrika 2026 - Nchi 54 | AfroTools">'],
    [/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Kokotoa malipo ya muda wa ziada kwa sheria za kazi za Afrika. Nchi zote 54, zamu za usiku, wikendi, sikukuu na TOIL.">'],
    [/<meta property="og:url" content="https:\/\/afrotools\.com\/tools\/overtime-calc\/">/, '<meta property="og:url" content="https://afrotools.com/sw/zana/kikokotoo-muda-wa-ziada/">'],
    [/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="Kikokotoo cha Muda wa Ziada Afrika 2026 - Nchi 54 | AfroTools">'],
    [/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Kokotoa malipo ya muda wa ziada kwa nchi zote 54 za Afrika. TOIL, sikukuu, wikendi na zamu za usiku.">'],
    [/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebApplication","name":"Kikokotoo cha Muda wa Ziada Afrika 2026","url":"https://afrotools.com/sw/zana/kikokotoo-muda-wa-ziada/","description":"Kokotoa malipo ya muda wa ziada kwa kutumia sheria za kazi za nchi yako barani Afrika. Viwango vya siku ya kazi, wikendi, sikukuu za umma na zamu ya usiku.","applicationCategory":"FinanceApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"inLanguage":"sw"},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AfroTools","item":"https://afrotools.com"},{"@type":"ListItem","position":2,"name":"Kiswahili","item":"https://afrotools.com/sw/"},{"@type":"ListItem","position":3,"name":"Zana","item":"https://afrotools.com/sw/zana/"},{"@type":"ListItem","position":4,"name":"Kikokotoo cha Muda wa Ziada","item":"https://afrotools.com/sw/zana/kikokotoo-muda-wa-ziada/"}]}]}</script>\n  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kikokotoo-muda-wa-ziada/">\n  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/overtime-calc/">\n  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/overtime-calc/">\n  <meta property="og:locale" content="sw_TZ">\n  <meta name="content-language" content="sw">'],
  ]);

  html = replaceAll(html, [
    ['<a href="/">AfroTools</a> &rsaquo; <a href="/salary-tax/">Salary &amp; Tax</a> &rsaquo; Overtime Calculator', '<a href="/">AfroTools</a> &rsaquo; <a href="/sw/mshahara-na-kodi/">Mshahara na Kodi</a> &rsaquo; Kikokotoo cha Muda wa Ziada'],
    ['<div class="tl-category-label">&#x1F4B0; SALARY &amp; TAX</div>', '<div class="tl-category-label">&#x1F4B0; MSHAHARA NA KODI</div>'],
    ['<h1 class="tl-title">Overtime <span class="tl-accent">Calculator</span></h1>', '<h1 class="tl-title">Kikokotoo cha <span class="tl-accent">Muda wa Ziada</span></h1>'],
    ['<p class="tl-desc">Calculate overtime pay using country-specific labour law rates across all 54 African countries. Every country has different multipliers for weekday OT, weekends, public holidays and night shifts. Includes TOIL comparison and an OT dispute letter generator.</p>', '<p class="tl-desc">Kokotoa malipo ya muda wa ziada kwa kutumia sheria za kazi za nchi yako katika nchi zote 54 za Afrika. Linganisha viwango vya siku ya kazi, wikendi, sikukuu za umma na zamu za usiku pamoja na TOIL na barua ya madai.</p>'],
    ['<span>&#x1F30D; All 54 countries</span>', '<span>&#x1F30D; Nchi zote 54</span>'],
    ['<span>&#x1F1FF;&#x1F1E6; BCEA rates</span>', '<span>&#x1F1FF;&#x1F1E6; Viwango vya BCEA</span>'],
    ['<span>&#x1F1EC;&#x1F1ED; 2.5&times; holiday</span>', '<span>&#x1F1EC;&#x1F1ED; Sikukuu 2.5&times;</span>'],
    ['<span>&#x23F0; TOIL calculator</span>', '<span>&#x23F0; Ulinganisho wa TOIL</span>'],
    ['<span>&#x2696;&#xFE0F; Dispute letter</span>', '<span>&#x2696;&#xFE0F; Barua ya madai</span>'],
    ['<div class="tl-card-title">Overtime Pay Calculator</div>', '<div class="tl-card-title">Kikokotoo cha Malipo ya Muda wa Ziada</div>'],
    ['<div class="tl-card-sub">Select your country and enter your salary details</div>', '<div class="tl-card-sub">Chagua nchi yako kisha weka taarifa za mshahara</div>'],
    ['<label class="tl-label" for="country">COUNTRY</label>', '<label class="tl-label" for="country">NCHI</label>'],
    ['<label class="tl-label" for="monthly-salary">MONTHLY SALARY</label>', '<label class="tl-label" for="monthly-salary">MSHAHARA WA MWEZI</label>'],
    ['aria-label="Monthly salary amount"', 'aria-label="Kiasi cha mshahara wa mwezi"'],
    ['<label class="tl-label" for="ot-hours">OVERTIME HOURS</label>', '<label class="tl-label" for="ot-hours">SAA ZA MUDA WA ZIADA</label>'],
    ['<label class="tl-label" for="day-type">DAY TYPE</label>', '<label class="tl-label" for="day-type">AINA YA SIKU</label>'],
    ['<option value="weekday">Weekday (Normal OT)</option>', '<option value="weekday">Siku ya kazi (OT ya kawaida)</option>'],
    ['<option value="weekend">Weekend / Rest Day</option>', '<option value="weekend">Wikendi / siku ya mapumziko</option>'],
    ['<option value="holiday">Public Holiday</option>', '<option value="holiday">Sikukuu ya umma</option>'],
    ['<option value="night">Night Shift</option>', '<option value="night">Zamu ya usiku</option>'],
    ['<label class="tl-label" id="payment-type-label">PAYMENT TYPE</label>', '<label class="tl-label" id="payment-type-label">AINA YA MALIPO</label>'],
    ['&#x1F4B5; Cash Payment', '&#x1F4B5; Malipo ya fedha'],
    ['&#x23F0; TOIL (Time Off In Lieu)', '&#x23F0; TOIL (mapumziko badala ya malipo)'],
    ['<button class="tl-btn" onclick="calculate()">Calculate Overtime Pay</button>', '<button class="tl-btn" onclick="calculate()">Kokotoa Malipo ya Muda wa Ziada</button>'],
    ['<div class="tl-card-title">Overtime Calculation Results</div>', '<div class="tl-card-title">Matokeo ya Hesabu ya Muda wa Ziada</div>'],
    ['<div class="os-label">Base Hourly Rate</div>', '<div class="os-label">Kiwango cha msingi kwa saa</div>'],
    ['<div class="os-sub">Monthly &div; standard hours</div>', '<div class="os-sub">Mwezi &div; saa za kawaida</div>'],
    ['<div class="os-label">OT Multiplier</div>', '<div class="os-label">Kizidishi cha OT</div>'],
    ['<div class="os-label">Overtime Pay</div>', '<div class="os-label">Malipo ya muda wa ziada</div>'],
    ['<div class="os-label">Total Monthly Pay (with OT)</div>', '<div class="os-label">Jumla ya malipo ya mwezi (na OT)</div>'],
    ['<div class="ol-title">Legal Notes</div>', '<div class="ol-title">Maelezo ya kisheria</div>'],
    ['<div class="otb-title">&#x23F0; Time Off In Lieu (TOIL) Comparison</div>', '<div class="otb-title">&#x23F0; Ulinganisho wa TOIL</div>'],
    ['<div class="otb-row"><span class="otb-label">Cash OT value</span>', '<div class="otb-row"><span class="otb-label">Thamani ya OT ya fedha</span>'],
    ['<div class="otb-row"><span class="otb-label">TOIL hours equivalent</span>', '<div class="otb-row"><span class="otb-label">Saa sawa za TOIL</span>'],
    ['<div class="otb-row"><span class="otb-label">TOIL days equivalent</span>', '<div class="otb-row"><span class="otb-label">Siku sawa za TOIL</span>'],
    ['<div class="otb-row"><span class="otb-label">Daily rate (8hrs)</span>', '<div class="otb-row"><span class="otb-label">Kiwango cha siku (saa 8)</span>'],
    ['&#x1F4AC; Share via WhatsApp', '&#x1F4AC; Shiriki kupitia WhatsApp'],
    ['<summary>Generate OT Dispute Letter</summary>', '<summary>Tengeneza barua ya madai ya OT</summary>'],
    ['Use this if your employer has refused to pay your overtime. Edit the bracketed fields before sending.', 'Tumia hii ikiwa mwajiri wako amekataa kulipa muda wako wa ziada. Hariri sehemu za mabano kabla ya kutuma.'],
    ['&#x1F4CB; Copy Letter', '&#x1F4CB; Nakili barua'],
    ['<div class="tl-card-title">Standard Working Hours by Country</div>', '<div class="tl-card-title">Saa za kawaida za kazi kwa nchi</div>'],
    ['<div class="tl-card-sub">Key African labour law reference</div>', '<div class="tl-card-sub">Rejea kuu ya sheria za kazi Afrika</div>'],
    ['<tr><th>Country</th><th>Weekly Hrs</th><th>Monthly Hrs</th><th>Weekday OT</th><th>Holiday OT</th></tr>', '<tr><th>Nchi</th><th>Saa kwa wiki</th><th>Saa kwa mwezi</th><th>OT ya siku ya kazi</th><th>OT ya sikukuu</th></tr>'],
    ['<div class="tl-ai-badge">AI OBSERVATIONS</div>', '<div class="tl-ai-badge">MUHTASARI WA HARAKA</div>'],
    ['<div class="tl-ai-title">Country Insights</div>', '<div class="tl-ai-title">Muhtasari wa nchi</div>'],
    ['<div class="tl-ai-body" id="ai-obs">Select a country and calculate overtime to see AI-powered insights on local labour law, maximum OT limits, exemptions and enforcement practices.</div>', '<div class="tl-ai-body" id="ai-obs">Chagua nchi uone muhtasari wa muda wa kazi, viwango vya OT na maelezo ya kisheria kwa lugha rahisi.</div>'],
    ['<div class="tl-info-title">&#x2696;&#xFE0F; HOW IT WORKS</div>', '<div class="tl-info-title">&#x2696;&#xFE0F; JINSI INAVYOFANYA KAZI</div>'],
    ['<li><strong>Base hourly rate</strong> = Monthly salary &div; standard monthly hours</li>', '<li><strong>Kiwango cha msingi kwa saa</strong> = mshahara wa mwezi &div; saa za kawaida za mwezi</li>'],
    ['<li><strong>OT pay</strong> = Base hourly &times; multiplier &times; OT hours</li>', '<li><strong>Malipo ya OT</strong> = kiwango cha msingi kwa saa &times; kizidishi &times; saa za OT</li>'],
    ['<li><strong>Multipliers</strong> vary by country and day type (weekday, weekend, holiday, night)</li>', '<li><strong>Vizuishi</strong> hutofautiana kwa nchi na aina ya siku (siku ya kazi, wikendi, sikukuu, usiku)</li>'],
    ['<li><strong>Night shift</strong> premiums apply in addition to base OT in some jurisdictions</li>', '<li><strong>Zamu ya usiku</strong> inaweza kuwa na nyongeza juu ya OT ya msingi katika baadhi ya nchi</li>'],
    ['<div class="tl-info-title">&#x1F517; RELATED TOOLS</div>', '<div class="tl-info-title">&#x1F517; ZANA ZINAZOHUSIANA</div>'],
    ['<li><a href="/salary-tax/">&#x1F4B0; PAYE Calculator</a> &mdash; Income tax after deductions</li>', '<li><a href="/sw/mshahara-na-kodi/paye/">&#x1F4B0; Kikokotoo cha PAYE</a> &mdash; Kodi ya mapato baada ya makato</li>'],
    ['<li><a href="/tools/leave-days/">&#x1F4C5; Leave Days Calculator</a> &mdash; Statutory leave entitlements</li>', '<li><a href="/tools/leave-days/">&#x1F4C5; Kikokotoo cha siku za likizo</a> &mdash; Haki za likizo za kisheria</li>'],
    ['<li><a href="/tools/staff-cost/">&#x1F465; Employee Cost Calculator</a> &mdash; True cost of hiring</li>', '<li><a href="/tools/staff-cost/">&#x1F465; Kikokotoo cha gharama ya mfanyakazi</a> &mdash; Gharama halisi ya kuajiri</li>'],
    ['<li><a href="/tools/minimum-wage/">&#x1F4CA; Minimum Wage Reference</a> &mdash; All 54 countries</li>', '<li><a href="/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/">&#x1F4CA; Kima cha chini cha mshahara</a> &mdash; Nchi zote 54</li>'],
    ['<li><a href="/tools/working-days/">&#x1F4C6; Working Days Calculator</a> &mdash; Business days between dates</li>', '<li><a href="/tools/working-days/">&#x1F4C6; Kikokotoo cha siku za kazi</a> &mdash; Siku za kazi kati ya tarehe</li>'],
  ]);

  html = html.replace(
    "var countrySelect = document.getElementById('country');",
    `var countrySelect = document.getElementById('country');
var SW_COUNTRY_NAMES = ${JSON.stringify(SW_COUNTRY_NAMES, null, 2)};`
  );

  html = replaceRegex(html, [
    [/opt\.textContent = rule\.flag \+ ' ' \+ rule\.name;/, "opt.textContent = rule.flag + ' ' + (SW_COUNTRY_NAMES[codes[i]] || rule.name);"],
    [/var obsEl = document\.getElementById\('ai-obs'\);[\s\S]*?}\n}/, "var obsEl = document.getElementById('ai-obs');\n  var weekly = rule.standardHours && rule.standardHours.weekly ? rule.standardHours.weekly + ' saa kwa wiki' : 'saa za kawaida za kazi';\n  obsEl.textContent = 'Sheria za ' + (SW_COUNTRY_NAMES[code] || rule.name) + ' zitatumika kwenye hesabu hii. Saa za kawaida: ' + weekly + '. Chagua aina ya siku na uone malipo ya muda wa ziada na TOIL.';\n}"],
    [/return Number\(n\)\.toLocaleString\('en-US'/, "return Number(n).toLocaleString('sw-TZ'"],
    [/alert\('Data is still loading\. Please wait a moment and try again\.'\);/, "alert('Data bado inapakia. Tafadhali subiri kidogo kisha ujaribu tena.');"],
    [/alert\('Please enter a valid monthly salary\.'\);/, "alert('Tafadhali weka mshahara sahihi wa mwezi.');"],
    [/alert\('Please enter valid overtime hours\.'\);/, "alert('Tafadhali weka saa sahihi za muda wa ziada.');"],
    [/calcBtn\.textContent = 'Calculating\\u2026';/, "calcBtn.textContent = 'Inakokotoa...';"],
    [/alert\(result \? result\.error : 'Calculation failed\.'\);/, "alert(result ? result.error : 'Hesabu imeshindikana.');"],
    [/var dayLabel = inputs\.dayType\.charAt\(0\)\.toUpperCase\(\) \+ inputs\.dayType\.slice\(1\);/, "var dayLabels = { weekday: 'Siku ya kazi', weekend: 'Wikendi', holiday: 'Sikukuu ya umma', night: 'Zamu ya usiku' };\n  var dayLabel = dayLabels[inputs.dayType] || inputs.dayType;"],
    [/document\.getElementById\('r-multiplier-type'\)\.textContent = dayLabel \+ ' rate';/, "document.getElementById('r-multiplier-type').textContent = 'Kiwango cha ' + dayLabel.toLowerCase();"],
    [/document\.getElementById\('r-ot-hours-label'\)\.textContent = inputs\.overtimeHours \+ ' hour' \+ \(inputs\.overtimeHours !== 1 \? 's' : ''\) \+ ' of overtime';/, "document.getElementById('r-ot-hours-label').textContent = inputs.overtimeHours + ' saa za muda wa ziada';"],
    [/document\.getElementById\('r-effective-rate'\)\.textContent = 'Effective hourly rate with OT: ' \+ cur \+ ' ' \+ fmt\(result\.effectiveHourly\);/, "document.getElementById('r-effective-rate').textContent = 'Kiwango halisi kwa saa na OT: ' + cur + ' ' + fmt(result.effectiveHourly);"],
    [/document\.getElementById\('result-subtitle'\)\.textContent = rule\.flag \+ ' ' \+ rule\.name \+ ' \\u2014 ' \+ dayLabel \+ ' Overtime';/, "document.getElementById('result-subtitle').textContent = rule.flag + ' ' + (SW_COUNTRY_NAMES[inputs.country] || rule.name) + ' - OT ya ' + dayLabel.toLowerCase();"],
    [/li\.textContent = 'Max overtime: ' \+ maxOT\.weekly \+ ' hours\/week';/, "li.textContent = 'Kiwango cha juu cha OT: ' + maxOT.weekly + ' saa kwa wiki';"],
    [/li2\.textContent = 'Max overtime: ' \+ maxOT\.daily \+ ' hours\/day';/, "li2.textContent = 'Kiwango cha juu cha OT: ' + maxOT.daily + ' saa kwa siku';"],
    [/li3\.textContent = 'Max overtime: ' \+ maxOT\.monthly \+ ' hours\/month';/, "li3.textContent = 'Kiwango cha juu cha OT: ' + maxOT.monthly + ' saa kwa mwezi';"],
    [/li4\.textContent = 'Night work: ' \+ rule\.nightWork\.definition;/, "li4.textContent = 'Zamu ya usiku: ' + rule.nightWork.definition;"],
    [/li5\.textContent = 'Exemptions: ' \+ result\.exemptions\.join\('; '\);/, "li5.textContent = 'Misamaha: ' + result.exemptions.join('; ');"],
    [/var lawText = \(rule\.standardHours && rule\.standardHours\.law\) \? 'Law: ' \+ rule\.standardHours\.law : '';/, "var lawText = (rule.standardHours && rule.standardHours.law) ? 'Sheria: ' + rule.standardHours.law : '';"],
    [/document\.getElementById\('toil-hours'\)\.textContent = fmt\(toilHours, 1\) \+ ' hrs';/, "document.getElementById('toil-hours').textContent = fmt(toilHours, 1) + ' saa';"],
    [/document\.getElementById\('toil-days'\)\.textContent = fmt\(toilDays, 1\) \+ ' days';/, "document.getElementById('toil-days').textContent = fmt(toilDays, 1) + ' siku';"],
    [/document\.getElementById\('toil-daily-rate'\)\.textContent = cur \+ ' ' \+ fmt\(dailyRate\) \+ '\/day';/, "document.getElementById('toil-daily-rate').textContent = cur + ' ' + fmt(dailyRate) + ' / siku';"],
    [/document\.getElementById\('toil-verdict'\)\.textContent = cashIsBetter[\s\S]*?;\n    toilBlock\.style\.display = '';/, "document.getElementById('toil-verdict').textContent = cashIsBetter\n      ? 'Fedha ina thamani ya juu kwa takriban ' + pct + '% kuliko TOIL kwenye kiwango chako cha siku.'\n      : 'Thamani ya TOIL (' + cur + ' ' + fmt(toilCashEquiv) + ') iko karibu na malipo ya fedha.';\n    toilBlock.style.display = '';"],
    [/var month = new Date\(\)\.toLocaleString\('en-US', \{ month: 'long', year: 'numeric' \}\);/, "var month = new Date().toLocaleString('sw-TZ', { month: 'long', year: 'numeric' });"],
    [/var waText = '\*Overtime Calculation \\u2014 ' \+ rule\.name \+ '\*\\nMonth: ' \+ month \+ '\\nSalary: ' \+ cur \+ fmt\(inputs\.monthlySalary, 0\) \+ '\/month\\nOT hours: ' \+ inputs\.overtimeHours \+ ' \(' \+ inputs\.dayType \+ '\)\\nOT rate: ' \+ result\.otMultiplier \+ '\\u00D7\\n\*OT pay: ' \+ cur \+ fmt\(result\.overtimePay\) \+ '\*\\n\*Total pay: ' \+ cur \+ fmt\(result\.totalPay\) \+ '\*\\n' \+ \(lawText \? lawText : ''\);/, "var waText = '*Hesabu ya Muda wa Ziada - ' + (SW_COUNTRY_NAMES[inputs.country] || rule.name) + '*\\nMwezi: ' + month + '\\nMshahara: ' + cur + fmt(inputs.monthlySalary, 0) + '/mwezi\\nSaa za OT: ' + inputs.overtimeHours + ' (' + dayLabel + ')\\nKiwango cha OT: ' + result.otMultiplier + 'x\\n*Malipo ya OT: ' + cur + fmt(result.overtimePay) + '*\\n*Jumla ya malipo: ' + cur + fmt(result.totalPay) + '*\\n' + (lawText ? lawText : '');"],
    [/new Date\(\)\.toLocaleDateString\('en-GB'\)/, "new Date().toLocaleDateString('sw-TZ')"],
  ]);

  html = html.replace(
    "var lawRef2 = (rule.standardHours && rule.standardHours.law) ? rule.standardHours.law : '[Labour Act]';",
    "var lawRef2 = (rule.standardHours && rule.standardHours.law) ? rule.standardHours.law : '[Sheria ya Kazi]';"
  );

  html = html.replace(
    /var letter = 'Date: ' \+ new Date\(\)\.toLocaleDateString\('sw-TZ'\) \+[\s\S]*?document\.getElementById\('dispute-letter'\)\.textContent = letter;/,
    "var letter = 'Tarehe: ' + new Date().toLocaleDateString('sw-TZ') + '\\n\\nKwa: [Jina la Mwajiri / Meneja wa Rasilimali Watu]\\n[Jina la Kampuni]\\n[Anwani ya Kampuni]\\n\\nKutoka: [Jina Lako Kamili]\\n[Cheo Chako]\\n[Nambari ya Mfanyakazi]\\n\\nSomo: Madai ya kutolipwa muda wa ziada\\n\\nNdugu [Jina la Meneja],\\n\\nNaandika kuomba rasmi malipo ya muda wa ziada ninayodaiwa kwa kazi niliyofanya katika mwezi wa ' + month + '.\\n\\nKama ilivyoandikwa, nilifanya saa ' + inputs.overtimeHours + ' za muda wa ziada katika kipindi hiki (' + dayLabel.toLowerCase() + '). Chini ya ' + lawRef2 + ', muda wa ziada hulipwa kwa kiwango cha ' + result.otMultiplier + 'x cha kiwango cha kawaida kwa saa.\\n\\nHesabu:\\n  Mshahara wa mwezi: ' + cur + fmt(inputs.monthlySalary, 0) + '\\n  Kiwango cha kawaida kwa saa: ' + cur + fmt(result.hourlyRate) + '\\n  Kizidishi cha OT: ' + result.otMultiplier + 'x\\n  Saa za OT: ' + inputs.overtimeHours + '\\n  Kiasi ninachodai: ' + cur + fmt(result.overtimePay) + '\\n\\nNaomba kiasi hiki kijumuishwe kwenye malipo yangu yajayo au kilipwe ndani ya siku [14] tangu tarehe ya barua hii.\\n\\nIwapo suala hili halitatatuliwa, nitawasilisha malalamiko rasmi kwa [Wizara ya Kazi / mamlaka husika].\\n\\nWako kwa uaminifu,\\n[Sahihi Yako]\\n[Jina Lako Kamili]\\n[Tarehe]';\n  document.getElementById('dispute-letter').textContent = letter;"
  );

  html = replaceRegex(html, [
    [/btn\.textContent = '\\u2713 Copied!';/g, "btn.textContent = '✓ Imenakiliwa!';"],
    [/btn\.textContent = '\\uD83D\\uDCCB Copy Letter';/g, "btn.textContent = '📋 Nakili barua';"],
  ]);

  html = replaceAll(html, [
    ['Select a country and calculate overtime to see insights on local labour law practices.', 'Chagua nchi uone muhtasari wa sheria za kazi, saa za kawaida na viwango vya muda wa ziada.'],
  ]);

  write('sw/zana/kikokotoo-muda-wa-ziada/index.html', html);
}

function buildMinimumWagePage() {
  let html = read('tools/minimum-wage/index.html');

  html = replaceRegex(html, [
    [/<html([^>]*?)lang="en"/, '<html$1lang="sw"'],
    [/<title>[\s\S]*?<\/title>/, '<title>Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026 | AfroTools</title>'],
    [/<meta name="description" content="[^"]*">/, '<meta name="description" content="Angalia kima cha chini cha mshahara kwa nchi zote 54 za Afrika. Uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya kihistoria, sekta maalumu na tahadhari za nchi.">'],
    [/<link rel="canonical" href="https:\/\/afrotools\.com\/tools\/minimum-wage\/">/, '<link rel="canonical" href="https://afrotools.com/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/">'],
    [/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026 | AfroTools">'],
    [/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Angalia kima cha chini cha mshahara kwa nchi zote 54 za Afrika. Uhakiki wa ulinganifu, pengo la gharama ya maisha na mabadiliko ya kihistoria.">'],
    [/<meta property="og:url" content="https:\/\/afrotools\.com\/tools\/minimum-wage\/">/, '<meta property="og:url" content="https://afrotools.com/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/">'],
    [/<meta property="og:locale" content="en_US">/, '<meta property="og:locale" content="sw_TZ">'],
    [/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026 | AfroTools">'],
    [/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Uhakiki wa ulinganifu, pengo la gharama ya maisha, viwango vya sekta na tahadhari za nchi kwa Afrika yote.">'],
    [/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebApplication","name":"Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026","url":"https://afrotools.com/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/","description":"Angalia kima cha chini cha mshahara kwa nchi zote 54 za Afrika kwa uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya kihistoria na tahadhari za nchi.","applicationCategory":"FinanceApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"author":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"inLanguage":"sw"},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AfroTools","item":"https://afrotools.com"},{"@type":"ListItem","position":2,"name":"Kiswahili","item":"https://afrotools.com/sw/"},{"@type":"ListItem","position":3,"name":"Zana","item":"https://afrotools.com/sw/zana/"},{"@type":"ListItem","position":4,"name":"Kikokotoo cha Kima cha Chini cha Mshahara","item":"https://afrotools.com/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/"}]}]}</script>\n  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/">\n  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/minimum-wage/">\n  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/minimum-wage/">\n  <meta name="content-language" content="sw">'],
  ]);

  html = replaceAll(html, [
    ['<a href="/">AfroTools</a> â€º <a href="/salary-tax/">Salary &amp; Tax</a> â€º Minimum Wage Checker', '<a href="/">AfroTools</a> â€º <a href="/sw/mshahara-na-kodi/">Mshahara na Kodi</a> â€º Kikokotoo cha Kima cha Chini cha Mshahara'],
    ['<div class="tl-category-label">ðŸ’° SALARY &amp; TAX</div>', '<div class="tl-category-label">ðŸ’° MSHAHARA NA KODI</div>'],
    ['<h1 class="tl-title">Minimum Wage <span class="tl-accent">Checker</span></h1>', '<h1 class="tl-title">Kikokotoo cha <span class="tl-accent">Kima cha Chini cha Mshahara</span></h1>'],
    ['<p class="tl-desc">Check the current minimum wage for any African country â€” with compliance checker, living wage gap, inflation erosion tracker, sector rates, and country alerts. All 54 countries covered.</p>', '<p class="tl-desc">Angalia kima cha chini cha mshahara kwa nchi yoyote ya Afrika pamoja na uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya nguvu ya manunuzi, viwango vya sekta na tahadhari za nchi. Nchi zote 54 zimejumuishwa.</p>'],
    ['<div class="tl-card-title">Minimum Wage Checker</div>', '<div class="tl-card-title">Kikokotoo cha Kima cha Chini cha Mshahara</div>'],
    ['<div class="tl-card-sub">Select a country to view rates, check compliance, and see the living wage gap</div>', '<div class="tl-card-sub">Chagua nchi uone viwango, hakiki ulinganifu na pengo la gharama ya maisha</div>'],
    ['<label class="tl-label" for="country">COUNTRY</label>', '<label class="tl-label" for="country">NCHI</label>'],
    ['<option value="">â€” Select a country â€”</option>', '<option value="">â€” Chagua nchi â€”</option>'],
    ['<label class="tl-label" for="state-select">REFINE BY STATE / SECTOR (OPTIONAL)</label>', '<label class="tl-label" for="state-select">CHUJA KWA JIMBO / SEKTA (SI LAZIMA)</label>'],
    ['<option value="">â€” National / all states â€”</option>', '<option value="">â€” Taifa / majimbo yote â€”</option>'],
    ['<span>Check if my salary is compliant</span>', '<span>Hakiki kama mshahara wangu unafuata sheria</span>'],
    ['<p style="font-size:.82rem;color:#64748b;margin:0 0 12px">Enter your monthly gross salary to check if it meets the legal minimum.</p>', '<p style="font-size:.82rem;color:#64748b;margin:0 0 12px">Weka mshahara wako wa mwezi kabla ya makato ili kuona kama unafikia kiwango cha chini cha kisheria.</p>'],
    ['placeholder="e.g. 80000"', 'placeholder="mf. 80000"'],
    ['aria-label="Monthly gross salary"', 'aria-label="Mshahara wa mwezi kabla ya makato"'],
    ['<button onclick="checkCompliance()">Check</button>', '<button onclick="checkCompliance()">Hakiki</button>'],
    ["<strong>What to do if you're paid below minimum wage:</strong><br>", '<strong>Cha kufanya ukilipwa chini ya kima cha chini cha mshahara:</strong><br>'],
    ['1. Collect evidence â€” payslips, bank statements, employment contract<br>', '1. Kusanya ushahidi â€” payslip, taarifa ya benki na mkataba wa ajira<br>'],
    ['2. Report to your national Ministry of Labour / labour inspectorate<br>', '2. Ripoti kwa Wizara ya Kazi au mkaguzi wa kazi wa nchi yako<br>'],
    ['3. Contact a registered trade union for support<br>', '3. Wasiliana na chama cha wafanyakazi kilichosajiliwa kwa msaada<br>'],
    ['4. File a complaint with the industrial tribunal or labour court<br>', '4. Wasilisha malalamiko kwa mahakama ya kazi au chombo husika<br>'],
    ['Generate a formal complaint letter â†’', 'Tengeneza barua rasmi ya malalamiko â†’'],
    ['Select a country above to view minimum wage data', 'Chagua nchi hapo juu ili kuona taarifa za kima cha chini cha mshahara'],
    ['<div class="mw-label">Monthly</div>', '<div class="mw-label">Kwa mwezi</div>'],
    ['<div class="mw-label">Daily</div>', '<div class="mw-label">Kwa siku</div>'],
    ['<div class="mw-label">Hourly</div>', '<div class="mw-label">Kwa saa</div>'],
    ['<span class="mw-info-label">â‰ˆ USD Equivalent</span>', '<span class="mw-info-label">â‰ˆ Sawa na USD</span>'],
    ['<h2 class="tl-section-title">Details</h2>', '<h2 class="tl-section-title">Maelezo</h2>'],
    ['<h2 class="tl-section-title" style="margin-top:16px">Sector-Specific Rates</h2>', '<h2 class="tl-section-title" style="margin-top:16px">Viwango vya sekta maalumu</h2>'],
    ['<thead><tr><th>Sector</th><th>Rate</th><th>Period</th></tr></thead>', '<thead><tr><th>Sekta</th><th>Kiwango</th><th>Kipindi</th></tr></thead>'],
    ['<h2 class="tl-section-title" style="margin-top:16px">Living Wage Gap</h2>', '<h2 class="tl-section-title" style="margin-top:16px">Pengo la gharama ya maisha</h2>'],
    ['<span>Legal Minimum Wage</span>', '<span>Kima cha chini cha kisheria</span>'],
    ['<span>Living Wage â€” Individual</span>', '<span>Gharama ya maisha â€” mtu mmoja</span>'],
    ['<span>Living Wage â€” Family of 4</span>', '<span>Gharama ya maisha â€” familia ya watu 4</span>'],
    ['<h2 class="tl-section-title" style="margin-top:16px">Previous Rates</h2>', '<h2 class="tl-section-title" style="margin-top:16px">Viwango vya awali</h2>'],
    ['aria-label="Minimum wage history chart"', 'aria-label="Chati ya historia ya kima cha chini cha mshahara"'],
    ['<h2 class="tl-section-title" style="margin-top:16px">Purchasing Power Erosion</h2>', '<h2 class="tl-section-title" style="margin-top:16px">Kupungua kwa nguvu ya manunuzi</h2>'],
    ['aria-label="Purchasing power erosion chart"', 'aria-label="Chati ya kupungua kwa nguvu ya manunuzi"'],
    ['<div class="ai-name">AfroTools AI</div>', '<div class="ai-name">Muhtasari wa AfroTools</div>'],
    ['<p>Select a country above to see AI-powered observations about minimum wage compliance, enforcement, and living wage gaps.</p>', '<p>Chagua nchi hapo juu uone muhtasari wa kima cha chini cha mshahara, ulinganifu na pengo la gharama ya maisha.</p>'],
    ['<div class="mw-alert-title">ðŸ”” Get Notified When <span id="alert-country-name">This Country\'s</span> Minimum Wage Changes</div>', '<div class="mw-alert-title">ðŸ”” Pata taarifa kima cha chini cha mshahara cha <span id="alert-country-name">nchi hii</span> kinapobadilika</div>'],
    ['<div class="mw-alert-sub">We\'ll email you when the rate is updated â€” no spam, just the change.</div>', '<div class="mw-alert-sub">Tutakutumia barua pepe kiwango kinapobadilika â€” hakuna spam, taarifa ya mabadiliko tu.</div>'],
    ['placeholder="Your email address"', 'placeholder="Anwani yako ya barua pepe"'],
    ['aria-label="Email address for minimum wage change alerts"', 'aria-label="Barua pepe ya tahadhari za kima cha chini cha mshahara"'],
    ['<button onclick="subscribeAlert()">Subscribe</button>', '<button onclick="subscribeAlert()">Jiandikishe</button>'],
    ['<h2 class="tl-section-title" style="margin-top:20px">Compare Countries</h2>', '<h2 class="tl-section-title" style="margin-top:20px">Linganisha nchi</h2>'],
    ['Compare 2 Countries Side by Side', 'Linganisha nchi 2 bega kwa bega'],
    ['<label class="tl-label" for="compare-a">COUNTRY A</label>', '<label class="tl-label" for="compare-a">NCHI A</label>'],
    ['<label class="tl-label" for="compare-b">COUNTRY B</label>', '<label class="tl-label" for="compare-b">NCHI B</label>'],
    ['<option value="">â€” Select â€”</option>', '<option value="">â€” Chagua â€”</option>'],
    ['<h2 class="tl-section-title" style="margin-top:28px">All 54 African Countries â€” Minimum Wage Comparison</h2>', '<h2 class="tl-section-title" style="margin-top:28px">Nchi zote 54 za Afrika â€” Ulinganisho wa kima cha chini cha mshahara</h2>'],
    ['All 54', 'Zote 54'],
    ['Top 10 (USD)', '10 bora (USD)'],
    ['Bottom 10 (USD)', '10 za chini (USD)'],
    ['aria-label="Export all countries as CSV"', 'aria-label="Hamisha nchi zote kama CSV"'],
    ['Export CSV', 'Hamisha CSV'],
    ['Minimum wage comparison â€” all 54 African countries, sortable by column header', 'Ulinganisho wa kima cha chini cha mshahara â€” nchi zote 54 za Afrika, linaweza kupangwa kwa kichwa cha safu'],
    ['Country <span aria-hidden="true">â†•</span>', 'Nchi <span aria-hidden="true">â†•</span>'],
    ['Local Rate <span aria-hidden="true">â†•</span>', 'Kiwango cha ndani <span aria-hidden="true">â†•</span>'],
    ['USD/Month <span aria-hidden="true">â†•</span>', 'USD/Mwezi <span aria-hidden="true">â†•</span>'],
    ['Effective Date <span aria-hidden="true">â†•</span>', 'Tarehe ya kuanza <span aria-hidden="true">â†•</span>'],
    ['Loadingâ€¦', 'Inapakia...'],
    ['ðŸ“¢ Report a Wage Violation', 'ðŸ“¢ Ripoti ukiukaji wa mshahara'],
    ['Know of an employer paying below the legal minimum wage? Report it anonymously. Verified reports earn 50 AfroPoints. Aggregate stats only â€” no employer names without verification.', 'Unamfahamu mwajiri anayelipa chini ya kiwango cha chini cha kisheria? Ripoti bila kutaja jina lako. Ripoti zilizothibitishwa hupata AfroPoints 50. Tunahifadhi takwimu za jumla tu hadi uthibitisho upatikane.'],
    ['Report Anonymously', 'Ripoti bila jina'],
    ['<label class="mw-vf-label" for="vf-country">Country</label>', '<label class="mw-vf-label" for="vf-country">Nchi</label>'],
    ['<label class="mw-vf-label" for="vf-sector">Sector / Industry</label>', '<label class="mw-vf-label" for="vf-sector">Sekta / tasnia</label>'],
    ['placeholder="e.g. Garment, Domestic Work, Agriculture"', 'placeholder="mf. mavazi, kazi za nyumbani, kilimo"'],
    ['<label class="mw-vf-label" for="vf-salary">Reported Monthly Salary (local currency)</label>', '<label class="mw-vf-label" for="vf-salary">Mshahara wa mwezi ulioripotiwa (sarafu ya ndani)</label>'],
    ['placeholder="e.g. 25000"', 'placeholder="mf. 25000"'],
    ['<label class="mw-vf-label" for="vf-city">City / State (optional)</label>', '<label class="mw-vf-label" for="vf-city">Jiji / jimbo (si lazima)</label>'],
    ['placeholder="e.g. Lagos, Nakuru, Cape Town"', 'placeholder="mf. Lagos, Nakuru, Cape Town"'],
    ['<button class="mw-vf-submit" onclick="submitViolation()">Submit Report</button>', '<button class="mw-vf-submit" onclick="submitViolation()">Wasilisha ripoti</button>'],
    ['All reports are anonymous. Data is moderated before public display.', 'Ripoti zote hazina majina. Data hupitiwa kabla ya kuonyeshwa hadharani.'],
    ['<div class="tl-ai-badge">AI OBSERVATIONS</div>', '<div class="tl-ai-badge">MUHTASARI WA HARAKA</div>'],
    ['<div class="tl-ai-title">Smart Insights</div>', '<div class="tl-ai-title">Maarifa ya haraka</div>'],
    ['Select a country to see regional minimum wage insights and compliance tips.', 'Chagua nchi uone muhtasari wa kima cha chini cha mshahara na vidokezo vya ulinganifu.'],
    ['âš ï¸ KNOW YOUR RIGHTS', 'âš ï¸ JUA HAKI ZAKO'],
    ['Minimum wage is the legal floor â€” employers cannot pay below it', 'Kima cha chini cha mshahara ni kiwango cha kisheria â€” mwajiri haruhusiwi kulipa chini yake'],
    ['Some countries have sector-specific rates (agriculture, domestic work)', 'Baadhi ya nchi zina viwango vya sekta maalumu kama kilimo na kazi za nyumbani'],
    ['Overtime, night shifts, and hazardous work often carry premium rates', 'Muda wa ziada, zamu za usiku na kazi hatarishi mara nyingi huwa na viwango vya juu zaidi'],
    ['Deductions for housing or meals may be capped by law', 'Makato ya nyumba au chakula yanaweza kuwa na kikomo cha kisheria'],
    ['Enforcement varies widely across the continent', 'Utekelezaji hutofautiana sana barani kote'],
    ['Report violations to the Ministry of Labour in your country', 'Ripoti ukiukaji kwa Wizara ya Kazi ya nchi yako'],
    ['ðŸ”— RELATED TOOLS', 'ðŸ”— ZANA ZINAZOHUSIANA'],
    ['<li><a href="/salary-tax/">ðŸ’µ Salary Calculator</a> â€” Net pay after tax</li>', '<li><a href="/sw/mshahara-na-kodi/paye/">ðŸ’µ Kikokotoo cha mshahara</a> â€” Malipo halisi baada ya kodi</li>'],
    ['<li><a href="/salary-tax/">ðŸ’° PAYE Tax Calculator</a> â€” 50+ countries</li>', '<li><a href="/sw/mshahara-na-kodi/paye/">ðŸ’° Kikokotoo cha PAYE</a> â€” Nchi 50+</li>'],
    ['<li><a href="/tools/cost-of-living/">ðŸ™ï¸ Cost of Living</a> â€” Compare cities</li>', '<li><a href="/tools/cost-of-living/">ðŸ™ï¸ Gharama ya maisha</a> â€” Linganisha miji</li>'],
    ['<li><a href="/tools/currency-converter/">ðŸ’± Currency Converter</a> â€” Convert wages</li>', '<li><a href="/sw/zana/kibadilishaji-sarafu/">ðŸ’± Kibadilishaji cha sarafu</a> â€” Badilisha mishahara</li>'],
    ['<li><a href="/tools/employee-cost/">ðŸ‘· Staff Cost Calculator</a> â€” Employer burden</li>', '<li><a href="/tools/employee-cost/">ðŸ‘· Kikokotoo cha gharama ya mfanyakazi</a> â€” Mzigo wa mwajiri</li>'],
    ['<li><a href="/salary-tax/">ðŸ’° All Salary &amp; Tax Tools</a> â€” Full toolkit</li>', '<li><a href="/sw/mshahara-na-kodi/">ðŸ’° Zana zote za mshahara na kodi</a> â€” Zana kamili</li>'],
    ['<div class="tl-info-title">EMBED A WIDGET</div>', '<div class="tl-info-title">CHOMEKA WIDGET</div>'],
    ['Need an embeddable payroll, VAT, finance, health, or developer widget for your site? Browse the AfroTools widget library, or request a custom minimum wage widget for your audience.', 'Unahitaji widget ya payroll, VAT, fedha, afya au developer kwa tovuti yako? Vinjari maktaba ya widget za AfroTools au omba widget ya kima cha chini cha mshahara kwa hadhira yako.'],
    ['Browse Widgets', 'Vinjari widget'],
    ['Request Custom Widget', 'Omba widget maalumu'],
  ]);

  html = html.replace(
    "var _violationOpen = false;",
    `var _violationOpen = false;
var SW_COUNTRY_NAMES = ${JSON.stringify(SW_COUNTRY_NAMES, null, 2)};

function swCountryName(code, fallback) {
  return SW_COUNTRY_NAMES[code] || fallback || code;
}

function localizeCountryData(country) {
  if (!country) return country;
  var clone = Object.assign({}, country);
  clone.name = swCountryName(clone.code, clone.name);
  return clone;
}

function buildSwObservation(c) {
  var parts = [];
  if (c.monthly > 0) parts.push(c.name + ' ina kima cha chini cha mshahara cha ' + fmtWage(c.monthly, c.symbol) + ' kwa mwezi.');
  if (c.law) parts.push('Msingi wa kisheria ni ' + c.law + '.');
  if (c.effectiveDate) parts.push('Kiwango hiki kilianza kutumika ' + c.effectiveDate + '.');
  if (c.livingWage > 0) parts.push('Makadirio ya gharama ya maisha kwa mtu mmoja ni ' + fmtWage(c.livingWage, c.symbol) + ' kwa mwezi.');
  if (c.sectors && c.sectors.length) parts.push('Pia kuna viwango vya sekta maalumu katika baadhi ya ajira.');
  return parts.join(' ');
}`
  );

  html = replaceRegex(html, [
    [/var c = E\.getCountry\(cc\);/g, "var c = localizeCountryData(E.getCountry(cc));"],
    [/var all = E\.getAllCountries\('name'\);/g, "var all = E.getAllCountries('name').map(localizeCountryData);"],
    [/document\.getElementById\('alert-country-name'\)\.textContent = c\.flag \+ ' ' \+ c\.name \+ '\\'s';/, "document.getElementById('alert-country-name').textContent = c.flag + ' ' + c.name;"],
    [/document\.getElementById\('r-monthly'\)\.textContent = c\.monthly > 0 \? fmtWage\(c\.monthly, c\.symbol\) : 'Not set';/, "document.getElementById('r-monthly').textContent = c.monthly > 0 ? fmtWage(c.monthly, c.symbol) : 'Hakijawekwa';"],
    [/document\.getElementById\('r-daily'\)\.textContent   = c\.daily   > 0 \? fmtWage\(c\.daily,   c\.symbol\) : 'Not set';/, "document.getElementById('r-daily').textContent   = c.daily   > 0 ? fmtWage(c.daily,   c.symbol) : 'Hakijawekwa';"],
    [/document\.getElementById\('r-hourly'\)\.textContent  = c\.hourly  > 0 \? fmtWage\(c\.hourly,  c\.symbol\) : 'Not set';/, "document.getElementById('r-hourly').textContent  = c.hourly  > 0 ? fmtWage(c.hourly,  c.symbol) : 'Hakijawekwa';"],
    [/document\.getElementById\('r-monthly-sub'\)\.textContent = c\.monthly > 0 \? 'per month' : '';/, "document.getElementById('r-monthly-sub').textContent = c.monthly > 0 ? 'kwa mwezi' : '';"],
    [/document\.getElementById\('r-daily-sub'\)\.textContent   = c\.daily   > 0 \? 'per day \(22 days\)' : '';/, "document.getElementById('r-daily-sub').textContent   = c.daily   > 0 ? 'kwa siku (siku 22)' : '';"],
    [/document\.getElementById\('r-hourly-sub'\)\.textContent  = c\.hourly  > 0 \? 'per hour \(8hr day\)' : '';/, "document.getElementById('r-hourly-sub').textContent  = c.hourly  > 0 ? 'kwa saa (siku ya saa 8)' : '';"],
    [/document\.getElementById\('r-usd'\)\.textContent = usd \? 'â‰ˆ US\$' \+ usd\.toLocaleString\(\) \+ '\/month' : 'N\/A';/, "document.getElementById('r-usd').textContent = usd ? 'â‰ˆ US$' + usd.toLocaleString('sw-TZ') + '/mwezi' : 'Hakuna';"],
    [/dHTML \+= '<div class="mw-info-row"><span class="mw-info-label">Country<\/span><span class="mw-info-val">' \+ c\.flag \+ ' ' \+ c\.name \+ '<\/span><\/div>';/, "dHTML += '<div class=\"mw-info-row\"><span class=\"mw-info-label\">Nchi</span><span class=\"mw-info-val\">' + c.flag + ' ' + c.name + '</span></div>';"],
    [/dHTML \+= '<div class="mw-info-row"><span class="mw-info-label">Currency<\/span><span class="mw-info-val">' \+ c\.currency \+ '<\/span><\/div>';/, "dHTML += '<div class=\"mw-info-row\"><span class=\"mw-info-label\">Sarafu</span><span class=\"mw-info-val\">' + c.currency + '</span></div>';"],
    [/dHTML \+= '<div class="mw-info-row"><span class="mw-info-label">Effective Date<\/span><span class="mw-info-val">' \+ c\.effectiveDate \+ '<\/span><\/div>';/, "dHTML += '<div class=\"mw-info-row\"><span class=\"mw-info-label\">Tarehe ya kuanza</span><span class=\"mw-info-val\">' + c.effectiveDate + '</span></div>';"],
    [/dHTML \+= '<div class="mw-info-row"><span class="mw-info-label">Legal Basis<\/span><span class="mw-info-val">' \+ c\.law \+ '<\/span><\/div>';/, "dHTML += '<div class=\"mw-info-row\"><span class=\"mw-info-label\">Msingi wa kisheria</span><span class=\"mw-info-val\">' + c.law + '</span></div>';"],
    [/document\.getElementById\('lw-min-val'\)\.textContent = fmtWage\(c\.monthly,       c\.symbol\) \+ '\/mo';/, "document.getElementById('lw-min-val').textContent = fmtWage(c.monthly, c.symbol) + '/mwezi';"],
    [/document\.getElementById\('lw-ind-val'\)\.textContent = fmtWage\(c\.livingWage,    c\.symbol\) \+ '\/mo';/, "document.getElementById('lw-ind-val').textContent = fmtWage(c.livingWage, c.symbol) + '/mwezi';"],
    [/document\.getElementById\('lw-fam-val'\)\.textContent = fmtWage\(lwFam,           c\.symbol\) \+ '\/mo';/, "document.getElementById('lw-fam-val').textContent = fmtWage(lwFam, c.symbol) + '/mwezi';"],
    [/document\.getElementById\('r-lw-gap-stat'\)\.innerHTML =[\s\S]*?\(c\.livingWageSource \? '<br><small style="color:#9a3412">Source: ' \+ c\.livingWageSource \+ '<\/small>' : ''\);/, "document.getElementById('r-lw-gap-stat').innerHTML = '<strong>Kima cha chini cha mshahara cha ' + c.name + ' ni ' + fmtWage(c.monthly, c.symbol) + '/mwezi.</strong> Gharama ya maisha kwa mtu mmoja ni ' + fmtWage(c.livingWage, c.symbol) + ' - pengo la <strong>' + gapInd + '%</strong>. Kwa familia ya watu 4 ni ' + fmtWage(lwFam, c.symbol) + ' - pengo la <strong>' + gapFam + '%</strong>.' + (c.livingWageSource ? '<br><small style=\"color:#9a3412\">Chanzo: ' + c.livingWageSource + '</small>' : '');"],
    [/document\.getElementById\('r-notes'\)\.innerHTML = '<strong>Note:<\/strong> ' \+ c\.notes;/, "document.getElementById('r-notes').innerHTML = '<strong>Kumbuka:</strong> Taarifa hizi zinategemea sheria ya ' + c.law + ' na tarehe ya kuanza kutumika ' + c.effectiveDate + '.';"],
    [/var obs = c\.observation \|\| 'No additional observations available for ' \+ c\.name \+ ' at this time\.';/, "var obs = buildSwObservation(c);"],
    [/canvas\.setAttribute\('aria-label', c\.name \+ ' minimum wage history ' \+ c\.history\[c\.history\.length-1\]\.year \+ 'â€“' \+ c\.history\[0\]\.year\);/, "canvas.setAttribute('aria-label', 'Historia ya kima cha chini cha mshahara ya ' + c.name + ' ' + c.history[c.history.length-1].year + '-' + c.history[0].year);"],
    [/label: 'Nominal Wage \(' \+ c\.currency \+ '\)'/, "label: 'Mshahara wa kawaida (' + c.currency + ')'"],
    [/canvas\.setAttribute\('aria-label', c\.name \+ ' purchasing power erosion ' \+ inf\.baseYear \+ 'â€“' \+ inf\.points\[inf\.points\.length-1\]\.year\);/, "canvas.setAttribute('aria-label', 'Kupungua kwa nguvu ya manunuzi ya ' + c.name + ' ' + inf.baseYear + '-' + inf.points[inf.points.length-1].year);"],
    [/document\.getElementById\('r-inflation-stat'\)\.innerHTML =[\s\S]*?'\. Nominal increases have not kept pace with inflation\.';/, "document.getElementById('r-inflation-stat').innerHTML = 'Kiwango cha leo cha ' + c.name + ' cha ' + fmtWage(latest.nominal, inf.currency) + ' kina thamani ya <strong>' + fmtWage(realLatest, inf.currency) + ' kwa bei za mwaka ' + inf.baseYear + '</strong> - upungufu wa nguvu ya manunuzi wa ' + Math.round(((base.nominal - realLatest) / base.nominal) * 100) + '% tangu ' + inf.baseYear + '.';"],
    [/label: 'Nominal Wage'/, "label: 'Mshahara wa kawaida'"],
    [/label: 'Real Wage \(in ' \+ inf\.baseYear \+ ' money\)'/, "label: 'Mshahara halisi (bei za ' + inf.baseYear + ')'"],
    [/titleEl\.innerHTML = 'â„¹ï¸ No statutory minimum wage in ' \+ result\.flag \+ ' ' \+ result\.country;/, "titleEl.innerHTML = 'â„¹ï¸ Hakuna kima cha chini cha mshahara cha kitaifa katika ' + result.flag + ' ' + swCountryName(_currentCode, result.country);"],
    [/detailEl\.textContent = 'This country has not enacted a national minimum wage\. Market rates apply\.';/, "detailEl.textContent = 'Nchi hii haijaweka kima cha chini cha mshahara cha kitaifa. Viwango vya soko hutumika.';"],
    [/titleEl\.textContent = 'âœ“ Compliant';/, "titleEl.textContent = 'âœ“ Inafuata sheria';"],
    [/detailEl\.innerHTML = 'Your salary of <strong>' \+ result\.symbol \+ salary\.toLocaleString\(\) \+ '<\/strong> is ' \+[\s\S]*?'\.';/, "detailEl.innerHTML = 'Mshahara wako wa <strong>' + result.symbol + salary.toLocaleString('sw-TZ') + '</strong> uko <strong>' + result.symbol + result.diff.toLocaleString('sw-TZ') + ' (' + result.diffPct + '%)</strong> juu ya kima cha chini cha mshahara cha ' + swCountryName(_currentCode, result.country) + ' cha <strong>' + result.symbol + result.minimum.toLocaleString('sw-TZ') + '/mwezi</strong>.';"],
    [/actionEl\.textContent = 'Law: ' \+ result\.law \+ ' \(effective ' \+ result\.effectiveDate \+ '\)';/, "actionEl.textContent = 'Sheria: ' + result.law + ' (imeanza kutumika ' + result.effectiveDate + ')';"],
    [/titleEl\.textContent = 'âœ— Below Minimum Wage â€” This is Illegal';/, "titleEl.textContent = 'âœ— Chini ya kima cha chini cha mshahara - si halali';"],
    [/detailEl\.innerHTML = 'Your salary of <strong>' \+ result\.symbol \+ salary\.toLocaleString\(\) \+ '<\/strong> is ' \+[\s\S]*?'\.';/, "detailEl.innerHTML = 'Mshahara wako wa <strong>' + result.symbol + salary.toLocaleString('sw-TZ') + '</strong> uko <strong>' + result.symbol + result.diff.toLocaleString('sw-TZ') + ' (' + result.diffPct + '%) CHINI</strong> ya kima cha chini cha mshahara cha ' + swCountryName(_currentCode, result.country) + ' cha <strong>' + result.symbol + result.minimum.toLocaleString('sw-TZ') + '/mwezi</strong>.';"],
    [/actionEl\.innerHTML = '<button onclick="toggleWhatToDo\(\)" style="background:none;border:none;color:#991b1b;font-weight:700;cursor:pointer;padding:0;font-size:.82rem">What to do â†’<\/button>';/, "actionEl.innerHTML = '<button onclick=\"toggleWhatToDo()\" style=\"background:none;border:none;color:#991b1b;font-weight:700;cursor:pointer;padding:0;font-size:.82rem\">Cha kufanya â†’</button>';"],
    [/msgEl\.textContent = 'Please enter a valid email address\.';/, "msgEl.textContent = 'Tafadhali weka anwani sahihi ya barua pepe.';"],
    [/msgEl\.textContent = 'âœ“ Subscribed! We\\'ll notify you when ' \+ cc \+ ' minimum wage changes\.';/, "msgEl.textContent = 'âœ“ Umejiandikisha! Tutakujulisha kima cha chini cha mshahara cha ' + swCountryName(cc, cc) + ' kinapobadilika.';"],
    [/msgEl\.textContent = data\.error \|\| 'Something went wrong\. Please try again\.';/, "msgEl.textContent = data.error || 'Kuna tatizo. Tafadhali jaribu tena.';"],
    [/msgEl\.textContent = 'Network error\. Please try again\.';/, "msgEl.textContent = 'Hitilafu ya mtandao. Tafadhali jaribu tena.';"],
    [/localStr = c\.monthly > 0 \? fmtWage\(c\.monthly, c\.symbol\) \+ '\/mo' : '<span class="ct-nomin">Not set<\/span>';/, "localStr = c.monthly > 0 ? fmtWage(c.monthly, c.symbol) + '/mwezi' : '<span class=\"ct-nomin\">Hakijawekwa</span>';"],
    [/usdStr   = c\.usdMonthly > 0 \? 'US\$' \+ c\.usdMonthly : '<span class="ct-nomin">N\/A<\/span>';/, "usdStr = c.usdMonthly > 0 ? 'US$' + c.usdMonthly : '<span class=\"ct-nomin\">Hakuna</span>';"],
    [/document\.getElementById\('table-body'\)\.innerHTML = html \|\| '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">No data<\/td><\/tr>';/, "document.getElementById('table-body').innerHTML = html || '<tr><td colspan=\"5\" style=\"text-align:center;color:#94a3b8;padding:20px\">Hakuna data</td></tr>';"],
    [/btn\.innerHTML = '[\s\S]*? Close Comparison';/, "btn.innerHTML = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"flex-shrink:0\" aria-hidden=\"true\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg> Funga ulinganisho';"],
    [/btn\.innerHTML = '[\s\S]*? Compare 2 Countries Side by Side';/, "btn.innerHTML = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"flex-shrink:0\" aria-hidden=\"true\"><rect x=\"2\" y=\"3\" width=\"8\" height=\"18\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"8\" height=\"18\" rx=\"1\"/></svg> Linganisha nchi 2 bega kwa bega';"],
    [/opts = '<option value="">â€” Select â€”<\/option>';/, "opts = '<option value=\"\">â€” Chagua â€”</option>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Monthly<\/span><span class="mw-cc-val">' \+ \(c\.monthly > 0 \? fmtWage\(c\.monthly, c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa mwezi</span><span class=\"mw-cc-val\">' + (c.monthly > 0 ? fmtWage(c.monthly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">USD Equiv\.<\/span><span class="mw-cc-val">' \+ \(c\.usdMonthly \? 'US\$' \+ c\.usdMonthly : 'N\/A'\) \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Sawa na USD</span><span class=\"mw-cc-val\">' + (c.usdMonthly ? 'US$' + c.usdMonthly : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Daily<\/span><span class="mw-cc-val">'   \+ \(c\.daily   > 0 \? fmtWage\(c\.daily,   c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa siku</span><span class=\"mw-cc-val\">' + (c.daily > 0 ? fmtWage(c.daily, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Hourly<\/span><span class="mw-cc-val">'  \+ \(c\.hourly  > 0 \? fmtWage\(c\.hourly,  c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa saa</span><span class=\"mw-cc-val\">' + (c.hourly > 0 ? fmtWage(c.hourly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Living Wage Gap<\/span><span class="mw-cc-val">' \+ \(c\.livingWage && c\.monthly \? Math\.round\(\(\(c\.livingWage - c\.monthly\)\/c\.monthly\)\*100\) \+ '% gap' : 'N\/A'\) \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Pengo la gharama ya maisha</span><span class=\"mw-cc-val\">' + (c.livingWage && c.monthly ? Math.round(((c.livingWage - c.monthly)/c.monthly)*100) + '% pengo' : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Effective<\/span><span class="mw-cc-val">' \+ c\.effectiveDate \+ '<\/span><\/div>';/, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Imeanza</span><span class=\"mw-cc-val\">' + c.effectiveDate + '</span></div>';"],
    [/res\.textContent = 'Please fill in country, sector, and reported salary\.';/, "res.textContent = 'Tafadhali jaza nchi, sekta na mshahara ulioripotiwa.';"],
    [/res\.textContent = 'âœ“ Report submitted\. Thank you â€” \+50 AfroPoints credited once verified\.';/, "res.textContent = 'âœ“ Ripoti imewasilishwa. Asante - AfroPoints 50 zitaongezwa baada ya kuthibitishwa.';"],
    [/res\.textContent = 'âœ“ Report queued\. Thank you for helping protect workers\.';/, "res.textContent = 'âœ“ Ripoti imepokelewa. Asante kwa kusaidia kulinda wafanyakazi.';"],
    [/opts = '<option value="">â€” Select country â€”<\/option>';/, "opts = '<option value=\"\">â€” Chagua nchi â€”</option>';"],
    [/<option value="([A-Z]{2})">[^<]+<\/option>/g, (match, code) => `<option value="${code}">${swFlagCode(code)} ${SW_COUNTRY_NAMES[code] || code}</option>`],
  ]);

  html = replaceRegex(html, [
    [/<a href="\/">AfroTools<\/a>[^<]*<a href="\/salary-tax\/">Salary &amp; Tax<\/a>[^<]*Minimum Wage Checker/, '<a href="/">AfroTools</a> â€º <a href="/sw/mshahara-na-kodi/">Mshahara na Kodi</a> â€º Kikokotoo cha Kima cha Chini cha Mshahara'],
    [/<div class="tl-category-label">[^<]*SALARY &amp; TAX<\/div>/, '<div class="tl-category-label">ðŸ’° MSHAHARA NA KODI</div>'],
    [/<p class="tl-desc">Check the current minimum wage[\s\S]*?countries covered\.<\/p>/, '<p class="tl-desc">Angalia kima cha chini cha mshahara kwa nchi yoyote ya Afrika pamoja na uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya nguvu ya manunuzi, viwango vya sekta na tahadhari za nchi. Nchi zote 54 zimejumuishwa.</p>'],
    [/<option value="">[^<]*Select a country[^<]*<\/option>/, '<option value="">â€” Chagua nchi â€”</option>'],
    [/<option value="">[^<]*National \/ all states[^<]*<\/option>/, '<option value="">â€” Taifa / majimbo yote â€”</option>'],
    [/<strong>Cha kufanya ukilipwa chini ya kima cha chini cha mshahara:<\/strong><br>\s*1\.[\s\S]*?5\. <a href="\/tools\/document-generator\/" onclick="return false">Generate a formal complaint letter[^<]*<\/a>/, '<strong>Cha kufanya ukilipwa chini ya kima cha chini cha mshahara:</strong><br>\n              1. Kusanya ushahidi â€” payslip, taarifa ya benki na mkataba wa ajira<br>\n              2. Ripoti kwa Wizara ya Kazi au mkaguzi wa kazi wa nchi yako<br>\n              3. Wasiliana na chama cha wafanyakazi kilichosajiliwa kwa msaada<br>\n              4. Wasilisha malalamiko kwa mahakama ya kazi au chombo husika<br>\n              5. <a href="/tools/document-generator/" onclick="return false">Tengeneza barua rasmi ya malalamiko â†’</a>'],
    [/<span>Living Wage â€” Individual<\/span>/g, '<span>Gharama ya maisha â€” mtu mmoja</span>'],
    [/<span>Living Wage â€” Family of 4<\/span>/g, '<span>Gharama ya maisha â€” familia ya watu 4</span>'],
    [/<div class="mw-alert-title">[\s\S]*?Minimum Wage Changes<\/div>/, '<div class="mw-alert-title">ðŸ”” Pata taarifa kima cha chini cha mshahara cha <span id="alert-country-name">nchi hii</span> kinapobadilika</div>'],
    [/<div class="mw-alert-sub">[\s\S]*?<\/div>/, '<div class="mw-alert-sub">Tutakutumia barua pepe kiwango kinapobadilika â€” hakuna spam, taarifa ya mabadiliko tu.</div>'],
    [/<option value="">[^<]*Select[^<]*<\/option>/g, '<option value="">â€” Chagua â€”</option>'],
    [/<h2 class="tl-section-title" style="margin-top:28px">[\s\S]*?<\/h2>/, '<h2 class="tl-section-title" style="margin-top:28px">Nchi zote 54 za Afrika â€” Ulinganisho wa kima cha chini cha mshahara</h2>'],
    [/<caption class="sr-only">[\s\S]*?<\/caption>/, '<caption class="sr-only">Ulinganisho wa kima cha chini cha mshahara â€” nchi zote 54 za Afrika, linaweza kupangwa kwa kichwa cha safu</caption>'],
    [/<div class="mw-crowdsource-title">[\s\S]*?<\/div>/, '<div class="mw-crowdsource-title">ðŸ“¢ Ripoti ukiukaji wa mshahara</div>'],
    [/<div class="mw-crowdsource-desc">[\s\S]*?<\/div>/, '<div class="mw-crowdsource-desc">\n          Unamfahamu mwajiri anayelipa chini ya kiwango cha chini cha kisheria? Ripoti bila kutaja jina lako. Ripoti zilizothibitishwa hupata AfroPoints 50. Tunahifadhi takwimu za jumla tu hadi uthibitisho upatikane.\n        </div>'],
    [/<div class="tl-info-title">[^<]*KNOW YOUR RIGHTS<\/div>/, '<div class="tl-info-title">âš ï¸ JUA HAKI ZAKO</div>'],
    [/<li>Minimum wage is the legal floor[\s\S]*?<\/li>/, '<li>Kima cha chini cha mshahara ni kiwango cha kisheria â€” mwajiri haruhusiwi kulipa chini yake</li>'],
    [/<div class="tl-info-title">[^<]*RELATED TOOLS<\/div>/, '<div class="tl-info-title">ðŸ”— ZANA ZINAZOHUSIANA</div>'],
    [/<li><a href="\/salary-tax\/">[^<]*Salary Calculator<\/a>[^<]*Net pay after tax<\/li>/, '<li><a href="/sw/mshahara-na-kodi/paye/">ðŸ’µ Kikokotoo cha mshahara</a> â€” Malipo halisi baada ya kodi</li>'],
    [/<li><a href="\/salary-tax\/">[^<]*PAYE Tax Calculator<\/a>[^<]*50\+ countries<\/li>/, '<li><a href="/sw/mshahara-na-kodi/paye/">ðŸ’° Kikokotoo cha PAYE</a> â€” Nchi 50+</li>'],
    [/<li><a href="\/tools\/cost-of-living\/">[^<]*Cost of Living<\/a>[^<]*Compare cities<\/li>/, '<li><a href="/tools/cost-of-living/">ðŸ™ï¸ Gharama ya maisha</a> â€” Linganisha miji</li>'],
    [/<li><a href="\/tools\/currency-converter\/">[^<]*Currency Converter<\/a>[^<]*Convert wages<\/li>/, '<li><a href="/sw/zana/kibadilishaji-sarafu/">ðŸ’± Kibadilishaji cha sarafu</a> â€” Badilisha mishahara</li>'],
    [/<li><a href="\/tools\/employee-cost\/">[^<]*Staff Cost Calculator<\/a>[^<]*Employer burden<\/li>/, '<li><a href="/tools/employee-cost/">ðŸ‘· Kikokotoo cha gharama ya mfanyakazi</a> â€” Mzigo wa mwajiri</li>'],
    [/<li><a href="\/salary-tax\/">[^<]*All Salary &amp; Tax Tools<\/a>[^<]*Full toolkit<\/li>/, '<li><a href="/sw/mshahara-na-kodi/">ðŸ’° Zana zote za mshahara na kodi</a> â€” Zana kamili</li>'],
    [/titleEl\.innerHTML = 'â„¹ï¸ No statutory minimum wage in ' \+ result\.flag \+ ' ' \+ result\.country;/, "titleEl.innerHTML = 'â„¹ï¸ Hakuna kima cha chini cha mshahara cha kitaifa katika ' + result.flag + ' ' + swCountryName(_currentCode, result.country);"],
    [/titleEl\.textContent = 'âœ“ Compliant';/, "titleEl.textContent = 'âœ“ Inafuata sheria';"],
    [/detailEl\.innerHTML = 'Your salary of <strong>' \+ result\.symbol \+ salary\.toLocaleString\(\) \+ '<\/strong> is ' \+\s*'<strong>' \+ result\.symbol \+ result\.diff\.toLocaleString\(\) \+ ' \(' \+ result\.diffPct \+ '%\)<\/strong> ' \+\s*'above the ' \+ result\.country \+ ' minimum wage of <strong>' \+ result\.symbol \+ result\.minimum\.toLocaleString\(\) \+ '\/month<\/strong>\.';/, "detailEl.innerHTML = 'Mshahara wako wa <strong>' + result.symbol + salary.toLocaleString('sw-TZ') + '</strong> uko <strong>' + result.symbol + result.diff.toLocaleString('sw-TZ') + ' (' + result.diffPct + '%)</strong> juu ya kima cha chini cha mshahara cha ' + swCountryName(_currentCode, result.country) + ' cha <strong>' + result.symbol + result.minimum.toLocaleString('sw-TZ') + '/mwezi</strong>.';"],
    [/titleEl\.textContent = 'âœ— Below Minimum Wage â€” This is Illegal';/, "titleEl.textContent = 'âœ— Chini ya kima cha chini cha mshahara - si halali';"],
    [/detailEl\.innerHTML = 'Your salary of <strong>' \+ result\.symbol \+ salary\.toLocaleString\(\) \+ '<\/strong> is ' \+\s*'<strong>' \+ result\.symbol \+ result\.diff\.toLocaleString\(\) \+ ' \(' \+ result\.diffPct \+ '%\) BELOW<\/strong> ' \+\s*'the ' \+ result\.country \+ ' minimum wage of <strong>' \+ result\.symbol \+ result\.minimum\.toLocaleString\(\) \+ '\/month<\/strong>\.';/, "detailEl.innerHTML = 'Mshahara wako wa <strong>' + result.symbol + salary.toLocaleString('sw-TZ') + '</strong> uko <strong>' + result.symbol + result.diff.toLocaleString('sw-TZ') + ' (' + result.diffPct + '%) CHINI</strong> ya kima cha chini cha mshahara cha ' + swCountryName(_currentCode, result.country) + ' cha <strong>' + result.symbol + result.minimum.toLocaleString('sw-TZ') + '/mwezi</strong>.';"],
    [/actionEl\.innerHTML = '<button onclick="toggleWhatToDo\(\)" style="background:none;border:none;color:#991b1b;font-weight:700;cursor:pointer;padding:0;font-size:.82rem">What to do â†’<\/button>';/, "actionEl.innerHTML = '<button onclick=\"toggleWhatToDo()\" style=\"background:none;border:none;color:#991b1b;font-weight:700;cursor:pointer;padding:0;font-size:.82rem\">Cha kufanya â†’</button>';"],
    [/msgEl\.textContent = 'âœ“ Subscribed! We\\'ll notify you when ' \+ cc \+ ' minimum wage changes\.';/, "msgEl.textContent = 'âœ“ Umejiandikisha! Tutakujulisha kima cha chini cha mshahara cha ' + swCountryName(cc, cc) + ' kinapobadilika.';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Monthly<\/span><span class="mw-cc-val">' \+ \(c\.monthly > 0 \? fmtWage\(c\.monthly, c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa mwezi</span><span class=\"mw-cc-val\">' + (c.monthly > 0 ? fmtWage(c.monthly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">USD Equiv\.<\/span><span class="mw-cc-val">' \+ \(c\.usdMonthly \? 'US\$' \+ c\.usdMonthly : 'N\/A'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Sawa na USD</span><span class=\"mw-cc-val\">' + (c.usdMonthly ? 'US$' + c.usdMonthly : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Daily<\/span><span class="mw-cc-val">'\s+\+\s+\(c\.daily\s+>\s+0 \? fmtWage\(c\.daily,\s+c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa siku</span><span class=\"mw-cc-val\">' + (c.daily > 0 ? fmtWage(c.daily, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Hourly<\/span><span class="mw-cc-val">'\s+\+\s+\(c\.hourly\s+>\s+0 \? fmtWage\(c\.hourly,\s+c\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa saa</span><span class=\"mw-cc-val\">' + (c.hourly > 0 ? fmtWage(c.hourly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Living Wage Gap<\/span><span class="mw-cc-val">' \+ \(c\.livingWage && c\.monthly \? Math\.round\(\(\(c\.livingWage - c\.monthly\)\/c\.monthly\)\*100\) \+ '% gap' : 'N\/A'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Pengo la gharama ya maisha</span><span class=\"mw-cc-val\">' + (c.livingWage && c.monthly ? Math.round(((c.livingWage - c.monthly)/c.monthly)*100) + '% pengo' : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Effective<\/span><span class="mw-cc-val">' \+ c\.effectiveDate \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Imeanza</span><span class=\"mw-cc-val\">' + c.effectiveDate + '</span></div>';"],
  ]);

  html = replaceAll(html, [
    ['>Country <span aria-hidden="true">â†•</span></th>', '>Nchi <span aria-hidden="true">â†•</span></th>'],
    ['>Local Rate <span aria-hidden="true">â†•</span></th>', '>Kiwango cha ndani <span aria-hidden="true">â†•</span></th>'],
    ['>USD/Month <span aria-hidden="true">â†•</span></th>', '>USD/Mwezi <span aria-hidden="true">â†•</span></th>'],
    ['>Effective Date <span aria-hidden="true">â†•</span></th>', '>Tarehe ya kuanza <span aria-hidden="true">â†•</span></th>'],
    ['>Loadingâ€¦</td>', '>Inapakia...</td>'],
    ['>Country <span aria-hidden="true">↕</span></th>', '>Nchi <span aria-hidden="true">↕</span></th>'],
    ['>Local Rate <span aria-hidden="true">↕</span></th>', '>Kiwango cha ndani <span aria-hidden="true">↕</span></th>'],
    ['>USD/Month <span aria-hidden="true">↕</span></th>', '>USD/Mwezi <span aria-hidden="true">↕</span></th>'],
    ['>Effective Date <span aria-hidden="true">↕</span></th>', '>Tarehe ya kuanza <span aria-hidden="true">↕</span></th>'],
    ['>Loading…</td>', '>Inapakia...</td>'],
  ]);

  html = replaceRegex(html, [
    [/var opts = '<option value="">[^<]*National \/ all states[^<]*<\/option>';/, "var opts = '<option value=\"\">Ã¢â‚¬â€ Taifa / majimbo yote Ã¢â‚¬â€</option>';"],
    [/dHTML \+= '<div class="mw-info-row"><span class="mw-info-label">Effective Date<\/span><span class="mw-info-val">' \+ \(sr\.effectiveDate \|\| c\.effectiveDate\) \+ '<\/span><\/div>';/, "dHTML += '<div class=\"mw-info-row\"><span class=\"mw-info-label\">Tarehe ya kuanza</span><span class=\"mw-info-val\">' + (sr.effectiveDate || c.effectiveDate) + '</span></div>';"],
    [/canvas\.setAttribute\('aria-label', c\.name \+ ' minimum wage history ' \+ c\.history\[c\.history\.length-1\]\.year \+ '[^']*' \+ c\.history\[0\]\.year\);/, "canvas.setAttribute('aria-label', 'Historia ya kima cha chini cha mshahara ya ' + c.name + ' ' + c.history[c.history.length-1].year + '-' + c.history[0].year);"],
    [/titleEl\.(?:innerHTML|textContent) = '[^']*No statutory minimum wage in ' \+ result\.flag \+ ' ' \+ result\.country;/, "titleEl.innerHTML = 'â„¹ï¸ Hakuna kima cha chini cha mshahara cha kitaifa katika ' + result.flag + ' ' + swCountryName(_currentCode, result.country);"],
    [/titleEl\.textContent = '[^']*Compliant';/, "titleEl.textContent = 'âœ“ Inafuata sheria';"],
    [/titleEl\.textContent = '[^']*Below Minimum Wage[^']*';/, "titleEl.textContent = 'âœ— Chini ya kima cha chini cha mshahara - si halali';"],
    [/actionEl\.innerHTML = '<button onclick="toggleWhatToDo\(\)"[^>]*>What to do [^<]*<\/button>';/, "actionEl.innerHTML = '<button onclick=\"toggleWhatToDo()\" style=\"background:none;border:none;color:#991b1b;font-weight:700;cursor:pointer;padding:0;font-size:.82rem\">Cha kufanya â†’</button>';"],
    [/msgEl\.textContent = '[^']*Subscribed! We\\'ll notify you when ' \+ cc \+ ' minimum wage changes\.';/, "msgEl.textContent = 'âœ“ Umejiandikisha! Tutakujulisha kima cha chini cha mshahara cha ' + swCountryName(cc, cc) + ' kinapobadilika.';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Monthly<\/span><span class="mw-cc-val">' \+ \((?:c|country)\.monthly > 0 \? fmtWage\((?:c|country)\.monthly, (?:c|country)\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa mwezi</span><span class=\"mw-cc-val\">' + (c.monthly > 0 ? fmtWage(c.monthly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">USD Equiv\.<\/span><span class="mw-cc-val">' \+ \((?:c|country)\.usdMonthly \? 'US\$' \+ (?:c|country)\.usdMonthly : 'N\/A'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Sawa na USD</span><span class=\"mw-cc-val\">' + (c.usdMonthly ? 'US$' + c.usdMonthly : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Daily<\/span><span class="mw-cc-val">' \+ \((?:c|country)\.daily > 0 \? fmtWage\((?:c|country)\.daily, (?:c|country)\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa siku</span><span class=\"mw-cc-val\">' + (c.daily > 0 ? fmtWage(c.daily, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Hourly<\/span><span class="mw-cc-val">' \+ \((?:c|country)\.hourly > 0 \? fmtWage\((?:c|country)\.hourly, (?:c|country)\.symbol\) : 'Not set'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Kwa saa</span><span class=\"mw-cc-val\">' + (c.hourly > 0 ? fmtWage(c.hourly, c.symbol) : 'Hakijawekwa') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Living Wage Gap<\/span><span class="mw-cc-val">' \+ \((?:c|country)\.livingWage && (?:c|country)\.monthly \? Math\.round\(\(\((?:c|country)\.livingWage - (?:c|country)\.monthly\)\/(?:c|country)\.monthly\)\*100\) \+ '% gap' : 'N\/A'\) \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Pengo la gharama ya maisha</span><span class=\"mw-cc-val\">' + (c.livingWage && c.monthly ? Math.round(((c.livingWage - c.monthly)/c.monthly)*100) + '% pengo' : 'Hakuna') + '</span></div>';"],
    [/html \+= '<div class="mw-cc-row"><span class="mw-cc-label">Effective<\/span><span class="mw-cc-val">' \+ (?:c|country)\.effectiveDate \+ '<\/span><\/div>';/g, "html += '<div class=\"mw-cc-row\"><span class=\"mw-cc-label\">Imeanza</span><span class=\"mw-cc-val\">' + c.effectiveDate + '</span></div>';"],
  ]);

  write('sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/index.html', html);
}

buildOvertimePage();
buildMinimumWagePage();
