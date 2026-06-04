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

function assertNoSensitiveAnalytics(payloads) {
  const serialized = JSON.stringify(payloads || []);
  const forbidden = [
    'Parser Candidate',
    'parser.candidate@example.com',
    '08012345678',
    'linkedin.com/in/parser-candidate',
    'parser.example.com',
    'AfroTools QA Lab',
    'Built weekly reporting dashboards',
    'Cleaned spreadsheet data'
  ];
  const leaked = forbidden.filter((token) => serialized.includes(token));
  if (leaked.length) {
    throw new Error(`Analytics payload leaked sensitive fixture content: ${leaked.join(', ')}`);
  }
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
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: `http://127.0.0.1:${PORT}` }).catch(() => {});
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
    const gateSurface = await page.evaluate(() => ({
      emailGateModal: Boolean(document.querySelector('email-gate-modal')),
      pdfGateScript: Array.from(document.scripts).some((script) => /pdf-download-gate\.js/.test(script.src || '')),
      cvLeadForm: Boolean(document.querySelector('form[name="cv-leads"]')),
      pdfGateKeys: ['afrotools-email-gate', 'afrotools_lead_email'].filter((key) => {
        try { return localStorage.getItem(key); } catch (err) { return false; }
      })
    }));
    if (gateSurface.emailGateModal || gateSurface.pdfGateScript || gateSurface.cvLeadForm || gateSurface.pdfGateKeys.length) {
      throw new Error(`Primary PDF export still has a lead/account gate surface: ${JSON.stringify(gateSurface)}`);
    }
    const toolbarActions = await page.evaluate(() => ['pdf'].map((action) => {
      const el = document.querySelector(`.cv-toolbar-right [data-action="${action}"]`);
      const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
      const style = el ? window.getComputedStyle(el) : null;
      return {
        action,
        present: Boolean(el),
        visible: Boolean(el && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden')
      };
    }));
    const hiddenActions = toolbarActions.filter((item) => !item.present || !item.visible);
    if (hiddenActions.length) {
      throw new Error(`Hidden toolbar actions detected: ${JSON.stringify(hiddenActions)}`);
    }
    await page.locator('.cv-more-toggle').click();
    const secondaryActions = await page.evaluate(() => ['save', 'print', 'import', 'ats', 'coverletter', 'history'].map((action) => {
      const el = document.querySelector(`.cv-more-menu [data-action="${action}"]`);
      const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
      const style = el ? window.getComputedStyle(el) : null;
      return {
        action,
        present: Boolean(el),
        visible: Boolean(el && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden')
      };
    }));
    const inaccessibleSecondary = secondaryActions.filter((item) => !item.present || !item.visible);
    if (inaccessibleSecondary.length) {
      throw new Error(`Secondary toolbar actions are not accessible from More: ${JSON.stringify(inaccessibleSecondary)}`);
    }
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      window.CVApp.updateData('fn', 'Parser');
      window.CVApp.updateData('ln', 'Candidate');
      window.CVApp.updateData('email', 'parser.candidate@example.com');
      window.CVApp.updateData('phone', '08012345678');
      window.CVApp.updateData('loc', 'Lagos, Nigeria');
      window.CVApp.updateData('linkedin', 'https://linkedin.com/in/parser-candidate');
      window.CVApp.updateData('web', 'https://parser.example.com');
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

    const selectedTemplate = await page.evaluate(() => {
      const select = document.querySelector('.cv-workspace-template-select');
      if (select) {
        select.value = 'nairobi-tech';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (window.CVApp && window.CVApp.setTopState) {
        window.CVApp.setTopState('template', 'nairobi-tech');
        window.CVApp.renderAll();
      }
      return window.CVApp.getState().template;
    });
    if (selectedTemplate !== 'nairobi-tech') throw new Error(`Template switching failed, got ${selectedTemplate}`);

    const toolbarDownloadPromise = page.waitForEvent('download');
    await page.locator('.cv-toolbar-right [data-action="pdf"]').click();
    const toolbarDownload = await toolbarDownloadPromise;
    const normalPath = path.join(OUT_DIR, toolbarDownload.suggestedFilename());
    await toolbarDownload.saveAs(normalPath);
    const normalBytes = fs.statSync(normalPath).size;
    if (normalBytes < 1000) throw new Error('Primary toolbar PDF export produced an unexpectedly small file');

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

    const txtDownloadPromise = page.waitForEvent('download');
    await page.evaluate(() => window.CVExportUpgrade.exportText(window.CVExportUpgrade.buildAtsPlainText()));
    const txtDownload = await txtDownloadPromise;
    const txtPath = path.join(OUT_DIR, txtDownload.suggestedFilename());
    await txtDownload.saveAs(txtPath);
    const txt = fs.readFileSync(txtPath, 'utf8');
    if (!txt.includes('Parser Candidate') || !txt.includes('parser.candidate@example.com') || !txt.includes('PROFESSIONAL SUMMARY')) {
      throw new Error('ATS TXT export is missing required plain-text content');
    }

    const jsonDownloadPromise = page.waitForEvent('download');
    await page.evaluate(() => window.CVExportUpgrade.exportJson());
    const jsonDownload = await jsonDownloadPromise;
    const jsonPath = path.join(OUT_DIR, jsonDownload.suggestedFilename());
    await jsonDownload.saveAs(jsonPath);
    const backup = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!backup || backup.source !== 'afrotools-cv-builder' || backup.data.email !== 'parser.candidate@example.com') {
      throw new Error('JSON backup export did not preserve the CV data for restore');
    }

    const copyResult = await page.evaluate(async () => {
      window.CVExportUpgrade.openAtsModal();
      await new Promise((resolve) => setTimeout(resolve, 100));
      document.querySelector('[data-export-copy-ats]').click();
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        return { ok: true, text: await navigator.clipboard.readText() };
      } catch (err) {
        const textarea = document.querySelector('[data-export-ats-text]');
        return { ok: false, text: textarea ? textarea.value : '', error: err.message };
      }
    });
    if (!copyResult.text.includes('Parser Candidate') || !copyResult.text.includes('PROFESSIONAL SUMMARY')) {
      throw new Error(`Copy action failed to expose ATS plain text: ${copyResult.error || 'empty clipboard'}`);
    }

    const printResult = await page.evaluate(async () => {
      let printed = false;
      const originalOpen = window.open;
      window.open = function() {
        return {
          document: { write() {}, close() {} },
          set onload(handler) {
            setTimeout(handler, 0);
          },
          focus() {},
          print() {
            printed = true;
          }
        };
      };
      try {
        window.CVExportUpgrade.printCv();
        await new Promise((resolve) => setTimeout(resolve, 450));
      } finally {
        window.open = originalOpen;
      }
      return printed;
    });
    if (!printResult) throw new Error('Print action did not reach window.print');

    const savedId = await page.evaluate(() => {
      window.CVApp.saveCVToList('Parser Candidate Smoke');
      return window.CVApp.getState().currentCVId;
    });
    await page.goto(`http://127.0.0.1:${PORT}/tools/cv-builder/?cv=${encodeURIComponent(savedId)}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.CVApp && window.CVApp.getState && window.CVApp.getState().data.fn === 'Parser');
    const restored = await page.evaluate(() => ({
      fn: window.CVApp.getState().data.fn,
      email: window.CVApp.getState().data.email,
      savedCount: window.CVApp.getState().savedCVs.length
    }));
    if (restored.fn !== 'Parser' || restored.email !== 'parser.candidate@example.com' || restored.savedCount < 1) {
      throw new Error(`Save/restore failed: ${JSON.stringify(restored)}`);
    }

    const analyticsPayloads = await page.evaluate(() => window.dataLayer || []);
    assertNoSensitiveAnalytics(analyticsPayloads);
    const docDocxPresent = await page.evaluate(() => Array.from(document.querySelectorAll('button, a')).some((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const download = el.getAttribute('download') || '';
      const exportType = el.getAttribute('data-cv-export') || '';
      return /\b(download\s+)?(docx|doc|word document)\b/i.test(text)
        || /\.(docx|doc)\b/i.test(download)
        || /^(docx|doc|word)$/i.test(exportType);
    }));
    let docExport = null;
    if (docDocxPresent) {
      await page.locator('[data-pack-generate-all]').click();
      const docDownloadPromise = page.waitForEvent('download');
      await page.locator('[data-pack-export="doc"]').click();
      const docDownload = await docDownloadPromise;
      const docPath = path.join(OUT_DIR, docDownload.suggestedFilename());
      await docDownload.saveAs(docPath);
      const docHtml = fs.readFileSync(docPath, 'utf8');
      if (!/AFROTOOLS APPLICATION PACK/.test(docHtml) || !/Parser Candidate/.test(docHtml)) {
        throw new Error('DOC export is present but did not contain the generated application pack content');
      }
      docExport = {
        path: path.relative(ROOT, docPath).replace(/\\/g, '/'),
        bytes: fs.statSync(docPath).size
      };
    }

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
    const missingExportViewport = mobileResults.find((metrics) => !metrics.exportButtonVisible);
    if (missingExportViewport) throw new Error(`Mobile export controls were not visible at ${missingExportViewport.viewport}`);
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
      noGateSurface: gateSurface,
      toolbarActions,
      secondaryActions,
      templateSwitch: selectedTemplate,
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
      atsText: {
        path: path.relative(ROOT, txtPath).replace(/\\/g, '/'),
        bytes: Buffer.byteLength(txt, 'utf8'),
        copyVerified: Boolean(copyResult.text.includes('Parser Candidate'))
      },
      jsonBackup: {
        path: path.relative(ROOT, jsonPath).replace(/\\/g, '/'),
        bytes: fs.statSync(jsonPath).size,
        restoreVerified: true,
        savedCount: restored.savedCount
      },
      printVerified: true,
      docDocxPresent,
      docExport,
      analytics: {
        eventCount: Array.isArray(analyticsPayloads) ? analyticsPayloads.length : 0,
        sensitivePayloadLeak: false
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
