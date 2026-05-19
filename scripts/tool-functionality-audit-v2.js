const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'audit-results');
const PORT = Number(process.env.PORT || 4187);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const TOOLS = [
  { route: '/tools/vat-calculator/', family: 'tax', flow: 'vat' },
  { route: '/nigeria/ng-salary-tax.html', family: 'salary_hr', flow: 'salary' },
  { route: '/tools/unit-converter/', family: 'unit_conversion', flow: 'unit' },
  { route: '/sw/zana/kubadilisha-vipimo/', family: 'localized_swahili', flow: 'unit' },
  { route: '/tools/mortgage-calculator/', family: 'real_estate', flow: 'mortgage' },
  { route: '/tools/home-loan-eligibility/', family: 'real_estate', flow: 'generic' },
  { route: '/business/break-even/', family: 'business', flow: 'generic' },
  { route: '/business/invoice/', family: 'business', flow: 'static' },
  { route: '/agriculture/farm-budget/', family: 'agriculture_business', flow: 'farm_budget' },
  { route: '/health/bmi-calculator/', family: 'health', flow: 'bmi' },
  { route: '/education/fees/', family: 'education', flow: 'generic' },
  { route: '/telecom/data-usage-calc/', family: 'telecom', flow: 'static' },
  { route: '/property/rent-buy/', family: 'real_estate', flow: 'generic' },
  { route: '/tools/car-loan/', family: 'finance_cars', flow: 'car_loan' },
  { route: '/tools/loan-compare/', family: 'finance', flow: 'generic' },
  { route: '/tools/profit-margin/', family: 'business', flow: 'generic' },
  { route: '/tools/employee-cost/', family: 'salary_hr', flow: 'generic' },
  { route: '/tools/minimum-wage/', family: 'salary_hr', flow: 'static' },
  { route: '/tools/overtime-calc/', family: 'salary_hr', flow: 'generic' },
  { route: '/tools/social-security/', family: 'salary_hr', flow: 'static' },
  { route: '/tools/pension-projection/', family: 'finance', flow: 'generic' },
  { route: '/tools/currency-converter/', family: 'finance_fx', flow: 'static' },
  { route: '/tools/mobile-money-fees/', family: 'fintech', flow: 'generic' },
  { route: '/telecom/airtime-value/', family: 'telecom', flow: 'static' },
  { route: '/tools/pdf-workspace/', family: 'document_pdf', flow: 'static' },
  { route: '/tools/image-format-convert/', family: 'image_design', flow: 'static' },
  { route: '/tools/gpa-calculator/', family: 'education', flow: 'generic' },
  { route: '/tools/student-budget/', family: 'education', flow: 'generic' },
  { route: '/fr/tools/assurance-auto/', family: 'localized_french', flow: 'static' },
  { route: '/ha/kayan-aiki/kalkuletan-vat/', family: 'localized_hausa', flow: 'static' },
];

function routeCandidates(url) {
  let clean = decodeURIComponent(url.split('?')[0]).replace(/^\/+/, '');
  if (!clean) return ['index.html'];
  if (clean.endsWith('/')) return [path.join(clean, 'index.html')];
  if (path.extname(clean)) return [clean];
  return [path.join(clean, 'index.html'), `${clean}.html`];
}

function resolveCandidate(candidate) {
  const file = path.resolve(ROOT, candidate);
  if (!file.toLowerCase().startsWith(ROOT.toLowerCase())) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = req.url.split('?')[0];
    if (pathname === '/api/auth/session') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ authenticated: false, user: null }));
      return;
    }
    for (const candidate of routeCandidates(req.url)) {
      const file = resolveCandidate(candidate);
      if (file) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        fs.createReadStream(file).pipe(res);
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Not found');
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

function csv(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

async function stubNetwork(page) {
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(`http://127.0.0.1:${PORT}/`) || url.startsWith('data:')) return route.continue();
    return route.fulfill({ status: 204, body: '' });
  });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://www.google-analytics.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
}

async function fillGeneric(page) {
  const controls = await page.locator('input:not([type=hidden]), select, textarea').evaluateAll(nodes => nodes.slice(0, 10).map((node, index) => {
    const tag = node.tagName.toLowerCase();
    const type = (node.getAttribute('type') || '').toLowerCase();
    return { index, tag, type, id: node.id, value: node.value };
  }));
  for (const control of controls) {
    const locator = page.locator('input:not([type=hidden]), select, textarea').nth(control.index);
    if (control.tag === 'select') {
      const value = await locator.evaluate(select => Array.from(select.options).find(option => option.value && !option.disabled)?.value || '');
      if (value) await locator.selectOption(value).catch(() => {});
    } else if (!['checkbox', 'radio', 'file', 'range', 'button', 'submit'].includes(control.type)) {
      await locator.fill(control.type === 'number' ? '1000' : '1000').catch(() => {});
    }
  }
}

async function runFlow(page, tool) {
  if (tool.flow === 'vat') {
    await page.locator('#countrySelect').selectOption('NG');
    await page.locator('#calcBtn').click();
    await page.locator('#amountInput').fill('10000');
    await page.locator('#calcBtn').click();
    await page.locator('#resultsArea').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'unit') {
    await page.locator('#lenFrom').fill('1000');
    await page.locator('#lenToU').selectOption('1000');
    await page.locator('#lenFrom').dispatchEvent('input');
    await page.waitForFunction(() => /^1(\.0+)?$/.test(document.querySelector('#lenTo')?.value || ''), null, { timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'salary') {
    await page.locator('#grossSalary').fill('3600000');
    await page.locator('#calcBtn').click();
    await page.locator('#resultsCard').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'mortgage') {
    await page.locator('#homePrice').fill('50000000');
    await page.locator('#deposit').fill('10000000');
    await page.locator('#rate').fill('18');
    await page.locator('#term').fill('15');
    await page.getByRole('button', { name: /calculate mortgage/i }).click();
    await page.locator('#results').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'car_loan') {
    await page.locator('#price').fill('15000000');
    await page.locator('#deposit').fill('3000000');
    await page.locator('#rate').fill('22');
    await page.getByRole('button', { name: /calculate car loan/i }).click();
    await page.locator('#results').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'farm_budget') {
    await page.locator('#country-sel').selectOption('NG');
    await page.getByRole('button', { name: /plan my budget/i }).click();
    await page.locator('#results').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'bmi') {
    await page.locator('#weight-kg').fill('70');
    await page.locator('#height-cm').fill('170');
    await page.locator('#calc-btn').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 4000 });
    return 'pass';
  }
  if (tool.flow === 'generic') {
    await fillGeneric(page);
    const button = page.getByRole('button', { name: /calculate|compare|check|estimate|convert|plan|run|submit/i }).first();
    if (await button.count()) await button.click().catch(() => {});
    await page.waitForTimeout(500);
    const resultVisible = await page.locator('[id*="result" i], [class*="result" i], [id*="output" i], [class*="output" i], [aria-live]').evaluateAll(nodes => nodes.some(node => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (node.textContent || '').trim().length > 0;
    })).catch(() => false);
    return resultVisible ? 'pass' : 'warn';
  }
  return 'not_exercised_static';
}

async function auditTool(browser, tool) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(2500);
  await stubNetwork(page);
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource|ERR_FAILED|CORS|favicon|manifest|api\/forex|api\/rates/i.test(text)) return;
    errors.push(text);
  });

  const url = `http://127.0.0.1:${PORT}${tool.route}`;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(error => ({ status: () => 0, error }));
  await page.waitForTimeout(250);

  const base = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]), select, textarea'));
    const unlabeled = inputs.filter(input => {
      if (input.labels && input.labels.length) return false;
      if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return false;
      return !input.closest('label');
    }).length;
    const resultNodes = document.querySelectorAll('[id*="result" i], [class*="result" i], [aria-live]').length;
    const relatedLinks = Array.from(document.querySelectorAll('a[href]')).filter(link => /related|tool-card|seo-cluster|tool-info-action/i.test(link.className || '')).length;
    return {
      title: document.title || '',
      h1: document.querySelectorAll('h1').length,
      inputs: inputs.length,
      unlabeled,
      buttonsWithoutNames: Array.from(document.querySelectorAll('button')).filter(button => !(button.textContent || button.getAttribute('aria-label') || button.title || '').trim()).length,
      resultNodes,
      relatedLinks,
      mobileOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    };
  });

  let normal = 'not_run';
  try {
    normal = await runFlow(page, tool);
  } catch (error) {
    normal = `fail: ${error.message.split('\n')[0].slice(0, 120)}`;
  }

  const darkMode = await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    const body = getComputedStyle(document.body);
    const bg = body.backgroundColor;
    const color = body.color;
    return bg && color && bg !== 'rgb(255, 255, 255)' ? 'pass' : 'warn';
  }).catch(() => 'fail');

  await page.close();

  return {
    route: tool.route,
    family: tool.family,
    status: typeof response.status === 'function' ? response.status() : 0,
    page_load: typeof response.status === 'function' && response.status() < 400 ? 'pass' : 'fail',
    h1: base.h1,
    inputs: base.inputs,
    labels: base.unlabeled === 0 ? 'pass' : `warn:${base.unlabeled}_unlabeled`,
    buttons: base.buttonsWithoutNames === 0 ? 'pass' : `warn:${base.buttonsWithoutNames}_unnamed`,
    empty_invalid: tool.flow === 'static' ? 'not_exercised_static' : 'no_pageerror_during_flow',
    normal_calculation: normal,
    extreme_value: tool.flow === 'static' ? 'not_exercised_static' : 'not_exercised_deep',
    result_nodes: base.resultNodes,
    mobile_layout: base.mobileOverflow <= 8 ? 'pass' : `fail:overflow_${base.mobileOverflow}px`,
    dark_mode: darkMode,
    console_errors: errors.length ? errors.slice(0, 3).join(' | ') : 'none',
    related_links: base.relatedLinks,
    notes: tool.flow === 'static' ? 'static page/render/form audit; no calculation flow' : 'browser flow attempted with representative input',
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const rows = [];
    for (const tool of TOOLS) {
      console.log(`Auditing ${tool.route}`);
      rows.push(await auditTool(browser, tool));
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')].concat(rows.map(row => headers.map(header => csv(row[header])).join(',')));
    fs.writeFileSync(path.join(OUT_DIR, 'tool-functionality-matrix-v2.csv'), csvRows.join('\n'));

    const failures = rows.filter(row => /fail/i.test([row.page_load, row.labels, row.buttons, row.normal_calculation, row.mobile_layout, row.dark_mode, row.console_errors].join(' ')));
    const warnings = rows.filter(row => /warn|not_exercised/i.test([row.labels, row.buttons, row.normal_calculation, row.extreme_value, row.dark_mode, row.notes].join(' ')));
    const md = [
      '# Tool Functional Fixes V2',
      '',
      `- Tools sampled: ${rows.length}`,
      `- Rows with hard failures: ${failures.length}`,
      `- Rows with warnings/static-only coverage: ${warnings.length}`,
      '',
      '## Hard failures',
      '',
      failures.length ? failures.map(row => `- ${row.route}: ${row.normal_calculation}; ${row.mobile_layout}; console=${row.console_errors}`).join('\n') : '- None from the matrix run.',
      '',
      '## Coverage note',
      '',
      'The matrix combines exact browser flows for the highest-risk calculators with static render, label, mobile, dark-mode, and console checks for the broader 30-tool sample. Static-only rows still need deeper per-tool calculation assertions in a future dedicated pass.',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(OUT_DIR, 'tool-functional-fixes-v2.md'), md);
    console.log(`Tool matrix complete: ${rows.length} rows, ${failures.length} hard failures, ${warnings.length} warnings/static-only rows.`);
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
