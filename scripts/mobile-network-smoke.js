#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { chromium, devices } = loadPlaywright();

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');

const DEFAULT_ROUTES = [
  '/',
  '/search/',
  '/salary-tax/',
  '/nigeria/ng-salary-tax',
  '/tools/mobile-money-fees/',
  '/telecom/airtime-value/',
];

const PROFILES = {
  'africa-mobile': {
    label: 'Africa mobile 3G/low 4G',
    viewport: { width: 390, height: 844 },
    latencyMs: 220,
    downloadKbps: 900,
    uploadKbps: 350,
    cpuThrottle: 4,
    timeoutMs: 45000,
  },
  'slow-3g': {
    label: 'Slow 3G fallback',
    viewport: { width: 360, height: 740 },
    latencyMs: 400,
    downloadKbps: 400,
    uploadKbps: 150,
    cpuThrottle: 5,
    timeoutMs: 60000,
  },
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function loadPlaywright() {
  const candidates = [
    '@playwright/test',
    'playwright',
    path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright'),
  ];
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  const detail = lastError && lastError.message ? ` Last error: ${lastError.message}` : '';
  throw new Error(`Playwright runtime is not available. Run npm install, or provide playwright on NODE_PATH.${detail}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const profile = PROFILES[options.profile] || PROFILES['africa-mobile'];
  const routes = options.routes.length ? options.routes : DEFAULT_ROUTES;
  const server = await startServer(options.port);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const startedAt = new Date().toISOString();
  const results = [];

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of routes) {
      results.push(await auditRoute(browser, baseUrl, route, profile));
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }

  const report = {
    generatedAt: startedAt,
    root: ROOT,
    profileKey: options.profile,
    profile,
    routes,
    thresholds: buildThresholds(),
    results,
    summary: summarize(results),
    assumptions: [
      'This is a local static-site smoke test with browser network and CPU throttling.',
      'It models constrained mobile access for target African users, but it is not a carrier field measurement.',
      'Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.',
    ],
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'mobile-network-smoke.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(REPORT_DIR, 'mobile-network-smoke.md'), renderMarkdown(report), 'utf8');

  console.log(`Mobile network smoke complete for ${results.length} routes`);
  console.log(`  Profile: ${profile.label}`);
  console.log(`  Verdict: ${report.summary.verdict}`);
  console.log('  Output JSON: reports/mobile-network-smoke.json');
  console.log('  Output Markdown: reports/mobile-network-smoke.md');

  if (options.failOnWarn && report.summary.verdict !== 'PASS') process.exitCode = 1;
}

function parseArgs(args) {
  const options = {
    profile: 'africa-mobile',
    routes: [],
    port: 0,
    failOnWarn: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--profile=')) options.profile = arg.slice('--profile='.length);
    else if (arg.startsWith('--routes=')) options.routes = splitRoutes(arg.slice('--routes='.length));
    else if (arg.startsWith('--route=')) options.routes.push(normalizeRoute(arg.slice('--route='.length)));
    else if (arg.startsWith('--port=')) options.port = Number(arg.slice('--port='.length)) || 0;
    else if (arg === '--fail-on-warn') options.failOnWarn = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/mobile-network-smoke.js [--profile=africa-mobile] [--routes=/,/search/] [--fail-on-warn]');
      process.exit(0);
    } else if (arg.trim()) {
      options.routes.push(normalizeRoute(arg));
    }
  }

  if (!PROFILES[options.profile]) options.profile = 'africa-mobile';
  options.routes = [...new Set(options.routes.map(normalizeRoute))];
  return options;
}

function splitRoutes(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeRoute);
}

function normalizeRoute(route) {
  if (!route) return '/';
  return route.startsWith('/') ? route : `/${route}`;
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    try {
      const filePath = resolveRequestPath(req.url || '/');
      if (!filePath) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'content-type': CONTENT_TYPES[ext] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(error.message);
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port || 0, '127.0.0.1', () => resolve(server));
  });
}

function resolveRequestPath(requestUrl) {
  const cleanUrl = new URL(requestUrl, 'http://local.test');
  const pathname = decodeURIComponent(cleanUrl.pathname || '/');
  const rel = pathname.replace(/^\/+/, '');
  const candidates = [];

  if (!rel) candidates.push('index.html');
  else {
    candidates.push(rel);
    if (pathname.endsWith('/')) candidates.push(path.join(rel, 'index.html'));
    else {
      candidates.push(`${rel}.html`);
      candidates.push(path.join(rel, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const absPath = path.resolve(ROOT, candidate);
    if (!absPath.startsWith(ROOT + path.sep) && absPath !== ROOT) continue;
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) return absPath;
  }
  return null;
}

async function auditRoute(browser, baseUrl, route, profile) {
  const context = await browser.newContext({
    ...(devices['Pixel 5'] || {}),
    viewport: profile.viewport,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const errors = [];
  const assetErrors = [];
  const runtimeWarnings = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (/failed to load resource/i.test(message.text())) return;
    errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const parsed = new URL(response.url());
    if (!response.url().startsWith(baseUrl)) return;
    if (/\/favicon\.ico$/i.test(parsed.pathname)) return;
    if (parsed.pathname.startsWith('/.netlify/functions/')) {
      runtimeWarnings.push(`function unavailable in static smoke: ${parsed.pathname}`);
      return;
    }
    assetErrors.push(`${response.status()} ${parsed.pathname}`);
  });
  page.on('requestfailed', (request) => {
    if (!request.url().startsWith(baseUrl)) return;
    const failure = request.failure();
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith('/.netlify/functions/')) {
      runtimeWarnings.push(`function unavailable in static smoke: ${pathname}`);
      return;
    }
    assetErrors.push(`${pathname}: ${failure ? failure.errorText : 'request failed'}`);
  });

  await page.addInitScript(() => {
    window.__aftVitals = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__aftVitals.lcp = last.startTime || 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__aftVitals.cls += entry.value || 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
  });

  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.latencyMs,
    downloadThroughput: kbpsToBytesPerSecond(profile.downloadKbps),
    uploadThroughput: kbpsToBytesPerSecond(profile.uploadKbps),
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottle });

  const url = `${baseUrl}${route}`;
  const started = Date.now();
  let response;
  let timedOut = false;

  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: profile.timeoutMs });
    await page.waitForLoadState('load', { timeout: Math.min(profile.timeoutMs, 20000) }).catch(() => {});
    await page.waitForTimeout(1200);
  } catch (error) {
    timedOut = true;
    errors.push(error.message);
  }

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const resources = performance.getEntriesByType('resource') || [];
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const tapTargets = Array.from(document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"]'))
      .filter(visible)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
    const smallTapTargets = tapTargets.filter((target) => target.width < 44 || target.height < 44);
    const sub16Controls = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea'))
      .filter(visible)
      .map((el) => ({ tag: el.tagName.toLowerCase(), fontSize: parseFloat(getComputedStyle(el).fontSize) || 0 }))
      .filter((item) => item.fontSize && item.fontSize < 16);
    const html = document.documentElement;
    const body = document.body || html;
    const transferBytes = [nav, ...resources].reduce((sum, item) => sum + (item.transferSize || 0), 0);
    const encodedBytes = [nav, ...resources].reduce((sum, item) => sum + (item.encodedBodySize || 0), 0);

    return {
      title: document.title,
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || nav.domInteractive || 0),
      loadMs: Math.round(nav.loadEventEnd || 0),
      lcpMs: Math.round((window.__aftVitals && window.__aftVitals.lcp) || 0),
      cls: Number(((window.__aftVitals && window.__aftVitals.cls) || 0).toFixed(3)),
      transferBytes,
      encodedBytes,
      resourceCount: resources.length,
      viewportWidth: window.innerWidth,
      scrollWidth: Math.max(html.scrollWidth || 0, body.scrollWidth || 0),
      overflowX: Math.max(html.scrollWidth || 0, body.scrollWidth || 0) - window.innerWidth,
      smallTapTargetCount: smallTapTargets.length,
      smallTapTargetSamples: smallTapTargets.slice(0, 8),
      sub16ControlCount: sub16Controls.length,
      sub16ControlSamples: sub16Controls.slice(0, 8),
    };
  }).catch((error) => ({
    title: '',
    error: error.message,
    domContentLoadedMs: 0,
    loadMs: 0,
    lcpMs: 0,
    cls: 0,
    transferBytes: 0,
    encodedBytes: 0,
    resourceCount: 0,
    viewportWidth: profile.viewport.width,
    scrollWidth: profile.viewport.width,
    overflowX: 0,
    smallTapTargetCount: 0,
    smallTapTargetSamples: [],
    sub16ControlCount: 0,
    sub16ControlSamples: [],
  }));

  await context.close();

  const result = {
    route,
    url,
    status: response ? response.status() : 0,
    wallClockMs: Date.now() - started,
    timedOut,
    metrics,
    warnings: [...new Set(runtimeWarnings)].slice(0, 10),
    errors: [...new Set([...errors, ...assetErrors])].slice(0, 10),
  };
  result.warnings = [...new Set([...classifyWarnings(result), ...result.warnings])].slice(0, 12);
  result.verdict = result.errors.length || result.timedOut || result.status >= 400 || result.status === 0 ? 'FAIL'
    : result.warnings.length ? 'WARN'
    : 'PASS';
  return result;
}

function buildThresholds() {
  return {
    domContentLoadedMsWarn: 6000,
    loadMsWarn: 12000,
    lcpMsWarn: 4500,
    transferBytesWarn: 1800000,
    resourceCountWarn: 120,
    clsWarn: 0.1,
    overflowXPxFail: 2,
    sub16ControlsFail: 0,
  };
}

function classifyWarnings(result) {
  const thresholds = buildThresholds();
  const metrics = result.metrics || {};
  const warnings = [];

  if (metrics.domContentLoadedMs > thresholds.domContentLoadedMsWarn) warnings.push(`DCL ${metrics.domContentLoadedMs}ms`);
  if (metrics.loadMs > thresholds.loadMsWarn) warnings.push(`load ${metrics.loadMs}ms`);
  if (metrics.lcpMs > thresholds.lcpMsWarn) warnings.push(`LCP ${metrics.lcpMs}ms`);
  if (metrics.transferBytes > thresholds.transferBytesWarn) warnings.push(`transfer ${formatBytes(metrics.transferBytes)}`);
  if (metrics.resourceCount > thresholds.resourceCountWarn) warnings.push(`${metrics.resourceCount} resources`);
  if (metrics.cls > thresholds.clsWarn) warnings.push(`CLS ${metrics.cls}`);
  if (metrics.overflowX > thresholds.overflowXPxFail) warnings.push(`horizontal overflow ${metrics.overflowX}px`);
  if (metrics.sub16ControlCount > thresholds.sub16ControlsFail) warnings.push(`${metrics.sub16ControlCount} controls below 16px`);
  return warnings;
}

function summarize(results) {
  const counts = results.reduce((acc, result) => {
    acc[result.verdict] = (acc[result.verdict] || 0) + 1;
    return acc;
  }, {});
  return {
    routesAudited: results.length,
    pass: counts.PASS || 0,
    warn: counts.WARN || 0,
    fail: counts.FAIL || 0,
    verdict: (counts.FAIL || 0) ? 'FAIL' : (counts.WARN || 0) ? 'WARN' : 'PASS',
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Mobile Network Smoke');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Profile: ${report.profile.label}`);
  lines.push(`Network: ${report.profile.downloadKbps} Kbps down, ${report.profile.uploadKbps} Kbps up, ${report.profile.latencyMs}ms RTT, ${report.profile.cpuThrottle}x CPU throttle`);
  lines.push('');
  lines.push(`Verdict: ${report.summary.verdict}`);
  lines.push('');
  lines.push('| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const result of report.results) {
    const metrics = result.metrics || {};
    lines.push([
      `\`${result.route}\``,
      result.status || '-',
      formatMs(metrics.domContentLoadedMs),
      formatMs(metrics.loadMs),
      formatMs(metrics.lcpMs),
      formatBytes(metrics.transferBytes || metrics.encodedBytes || 0),
      metrics.resourceCount || 0,
      `${Math.max(0, metrics.overflowX || 0)}px`,
      metrics.sub16ControlCount || 0,
      result.verdict,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }
  lines.push('');
  lines.push('## Warnings');
  lines.push('');
  for (const result of report.results) {
    if (!result.warnings.length && !result.errors.length) continue;
    lines.push(`- \`${result.route}\`: ${[...result.warnings, ...result.errors].join('; ')}`);
  }
  if (!report.results.some((result) => result.warnings.length || result.errors.length)) lines.push('- None');
  lines.push('');
  lines.push('## Assumptions');
  lines.push('');
  for (const item of report.assumptions) lines.push(`- ${item}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function kbpsToBytesPerSecond(kbps) {
  return Math.max(1, Math.floor((kbps * 1024) / 8));
}

function formatMs(value) {
  return value ? `${Math.round(value)}ms` : '-';
}

function formatBytes(value) {
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}
