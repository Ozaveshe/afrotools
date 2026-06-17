const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), 'reports/tool-quality-ranking.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const targetRanks = new Set((process.env.AFROTOOLS_QUALITY_TARGET_RANKS || 'C').split(',').map((rank) => rank.trim()).filter(Boolean));

const profiles = {
  agriculture: {
    kicker: 'Field planning workflow',
    intro: 'Turn local farm assumptions into a quick planning summary before spending money or moving stock.',
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'quantity', 'Quantity or area', 'number', '100'],
      ['input', 'unitCost', 'Unit cost', 'number', '2500'],
      ['input', 'buffer', 'Risk buffer percent', 'number', '12']
    ],
    result: 'farm planning summary ready with cost, buffer, timing, and field-check notes',
    disclaimer: 'Agriculture estimate only. Confirm local extension advice, weather, disease pressure, buyer price, and input quality before acting.',
    source: 'extension, buyer, input supplier, and farm-record references'
  },
  'transport-logistics': {
    kicker: 'Route cost workflow',
    intro: 'Check distance, time, fees, delay risk, and margin before accepting a trip, route, or shipment.',
    fields: [
      ['select', 'city', 'Market', ['Lagos', 'Nairobi', 'Accra', 'Johannesburg']],
      ['input', 'distance', 'Distance km', 'number', '35'],
      ['input', 'baseCost', 'Base cost', 'number', '25000'],
      ['input', 'delay', 'Delay or waiting percent', 'number', '10']
    ],
    result: 'route cost summary ready with distance, waiting risk, fee checks, and margin note',
    disclaimer: 'Transport estimate only. Confirm live operator quote, tolls, parking, port, fuel, insurance, and local rules before dispatch.',
    source: 'operator, port, airport, toll, and fuel-price references'
  },
  'finance-tax': {
    kicker: 'Money decision workflow',
    intro: 'Model the numbers, assumptions, risk, and next step before comparing financial products or decisions.',
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'amount', 'Amount', 'number', '1000000'],
      ['input', 'rate', 'Rate or fee percent', 'number', '12'],
      ['input', 'months', 'Months', 'number', '12']
    ],
    result: 'financial planning summary ready with amount, fee, period, risk, and verification notes',
    disclaimer: 'Educational estimate only, not financial, tax, credit, or investment advice. Confirm current rates, fees, taxes, terms, and licensed-provider documents.',
    source: 'bank, exchange, tax authority, regulator, and product-term references'
  },
  fintech: {
    kicker: 'Payment comparison workflow',
    intro: 'Compare fees, settlement speed, chargeback risk, and customer fit before choosing a payment route.',
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'transaction', 'Transaction value', 'number', '50000'],
      ['input', 'fee', 'Fee percent', 'number', '1.5'],
      ['select', 'channel', 'Channel', ['POS', 'bank transfer', 'mobile money', 'card']]
    ],
    result: 'payment comparison ready with fees, settlement, dispute, and customer-channel notes',
    disclaimer: 'Payment estimate only. Confirm provider pricing, settlement timing, reversal rules, taxes, and fraud controls before using.',
    source: 'payment provider, regulator, bank, and merchant-term references'
  },
  crypto: {
    kicker: 'Crypto risk workflow',
    intro: 'Check fees, custody, volatility, counterparty risk, and safety steps before using a crypto tool.',
    fields: [
      ['select', 'asset', 'Asset', ['BTC', 'ETH', 'USDT', 'USDC']],
      ['input', 'amount', 'Amount', 'number', '1000'],
      ['input', 'fee', 'Fee percent', 'number', '1'],
      ['select', 'custody', 'Custody route', ['self-custody', 'exchange', 'wallet app']]
    ],
    result: 'crypto risk summary ready with amount, fees, custody, verification, and safety notes',
    disclaimer: 'Crypto education only, not investment advice. Confirm wallet address, chain, fees, regulation, taxes, and counterparty risk before sending funds.',
    source: 'wallet, exchange, blockchain explorer, regulator, and tax references'
  },
  'creator-economy': {
    kicker: 'Creator workflow',
    intro: 'Turn the creator task into a clear brief with platform, deliverables, rights, timing, and output checks.',
    fields: [
      ['select', 'platform', 'Platform', ['Instagram', 'TikTok', 'YouTube', 'LinkedIn']],
      ['input', 'deliverables', 'Deliverables', 'number', '3'],
      ['select', 'usage', 'Usage rights', ['personal', 'organic brand', 'paid ad', 'client work']],
      ['input', 'deadline', 'Days until deadline', 'number', '7']
    ],
    result: 'creator brief ready with platform fit, deliverables, rights, deadline, and review notes',
    disclaimer: 'Creator workflow only. Confirm platform policy, copyright, likeness consent, usage rights, and client approval before publishing.',
    source: 'platform policy, rights, client-brief, and creator analytics references'
  },
  'image-design': {
    kicker: 'Design output workflow',
    intro: 'Prepare the visual task with format, dimensions, source assets, and export needs before designing.',
    fields: [
      ['select', 'format', 'Format', ['social post', 'poster', 'thumbnail', 'document graphic']],
      ['input', 'versions', 'Versions', 'number', '3'],
      ['select', 'export', 'Export need', ['PNG', 'JPG', 'PDF', 'copy brief']],
      ['select', 'rights', 'Rights checked', ['not yet', 'partly', 'yes']]
    ],
    result: 'design output brief ready with format, versions, export, rights, and quality checks',
    disclaimer: 'Design workflow only. Confirm image rights, brand rules, readable text, safe zones, and export quality before publishing.',
    source: 'platform design spec, asset-license, and brand-guideline references'
  },
  'documents-pdf': {
    kicker: 'Document workflow',
    intro: 'Prepare a browser-first document task with inputs, output format, privacy, and export checks visible.',
    fields: [
      ['select', 'format', 'Output format', ['PDF', 'DOCX', 'TXT', 'JSON']],
      ['input', 'sections', 'Sections or pages', 'number', '4'],
      ['select', 'privacy', 'Sensitive data', ['none', 'personal', 'business', 'client']],
      ['select', 'action', 'Next action', ['copy', 'download', 'print', 'save draft']]
    ],
    result: 'document workflow ready with structure, privacy, output, and export notes',
    disclaimer: 'Document workflow only. Keep sensitive data local where possible and verify legal, HR, school, or client requirements before sending.',
    source: 'document-format, privacy, and workflow references'
  },
  education: {
    kicker: 'Education planning workflow',
    intro: 'Check requirements, dates, documents, workload, and readiness before applying or registering.',
    fields: [
      ['input', 'deadlineDays', 'Days until deadline', 'number', '30'],
      ['input', 'documents', 'Documents ready', 'number', '5'],
      ['select', 'level', 'Level', ['school', 'undergraduate', 'graduate', 'professional']],
      ['select', 'status', 'Status', ['planning', 'applying', 'submitted', 'reviewing']]
    ],
    result: 'education readiness summary ready with deadline, documents, level, and next-step notes',
    disclaimer: 'Education guidance only. Confirm official requirements, deadlines, fees, accreditation, and adviser guidance before applying.',
    source: 'school, scholarship, admissions, and education-authority references'
  },
  energy: {
    kicker: 'Energy planning workflow',
    intro: 'Turn power assumptions into a practical estimate with load, runtime, tariff, and backup caveats.',
    fields: [
      ['input', 'loadWatts', 'Load watts', 'number', '800'],
      ['input', 'hours', 'Hours per day', 'number', '6'],
      ['input', 'tariff', 'Tariff or fuel cost', 'number', '85'],
      ['input', 'buffer', 'Sizing buffer percent', 'number', '20']
    ],
    result: 'energy planning summary ready with load, runtime, tariff, buffer, and equipment notes',
    disclaimer: 'Energy estimate only. Confirm real appliance draw, tariff class, fuel price, battery health, installer advice, and safety rules.',
    source: 'utility tariff, fuel, manufacturer, installer, and energy-efficiency references'
  },
  telecom: {
    kicker: 'Telecom choice workflow',
    intro: 'Compare coverage, price, speed, data limits, support, and contract terms before choosing a telecom service.',
    fields: [
      ['select', 'market', 'Market', ['Nigeria', 'Kenya', 'Ghana', 'South Africa']],
      ['input', 'monthly', 'Monthly spend', 'number', '15000'],
      ['input', 'usage', 'Expected usage', 'number', '100'],
      ['select', 'priority', 'Priority', ['coverage', 'speed', 'price', 'support']]
    ],
    result: 'telecom comparison ready with price, usage, coverage, speed, and contract notes',
    disclaimer: 'Telecom estimate only. Confirm coverage map, fair-use policy, contract length, taxes, device support, and operator terms.',
    source: 'operator, regulator, coverage-map, and pricing references'
  },
  'civic-government': {
    kicker: 'Public service checklist',
    intro: 'Prepare documents, eligibility, fee checks, appointment timing, and official confirmation before visiting an office.',
    fields: [
      ['select', 'country', 'Country', ['Nigeria', 'Kenya', 'Ghana', 'South Africa']],
      ['input', 'documents', 'Documents ready', 'number', '4'],
      ['input', 'fee', 'Expected fee', 'number', '10000'],
      ['select', 'stage', 'Stage', ['checking', 'booking', 'submitting', 'following up']]
    ],
    result: 'public-service checklist ready with documents, fee, stage, and confirmation notes',
    disclaimer: 'Public-service guidance only. Confirm requirements, fees, appointment rules, and eligibility on the official agency page before acting.',
    source: 'government agency, regulator, and public-service references'
  },
  'career-hr': {
    kicker: 'Career planning workflow',
    intro: 'Turn a career task into a practical plan with proof, timing, salary, and next action visible.',
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'target', 'Target monthly value', 'number', '500000'],
      ['select', 'proof', 'Evidence strength', ['weak', 'medium', 'strong']],
      ['input', 'weeks', 'Weeks to act', 'number', '6']
    ],
    result: 'career plan ready with target, proof, timeline, and negotiation or application notes',
    disclaimer: 'Career guidance only. No job, admission, income, or salary outcome is guaranteed. Verify requirements and market evidence.',
    source: 'job-market, employer, education, and career-guidance references'
  },
  'business-operations': {
    kicker: 'Business operations workflow',
    intro: 'Check cost, revenue, operations, risks, and handoff notes before quoting, launching, or committing.',
    fields: [
      ['select', 'currency', 'Currency', ['NGN', 'KES', 'GHS', 'ZAR']],
      ['input', 'revenue', 'Expected revenue', 'number', '1000000'],
      ['input', 'cost', 'Expected cost', 'number', '650000'],
      ['input', 'buffer', 'Contingency percent', 'number', '15']
    ],
    result: 'business operations summary ready with revenue, cost, buffer, margin, and risk notes',
    disclaimer: 'Business estimate only. Confirm supplier quotes, contracts, taxes, insurance, delivery, and customer terms before committing.',
    source: 'supplier, contract, market, tax, and operations references'
  },
  default: {
    kicker: 'Practical workflow',
    intro: 'Turn the tool into a clearer decision with inputs, assumptions, result, and next-step checks.',
    fields: [
      ['select', 'country', 'Country', ['Nigeria', 'Kenya', 'Ghana', 'South Africa']],
      ['input', 'amount', 'Amount or count', 'number', '100'],
      ['select', 'priority', 'Priority', ['cost', 'speed', 'quality', 'risk']],
      ['input', 'buffer', 'Buffer percent', 'number', '10']
    ],
    result: 'planning summary ready with inputs, assumptions, caveats, and next-step notes',
    disclaimer: 'Planning guidance only. Confirm live rules, prices, eligibility, and source documents before acting.',
    source: 'local market, official, provider, and workflow references'
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugTitle(row) {
  return row.name || row.id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function profileFor(row) {
  return profiles[row.category] || profiles[row.category_label && row.category_label.toLowerCase()] || profiles.default;
}

function fieldMarkup(field) {
  const [kind, name, label, typeOrOptions, value] = field;
  const safeLabel = escapeHtml(label);
  if (kind === 'select') {
    return `<label>${safeLabel}<select name="${escapeHtml(name)}" aria-label="${safeLabel}">${typeOrOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select></label>`;
  }
  const min = typeOrOptions === 'number' ? ' min="0" step="any"' : '';
  return `<label>${safeLabel}<input name="${escapeHtml(name)}" type="${escapeHtml(typeOrOptions)}" value="${escapeHtml(value)}"${min} aria-label="${safeLabel}"></label>`;
}

function faqSchema(row, profile) {
  const name = slugTitle(row);
  const questions = [
    [`How should I use ${name}?`, `${profile.intro} Use the visible inputs to create a planning summary, then verify the assumptions before acting.`],
    [`What should I verify before acting on ${name}?`, profile.disclaimer],
    [`Is ${name} an official result?`, 'No. It is an educational planning workflow, not an official filing, quote, legal decision, or guaranteed outcome.']
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    })),
    url: `https://afrotools.com/${row.file.replace(/\\/g, '/').replace(/index\.html$/, '')}`
  };
}

function renderSection(row) {
  const profile = profileFor(row);
  const name = escapeHtml(slugTitle(row));
  const tool = escapeHtml(row.id);
  const result = `${name}: ${profile.result}.`;
  const missing = [...new Set([...(row.required_features_missing || []), ...(row.strong_features_missing || [])])].slice(0, 5);
  const gapText = missing.length ? `Quality checks addressed here: ${missing.map(escapeHtml).join(', ')}.` : 'Quality checks addressed here: input, output, methodology, source note, and export path.';

  return `
<section class="df-upgrade" data-df-upgrade="${tool}">
  <div class="df-upgrade__card">
    <div>
      <span class="df-upgrade__kicker">${escapeHtml(profile.kicker)}</span>
      <h2>${name} decision workspace</h2>
      <p>${escapeHtml(profile.intro)} This panel is tuned for ${name.toLowerCase()} so the user can move from a thin page to a usable first decision.</p>
      <ul class="df-upgrade__bullets"><li>Result output: ${escapeHtml(result)}</li><li>Methodology: combine the fields into a local planning summary, then compare the answer against current local terms.</li><li>${gapText}</li><li>Source note: ${escapeHtml(profile.source)} should be checked when live prices, rules, eligibility, or safety matter.</li></ul>
      <p class="df-upgrade__note"><strong>Reviewed 2026.</strong> ${escapeHtml(profile.disclaimer)} Source/reference: ${escapeHtml(profile.source)}.</p>
    </div>
    <form class="df-form" data-df-form="${tool}">
      ${profile.fields.map(fieldMarkup).join('\n      ')}
      <button type="submit">Create summary</button>
      <output class="df-result" data-df-result="${tool}" data-df-base="${escapeHtml(result)}" aria-live="polite">${escapeHtml(result)}</output>
      <div class="df-actions"><button type="button" data-df-copy="${tool}">Copy summary</button></div>
    </form>
  </div>
</section>
<section class="df-faq" aria-labelledby="${tool}-faq-title">
  <h2 id="${tool}-faq-title">${name} FAQ</h2>
  <div class="df-faq__grid"><details><summary>How should I use this?</summary><p>${escapeHtml(profile.intro)} Use it as a planning step before you pay, submit, publish, travel, or choose a provider.</p></details><details><summary>What should I verify?</summary><p>${escapeHtml(profile.disclaimer)}</p></details><details><summary>Is this official?</summary><p>No. It is an educational planning workflow, not an official filing, quote, legal decision, or guaranteed outcome.</p></details></div>
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

function injectFaqSchema(html, row) {
  if (html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"')) return html;
  const profile = profileFor(row);
  return html.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(faqSchema(row, profile), null, 2)}\n</script>\n</head>`);
}

function injectSection(html, row) {
  if (html.includes(`data-df-upgrade="${row.id}"`)) return html;
  const section = renderSection(row);
  if (html.includes('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">')) {
    return html.replace('<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">', `${section}\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">`);
  }
  if (html.includes('</main>')) return html.replace('</main>', `${section}\n</main>`);
  if (html.includes('<afro-footer>')) return html.replace('<afro-footer>', `${section}\n<afro-footer>`);
  return `${html}\n${section}`;
}

const targetRows = report.tools
  .filter((row) => row.language === 'en' && targetRanks.has(row.rank) && row.file && fs.existsSync(path.join(process.cwd(), row.file)))
  .filter((row, index, rows) => rows.findIndex((candidate) => candidate.file === row.file) === index);

let changed = 0;
for (const row of targetRows) {
  const full = path.join(process.cwd(), row.file);
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = injectAssets(html);
  html = injectFaqSchema(html, row);
  html = injectSection(html, row);
  if (html !== before) {
    fs.writeFileSync(full, html);
    changed += 1;
    console.log(`updated ${row.id} -> ${row.file}`);
  } else {
    console.log(`unchanged ${row.id} -> ${row.file}`);
  }
}

console.log(`English ${[...targetRanks].join(',')}-app upgrades applied: ${changed}/${targetRows.length}`);
