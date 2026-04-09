const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(ROOT, 'test-results', 'crypto-ui');
const REPORT_PATH = path.join(OUT_DIR, 'report.json');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json'
};

const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF7kAAAAASUVORK5CYII=';
const PNG_1X1_BUFFER = Buffer.from(PNG_1X1_BASE64, 'base64');

const NOW = Date.now();

const priceMap = {
  bitcoin: { usd: 65000, ngn: 104000000, kes: 8450000, zar: 1195000, ghs: 910000, egp: 3185000, tzs: 169000000, ugx: 250000000, xof: 39400000, etb: 3710000, rwf: 83500000, mad: 647000, dzd: 8700000 },
  ethereum: { usd: 3200, ngn: 5120000, kes: 416000, zar: 58800, ghs: 44800, egp: 156800, tzs: 8320000, ugx: 12320000, xof: 1936000, etb: 182400, rwf: 4128000, mad: 31840, dzd: 428800 },
  tether: { usd: 1, ngn: 1600, kes: 130, zar: 18.4, ghs: 14, egp: 49, tzs: 2600, ugx: 3850, xof: 605, etb: 57, rwf: 1290, mad: 9.95, dzd: 134 },
  'usd-coin': { usd: 1, ngn: 1600, kes: 130, zar: 18.4, ghs: 14, egp: 49, tzs: 2600, ugx: 3850, xof: 605, etb: 57, rwf: 1290, mad: 9.95, dzd: 134 },
  binancecoin: { usd: 580, ngn: 928000, kes: 75400, zar: 10672, ghs: 8120, egp: 28420, tzs: 1508000, ugx: 2233000, xof: 350900, etb: 33060, rwf: 748200, mad: 5771, dzd: 77720 },
  solana: { usd: 145, ngn: 232000, kes: 18850, zar: 2668, ghs: 2030, egp: 7105, tzs: 377000, ugx: 558250, xof: 87725, etb: 8265, rwf: 186950, mad: 1442.75, dzd: 19430 },
  ripple: { usd: 0.62, ngn: 992, kes: 80.6, zar: 11.41, ghs: 8.68, egp: 30.38, tzs: 1612, ugx: 2387, xof: 375.1, etb: 35.34, rwf: 799.8, mad: 6.169, dzd: 83.08 },
  cardano: { usd: 0.45, ngn: 720, kes: 58.5, zar: 8.28, ghs: 6.3, egp: 22.05, tzs: 1170, ugx: 1732.5, xof: 272.25, etb: 25.65, rwf: 580.5, mad: 4.4775, dzd: 60.3 },
  dogecoin: { usd: 0.18, ngn: 288, kes: 23.4, zar: 3.312, ghs: 2.52, egp: 8.82, tzs: 468, ugx: 693, xof: 108.9, etb: 10.26, rwf: 232.2, mad: 1.791, dzd: 24.12 },
  tron: { usd: 0.12, ngn: 192, kes: 15.6, zar: 2.208, ghs: 1.68, egp: 5.88, tzs: 312, ugx: 462, xof: 72.6, etb: 6.84, rwf: 154.8, mad: 1.194, dzd: 16.08 }
};

const coinMeta = {
  bitcoin: { symbol: 'btc', name: 'Bitcoin' },
  ethereum: { symbol: 'eth', name: 'Ethereum' },
  tether: { symbol: 'usdt', name: 'Tether' },
  'usd-coin': { symbol: 'usdc', name: 'USD Coin' },
  binancecoin: { symbol: 'bnb', name: 'BNB' },
  solana: { symbol: 'sol', name: 'Solana' },
  ripple: { symbol: 'xrp', name: 'XRP' },
  cardano: { symbol: 'ada', name: 'Cardano' },
  dogecoin: { symbol: 'doge', name: 'Dogecoin' },
  tron: { symbol: 'trx', name: 'TRON' }
};

const coinIds = Object.keys(coinMeta);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseUrl(url) {
  return new URL(url);
}

function buildSimplePrice(ids, currencies) {
  const out = {};
  ids.forEach((id) => {
    const ref = priceMap[id] || priceMap.tether;
    out[id] = {};
    currencies.forEach((currency) => {
      out[id][currency] = ref[currency] != null ? ref[currency] : ref.usd;
    });
    out[id].usd_24h_change = id === 'tether' || id === 'usd-coin' ? 0.02 : 2.4;
    out[id].usd_24h_vol = id === 'bitcoin' ? 35000000000 : 2500000000;
    out[id].usd_market_cap = id === 'bitcoin' ? 1200000000000 : 90000000000;
  });
  return out;
}

function buildMarketRow(id, currency, rank) {
  const meta = coinMeta[id] || { symbol: id.slice(0, 3), name: id };
  const ref = priceMap[id] || priceMap.tether;
  const current = ref[currency] != null ? ref[currency] : ref.usd;
  const change24 = id === 'tether' || id === 'usd-coin' ? 0.03 : (rank % 2 === 0 ? 3.8 : -1.6);
  return {
    id,
    symbol: meta.symbol,
    name: meta.name,
    image: `https://images.example.com/${id}.png`,
    current_price: current,
    market_cap: current * (1000000 - rank * 20000),
    market_cap_rank: rank,
    fully_diluted_valuation: current * (1200000 - rank * 18000),
    total_volume: current * (250000 - rank * 3000),
    high_24h: current * 1.05,
    low_24h: current * 0.95,
    price_change_24h: current * (change24 / 100),
    price_change_percentage_24h: change24,
    price_change_percentage_7d_in_currency: change24 * 1.7,
    market_cap_change_24h: current * 10000,
    market_cap_change_percentage_24h: change24 * 0.9,
    circulating_supply: 10000000 + rank * 1000,
    total_supply: 15000000 + rank * 1500,
    max_supply: 21000000,
    ath: current * 1.4,
    ath_change_percentage: -18.4,
    ath_date: '2025-12-01T00:00:00.000Z',
    atl: current * 0.2,
    atl_change_percentage: 420.5,
    atl_date: '2020-03-01T00:00:00.000Z',
    roi: null,
    last_updated: new Date(NOW - rank * 60000).toISOString(),
    sparkline_in_7d: {
      price: Array.from({ length: 7 }, (_, i) => Number((current * (0.94 + (i * 0.012))).toFixed(4)))
    }
  };
}

function buildHistory(id, currency, days) {
  const ref = priceMap[id] || priceMap.tether;
  const base = ref[currency] != null ? ref[currency] : ref.usd;
  const points = [];
  const count = Math.min(Math.max(Number(days) || 30, 7), 120);
  for (let i = count; i >= 0; i -= 1) {
    const ts = NOW - i * 24 * 60 * 60 * 1000;
    const price = base * (0.88 + ((count - i) / count) * 0.22);
    points.push([ts, Number(price.toFixed(6))]);
  }
  return { prices: points, market_caps: points.map(([ts, p]) => [ts, p * 1000000]), total_volumes: points.map(([ts, p]) => [ts, p * 10000]) };
}

function buildCoinDetail(id) {
  const meta = coinMeta[id] || { symbol: id.slice(0, 3), name: id };
  const usd = (priceMap[id] || priceMap.tether).usd;
  return {
    id,
    symbol: meta.symbol,
    name: meta.name,
    image: { large: `https://images.example.com/${id}.png`, thumb: `https://images.example.com/${id}-thumb.png` },
    market_cap_rank: coinIds.indexOf(id) + 1,
    hashing_algorithm: id === 'bitcoin' ? 'SHA-256' : null,
    market_data: {
      current_price: { usd, ngn: priceMap[id] && priceMap[id].ngn ? priceMap[id].ngn : usd },
      market_cap: { usd: usd * 1000000 },
      total_volume: { usd: usd * 25000 },
      circulating_supply: 10000000
    },
    description: { en: `${meta.name} is a sample CoinGecko stub payload for smoke testing.` },
    links: { homepage: [`https://example.com/${id}`] }
  };
}

function handleCoinGecko(url) {
  const parsed = parseUrl(url);
  const pathname = parsed.pathname;
  if (pathname.endsWith('/simple/price')) {
    const ids = (parsed.searchParams.get('ids') || '').split(',').filter(Boolean);
    const currencies = (parsed.searchParams.get('vs_currencies') || 'usd').split(',').filter(Boolean);
    return buildSimplePrice(ids, currencies);
  }
  if (pathname.endsWith('/coins/markets')) {
    const currency = parsed.searchParams.get('vs_currency') || 'usd';
    const ids = (parsed.searchParams.get('ids') || '').split(',').filter(Boolean);
    const pool = ids.length ? ids : coinIds;
    return pool.map((id, index) => buildMarketRow(id, currency, index + 1));
  }
  if (/\/coins\/[^/]+\/market_chart$/.test(pathname)) {
    const id = pathname.split('/').slice(-2)[0];
    const currency = parsed.searchParams.get('vs_currency') || 'usd';
    const days = parsed.searchParams.get('days') || '30';
    return buildHistory(id, currency, days);
  }
  if (/\/coins\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    return buildCoinDetail(id);
  }
  if (pathname.endsWith('/search/trending')) {
    return {
      coins: coinIds.slice(0, 7).map((id, index) => ({
        item: {
          id,
          coin_id: index + 1,
          name: coinMeta[id].name,
          symbol: coinMeta[id].symbol.toUpperCase(),
          market_cap_rank: index + 1,
          thumb: `https://images.example.com/${id}-thumb.png`,
          small: `https://images.example.com/${id}-small.png`,
          large: `https://images.example.com/${id}-large.png`,
          slug: id,
          price_btc: Number((0.001 * (index + 1)).toFixed(8))
        }
      }))
    };
  }
  return {};
}

function handleCryptoScam(method, url, postBody) {
  const parsed = parseUrl(url);
  if (method === 'POST') {
    return { success: true, id: 'smoke-report-1', received: JSON.parse(postBody || '{}') };
  }
  if (parsed.searchParams.has('stats')) {
    return {
      total: 42,
      totalLostNGN: 120500000,
      byType: { phishing: 12, ponzi: 10, 'fake-investment': 8, 'rug-pull': 6 },
      byCountry: { NG: 18, KE: 7, ZA: 6, GH: 5, EG: 3, UG: 3 }
    };
  }
  if (parsed.searchParams.has('recent')) {
    return {
      reports: [
        {
          platform: 'FakeYield Africa',
          scam_type: 'phishing',
          amount_lost: 250000,
          currency: 'NGN',
          country: 'NG',
          date_occurred: '2026-03-15',
          reported_at: '2026-03-16',
          story: 'Victim was asked to connect wallet to a fake exchange clone.',
          address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
        },
        {
          platform: 'Trust Wallet Support Clone',
          scam_type: 'impersonation',
          amount_lost: 1200,
          currency: 'USD',
          country: 'KE',
          date_occurred: '2026-02-11',
          reported_at: '2026-02-12',
          story: 'Fake support account requested a seed phrase.',
          address: 'TQwFakeAddress111111111111111111111'
        }
      ]
    };
  }
  const q = (parsed.searchParams.get('q') || '').toLowerCase();
  if (q.includes('deadbeef') || q.includes('fakeyield')) {
    return {
      found: 1,
      reports: [
        {
          platform: 'FakeYield Africa',
          scam_type: 'phishing',
          amount_lost: 250000,
          currency: 'NGN',
          country: 'NG',
          date_occurred: '2026-03-15',
          reported_at: '2026-03-16',
          story: 'Victim was asked to connect wallet to a fake exchange clone.',
          address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
        }
      ]
    };
  }
  return { found: 0, reports: [] };
}

function handleCryptoP2P(url) {
  const parsed = parseUrl(url);
  const asset = (parsed.searchParams.get('asset') || 'USDT').toUpperCase();
  const fiat = (parsed.searchParams.get('fiat') || 'NGN').toUpperCase();
  const basePrice = {
    NGN: 1600,
    KES: 130,
    ZAR: 18.4,
    GHS: 14,
    EGP: 49,
    TZS: 2600,
    UGX: 3850,
    XOF: 605,
    ETB: 57,
    RWF: 1290
  }[fiat] || 1600;
  const multiplier = asset === 'BTC' ? 65000 : asset === 'ETH' ? 3200 : asset === 'BNB' ? 580 : 1;
  const unitPrice = basePrice * multiplier;
  const makePlatform = (id, name, offset, source) => ({
    id,
    name,
    source,
    buyPrice: Number((unitPrice * (1 + offset)).toFixed(2)),
    sellPrice: Number((unitPrice * (1 - offset * 0.75)).toFixed(2)),
    methods: fiat === 'KES' ? ['Bank Transfer', 'M-Pesa'] : ['Bank Transfer', 'Mobile Money'],
    trust: id === 'binance' ? 94 : id === 'bybit' ? 90 : 83,
    fees: { maker: 0, taker: id === 'quidax' ? 0.25 : 0.1 },
    url: `https://example.com/${id}`,
    lastUpdated: new Date(NOW - Math.round(offset * 1000000)).toISOString()
  });
  return {
    platforms: [
      makePlatform('binance', 'Binance P2P', 0.004, 'live'),
      makePlatform('bybit', 'Bybit P2P', 0.007, 'live'),
      makePlatform('yellowcard', 'Yellow Card', 0.011, 'manual'),
      makePlatform('quidax', 'Quidax', 0.015, 'manual')
    ]
  };
}

function handlePortfolio(method, postBody) {
  if (method === 'POST') {
    return { success: true, saved: true, holdings: JSON.parse(postBody || '{}').holdings || [] };
  }
  return { holdings: [] };
}

function handleSupabase(url, method) {
  const parsed = parseUrl(url);
  if (parsed.pathname.endsWith('/crypto_exchanges')) {
    return [
      {
        id: 'binance',
        name: 'Binance',
        logo_id: 'binance',
        trust_score: 95,
        countries: ['NG', 'KE', 'ZA', 'GH'],
        fees_maker: '0.10',
        fees_taker: '0.10',
        deposit_methods: ['Bank Transfer', 'Card'],
        features: ['P2P Trading', 'Proof of Reserves'],
        pros: ['Deep liquidity', 'Strong brand'],
        cons: ['Complex interface'],
        description: 'Large global exchange.',
        url: 'https://example.com/binance'
      },
      {
        id: 'luno',
        name: 'Luno',
        logo_id: 'luno',
        trust_score: 88,
        countries: ['NG', 'ZA', 'UG'],
        fees_maker: '0.00',
        fees_taker: '0.10',
        deposit_methods: ['Bank Transfer'],
        features: ['Simple Buy/Sell'],
        pros: ['Easy onboarding'],
        cons: ['Fewer assets'],
        description: 'Africa-focused exchange.',
        url: 'https://example.com/luno'
      }
    ];
  }
  if (parsed.pathname.endsWith('/crypto_exchange_reviews') && method === 'POST') {
    return { success: true };
  }
  return [];
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

  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url === `${BASE_URL}/api/auth/session`) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/crypto-scam`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(handleCryptoScam(method, url, req.postData() || ''))
      });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/crypto-p2p`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(handleCryptoP2P(url))
      });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/crypto-portfolio-advisor`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 74,
          advice: '**Healthy mix overall.** Consider trimming any holding above 45% allocation and keep some cash for rebalancing.'
        })
      });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/crypto-portfolio`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(handlePortfolio(method, req.postData() || ''))
      });
    }
    if (url.startsWith(`${BASE_URL}/.netlify/functions/crypto-image`)) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1_BUFFER });
    }
    if (url.startsWith(`${BASE_URL}/assets/img/crypto/`) && url.endsWith('.svg')) {
      return route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"></svg>'
      });
    }
    if (url.includes('twemoji.min.js')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.twemoji={parse:function(){}};'
      });
    }
    if (url.startsWith('https://api.coingecko.com/api/v3/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(handleCoinGecko(url))
      });
    }
    if (url.startsWith('https://zpclagtgczsygrgztlts.supabase.co/rest/v1/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(handleSupabase(url, method))
      });
    }
    return route.continue();
  });

  return context;
}

async function collectPageState(page) {
  return page.evaluate(() => {
    const bodyText = (document.body && document.body.innerText ? document.body.innerText : '').replace(/\s+/g, ' ').trim();
    return bodyText.slice(0, 1200);
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

  page.on('response', async (res) => {
    const status = res.status();
    if (status >= 400) {
      const url = res.url();
      if (url.startsWith(BASE_URL) && !url.includes('/assets/img/tools/')) {
        requestErrors.push(`${status} ${url}`);
      }
    }
  });

  try {
    if (typeof config.beforeGoto === 'function') {
      await config.beforeGoto(page);
    }
    await page.goto(`${BASE_URL}${config.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    await config.run(page);
    await page.waitForTimeout(800);
    const screenshotPath = path.join(OUT_DIR, `${config.slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const summary = await (config.summary ? config.summary(page) : collectPageState(page));
    return {
      slug: config.slug,
      status: 'ok',
      summary,
      errors: consoleErrors.map((message) => ({ type: 'console', message })),
      requests: requestErrors
    };
  } catch (error) {
    const screenshotPath = path.join(OUT_DIR, `${config.slug}-failed.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (e) {
      // ignore screenshot errors in failure path
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

function containsText(page, text) {
  return page.locator(`text=${text}`).first();
}

async function main() {
  ensureDir(OUT_DIR);
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await createContext(browser);

  const tests = [
    {
      slug: 'tool-crypto-tax',
      path: '/tools/crypto-tax/',
      run: async (page) => {
        await page.selectOption('#country', 'KE');
        await page.fill('#costBasis', '100000');
        await page.fill('#salePrice', '160000');
        await page.fill('#fees', '5000');
        await page.click('button:has-text("Calculate Tax")');
        await page.waitForSelector('#resultCard', { state: 'visible' });
      }
    },
    {
      slug: 'p2p-rates',
      path: '/crypto/p2p-rates/',
      run: async (page) => {
        await page.waitForSelector('.platform-card');
      }
    },
    {
      slug: 'prices',
      path: '/crypto/prices/',
      run: async (page) => {
        await page.waitForSelector('tbody tr');
        await page.click('tbody tr:first-child');
        await page.waitForTimeout(800);
      }
    },
    {
      slug: 'stablecoins',
      path: '/crypto/stablecoins/',
      run: async (page) => {
        await page.waitForSelector('#stablecoin-tables .stable-coin-section');
      }
    },
    {
      slug: 'remittance',
      path: '/crypto/remittance/',
      run: async (page) => {
        await page.fill('input[type="number"]', '500');
        await page.waitForSelector('#channels .channel-card');
      }
    },
    {
      slug: 'arbitrage',
      path: '/crypto/arbitrage/',
      run: async (page) => {
        await page.waitForSelector('table tbody tr');
      }
    },
    {
      slug: 'portfolio',
      path: '/crypto/portfolio/',
      beforeGoto: async (page) => {
        await page.addInitScript(() => {
          localStorage.setItem('afro-crypto-portfolio', JSON.stringify([
            { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', qty: 0.25, buyPrice: 52000000, buyCurrency: 'ngn', buyDate: '2025-01-10', thumb: 'https://images.example.com/bitcoin-thumb.png' },
            { id: 'ethereum', symbol: 'eth', name: 'Ethereum', qty: 2, buyPrice: 2800000, buyCurrency: 'ngn', buyDate: '2025-03-01', thumb: 'https://images.example.com/ethereum-thumb.png' }
          ]));
        });
      },
      run: async (page) => {
        await page.waitForSelector('#summarySection', { state: 'visible' });
        await page.click('button[data-days="30"]');
        await page.waitForTimeout(800);
      }
    },
    {
      slug: 'dca-calculator',
      path: '/crypto/dca-calculator/',
      run: async (page) => {
        await page.fill('#dca-amount', '50000');
        await page.click('#btn-calculate');
        await page.waitForSelector('#dca-results.visible');
      }
    },
    {
      slug: 'tax-calculator',
      path: '/crypto/tax-calculator/',
      run: async (page) => {
        await page.selectOption('#country-select', 'KE');
        await page.fill('#trade-buy-price', '1000');
        await page.fill('#trade-sell-price', '1600');
        await page.fill('#trade-qty', '2');
        await page.click('#btn-add-trade');
        await page.waitForSelector('#tax-results', { state: 'visible' });
      }
    },
    {
      slug: 'profit-calculator',
      path: '/crypto/profit-calculator/',
      run: async (page) => {
        await page.fill('#buyPrice', '45000000');
        await page.fill('#quantity', '0.5');
        await page.click('#calcBtn');
        await page.waitForSelector('#whatifSection', { state: 'visible' });
      }
    },
    {
      slug: 'mining-calculator',
      path: '/crypto/mining-calculator/',
      run: async (page) => {
        await page.selectOption('#coinSelect', 'LTC');
        await page.fill('#hashrate', '9.5');
        await page.click('#calcBtn');
        await page.waitForSelector('#chartSection', { state: 'visible' });
      }
    },
    {
      slug: 'scam-checker',
      path: '/crypto/scam-checker/',
      run: async (page) => {
        await page.fill('#check-query', '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
        await page.click('#btn-check');
        await page.waitForSelector('#check-result.danger', { state: 'attached' });
      }
    },
    {
      slug: 'address-validator',
      path: '/crypto/address-validator/',
      run: async (page) => {
        await page.fill('#addressInput', '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
        await page.click('#validateBtn');
        await page.waitForSelector('#resultCard .status-banner', { state: 'attached' });
      }
    },
    {
      slug: 'exchange-ratings',
      path: '/crypto/exchange-ratings/',
      run: async (page) => {
        await page.waitForSelector('#exchangeTableBody tr');
        await page.click('#exchangeTableBody tr:first-child');
        await page.waitForSelector('#exchangeDetail .exchange-detail');
      }
    },
    {
      slug: 'contract-scanner',
      path: '/crypto/contract-scanner/',
      run: async (page) => {
        await page.fill('#contractAddress', '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
        await page.click('#scanBtn');
        await page.waitForFunction(() => {
          const el = document.getElementById('resultsContent');
          return el && !/Enter a contract address/i.test(el.textContent || '');
        });
      }
    },
    {
      slug: 'quiz',
      path: '/crypto/quiz/',
      run: async (page) => {
        await page.click('.diff-card[data-level="beginner"]');
        await page.waitForSelector('#questionText');
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
    console.error(`Crypto UI smoke failed for ${failed.length} page(s). See ${REPORT_PATH}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Crypto UI smoke passed. Report saved to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
