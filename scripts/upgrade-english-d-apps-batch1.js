const fs = require('fs');
const path = require('path');

const apps = {
  'tools/electricity-tariff/index.html': {
    tool: 'electricity-tariff',
    kicker: 'Bill estimate starter',
    title: 'Estimate a bill before opening a country tariff page',
    intro: 'Model kWh, tariff, and fixed charge first, then open the country page to check tariff bands, VAT, service charges, and utility-specific rules.',
    bullets: ['Result output: monthly bill estimate and tariff assumptions.', 'Methodology: kWh used x tariff plus fixed charge.', 'Source note: final bills depend on tariff class, meter type, distributor, VAT, and arrears.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'ZAR', 'GHS']], ['input', 'monthlyKwh', 'Monthly kWh used', 'number', '180'], ['input', 'tariff', 'Tariff per kWh', 'number', '85'], ['input', 'fixedCharge', 'Fixed charge', 'number', '1500']],
    button: 'Estimate bill',
    result: 'Estimate: enter kWh and tariff to calculate the monthly bill.',
    note: 'Planning estimate only. Verify current tariff class and charges with the official regulator, distribution company, or utility bill.',
    sources: [{ label: 'Nigeria NERC', href: 'https://nerc.gov.ng/' }, { label: 'Kenya EPRA', href: 'https://www.epra.go.ke/' }],
    faqs: [['Why can my bill differ from this estimate?', 'Tariff bands, fixed charges, VAT, arrears, estimated billing, service fees, and meter debt recovery can change the final bill.'], ['Should I use this for a landlord dispute?', 'Use it as a planning check only. For disputes, keep bills, meter photos, tokens, and official tariff notices.'], ['What is the best input to use?', 'Use kWh from your meter or past bills, then enter the tariff printed by your utility or regulator.']]
  },
  'tools/prepaid-meter/index.html': {
    tool: 'prepaid-meter',
    kicker: 'Token unit estimate',
    title: 'Convert prepaid spend into likely kWh units',
    intro: 'Estimate how many units a token purchase may deliver after tariff and deductions before checking the country-specific prepaid meter page.',
    bullets: ['Result output: estimated kWh units after deductions.', 'Methodology: spend minus charges divided by tariff per kWh.', 'Source note: arrears recovery, VAT, debt, lifeline bands, and fixed charges can change units.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'ZAR', 'GHS']], ['input', 'spend', 'Token purchase amount', 'number', '10000'], ['input', 'tariff', 'Tariff per kWh', 'number', '85'], ['input', 'deductions', 'Charges and deductions percent', 'number', '8']],
    button: 'Estimate units',
    result: 'Result: enter token spend and tariff to estimate kWh units.',
    note: 'Planning estimate only. Confirm arrears, debt recovery, VAT, fixed charge, and tariff band on your receipt.',
    sources: [{ label: 'Nigeria NERC', href: 'https://nerc.gov.ng/' }, { label: 'Kenya EPRA', href: 'https://www.epra.go.ke/' }],
    faqs: [['Why did my prepaid units drop?', 'Tariff change, debt recovery, VAT, fixed charges, arrears, or leaving a lifeline band can reduce units.'], ['Is this a token generator?', 'No. It only estimates kWh from a purchase amount. Tokens must come from licensed vending channels.'], ['What should I save for complaints?', 'Keep the receipt, token, meter number, tariff class, vending date, and a photo of the meter units before loading.']]
  },
  'tools/business-insurance/index.html': {
    tool: 'business-insurance',
    kicker: 'SME cover map',
    title: 'Map the business risks a quote should cover',
    intro: 'Build a quote pack around stock, equipment, liability, business interruption, goods in transit, and the evidence an insurer will request.',
    bullets: ['Result output: starter cover amount and quote checklist.', 'Methodology: stock plus equipment plus a liability exposure allowance.', 'Source note: underwriters may adjust for location, fire protection, claims history, and trade type.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'stockValue', 'Stock value', 'number', '3000000'], ['input', 'equipmentValue', 'Equipment value', 'number', '2500000'], ['input', 'liabilityLimit', 'Public liability limit', 'number', '5000000']],
    button: 'Estimate cover need',
    result: 'Estimate: enter assets and liability limit to prepare a quote pack.',
    note: 'Insurance disclaimer: this is not a quote. Confirm exclusions, excess, insured address, warranties, and claim evidence with a licensed insurer.',
    sources: [{ label: 'NAIC business insurance guide', href: 'https://content.naic.org/consumer/business-insurance' }],
    faqs: [['What cover does a small shop usually compare?', 'Fire, theft, stock, equipment, public liability, goods in transit, and business interruption are common starting points.'], ['What documents help with a quote?', 'Stock list, equipment invoices, lease, photos, security details, annual revenue, and claim history.'], ['Can one policy cover every risk?', 'Usually no. Compare policy sections, exclusions, limits, excess, and whether professional liability is separate.']]
  },
  'tools/prayer-times/index.html': {
    tool: 'prayer-times',
    kicker: 'Salah planning profile',
    title: 'Set prayer-time assumptions before checking local timetables',
    intro: 'Choose city, calculation method, and Asr school, then compare the result with the nearest mosque timetable.',
    bullets: ['Result output: calculation profile and local confirmation checklist.', 'Methodology: city plus method plus school; public use requires mosque confirmation.', 'Source note: location, elevation, twilight angle, and community method can change Fajr and Isha.'],
    fields: [['select', 'city', 'City', ['Lagos', 'Nairobi', 'Accra', 'Cape Town']], ['select', 'method', 'Calculation method', ['MWL', 'Egypt', 'UmmUra', 'ISNA']], ['select', 'school', 'Asr school', ['standard', 'hanafi']]],
    button: 'Set prayer profile',
    result: 'Result: choose city and method to prepare a prayer-time profile.',
    note: 'Religious disclaimer: calculated times are for planning. Use the local mosque or council timetable for public announcements.',
    sources: [{ label: 'Prayer calculation methods', href: 'https://praycalc.org/science/calculation-methods' }],
    faqs: [['Why do prayer apps show different times?', 'They may use different calculation angles, Asr school, location, elevation, or adjustment rules.'], ['Can I publish mosque times from this?', 'Use this as a draft only. Public timetables should be confirmed by the mosque or local authority.'], ['Which times differ most?', 'Fajr and Isha often differ most because twilight-angle assumptions vary.']]
  },
  'tools/traditional-calendar/index.html': {
    tool: 'traditional-calendar',
    kicker: 'Market-day reference',
    title: 'Convert dates with local-calendar caution',
    intro: 'Use the converter as a planning reference for market days or heritage dates, then confirm with the town, family, church, palace, or local organiser.',
    bullets: ['Result output: estimated market-day reference and publication warning.', 'Methodology: date lookup for planning, not legal conversion.', 'Source note: local calendar practice can differ by town and community.'],
    fields: [['input', 'date', 'Gregorian date', 'date', '2026-06-17'], ['select', 'system', 'Calendar system', ['Igbo market day', 'Ethiopian', 'Coptic', 'Yoruba']]],
    button: 'Convert date',
    result: 'Estimate: choose a date to get a local-calendar reference.',
    note: 'Cultural disclaimer: this is a planning reference. Confirm locally before printing invitations, market notices, or education material.',
    sources: [{ label: 'Igbo calendar overview', href: 'https://en.wikipedia.org/wiki/Igbo_calendar' }],
    faqs: [['Can this replace a town calendar?', 'No. Towns and communities may maintain their own market-day or festival calendars.'], ['What should I show on public flyers?', 'Show both Gregorian and local date, and add the confirming local authority or organiser.'], ['Why can dates disagree?', 'Local cycle counting, festival announcements, church calendars, or palace notices can differ from a generic converter.']]
  },
  'tools/freelancer-rate/index.html': {
    tool: 'freelancer-rate',
    kicker: 'Rate card builder',
    title: 'Turn income goals into a defensible day rate',
    intro: 'Calculate a realistic day rate from target income, billable days, tax buffer, admin time, and revision risk before opening a country page.',
    bullets: ['Result output: day-rate target and rate-card explanation.', 'Methodology: income goal plus buffer divided by realistic billable days.', 'Source note: market rates vary by skill, portfolio, urgency, platform fees, and client location.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'monthlyIncome', 'Monthly income target', 'number', '800000'], ['input', 'billableDays', 'Billable days per month', 'number', '14'], ['input', 'taxBuffer', 'Tax/admin buffer percent', 'number', '25']],
    button: 'Calculate rate',
    result: 'Result: enter income target and billable days to calculate a day rate.',
    note: 'Business disclaimer: this is a pricing guide, not a guaranteed market rate. Adjust for portfolio strength, urgency, scope, and payment risk.',
    sources: [{ label: 'Upwork rate-setting guide', href: 'https://www.upwork.com/resources/how-to-set-your-freelance-rate' }],
    faqs: [['Why use billable days instead of calendar days?', 'Freelancers need time for sales, admin, revisions, learning, unpaid calls, and late payments.'], ['Should I charge hourly or per project?', 'Use day rate for planning, then convert to project pricing with scope, revision limits, and payment milestones.'], ['What should a rate card include?', 'Deliverables, timeline, revision limits, payment terms, rush fee, usage rights, and what is excluded.']]
  },
  'tools/gratuity-calculator/index.html': {
    tool: 'gratuity-calculator',
    kicker: 'Exit-pay envelope',
    title: 'Estimate gratuity or severance before payroll review',
    intro: 'Model pay, service years, and days per year, then verify the country rule, contract clause, and tax treatment.',
    bullets: ['Result output: exit-pay envelope and verification checklist.', 'Methodology: daily pay x eligible days x service years.', 'Source note: statutory minimums, contracts, collective agreements, and tax can change the final value.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'monthlyPay', 'Monthly pay', 'number', '300000'], ['input', 'yearsWorked', 'Years worked', 'number', '5'], ['input', 'daysPerYear', 'Eligible days per year', 'number', '21']],
    button: 'Estimate gratuity',
    result: 'Estimate: enter pay and years worked to calculate an exit-pay envelope.',
    note: 'Legal/payroll disclaimer: verify labour law, contract terms, leave pay, notice, tax, and deductions before final settlement.',
    sources: [{ label: 'ILO employment protection resources', href: 'https://www.ilo.org/topics/employment-security' }],
    faqs: [['Is gratuity the same as severance?', 'Not always. Some countries or contracts separate gratuity, severance, notice, leave pay, and pension.'], ['What can change the final payment?', 'Contract terms, reason for exit, service years, daily-pay formula, tax, unpaid loans, and leave balance.'], ['Can employers use this for final payroll?', 'Use it as a review estimate only, then confirm with current labour law and payroll records.']]
  },
  'telecom/sim-registration/index.html': {
    tool: 'telecom-sim-reg',
    kicker: 'Registration checklist',
    title: 'Prepare SIM registration documents before visiting an operator',
    intro: 'Use the country checker above, then create a document and channel checklist for NIN linkage, RICA, national ID, or operator-store registration.',
    bullets: ['Result output: document checklist and confirmation reminder.', 'Methodology: country, ID type, and registration channel.', 'Source note: telecom regulators and operators remain the final authority for deadlines and penalties.'],
    fields: [['select', 'country', 'Country', ['Nigeria', 'South Africa', 'Kenya', 'Ghana']], ['select', 'idType', 'Identity document', ['national ID', 'passport', 'NIN', 'proof of residence']], ['select', 'channel', 'Registration channel', ['operator store', 'USSD', 'provider app', 'agent kiosk']]],
    button: 'Create checklist',
    result: 'Result: choose country and ID type to create a SIM registration checklist.',
    note: 'Privacy note: do not enter phone numbers here. Use official operator channels for status checks and keep confirmation SMS.',
    sources: [{ label: 'Nigerian Communications Commission', href: 'https://www.ncc.gov.ng/' }, { label: 'ICASA South Africa', href: 'https://www.icasa.org.za/' }],
    faqs: [['Should I enter my phone number here?', 'No. This page is for requirements and planning. Use official operator or regulator channels for live status checks.'], ['What documents are commonly needed?', 'National ID, passport, proof of residence, SIM card, and sometimes biometric capture, depending on country.'], ['What should I keep after registration?', 'Keep the confirmation SMS, receipt, registration reference, and the date you visited or submitted the request.']]
  },
  'tools/hajj-budget/index.html': {
    tool: 'hajj-budget',
    kicker: 'Pilgrimage savings target',
    title: 'Build a Hajj or Umrah budget before paying deposits',
    intro: 'Estimate package, cash, travellers, and contingency, then confirm official operator pricing, visa rules, vaccines, and foreign exchange.',
    bullets: ['Result output: total savings target and deposit checklist.', 'Methodology: package plus cash budget times travellers plus contingency.', 'Source note: official operators, visa windows, flight prices, and exchange rates can change quickly.'],
    fields: [['input', 'travellers', 'Travellers', 'number', '1'], ['input', 'packageCost', 'Package cost per person USD', 'number', '6200'], ['input', 'cashBudget', 'Cash and local spend USD', 'number', '800'], ['input', 'buffer', 'Contingency percent', 'number', '12']],
    button: 'Estimate budget',
    result: 'Estimate: enter package cost and travellers to calculate a savings target.',
    note: 'Travel disclaimer: this is a budget planner. Confirm official packages, visa rules, health requirements, and payment deadlines before deposit.',
    sources: [{ label: 'Nusuk official platform', href: 'https://www.nusuk.sa/' }, { label: 'NAHCON Nigeria', href: 'https://nahcon.gov.ng/' }],
    faqs: [['What costs are often missed?', 'Vaccines, laundry, local transport, SIM/data, food outside package, medicine, luggage, and emergency cash.'], ['Should I budget in local currency or USD?', 'Track both. Packages may be quoted in local currency, USD, or Saudi riyal, and exchange-rate swings matter.'], ['When should I pay a deposit?', 'Only after confirming the operator, package terms, refund rules, visa process, and official approval.']]
  },
  'tools/career-growth/index.html': {
    tool: 'career-growth',
    kicker: 'Career move plan',
    title: 'Turn a salary target into a practical career-growth plan',
    intro: 'Use current pay, target pay, timeline, and role focus to create a measurable plan for skills, proof, applications, and negotiation.',
    bullets: ['Result output: salary gap and action plan.', 'Methodology: target pay minus current pay over a defined timeline.', 'Source note: market pay depends on role, country, proof of work, employer, and negotiation timing.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'currentPay', 'Current monthly pay', 'number', '350000'], ['input', 'targetPay', 'Target monthly pay', 'number', '600000'], ['input', 'months', 'Timeline months', 'number', '12']],
    button: 'Build growth plan',
    result: 'Result: enter current and target pay to create a career-growth plan.',
    note: 'Career disclaimer: this is planning guidance, not a job or salary guarantee. Use evidence, applications, and negotiation preparation.',
    sources: [{ label: 'O*NET career exploration', href: 'https://www.onetonline.org/' }],
    faqs: [['What makes a career plan realistic?', 'One target role, measurable skill gaps, proof projects, applications, networking, and a salary negotiation date.'], ['Should I change jobs or negotiate?', 'Compare internal promotion path, market demand, proof strength, and risk before deciding.'], ['What should I track weekly?', 'Applications, portfolio proof, recruiter conversations, interviews, skill practice, and salary data.']]
  },
  'agriculture/crop-insurance/index.html': {
    tool: 'crop-insurance',
    kicker: 'Farm risk cover check',
    title: 'Estimate crop cover and claim readiness',
    intro: 'Model farm value, premium rate, and excess, then verify covered perils and claim evidence for the local scheme or insurer.',
    bullets: ['Result output: crop premium and excess note.', 'Methodology: insured farm value x premium rate.', 'Source note: crop, district, weather trigger, subsidy, and insurer wording can change both premium and payout.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'farmValue', 'Insured farm value', 'number', '750000'], ['input', 'premiumRate', 'Premium rate percent', 'number', '5'], ['input', 'excess', 'Policy excess percent', 'number', '10']],
    button: 'Estimate cover',
    result: 'Estimate: enter farm value and rate to calculate crop premium.',
    note: 'Agriculture disclaimer: verify perils, trigger data, waiting period, exclusions, claim evidence, and subsidy rules before enrollment.',
    sources: [{ label: 'World Bank agricultural insurance overview', href: 'https://www.worldbank.org/en/topic/financialsector/brief/agricultural-insurance' }],
    faqs: [['What is weather-index insurance?', 'It can pay based on rainfall or weather data triggers rather than a farm visit, depending on product design.'], ['What evidence should farmers keep?', 'Planting date, farm photos, input receipts, GPS/location, loss photos, and extension officer notes where required.'], ['Is crop insurance worth it?', 'It depends on premium, covered perils, payout trigger, subsidy, farm risk, and whether the household can absorb a bad season.']]
  },
  'tools/gym-roi-business/index.html': {
    tool: 'gym-roi-business',
    kicker: 'Fitness business payback',
    title: 'Estimate gym payback before buying equipment',
    intro: 'Model members, monthly fee, operating cost, and setup cost before signing a lease or importing machines.',
    bullets: ['Result output: monthly profit and setup payback.', 'Methodology: members x fee minus opex; setup cost divided by monthly profit.', 'Source note: rent, power, equipment maintenance, churn, and personal-training revenue can change ROI.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'members', 'Active members', 'number', '120'], ['input', 'fee', 'Monthly fee per member', 'number', '15000'], ['input', 'opex', 'Monthly operating cost', 'number', '900000'], ['input', 'setup', 'Setup cost', 'number', '12000000']],
    button: 'Estimate ROI',
    result: 'Estimate: enter members, fees, and costs to calculate payback.',
    note: 'Business disclaimer: this is a planning estimate. Validate rent, equipment life, churn, trainer costs, and local competition.',
    sources: [{ label: 'SBA break-even analysis guide', href: 'https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs' }],
    faqs: [['What breaks gym ROI fastest?', 'Low retention, power cost, rent, equipment downtime, trainer payroll, and overestimating paid memberships.'], ['Should I buy all equipment at once?', 'Often no. Start with demand-proven zones, then add machines based on member usage and cash flow.'], ['What metric should I track monthly?', 'Active paid members, churn, revenue per member, opex, equipment repairs, and cash reserve.']]
  },
  'tools/athlete-earnings/index.html': {
    tool: 'athlete-earnings',
    kicker: 'Career earnings planner',
    title: 'Plan athlete income beyond headline salary',
    intro: 'Estimate salary, bonuses, active years, and agent fee, then plan taxes, injury risk, savings, and post-career income.',
    bullets: ['Result output: career earnings after agent fee.', 'Methodology: salary plus bonuses multiplied by active years minus agent fee.', 'Source note: contracts, taxes, injuries, transfers, and endorsement terms can change earnings.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'salary', 'Annual salary', 'number', '1200000'], ['input', 'bonuses', 'Annual bonuses', 'number', '300000'], ['input', 'years', 'Active years planned', 'number', '6'], ['input', 'agentFee', 'Agent fee percent', 'number', '10']],
    button: 'Estimate earnings',
    result: 'Estimate: enter salary and active years to calculate career earnings.',
    note: 'Financial disclaimer: this is not financial advice. Plan taxes, injury protection, savings, and post-career skills with qualified help.',
    sources: [{ label: 'FIFPRO player career resources', href: 'https://fifpro.org/' }],
    faqs: [['Why is headline salary misleading?', 'Taxes, agent fees, unpaid bonuses, short contracts, injuries, and delayed payments can reduce take-home value.'], ['What should athletes save for?', 'Injury periods, off-season costs, family support, training, relocation, and post-career education.'], ['Can endorsements replace salary?', 'Sometimes, but they depend on performance, visibility, contract rights, and brand demand.']]
  },
  'tools/contractor-vs-employee/index.html': {
    tool: 'contractor-vs-employee',
    kicker: 'Hiring cost comparison',
    title: 'Compare employee cost against contractor pricing',
    intro: 'Model base pay, benefits, and contractor markup, then check labour classification risk before deciding the engagement model.',
    bullets: ['Result output: employee cost versus contractor equivalent.', 'Methodology: base pay plus benefits compared with contractor markup.', 'Source note: labour law, control, exclusivity, tax, and benefits can change classification risk.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'basePay', 'Base monthly pay', 'number', '500000'], ['input', 'benefits', 'Benefits and payroll percent', 'number', '18'], ['input', 'contractorMarkup', 'Contractor markup percent', 'number', '35']],
    button: 'Compare cost',
    result: 'Result: enter base pay and markup to compare hiring models.',
    note: 'Legal/payroll disclaimer: this is not legal advice. Confirm worker classification, tax withholding, benefits, and contract control rules locally.',
    sources: [{ label: 'ILO employment relationship guidance', href: 'https://www.ilo.org/topics/employment-relationship' }],
    faqs: [['When is contractor cheaper?', 'Contractors can look cheaper when benefits and payroll taxes are high, but misclassification risk can erase savings.'], ['What signals employee status?', 'Control, fixed hours, exclusivity, company tools, manager supervision, and ongoing core work can indicate employment.'], ['What should contracts clarify?', 'Scope, deliverables, IP, tax responsibility, termination, confidentiality, payment milestones, and dispute process.']]
  },
  'tools/retrenchment-calculator/index.html': {
    tool: 'retrenchment-calculator',
    kicker: 'Retrenchment package review',
    title: 'Estimate severance, notice, and settlement items',
    intro: 'Model monthly pay, years worked, and notice months, then verify statutory minimums, consultation process, leave pay, and tax.',
    bullets: ['Result output: retrenchment package envelope.', 'Methodology: severance days per year plus notice pay.', 'Source note: labour law, contract, union agreement, leave balance, and tax can change final settlement.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'monthlyPay', 'Monthly pay', 'number', '400000'], ['input', 'yearsWorked', 'Years worked', 'number', '4'], ['input', 'noticeMonths', 'Notice months', 'number', '1']],
    button: 'Estimate package',
    result: 'Estimate: enter pay, service years, and notice to calculate a package envelope.',
    note: 'Legal disclaimer: this is not legal advice. Confirm consultation steps, statutory minimums, leave pay, notice, tax, and deductions with local rules.',
    sources: [{ label: 'ILO termination of employment resources', href: 'https://www.ilo.org/topics/employment-security' }],
    faqs: [['What belongs in a retrenchment review?', 'Severance, notice, leave pay, final salary, pension, tax, benefits end date, and consultation records.'], ['Can an employer skip consultation?', 'Many jurisdictions require consultation or procedural fairness. Check local labour law before accepting terms.'], ['What documents should workers keep?', 'Contract, payslips, letters, consultation notes, leave balance, pension records, and final settlement statement.']]
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
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: app.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    })),
    url: `https://afrotools.com/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`
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
  if (html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"')) return html;
  return html.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(faqSchema(app, file), null, 2)}\n</script>\n</head>`);
}

function injectSection(html, app) {
  if (html.includes(`data-df-upgrade="${app.tool}"`)) return html;
  const section = renderSection(app);
  if (html.includes('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">')) {
    return html.replace('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">', `${section}\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">`);
  }
  if (html.includes('</main>')) return html.replace('</main>', `${section}\n</main>`);
  return html.replace('<afro-footer>', `${section}\n<afro-footer>`);
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

console.log(`English D-app batch 1 upgrades applied: ${changed}`);
