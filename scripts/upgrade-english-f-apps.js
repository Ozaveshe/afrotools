const fs = require('fs');
const path = require('path');

const apps = {
  'tools/baby-name-generator/index.html': {
    tool: 'baby-name-generator',
    kicker: 'Name shortlist starter',
    title: 'Turn the generator into a family-ready shortlist',
    intro: 'Use the live generator above for deeper options, then use this quick starter to frame the name around culture, meaning, gender preference, and family confirmation.',
    bullets: [
      'Result output: shortlist, meaning theme, and registration note.',
      'Methodology: culture first, then meaning, gender preference, pronunciation, and family spelling.',
      'Source note: naming traditions vary by family and language, so final spelling should be confirmed locally.'
    ],
    fields: [
      ['select', 'culture', 'Culture', ['Yoruba', 'Akan', 'Swahili', 'Igbo']],
      ['select', 'theme', 'Meaning theme', ['joy', 'faith', 'strength', 'peace']],
      ['select', 'gender', 'Gender preference', ['unisex', 'female', 'male']]
    ],
    button: 'Generate shortlist',
    result: 'Result: choose a culture and meaning theme to generate a local shortlist.',
    note: 'Privacy: this name search runs in your browser. It does not replace local family, language, or civil registration checks.',
    sources: [{ label: 'Akan day-name reference', href: 'https://en.wikipedia.org/wiki/Akan_names' }],
    faqs: [
      ['Is this a legal baby name registry?', 'No. It is a planning tool for finding ideas. Always confirm spelling, pronunciation, and civil registration rules in the country where the child will be registered.'],
      ['Can I filter by meaning?', 'Yes. Start with a meaning theme such as joy, faith, strength, or peace, then review cultural fit and family preference before choosing.'],
      ['Does one name mean the same thing everywhere?', 'Not always. African names can change meaning by language, tone, spelling, and family context, so local confirmation matters.']
    ]
  },
  'tools/festival-calendar/index.html': {
    tool: 'festival-calendar',
    kicker: 'Event travel planner',
    title: 'Find festival windows without treating dates as final',
    intro: 'Use this starter to choose a country, month, and purpose, then confirm dates locally before booking travel, vendors, or filming.',
    bullets: [
      'Result output: planning month, travel lead time, and confirmation checklist.',
      'Methodology: match country and month, then add travel, respect, and budget checks.',
      'Source note: cultural dates can move by local authority, town, palace, church, mosque, or organiser.'
    ],
    fields: [
      ['select', 'country', 'Country', ['Nigeria', 'Ghana', 'South Africa', 'Ethiopia']],
      ['select', 'month', 'Month', ['January', 'April', 'August', 'December']],
      ['select', 'purpose', 'Purpose', ['travel', 'filming', 'family visit', 'school project']]
    ],
    button: 'Build festival plan',
    result: 'Result: choose a country and month to create a festival planning checklist.',
    note: 'Disclaimer: this is a planning estimate, not an official festival calendar. Confirm exact dates with organisers before booking.',
    sources: [{ label: 'UNESCO intangible heritage lists', href: 'https://ich.unesco.org/en/lists' }],
    faqs: [
      ['Why do some festival dates change?', 'Some dates depend on local calendars, rainfall, lunar sighting, palace announcements, or organiser decisions.'],
      ['Can I use this for travel booking?', 'Use it for early planning only. Confirm the final date, venue, security notice, and accommodation availability before paying.'],
      ['What should visitors check before attending?', 'Ask about filming rules, dress expectations, restricted rituals, local transport, and whether the public is welcome.']
    ]
  },
  'tools/age-calculator-african/index.html': {
    tool: 'age-calculator-african',
    kicker: 'Age and name-day check',
    title: 'Calculate age and add an African day-name reference',
    intro: 'Enter a birth date to calculate current age, weekday, and a planning reference for Akan day names where relevant.',
    bullets: [
      'Result output: exact age, weekday, and day-name reference.',
      'Methodology: calendar age plus weekday lookup; cultural naming is shown as context, not a legal record.',
      'Source note: always use the legal birth certificate date for forms and applications.'
    ],
    fields: [
      ['input', 'birthDate', 'Birth date', 'date', '1998-06-02'],
      ['select', 'gender', 'Gender reference', ['female', 'male']],
      ['select', 'culture', 'Name-day system', ['Akan', 'Yoruba', 'Swahili']]
    ],
    button: 'Calculate age',
    result: 'Result: enter a birth date to calculate age and weekday.',
    note: 'Disclaimer: this is an educational age and name-day reference. It does not replace official identity records.',
    sources: [{ label: 'Akan names overview', href: 'https://en.wikipedia.org/wiki/Akan_names' }],
    faqs: [
      ['Why is weekday useful for some names?', 'Some Akan names are linked to the day of birth. Other cultures may use different naming systems or family rules.'],
      ['Can this calculate school or visa eligibility?', 'It can show age, but eligibility decisions should be checked against the official form or institution.'],
      ['What if my birth certificate has a different date?', 'Use the legal document date for applications. Family or oral-history dates can be noted separately.']
    ]
  },
  'tools/crop-insurance-calc/index.html': {
    tool: 'crop-insurance-calc',
    kicker: 'Premium starter',
    title: 'Estimate a crop insurance premium before opening a country page',
    intro: 'Model insured crop value, risk rate, and subsidy before checking the country-specific crop insurance pages and insurer terms.',
    bullets: [
      'Result output: planning premium, insured value, and subsidy effect.',
      'Methodology: insured crop value multiplied by risk rate, reduced by any subsidy.',
      'Source note: final premiums depend on crop, district, peril covered, insurer, and public scheme rules.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'cropValue', 'Insured crop value', 'number', '500000'],
      ['input', 'riskRate', 'Risk rate percent', 'number', '4.5'],
      ['input', 'subsidy', 'Subsidy percent', 'number', '0']
    ],
    button: 'Estimate premium',
    result: 'Estimate: enter crop value and risk rate to model the premium.',
    note: 'Disclaimer: planning estimate only. Verify perils, exclusions, waiting periods, claim evidence, and official scheme rules before buying cover.',
    sources: [{ label: 'World Bank agricultural insurance overview', href: 'https://www.worldbank.org/en/topic/financialsector/brief/agricultural-insurance' }],
    faqs: [
      ['What drives crop insurance premium?', 'Premiums usually depend on insured crop value, crop risk, district, peril covered, farm history, and subsidy support.'],
      ['Is this an official quote?', 'No. It is a planning estimate to help compare risk and affordability before contacting an insurer or public scheme.'],
      ['What should farmers check before paying?', 'Check covered perils, claim evidence, waiting period, excess, payout trigger, and whether weather-index data is used.']
    ]
  },
  'tools/health-insurance-compare/index.html': {
    tool: 'health-insurance-compare',
    kicker: 'Plan fit score',
    title: 'Score a health plan before comparing country options',
    intro: 'Compare monthly premium, inpatient cover, provider network, chronic-care handling, exclusions, and waiting periods before choosing a health plan.',
    bullets: [
      'Result output: plan-fit score and comparison checklist.',
      'Methodology: balance price, inpatient limit, network breadth, and chronic-care support.',
      'Source note: insurer benefit tables and national health insurance authorities remain the final reference.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'premium', 'Monthly premium', 'number', '25000'],
      ['input', 'inpatient', 'Inpatient limit', 'number', '1000000'],
      ['input', 'network', 'Hospitals in network', 'number', '30'],
      ['select', 'chronic', 'Chronic care included', ['no', 'yes']]
    ],
    button: 'Compare plan fit',
    result: 'Result: enter plan details to create a fit score.',
    note: 'Medical disclaimer: this is not medical, insurance, or legal advice. Confirm benefits, exclusions, and claims process with the insurer.',
    sources: [
      { label: 'Nigeria NHIA', href: 'https://www.nhia.gov.ng/' },
      { label: 'Ghana NHIA', href: 'https://www.nhis.gov.gh/nhia' }
    ],
    faqs: [
      ['What should I compare besides premium?', 'Compare inpatient limit, exclusions, waiting periods, provider network, emergency cover, chronic care, and claim turnaround.'],
      ['Can the cheapest plan be the best plan?', 'Not always. A low premium can come with small limits, narrow hospital access, or exclusions that matter for your household.'],
      ['Is this tool private?', 'Yes. The quick score runs in the browser and does not send your health details to AfroTools.']
    ]
  },
  'tools/health-contribution/index.html': {
    tool: 'health-contribution',
    kicker: 'Contribution starter',
    title: 'Estimate statutory health contribution before choosing a country',
    intro: 'Start with salary or household income, then open the country page to check the local NHIF, SHIF, NHIS, or public health insurance rule.',
    bullets: [
      'Result output: contribution estimate and remittance reminder.',
      'Methodology: country-specific rule where available; otherwise a planning percentage with a clear warning.',
      'Source note: final rates, deadlines, and minimums must be checked with the health authority.'
    ],
    fields: [
      ['select', 'country', 'Country', ['Kenya', 'Nigeria', 'Ghana', 'South Africa']],
      ['select', 'currency', 'Currency', ['KES', 'NGN', 'GHS', 'ZAR']],
      ['input', 'income', 'Monthly gross income', 'number', '100000']
    ],
    button: 'Estimate contribution',
    result: 'Estimate: enter monthly income to calculate a planning contribution.',
    note: 'Disclaimer: health contribution rules change. Confirm current rates, minimums, and filing dates with the official authority before remitting.',
    sources: [
      { label: 'Kenya Ministry of Health SHA tariffs', href: 'https://health.go.ke/' },
      { label: 'Nigeria NHIA', href: 'https://www.nhia.gov.ng/' }
    ],
    faqs: [
      ['Is Kenya SHIF still based on gross salary?', 'The planner uses a 2.75% gross-income assumption with a minimum contribution for Kenya. Confirm the current rule before payroll remittance.'],
      ['Does every African country use the same formula?', 'No. Some use payroll percentages, some use tiered schemes, and others use plan enrollment or tax-funded public health systems.'],
      ['Can employers use this for payroll filing?', 'Use it as a check only. Payroll filing should use the official portal, contribution schedule, and employer deadline.']
    ]
  },
  'tools/workers-comp/index.html': {
    tool: 'workers-comp',
    kicker: 'Employer assessment envelope',
    title: 'Estimate workers compensation exposure before filing',
    intro: 'Model annual payroll and risk class to understand the likely assessment envelope, then confirm the country-specific rule and filing portal.',
    bullets: [
      'Result output: annual assessment envelope and compliance checklist.',
      'Methodology: insurable payroll multiplied by risk class rate.',
      'Source note: final assessment depends on industry classification, earnings cap, claim history, and authority schedule.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['ZAR', 'NGN', 'KES', 'GHS']],
      ['input', 'payroll', 'Annual insurable payroll', 'number', '12000000'],
      ['input', 'riskRate', 'Risk class rate percent', 'number', '1.2']
    ],
    button: 'Estimate assessment',
    result: 'Estimate: enter payroll and risk rate to calculate employer exposure.',
    note: 'Legal disclaimer: this is not legal advice or an official assessment. Confirm registration, earnings caps, deadlines, and claim rules with the compensation authority.',
    sources: [
      { label: 'South Africa Compensation Fund submissions', href: 'https://cfonline.labour.gov.za/OnlineSubmissions/' },
      { label: 'South Africa government earnings statement guide', href: 'https://www.gov.za/services/compensation-fund/submit-earnings-statements' }
    ],
    faqs: [
      ['What is the biggest driver of assessment cost?', 'Annual insurable payroll and industry risk classification usually drive the assessment more than headcount alone.'],
      ['Can this calculate a claim payout?', 'It gives an employer planning envelope. Claim payout rules depend on injury, medical evidence, earnings caps, and local compensation law.'],
      ['What should employers keep ready?', 'Keep registration proof, payroll records, industry classification, accident reports, medical documents, and payment references.']
    ]
  },
  'tools/aso-ebi-cost/index.html': {
    tool: 'aso-ebi-cost',
    kicker: 'Group outfit budget',
    title: 'Price Aso-Ebi without losing money as the organiser',
    intro: 'Build a per-person and group budget for fabric, tailoring, accessories, deposits, and delivery pressure before collecting orders.',
    bullets: [
      'Result output: total group budget and suggested deposit.',
      'Methodology: people multiplied by fabric plus tailoring, with accessories handled on the app page.',
      'Source note: vendor quotes, fabric quality, exchange rate, and measurement discipline can move the final price.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'GHS', 'KES', 'ZAR']],
      ['input', 'people', 'Number of people', 'number', '20'],
      ['input', 'fabric', 'Fabric per person', 'number', '18000'],
      ['input', 'tailoring', 'Tailoring per person', 'number', '25000']
    ],
    button: 'Calculate group cost',
    result: 'Result: enter group size and outfit costs to estimate the Aso-Ebi budget.',
    note: 'Planning note: collect deposits before bulk purchase, document sizes, and separate delivery costs from outfit price.',
    sources: [{ label: 'Event budget reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
    faqs: [
      ['What deposit should an organiser collect?', 'A 50-70% deposit is common for planning because fabric purchase and tailor booking require upfront cash.'],
      ['What costs are often forgotten?', 'Accessories, delivery, size corrections, last-minute orders, power/fuel surcharge, and unpaid family orders.'],
      ['Can this work outside Nigeria?', 'Yes. Change the currency and local prices. The workflow works for matching outfits in weddings, funerals, church groups, and family events.']
    ]
  },
  'tools/life-insurance-calc/index.html': {
    tool: 'life-insurance-calc',
    kicker: 'Protection gap estimate',
    title: 'Calculate the cover gap a family may need',
    intro: 'Estimate income replacement, debt, and existing savings before comparing life cover options by country.',
    bullets: [
      'Result output: protection gap and the assumptions behind it.',
      'Methodology: annual income replacement years plus debt minus current savings.',
      'Source note: premiums and eligibility depend on age, health, underwriting, currency, and insurer terms.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'annualIncome', 'Annual household income', 'number', '6000000'],
      ['input', 'years', 'Income replacement years', 'number', '7'],
      ['input', 'debt', 'Debts and school fees', 'number', '1000000'],
      ['input', 'savings', 'Savings already available', 'number', '500000']
    ],
    button: 'Estimate cover gap',
    result: 'Result: enter income, debt, and savings to estimate the cover gap.',
    note: 'Financial disclaimer: this is not financial advice. Confirm affordability, exclusions, beneficiaries, and claim documents with a licensed insurer.',
    sources: [{ label: 'National Association of Insurance Commissioners life insurance guide', href: 'https://content.naic.org/consumer/life-insurance' }],
    faqs: [
      ['How many years of income should I replace?', 'Many households test 5-10 years, then adjust for school fees, debts, dependants, and existing assets.'],
      ['Is employer life cover enough?', 'Sometimes no. Employer cover can end when employment ends and may not cover all debts or dependants.'],
      ['What should I check before buying?', 'Check exclusions, waiting period, premium increases, beneficiary rules, claim documents, and currency risk.']
    ]
  },
  'tools/car-insurance/index.html': {
    tool: 'car-insurance',
    kicker: 'Vehicle cover estimate',
    title: 'Estimate car insurance before comparing insurers',
    intro: 'Model vehicle value and cover type, then compare what matters: excess, theft, flood, repair network, and claim speed.',
    bullets: [
      'Result output: annual premium envelope and cover checklist.',
      'Methodology: vehicle value multiplied by a planning rate for cover type.',
      'Source note: final premium depends on driver profile, location, use, claims history, excess, and insurer underwriting.'
    ],
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'vehicleValue', 'Vehicle value', 'number', '8000000'],
      ['select', 'cover', 'Cover type', ['comprehensive', 'third-party']],
      ['select', 'risk', 'Usage', ['private', 'ride-hailing', 'commercial']]
    ],
    button: 'Estimate premium',
    result: 'Estimate: enter vehicle value and cover type to calculate the premium envelope.',
    note: 'Insurance disclaimer: this is not a quote. Confirm policy wording, exclusions, excess, and claim process with the licensed insurer.',
    sources: [{ label: 'NAIC auto insurance consumer guide', href: 'https://content.naic.org/consumer/auto-insurance' }],
    faqs: [
      ['What is comprehensive cover?', 'It usually protects against more than third-party liability, but exact theft, accident, flood, and repair terms depend on policy wording.'],
      ['Why can two cars with the same value cost differently?', 'Location, use, driver history, security, vehicle model, excess, and claims record can change the premium.'],
      ['What should I compare before paying?', 'Compare excess, approved repairers, towing, flood or riot exclusions, claim turnaround, and whether accessories are covered.']
    ]
  },
  'tools/motor-third-party/index.html': {
    tool: 'motor-third-party',
    kicker: 'Mandatory cover checklist',
    title: 'Check third-party motor cover before road use',
    intro: 'Use this guide to prepare the basic third-party insurance questions before buying or renewing a policy.',
    bullets: [
      'Result output: certificate and regulator checklist.',
      'Methodology: identify vehicle type, usage, passenger risk, and cross-border need.',
      'Source note: statutory premiums and certificate rules must be confirmed with the country regulator or licensed insurer.'
    ],
    fields: [
      ['select', 'country', 'Country', ['Nigeria', 'Kenya', 'Ghana', 'South Africa']],
      ['select', 'vehicleType', 'Vehicle type', ['private car', 'commercial car', 'motorcycle', 'minibus']],
      ['select', 'crossBorder', 'Cross-border use', ['no', 'yes']]
    ],
    button: 'Create checklist',
    result: 'Result: choose vehicle type to prepare a third-party insurance checklist.',
    note: 'Legal disclaimer: this is not an official premium table. Confirm current statutory premium and valid certificate requirements before driving.',
    sources: [{ label: 'Nigeria NAICOM', href: 'https://www.naicom.gov.ng/' }],
    faqs: [
      ['What does third-party motor insurance cover?', 'It generally covers liability to other people or property, not full repair of your own vehicle. Exact rules depend on the country and policy.'],
      ['Is a certificate enough?', 'You should verify the certificate is valid, issued by a licensed insurer, and accepted by the relevant road or insurance authority.'],
      ['Do I need extra cover for cross-border trips?', 'Often yes. Ask about ECOWAS Brown Card, COMESA Yellow Card, or local border insurance where applicable.']
    ]
  },
  'tools/ramadan-timetable/index.html': {
    tool: 'ramadan-timetable',
    kicker: 'Ramadan planner',
    title: 'Create a Ramadan timetable draft before local confirmation',
    intro: 'Draft a family or community Ramadan timetable with city, start date, days, and suhoor buffer, then confirm moon sighting and mosque times.',
    bullets: [
      'Result output: timetable draft and publishing caveats.',
      'Methodology: start date, day count, city, and buffer; prayer times should be confirmed locally.',
      'Source note: moon sighting and mosque timetable are the final authority for public schedules.'
    ],
    fields: [
      ['select', 'city', 'City', ['Lagos', 'Nairobi', 'Accra', 'Cape Town']],
      ['input', 'startDate', 'Expected start date', 'date', '2026-02-18'],
      ['input', 'days', 'Number of days', 'number', '30'],
      ['input', 'suhoorBuffer', 'Suhoor safety buffer minutes', 'number', '10']
    ],
    button: 'Draft timetable',
    result: 'Result: enter city and expected start date to draft a Ramadan timetable.',
    note: 'Religious disclaimer: calculated dates are for planning. Confirm the official start, suhoor, iftar, and Eid announcement locally before publishing.',
    sources: [
      { label: 'Prayer calculation methods', href: 'https://praycalc.org/science/calculation-methods' },
      { label: 'IslamicFinder Islamic events', href: 'https://www.islamicfinder.org/locale/?language=en' }
    ],
    faqs: [
      ['Why can Ramadan start shift by one day?', 'Many communities follow local moon sighting or an official council, so calculated dates remain planning dates until confirmed.'],
      ['Should I publish mosque times from this tool?', 'Use this for drafting only. Public mosque timetables should use the mosque or council-approved prayer times.'],
      ['What buffer should families use for suhoor?', 'Many households add 5-15 minutes before Fajr as a safety buffer, but local guidance should come first.']
    ]
  }
};

function fieldMarkup(field) {
  const [kind, name, label, typeOrOptions, value] = field;
  if (kind === 'select') {
    return `<label>${label}<select name="${name}" aria-label="${label}">${typeOrOptions.map((option) => `<option value="${option}">${option}</option>`).join('')}</select></label>`;
  }
  return `<label>${label}<input name="${name}" type="${typeOrOptions}" value="${value}" min="0" step="any" aria-label="${label}"></label>`;
}

function faqSchema(app, file) {
  const url = `https://afrotools.com/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: app.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    })),
    url
  };
}

function renderSection(app) {
  const sources = app.sources.map((source) => `<a href="${source.href}" target="_blank" rel="noopener">${source.label}</a>`).join(' | ');
  return `
<section class="df-upgrade" data-df-upgrade="${app.tool}">
  <div class="df-upgrade__card">
    <div>
      <span class="df-upgrade__kicker">${app.kicker}</span>
      <h2>${app.title}</h2>
      <p>${app.intro}</p>
      <ul class="df-upgrade__bullets">${app.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>
      <p class="df-upgrade__note"><strong>Reviewed 2026.</strong> ${app.note} Sources/reference: ${sources}</p>
    </div>
    <form class="df-form" data-df-form="${app.tool}">
      ${app.fields.map(fieldMarkup).join('\n      ')}
      <button type="submit">${app.button}</button>
      <output class="df-result" data-df-result="${app.tool}" aria-live="polite">${app.result}</output>
      <div class="df-actions"><button type="button" data-df-copy="${app.tool}">Copy summary</button></div>
    </form>
  </div>
</section>
<section class="df-faq" aria-labelledby="${app.tool}-faq-title">
  <h2 id="${app.tool}-faq-title">Frequently Asked Questions</h2>
  <div class="df-faq__grid">${app.faqs.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}</div>
</section>`;
}

function injectAssets(html) {
  if (!html.includes('english-df-app-upgrades.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/english-df-app-upgrades.css">\n</head>');
  }
  if (!html.includes('english-df-app-upgrades.js')) {
    html = html.replace('</body>', '<script src="/assets/js/pages/english-df-app-upgrades.js" defer></script>\n</body>');
  }
  return html;
}

function injectFaqSchema(html, app, file) {
  const marker = `"@type": "FAQPage"`;
  if (html.includes(marker) || html.includes('"@type":"FAQPage"')) return html;
  const json = JSON.stringify(faqSchema(app, file), null, 2);
  return html.replace('</head>', `<script type="application/ld+json">\n${json}\n</script>\n</head>`);
}

function injectSection(html, app) {
  if (html.includes(`data-df-upgrade="${app.tool}"`)) return html;
  const section = renderSection(app);
  if (html.includes('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">')) {
    return html.replace('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">', `${section}\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">`);
  }
  return html.replace('</main>', `${section}\n</main>`);
}

let changed = 0;
for (const [file, app] of Object.entries(apps)) {
  const full = path.join(process.cwd(), file);
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = injectAssets(html);
  html = injectFaqSchema(html, app, file);
  html = injectSection(html, app);
  if (html !== before) {
    fs.writeFileSync(full, html);
    changed += 1;
    console.log(`updated ${file}`);
  } else {
    console.log(`unchanged ${file}`);
  }
}

console.log(`English F-app upgrades applied: ${changed}`);
