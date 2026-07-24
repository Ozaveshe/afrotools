const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(ROOT, 'test-results', 'fx-ui');
const REPORT_PATH = path.join(OUT_DIR, 'report.json');
const PNG_1X1_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF7kAAAAASUVORK5CYII=',
  'base64'
);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function shouldIgnoreConsole(message) {
  return (
    message.includes('googletagmanager.com') ||
    message.includes('fonts.googleapis.com') ||
    message.includes('fonts.gstatic.com')
  );
}

async function startStaticServer() {
  const logPath = path.join(OUT_DIR, 'server.log');
  const errPath = path.join(OUT_DIR, 'server.err.log');
  const outLog = fs.openSync(logPath, 'w');
  const errLog = fs.openSync(errPath, 'w');
  const child = spawn(process.execPath, ['_serve.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', outLog, errLog]
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Static server did not start in time.')), 10000);
    const poll = () => {
      const req = http.get(`${BASE_URL}/`, (res) => {
        res.resume();
        clearTimeout(timeout);
        resolve();
      });
      req.on('error', () => setTimeout(poll, 200));
    };
    poll();
  });

  return child;
}

async function createContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    ignoreHTTPSErrors: true
  });

  const fuelJson = fs.readFileSync(path.join(ROOT, 'data', 'fuel', 'latest.json'), 'utf8');

  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();

    if (url === `${BASE_URL}/api/auth/session`) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/api-data-freshness`)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    }
    if (url === `${BASE_URL}/.netlify/functions/api-fuel`) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: fuelJson });
    }
    if (url.startsWith(`${BASE_URL}/assets/img/tools/`)) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1_BUFFER });
    }
    return route.continue();
  });

  return context;
}

async function collectSummary(page) {
  return page.evaluate(() => {
    return (document.body && document.body.innerText ? document.body.innerText : '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
  });
}

async function runCase(context, config) {
  const page = await context.newPage();
  const consoleErrors = [];
  const requestErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !shouldIgnoreConsole(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      if (url.startsWith(BASE_URL) && !url.includes('/assets/img/tools/')) {
        requestErrors.push(`${res.status()} ${url}`);
      }
    }
  });

  try {
    await page.goto(`${BASE_URL}${config.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    await config.run(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, `${config.slug}.png`), fullPage: true });
    return {
      slug: config.slug,
      status: 'ok',
      summary: config.summary ? await config.summary(page) : await collectSummary(page),
      errors: consoleErrors.map((message) => ({ type: 'console', message })),
      requests: requestErrors
    };
  } catch (error) {
    try {
      await page.screenshot({ path: path.join(OUT_DIR, `${config.slug}-failed.png`), fullPage: true });
    } catch (e) {
      // ignore screenshot failures after page errors
    }
    return {
      slug: config.slug,
      status: 'failed',
      summary: error.message,
      errors: consoleErrors.map((message) => ({ type: 'console', message })).concat([{ type: 'exception', message: error.message }]),
      requests: requestErrors
    };
  } finally {
    await page.close();
  }
}

async function main() {
  ensureDir(OUT_DIR);
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await createContext(browser);

  const tests = [
    {
      slug: 'fx-hub',
      path: '/salary-tax/fx/',
      run: async (page) => {
        await page.waitForFunction(() => {
          const grid = document.getElementById('tool-grid');
          return grid && /Currency Converter|AfroRates|Forex Profit/.test(grid.innerText || '');
        });
      }
    },
    {
      slug: 'interest-rate-ref',
      path: '/tools/interest-rate-ref/',
      run: async (page) => {
        await page.waitForSelector('#rateTableBody tr');
        await page.waitForFunction(() => {
          const el = document.getElementById('dataFreshness');
          return el && !/Loading/.test(el.textContent || '');
        });
      }
    },
    {
      slug: 'currency-converter',
      path: '/tools/currency-converter/',
      run: async (page) => {
        await page.waitForFunction(() => {
          const from = document.getElementById('fxFrom');
          const to = document.getElementById('fxTo');
          const status = document.getElementById('fxStatus');
          return from && to && status && from.options.length > 5 && to.options.length > 5 && !/Checking/.test(status.textContent || '');
        });
        await page.getByLabel('My provider rate').check();
        await page.fill('#fxAmount', '100');
        await page.selectOption('#fxFrom', 'USD');
        await page.selectOption('#fxTo', 'NGN');
        await page.fill('#fxManualRate', '1');
        await page.click('#fxConvert');
        await page.waitForFunction(() => {
          const el = document.getElementById('fxResultValue');
          return el && el.textContent && /NGN/.test(el.textContent);
        });
      }
    },
    {
      slug: 'fuel-tracker',
      path: '/tools/fuel-tracker/',
      run: async (page) => {
        await page.waitForSelector('#price-table-body tr');
        await page.click('.fuel-tab[data-fuel="lpg"]');
        await page.waitForFunction(() => {
          const el = document.getElementById('avg-price-label');
          return el && /USD\/kg/.test(el.textContent || '');
        });
        await page.selectOption('#calc-country', 'NG');
        await page.waitForFunction(() => {
          const el = document.getElementById('result-monthly');
          return el && el.textContent && el.textContent !== '--';
        });
      }
    },
    {
      slug: 'afrorates',
      path: '/tools/afrorates/',
      run: async (page) => {
        await page.waitForSelector('#rate-table-body tr');
        await page.waitForFunction(() => {
          const el = document.getElementById('last-updated');
          return el && /Last snapshot:/.test(el.textContent || '');
        });
      }
    },
    {
      slug: 'bank-charges',
      path: '/tools/bank-charges/',
      run: async (page) => {
        await page.selectOption('#selCountry', 'ke');
        await page.click('button[data-filter="mobile-money"]');
        await page.selectOption('#selCountry', 'za');
        await page.click('button:has-text("Compare Banks")');
        await page.waitForSelector('#rankCard.show');
        await page.waitForFunction(() => {
          const list = document.getElementById('rankList');
          return list && /No banks of this type/.test(list.innerText || '') === false;
        });
      }
    },
    {
      slug: 'forex-profit',
      path: '/tools/forex-profit/',
      run: async (page) => {
        await page.selectOption('#pair', 'USD/NGN');
        await page.fill('#entry', '1500');
        await page.fill('#exit', '1560');
        await page.fill('#lots', '1');
        await page.selectOption('#acctCur', 'NGN');
        await page.click('button:has-text("Calculate Profit/Loss")');
        await page.waitForSelector('#results', { state: 'visible' });
        await page.waitForFunction(() => {
          const el = document.getElementById('rReturn');
          return el && /\+/.test(el.textContent || '');
        });
      }
    }
  ];

  const results = [];
  try {
    for (const test of tests) {
      results.push(await runCase(context, test));
    }
  } finally {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
    await context.close();
    await browser.close();
    server.kill();
  }

  const failed = results.filter((item) => item.status !== 'ok');
  if (failed.length) {
    console.error(`FX UI smoke failed for ${failed.length} page(s). See ${REPORT_PATH}`);
    process.exitCode = 1;
    return;
  }
  console.log(`FX UI smoke passed. Report saved to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
