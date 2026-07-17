const fs = require('fs');
const path = require('path');

const fixes = {
  'tools/first-home-buyer/index.html': {
    tool: 'First Home Buyer Calculator',
    note: 'Mortgage eligibility, deposit rules, grants, property taxes, bank rates, and legal costs change by country and lender. Use this as a planning estimate, then verify with the bank, conveyancer, housing agency, or official programme page.',
    links: [
      ['/tools/mortgage-affordability/', 'Mortgage affordability'],
      ['/tools/home-loan-eligibility/', 'Home loan eligibility'],
      ['/tools/rent-vs-buy/', 'Rent vs buy']
    ],
    business: true
  },
  'tools/cover-letter-generator/index.html': {
    tool: 'Cover Letter Generator',
    note: 'Keep CV, phone, email, recruiter notes, and job descriptions local unless you explicitly opt in to a network or AI action. Review every generated paragraph for truth, tone, and employer-specific evidence before sending.',
    links: [
      ['/tools/cv-builder/', 'CV Builder'],
      ['/tools/job-offer-evaluator/', 'Job offer evaluator'],
      ['/tools/linkedin-optimizer/', 'LinkedIn optimizer']
    ]
  },
  'tools/diff-checker/index.html': {
    tool: 'Diff Checker',
    note: 'Do not paste private keys, passwords, customer records, or unreleased source code into a browser you do not control. Use the comparison as a review aid, then confirm important code, contract, or policy changes in the source system.',
    links: [
      ['/tools/json-formatter/', 'JSON formatter'],
      ['/tools/regex-tester/', 'Regex tester'],
      ['/tools/markdown-editor/', 'Markdown editor']
    ]
  },
  'tools/freelance-invoice/index.html': {
    tool: 'Freelance Invoice Generator',
    note: 'Invoice numbering, withholding tax, VAT, bank details, payment links, and client terms should match your contract and local tax rules. Export a copy for your records before sending.',
    links: [
      ['/tools/invoice-generator/', 'Invoice generator'],
      ['/tools/marketplace-fees/', 'Marketplace fees'],
      ['/tools/freelancer-rate/', 'Freelancer rate']
    ],
    business: true
  },
  'tools/pdf-to-audio/index.html': {
    tool: 'PDF to Audio Reader',
    note: 'Uploaded PDFs may include personal, school, legal, or business content. Prefer browser-local reading, check voice availability on the device, and verify any extracted text before relying on it for study or accessibility support.',
    links: [
      ['/tools/pdf-workspace/', 'PDF workspace'],
      ['/tools/pdf-ocr/', 'PDF OCR'],
      ['/document-pdf/', 'Document tools']
    ]
  },
  'telecom/internet-compare/index.html': {
    tool: 'Internet Speed vs Cost Comparator',
    note: 'Coverage, fair-use policy, router fees, installation charges, outages, and peak-hour speeds can change by location. Confirm the operator package, contract length, and regulator/service terms before paying.',
    links: [
      ['/telecom/data-plan-compare/', 'Data plan compare'],
      ['/telecom/fiber-lte-5g/', 'Fiber, LTE, or 5G'],
      ['/telecom/starlink-compare/', 'Starlink compare']
    ],
    business: true
  },
  'telecom/tv-compare/index.html': {
    tool: 'TV Package Comparator',
    note: 'Channel rights, sports coverage, decoder fees, streaming bundles, and promotional pricing change often. Confirm the current provider package and cancellation terms before renewal.',
    links: [
      ['/telecom/internet-compare/', 'Internet compare'],
      ['/telecom/data-usage-calc/', 'Data usage calculator'],
      ['/tools/budget-planner/', 'Budget planner']
    ],
    business: true
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function panel(config) {
  return `
<section class="df-faq quality-verification-panel" data-quality-proof="${escapeHtml(config.tool)}" aria-label="${escapeHtml(config.tool)} verification and limitations">
  <h2>${escapeHtml(config.tool)} verification and limitations</h2>
  <div class="df-faq__grid">
    <details open><summary>Official/source check</summary><p>${escapeHtml(config.note)}</p></details>
    <details><summary>Export or save path</summary><p>Use the page output, copy, print, download, or saved draft controls where available, and keep a separate record before acting on a money, travel, career, telecom, or document decision.</p></details>
    <details><summary>Related next steps</summary><p>${config.links.map(([href, label]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' &middot; ')}</p></details>
  </div>
</section>`;
}

function addBusinessCta(html, config) {
  if (!config.business || html.includes('<afro-business-cta')) return html;
  if (!html.includes('/assets/js/components/business-cta.js')) {
    html = html.replace('</body>', '<script src="/assets/js/components/business-cta.js" defer></script>\n</body>');
  }
  const cta = `\n<afro-business-cta tool-name="${escapeHtml(config.tool)}" save-note="Save or export the scenario, then request a branded calculator or widget if your team needs this workflow for customers."></afro-business-cta>`;
  if (html.includes('</main>')) return html.replace('</main>', `${cta}\n</main>`);
  return html.replace('<afro-footer>', `${cta}\n<afro-footer>`);
}

let changed = 0;
for (const [file, config] of Object.entries(fixes)) {
  const full = path.join(process.cwd(), file);
  let html = fs.readFileSync(full, 'utf8');
  const before = html;

  if (file.endsWith('first-home-buyer/index.html')) {
    html = html.replace('<h1 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin:0 0 4px;">First Home Buyer Plan</h1>', '<h2 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin:0 0 4px;">First Home Buyer Plan</h2>');
  }

  if (!html.includes(`data-quality-proof="${config.tool}"`)) {
    const proofPanel = panel(config);
    if (html.includes('</main>')) html = html.replace('</main>', `${proofPanel}\n</main>`);
    else html = html.replace('<afro-footer>', `${proofPanel}\n<afro-footer>`);
  }

  html = addBusinessCta(html, config);

  if (html !== before) {
    fs.writeFileSync(full, html);
    changed += 1;
    console.log(`fixed ${file}`);
  } else {
    console.log(`unchanged ${file}`);
  }
}

console.log(`English B leftovers fixed: ${changed}/${Object.keys(fixes).length}`);
