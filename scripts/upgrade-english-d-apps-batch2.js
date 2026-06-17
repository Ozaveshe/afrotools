const fs = require('fs');
const path = require('path');

const apps = {
  'tools/gov-scholarship/index.html': {
    tool: 'gov-scholarship',
    kicker: 'Scholarship readiness',
    title: 'Check whether an application pack is actually ready',
    intro: 'Score deadline pressure and document readiness before opening country scholarship routes or sending applications.',
    bullets: ['Result output: readiness score and missing-document focus.', 'Methodology: deadline buffer plus number of core documents ready.', 'Source note: official scholarship pages control eligibility, deadlines, and required documents.'],
    fields: [['select', 'country', 'Country', ['Nigeria', 'Kenya', 'Ghana', 'South Africa']], ['select', 'level', 'Study level', ['undergraduate', 'masters', 'phd', 'short course']], ['input', 'deadlineDays', 'Days until deadline', 'number', '30'], ['input', 'documentsReady', 'Core documents ready', 'number', '5']],
    button: 'Check readiness',
    result: 'Result: enter deadline and documents to score scholarship readiness.',
    note: 'Education disclaimer: this does not guarantee funding or admission. Verify eligibility, deadline, and required documents with the official scholarship provider.',
    sources: [{ label: 'DAAD scholarship database', href: 'https://www.daad.de/en/studying-in-germany/scholarships/' }, { label: 'Commonwealth Scholarships', href: 'https://cscuk.fcdo.gov.uk/scholarships/' }],
    faqs: [['What documents usually matter first?', 'Transcript, admission letter, ID/passport, recommendation letters, essay, CV, and proof of financial need where required.'], ['Can I apply close to the deadline?', 'Yes, but late applications fail easily because referees, transcripts, portals, and payment confirmations take time.'], ['Should I reuse one essay?', 'Use a base essay, but tailor motivation, country fit, course fit, and impact plan to each scholarship.']]
  },
  'agriculture/livestock-feed/index.html': {
    tool: 'livestock-feed-calculator',
    kicker: 'Feed budget planner',
    title: 'Estimate feed cost before stock runs low',
    intro: 'Calculate herd size, daily ration, feed price, and number of days so farmers can plan purchases and compare feed alternatives.',
    bullets: ['Result output: total feed budget and ration warning.', 'Methodology: animals x kg per day x feed price x days.', 'Source note: age, breed, weight, grazing, and veterinary advice can change ration.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'animals', 'Number of animals', 'number', '25'], ['input', 'kgPerDay', 'Kg feed per animal per day', 'number', '2.5'], ['input', 'feedPrice', 'Feed price per kg', 'number', '420'], ['input', 'days', 'Planning days', 'number', '30']],
    button: 'Estimate feed cost',
    result: 'Estimate: enter herd and feed data to calculate budget.',
    note: 'Agriculture disclaimer: this is a planning estimate. Confirm ration with an extension officer or veterinarian, especially for young, pregnant, or sick animals.',
    sources: [{ label: 'FAO livestock production', href: 'https://www.fao.org/livestock-production/en/' }],
    faqs: [['What changes feed needs most?', 'Animal age, breed, weight, pregnancy, milk production, climate, grazing quality, and health status.'], ['Should I buy the cheapest feed?', 'Not automatically. Compare nutrient value, spoilage risk, transport, animal response, and veterinary guidance.'], ['What should I track weekly?', 'Feed used, weight gain, milk or egg output, sickness, mortality, and feed price changes.']]
  },
  'tools/streaming-royalties/index.html': {
    tool: 'streaming-royalties',
    kicker: 'Royalty estimate',
    title: 'Estimate music streaming royalties after distribution fees',
    intro: 'Model streams, rate per thousand, and distributor fee so artists can understand a realistic payout envelope.',
    bullets: ['Result output: net royalty estimate.', 'Methodology: streams divided by 1,000 multiplied by blended rate minus distributor fee.', 'Source note: actual rates vary by platform, country, subscription type, rights split, and reporting delay.'],
    fields: [['input', 'streams', 'Streams', 'number', '100000'], ['input', 'ratePerThousand', 'USD per 1,000 streams', 'number', '3'], ['input', 'distributorFee', 'Distributor fee percent', 'number', '15']],
    button: 'Estimate royalties',
    result: 'Estimate: enter streams and rate to calculate net royalties.',
    note: 'Music business disclaimer: this is not a royalty statement. Confirm platform reports, distributor terms, publishing splits, and tax.',
    sources: [{ label: 'Spotify Loud and Clear', href: 'https://loudandclear.byspotify.com/' }],
    faqs: [['Why do royalty rates vary?', 'Platform, country, subscription type, ad-supported listening, rights split, and distributor terms affect payouts.'], ['Do streams pay the artist directly?', 'Usually no. Money passes through labels, distributors, publishers, and rights administrators before artists are paid.'], ['What should artists reconcile?', 'Streams, territory, ISRC, distributor fee, publishing split, label split, exchange rate, and payment date.']]
  },
  'tools/gaming-pc-build/index.html': {
    tool: 'gaming-pc-build',
    kicker: 'PC build budget',
    title: 'Build a gaming PC budget with warranty and power headroom',
    intro: 'Estimate core component cost, other parts, and buffer before buying imported or local PC parts.',
    bullets: ['Result output: total build budget.', 'Methodology: GPU plus CPU plus other parts plus contingency.', 'Source note: import duty, local warranty, exchange rate, and power supply quality can change the real cost.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'gpu', 'GPU budget', 'number', '450000'], ['input', 'cpu', 'CPU budget', 'number', '220000'], ['input', 'otherParts', 'Other parts budget', 'number', '380000'], ['input', 'buffer', 'Contingency percent', 'number', '10']],
    button: 'Estimate build',
    result: 'Estimate: enter component budgets to calculate PC build cost.',
    note: 'Buyer note: compare warranty, local repair options, PSU headroom, monitor target, and import fees before purchasing.',
    sources: [{ label: 'PCPartPicker build guides', href: 'https://pcpartpicker.com/guide/' }],
    faqs: [['What component should I prioritize?', 'For gaming, GPU and monitor target usually drive performance, but CPU, RAM, storage, and PSU must remain balanced.'], ['Why include a buffer?', 'Exchange rates, delivery, duty, warranty, cables, cooling, and price changes often add surprise costs.'], ['What should I avoid?', 'Underpowered PSUs, no-name storage, poor cooling, incompatible motherboard, and parts without warranty.']]
  },
  'tools/concert-budget/index.html': {
    tool: 'concert-budget',
    kicker: 'Event margin check',
    title: 'Estimate concert profit before deposits go out',
    intro: 'Stress test tickets, price, sponsors, and event cost before paying artists, venue, sound, security, and marketing deposits.',
    bullets: ['Result output: event profit or loss estimate.', 'Methodology: ticket revenue plus sponsors minus event cost.', 'Source note: attendance, refunds, weather, security, tax, and ticketing fees can change margin.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'tickets', 'Expected tickets sold', 'number', '800'], ['input', 'ticketPrice', 'Average ticket price', 'number', '5000'], ['input', 'sponsors', 'Sponsor revenue', 'number', '1000000'], ['input', 'eventCost', 'Total event cost', 'number', '3500000']],
    button: 'Estimate margin',
    result: 'Estimate: enter tickets, price, sponsors, and cost to calculate event margin.',
    note: 'Business disclaimer: this is a planning estimate. Confirm tax, permits, security, artist contract, refund rules, and venue terms.',
    sources: [{ label: 'Eventbrite event budget guide', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
    faqs: [['What costs are often missed?', 'Security, generators, fuel, ticketing fees, artist hospitality, permits, cleanup, insurance, and refunds.'], ['Why do sponsors matter?', 'Sponsors reduce break-even pressure, but deliverables and payment timing must be written down.'], ['What should I calculate before deposits?', 'Break-even tickets, worst-case attendance, refund exposure, artist cancellation terms, and cash reserve.']]
  },
  'tools/photo-video-pricing/index.html': {
    tool: 'photo-video-pricing',
    kicker: 'Shoot quote builder',
    title: 'Price photo and video work with editing time included',
    intro: 'Build a quote from shoot hours, hourly rate, edit days, and edit rate before adding travel, assistants, rush fees, and usage rights.',
    bullets: ['Result output: project quote estimate.', 'Methodology: shoot hours x hourly rate plus edit days x edit rate.', 'Source note: usage rights, location, gear, crew, and delivery timeline can change quote.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'shootHours', 'Shoot hours', 'number', '6'], ['input', 'hourlyRate', 'Hourly shoot rate', 'number', '25000'], ['input', 'editDays', 'Edit days', 'number', '2'], ['input', 'editRate', 'Edit day rate', 'number', '80000']],
    button: 'Build quote',
    result: 'Quote: enter shoot and edit time to calculate project fee.',
    note: 'Pricing note: include deliverables, revision limits, usage rights, payment milestones, travel, and cancellation terms in the quote.',
    sources: [{ label: 'AOP usage calculator reference', href: 'https://www.the-aop.org/information/usage-calculator' }],
    faqs: [['Why charge separately for editing?', 'Editing is skilled time and often takes longer than the shoot. Hiding it makes quotes unprofitable.'], ['What belongs in a client quote?', 'Deliverables, timeline, location, crew, revisions, payment milestones, usage rights, and cancellation terms.'], ['When should I charge a rush fee?', 'Charge rush fees when the deadline compresses editing, staffing, transport, or other booked work.']]
  },
  'tools/betting-odds/index.html': {
    tool: 'betting-odds',
    kicker: 'Odds value check',
    title: 'Compare implied probability with your own probability',
    intro: 'Convert odds into implied probability, compare your stated probability, and understand the potential profit and risk.',
    bullets: ['Result output: implied probability, stated edge, and potential profit.', 'Methodology: implied probability equals 100 divided by decimal odds.', 'Source note: odds move quickly and no calculator predicts match outcomes.'],
    fields: [['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']], ['input', 'odds', 'Decimal odds', 'number', '2.2'], ['input', 'stake', 'Stake', 'number', '5000'], ['input', 'probability', 'Your probability percent', 'number', '48']],
    button: 'Check odds value',
    result: 'Result: enter odds, stake, and probability to check implied value.',
    note: 'Responsible gambling disclaimer: this is an arithmetic tool, not a prediction or betting recommendation. Only risk money you can afford to lose.',
    sources: [{ label: 'GambleAware safer gambling', href: 'https://www.gambleaware.org/' }],
    faqs: [['What is implied probability?', 'It is the probability suggested by the odds. Decimal odds of 2.00 imply about 50% before bookmaker margin.'], ['Does positive edge guarantee profit?', 'No. It only compares your assumption with the odds. The event can still lose.'], ['What should users avoid?', 'Chasing losses, borrowing to bet, betting under pressure, and treating this calculator as a prediction.']]
  },
  'tools/creator-analytics/index.html': {
    tool: 'creator-analytics',
    kicker: 'Action engagement',
    title: 'Measure creator content by actions, not vanity views',
    intro: 'Compare views, saves, and clicks to understand whether content is creating useful audience action.',
    bullets: ['Result output: action engagement rate.', 'Methodology: saves plus clicks divided by views.', 'Source note: platforms count views and engagement differently, so compare trends within the same platform.'],
    fields: [['input', 'views', 'Views', 'number', '50000'], ['input', 'saves', 'Saves', 'number', '1200'], ['input', 'clicks', 'Clicks', 'number', '900']],
    button: 'Analyze content',
    result: 'Result: enter views, saves, and clicks to calculate action engagement.',
    note: 'Analytics note: use this for directional review. Platform analytics, attribution windows, and bot filtering can differ.',
    sources: [{ label: 'YouTube Analytics help', href: 'https://support.google.com/youtube/answer/9002587' }],
    faqs: [['Why not focus only on views?', 'Views can be passive. Saves, clicks, comments, watch time, and conversions show stronger intent.'], ['How often should I review content?', 'Weekly is enough for patterns; daily swings can mislead unless you are testing a campaign.'], ['What should I compare?', 'Topic, hook, format, platform, post time, retention, saves, clicks, and audience source.']]
  },
  'tools/creator-page/index.html': {
    tool: 'creator-page',
    kicker: 'Link-in-bio audit',
    title: 'Audit whether a creator page sends people to the right offers',
    intro: 'Calculate click rate and simplify the top links so booking, portfolio, shop, newsletter, and contact actions are obvious.',
    bullets: ['Result output: creator-page click rate and priority-offer reminder.', 'Methodology: link clicks divided by visits.', 'Source note: platform bios, tracking links, and landing pages can count visits differently.'],
    fields: [['input', 'visits', 'Page visits', 'number', '2000'], ['input', 'linkClicks', 'Link clicks', 'number', '220'], ['input', 'offers', 'Priority offers', 'number', '3']],
    button: 'Audit page',
    result: 'Result: enter visits and clicks to calculate page click rate.',
    note: 'Creator note: do not overload a profile with low-value links. Put business-critical actions first.',
    sources: [{ label: 'Google Analytics campaign measurement', href: 'https://support.google.com/analytics/answer/10917952' }],
    faqs: [['How many links should a creator page have?', 'Enough to cover the main actions, but not so many that booking, shop, portfolio, and contact links disappear.'], ['What is a useful click rate?', 'It depends on audience intent and offer. Track your own baseline and improve the weakest step.'], ['What should be above the fold?', 'Primary offer, booking/contact, portfolio proof, and a clear call to action.']]
  },
  'tools/creator-polish/index.html': {
    tool: 'creator-polish',
    kicker: 'Caption and pitch polish',
    title: 'Estimate the editing effort for creator copy',
    intro: 'Plan a polish pass for captions, brand pitches, bios, scripts, or product descriptions before publishing.',
    bullets: ['Result output: editing time estimate and checklist.', 'Methodology: word count divided by a practical review pace.', 'Source note: tone, claims, local idioms, and audience context shape the final edit.'],
    fields: [['input', 'words', 'Word count', 'number', '450'], ['select', 'tone', 'Target tone', ['professional', 'warm', 'sales', 'educational']]],
    button: 'Estimate polish pass',
    result: 'Result: enter word count and tone to estimate editing effort.',
    note: 'Copy note: this local checklist does not send private drafts anywhere. Verify factual claims before publishing.',
    sources: [{ label: 'PlainLanguage.gov guidelines', href: 'https://www.plainlanguage.gov/guidelines/' }],
    faqs: [['What should a polish pass fix?', 'Clarity, grammar, unsupported claims, tone, CTA, local idioms, and unnecessary filler.'], ['Should every caption sound polished?', 'No. Keep natural voice, but remove confusion and claims you cannot support.'], ['What should creators check before posting?', 'Audience, promise, proof, CTA, brand safety, spelling, links, and platform length.']]
  }
};

function fieldMarkup(field) {
  const [kind, name, label, typeOrOptions, value] = field;
  if (kind === 'select') return `<label>${label}<select name="${name}" aria-label="${label}">${typeOrOptions.map((option) => `<option value="${option}">${option}</option>`).join('')}</select></label>`;
  return `<label>${label}<input name="${name}" type="${typeOrOptions}" value="${value}" min="0" step="any" aria-label="${label}"></label>`;
}

function faqSchema(app, file) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: app.faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })), url: `https://afrotools.com/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}` };
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
  if (!html.includes('english-df-app-upgrades.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/english-df-app-upgrades.css">\n</head>');
  if (!html.includes('english-df-app-upgrades.js')) html = html.replace('</body>', '<script src="/assets/js/pages/english-df-app-upgrades.js" defer></script>\n</body>');
  return html;
}

function injectFaqSchema(html, app, file) {
  if (html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"')) return html;
  return html.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(faqSchema(app, file), null, 2)}\n</script>\n</head>`);
}

function injectSection(html, app) {
  if (html.includes(`data-df-upgrade="${app.tool}"`)) return html;
  const section = renderSection(app);
  if (html.includes('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">')) return html.replace('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">', `${section}\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">`);
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
console.log(`English D-app batch 2 upgrades applied: ${changed}`);
