#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const pdfParse = require('pdf-parse');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'audit-results', 'cv-builder-ats-plain-pdf-fix');
const PORT = Number(process.env.CV_QA_PORT || 4317);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf'
};

function serveFile(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let target = decodeURIComponent(url.pathname);
  if (target.endsWith('/')) target += 'index.html';
  const file = path.normalize(path.join(ROOT, target));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(serveFile);
    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function verify() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const desktopErrors = [];
  const mobileErrors = [];
  let result;

  try {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') desktopErrors.push(msg.text());
    });
    await page.goto(`http://127.0.0.1:${PORT}/tools/cv-builder/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('afro_cookie_consent_v1', 'accepted');
      document.querySelectorAll('[id*="cookie"], .cookie-banner, .cookie-consent').forEach((el) => el.remove());
    });
    const hasAtsFixScript = await page.evaluate(() =>
      Array.from(document.scripts).some((script) => /cv-ats-plain-pdf-fix\.js/.test(script.src || ''))
    );
    if (!hasAtsFixScript) throw new Error('CV ATS Plain PDF fix script is not loaded on the page');
    await page.waitForFunction(() => window.CVApp && window.CVApp.updateData && window.CVExportUpgrade && window.CVExportAtsPlainPdf);
    await page.evaluate(() => {
      window.CVApp.updateData('fn', 'Parser');
      window.CVApp.updateData('ln', 'Candidate');
      window.CVApp.updateData('email', 'parser.candidate@example.com');
      window.CVApp.updateData('phone', '08012345678');
      window.CVApp.updateData('loc', 'Lagos, Nigeria');
      window.CVApp.updateData('title', 'Data Analyst');
      window.CVApp.updateData('summary', 'Entry-level data analyst with strong Excel, SQL, dashboard reporting, and business analysis skills. Interested in roles that use evidence, clean reporting, and practical problem solving.');
      window.CVApp.updateData('exps', [{
        t: 'Data Intern',
        c: 'AfroTools QA Lab',
        l: 'Lagos',
        s: '2025-01',
        e: '2025-06',
        cur: false,
        d: 'Built weekly reporting dashboards for application tracking.\nCleaned spreadsheet data and documented recurring quality issues.'
      }]);
      window.CVApp.updateData('edus', [{
        deg: 'BSc Statistics',
        sch: 'University of Lagos',
        loc: 'Lagos',
        y1: '2021',
        y2: '2025',
        g: 'Second Class Upper'
      }]);
      window.CVApp.updateData('skills', {
        h: 'Excel, SQL, Power BI, data cleaning',
        s: 'Communication, problem solving, attention to detail',
        t: 'Google Sheets, Microsoft Excel, Power BI'
      });
      window.CVApp.updateData('certs', [{ n: 'Google Data Analytics Certificate', i: 'Google', y: '2025' }]);
      window.CVApp.updateData('langs', [{ l: 'English', lv: 'Fluent' }]);
      window.CVApp.renderEditor();
      window.CVApp.renderPreview();
    });
    await page.locator('[data-export-role]').fill('Data Analyst').catch(() => {});

    const downloadPromise = page.waitForEvent('download');
    await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf(window.CVExportUpgrade.buildAtsPlainText()));
    const download = await downloadPromise;
    const suggested = download.suggestedFilename();
    const pdfPath = path.join(OUT_DIR, suggested);
    await download.saveAs(pdfPath);

    const data = fs.readFileSync(pdfPath);
    const parsed = await pdfParse(data);
    const normalized = parsed.text.replace(/\s+/g, ' ').trim();
    const required = ['Parser Candidate', 'parser.candidate@example.com', 'PROFESSIONAL SUMMARY', 'EDUCATION', 'SKILLS'];
    const missing = required.filter((token) => !normalized.includes(token));
    if (missing.length) throw new Error(`ATS Plain PDF missing parsed text: ${missing.join(', ')}`);

    const normalDownload = page.waitForEvent('download');
    await page.evaluate(() => window.CVExportPdfQuality.exportPdf());
    const normal = await normalDownload;
    const normalPath = path.join(OUT_DIR, normal.suggestedFilename());
    await normal.saveAs(normalPath);
    const normalBytes = fs.statSync(normalPath).size;
    if (normalBytes < 1000) throw new Error('Normal designed PDF export produced an unexpectedly small file');

    const mobileResults = [];
    for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }]) {
      const mobile = await browser.newPage({ viewport, acceptDownloads: true });
      mobile.on('console', (msg) => {
        if (msg.type() === 'error') mobileErrors.push(`${viewport.width}x${viewport.height}: ${msg.text()}`);
      });
      await mobile.goto(`http://127.0.0.1:${PORT}/tools/cv-builder/`, { waitUntil: 'networkidle' });
      await mobile.evaluate(() => {
        localStorage.setItem('afro_cookie_consent_v1', 'accepted');
        document.querySelectorAll('[id*="cookie"], .cookie-banner, .cookie-consent').forEach((el) => el.remove());
      });
      await mobile.waitForFunction(() => window.CVApp && window.CVExportUpgrade);
      await mobile.locator('[data-mode="export"], [data-cv-mode="export"], button:has-text("Export")').first().click().catch(() => {});
      const mobileMetrics = await mobile.evaluate(() => {
      const controls = Array.from(document.querySelectorAll([
        'body.cv-builder-page input',
        'body.cv-builder-page select',
        'body.cv-builder-page textarea',
        'body.cv-builder-page .cv-app button',
        'body.cv-builder-page .cv-product-header button',
        'body.cv-builder-page .cv-layout-mode-tabs button',
        'body.cv-builder-page .cv-template-drawer-shell button',
        'body.cv-builder-page .cv-export-drawer-shell button'
      ].join(','))).filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });
      const fonts = controls.map((el) => Number.parseFloat(window.getComputedStyle(el).fontSize) || 0);
      const targets = controls.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          label: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
      return {
        overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        exportButtonVisible: !!document.querySelector('[data-cv-export="ats-pdf"], [data-cv-export="pdf"]'),
        minControlFontSize: fonts.length ? Math.min(...fonts) : null,
        smallTouchTargets: targets.filter((target) => target.height < 43.5).slice(0, 20)
      };
      });
      const screenshotName = `mobile-${viewport.width}x${viewport.height}-export-smoke.png`;
      await mobile.screenshot({ path: path.join(OUT_DIR, screenshotName), fullPage: true });
      mobileResults.push({
        viewport: `${viewport.width}x${viewport.height}`,
        screenshot: path.relative(ROOT, path.join(OUT_DIR, screenshotName)).replace(/\\/g, '/'),
        ...mobileMetrics
      });
      await mobile.close();
    }

    if (desktopErrors.length || mobileErrors.length) {
      throw new Error(`Console errors detected: ${desktopErrors.concat(mobileErrors).join(' | ')}`);
    }
    const overflowViewport = mobileResults.find((metrics) => metrics.overflowX > 0);
    if (overflowViewport) throw new Error(`Mobile horizontal overflow at ${overflowViewport.viewport}: ${overflowViewport.overflowX}px`);
    const smallFontViewport = mobileResults.find((metrics) => metrics.minControlFontSize !== null && metrics.minControlFontSize < 16);
    if (smallFontViewport) {
      throw new Error(`Mobile control font below 16px at ${smallFontViewport.viewport}: ${smallFontViewport.minControlFontSize}px`);
    }
    const smallTargetViewport = mobileResults.find((metrics) => metrics.smallTouchTargets.length);
    if (smallTargetViewport) {
      throw new Error(`Mobile touch targets below 44px high at ${smallTargetViewport.viewport}: ${JSON.stringify(smallTargetViewport.smallTouchTargets)}`);
    }

    result = {
      status: 'pass',
      url: `http://127.0.0.1:${PORT}/tools/cv-builder/`,
      hasAtsFixScript,
      atsPlainPdf: {
        path: path.relative(ROOT, pdfPath).replace(/\\/g, '/'),
        bytes: data.length,
        parserVersion: parsed.version,
        pages: parsed.numpages,
        sample: normalized.slice(0, 220)
      },
      normalPdf: {
        path: path.relative(ROOT, normalPath).replace(/\\/g, '/'),
        bytes: normalBytes
      },
      mobile: mobileResults,
      consoleErrors: []
    };
    fs.writeFileSync(path.join(OUT_DIR, 'parser-check.json'), JSON.stringify(result, null, 2));
    console.log(`CV ATS Plain PDF parser check passed: ${result.atsPlainPdf.path}`);
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }

  return result;
}

verify().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
