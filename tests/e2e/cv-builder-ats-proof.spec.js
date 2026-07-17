const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const LOCAL_HOSTS = new Set(['127.0.0.1:4173', 'localhost:4173']);

function installConsoleGuard(page) {
  const messages = [];
  page.on('console', function (message) {
    if (message.type() === 'warning' || message.type() === 'error') {
      if (message.text() === 'Service Worker registration blocked by Playwright') return;
      messages.push(message.type() + ': ' + message.text());
    }
  });
  page.on('pageerror', function (error) {
    messages.push('pageerror: ' + (error && error.message ? error.message : String(error)));
  });
  return messages;
}

async function installNetworkGate(page) {
  await page.route('**/*', async function (route) {
    const url = new URL(route.request().url());
    if (LOCAL_HOSTS.has(url.host)) {
      await route.continue();
      return;
    }
    if (url.hostname === 'fonts.googleapis.com') {
      await route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
      return;
    }
    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }
    await route.fulfill({ status: 204, contentType: 'text/plain; charset=utf-8', body: '' });
  });
}

async function installAnalyticsRecorder(page) {
  await page.addInitScript(function () {
    window.__cvAnalyticsCalls = [];
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.analytics = {
      track: function (event, payload) {
        window.__cvAnalyticsCalls.push({ event: event, payload: payload || {} });
      }
    };
    window.dataLayer = window.dataLayer || [];
    var originalPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function () {
      window.__cvAnalyticsCalls.push({ dataLayer: Array.prototype.slice.call(arguments) });
      return originalPush.apply(window.dataLayer, arguments);
    };
  });
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(function () {
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body ? document.body.scrollWidth : 0
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function seedSyntheticCv(page) {
  await page.evaluate(function () {
    localStorage.clear();
    const state = window.CVApp.getState();
    state.country = 'NG';
    state.template = 'ats-classic';
    Object.assign(state.data, {
      fn: 'Ayo',
      ln: 'Synthetic',
      title: 'Operations Analyst',
      email: 'candidate@example.test',
      phoneCode: '+234',
      phone: '8000000000',
      loc: 'Lagos, Nigeria',
      summary: 'Synthetic operations analyst fixture for parser and export testing only.',
      exps: [{
        t: 'Operations Analyst',
        c: 'Example Test Company',
        l: 'Lagos',
        s: '2024-01',
        e: '',
        cur: true,
        d: 'Built a synthetic dashboard fixture.\nReduced test handoff time by 20 percent.'
      }],
      edus: [{
        deg: 'BSc Business Administration',
        sch: 'Example Test University',
        loc: 'Lagos',
        y1: '2018',
        y2: '2022',
        g: ''
      }],
      skills: {
        h: 'Excel, SQL, Operations reporting',
        s: 'Process improvement, stakeholder communication',
        t: 'Power BI, Google Sheets'
      },
      certs: [{ n: 'Synthetic Data Handling', i: 'Example Institute', y: '2025' }],
      langs: [{ l: 'English', lv: 'Fluent' }]
    });
    window.CVApp.renderAll();
  });
}

async function parsePdf(download, outputPath) {
  const savedPath = outputPath(download.suggestedFilename());
  await download.saveAs(savedPath);
  const bytes = fs.readFileSync(savedPath);
  try {
    return await pdfParse(bytes);
  } catch (error) {
    return pdfParse(Uint8Array.from(bytes));
  }
}

test('CV Builder ATS proof panel and synthetic export paths stay local-first', async ({ page }, testInfo) => {
  const consoleMessages = installConsoleGuard(page);
  await installNetworkGate(page);
  await page.addInitScript(function () {
    window.print = function () {
      window.__cvPrintCalled = true;
    };
  });

  const response = await page.goto('/tools/cv-builder/', { waitUntil: 'domcontentloaded' });
  expect(response && response.status()).toBe(200);

  await expect(page.getByLabel('ATS and parser proof notes')).toContainText('ATS/parser proof, not a promise');
  await expect(page.getByLabel('ATS and parser proof notes')).toContainText('Text-based PDF path');
  await expect(page.getByLabel('ATS and parser proof notes')).toContainText('Import limits');
  await expect(page.getByLabel('ATS and parser proof notes')).toContainText('No guarantee');

  await page.waitForFunction(function () {
    return window.CVApp && window.CVExportUpgrade && window.CVExportAtsPlainPdf;
  });
  await seedSyntheticCv(page);

  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.locator('.cv-workspace-template-select').selectOption('accra-graduate');
  await expect.poll(async function () {
    return page.evaluate(function () { return window.CVApp.getState().template; });
  }).toBe('accra-graduate');

  await page.locator('.cv-toolbar-right [data-action="pdf"]').click();
  await expect(page.getByRole('dialog', { name: 'Export CV' })).toBeVisible();

  const normalPdfDownload = page.waitForEvent('download');
  await page.locator('.cv-export-drawer-shell [data-cv-export="pdf"]').click();
  const normalPdf = await normalPdfDownload;
  expect(normalPdf.suggestedFilename()).toMatch(/\.pdf$/i);

  const popupPromise = page.waitForEvent('popup');
  await page.locator('.cv-export-drawer-shell [data-cv-export="print"]').click();
  const popup = await popupPromise;
  await expect(popup.locator('#cvpreview')).toContainText('Ayo Synthetic');
  await popup.close();

  await page.locator('.cv-export-drawer-shell [data-cv-export="ats"]').click();
  await expect(page.locator('[data-export-ats-text]')).toHaveValue(/Ayo Synthetic/);

  const atsPdfDownload = page.waitForEvent('download');
  await page.locator('[data-export-download-ats-pdf]').click();
  const atsPdf = await atsPdfDownload;
  const parsed = await parsePdf(atsPdf, testInfo.outputPath.bind(testInfo));
  expect(parsed.text).toContain('Ayo Synthetic');
  expect(parsed.text).toContain('Operations Analyst');

  await page.locator('.cv-export-modal [data-export-close]').click();
  await expect(page.locator('.cv-export-modal-overlay.open')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Export CV' })).not.toBeVisible();

  await page.locator('[data-action="import"]').first().click();
  await expect(page.getByText('TXT works now. PDF/DOCX will be parsed only if a compatible parser is already loaded.')).toBeVisible();
  await expect(page.getByText('Your current CV will not change until you confirm the import.')).toBeVisible();

  expect(consoleMessages).toEqual([]);
});

test('Try sample CV loads fake data, resets blank, and keeps raw content out of analytics', async ({ page }) => {
  const consoleMessages = installConsoleGuard(page);
  const consoleText = [];
  page.on('console', function (message) {
    if (message.text() === 'Service Worker registration blocked by Playwright') return;
    consoleText.push(message.text());
  });
  await installNetworkGate(page);
  await installAnalyticsRecorder(page);

  const response = await page.goto('/tools/cv-builder/', { waitUntil: 'domcontentloaded' });
  expect(response && response.status()).toBe(200);
  await page.waitForFunction(function () {
    return window.CVApp && window.CVSampleMode && window.CVExportUpgrade;
  });
  await page.evaluate(function () {
    localStorage.clear();
    localStorage.setItem('afrotools_cookie_consent', 'accepted');
    localStorage.setItem('afro_cv_list', JSON.stringify([{
      id: 'saved-fixture',
      title: 'Saved boundary fixture',
      data: { fn: 'Saved', ln: 'Fixture' },
      template: 'ats-classic',
      updatedAt: Date.now()
    }]));
  });

  await page.locator('[data-cv-sample]').click();
  await expect(page.locator('[data-cv-sample-status]')).toContainText('Synthetic sample loaded');
  await expect(page.locator('#cvpreview')).toContainText('Demo-Only Amina Example');
  await expect(page.locator('#cvpreview')).toContainText('This profile is synthetic');

  await expect.poll(async function () {
    return page.evaluate(function () { return window.CVApp.getState().country; });
  }).toBe('KE');
  await expect.poll(async function () {
    return page.evaluate(function () { return window.CVApp.getState().template; });
  }).toBe('ats-classic');

  await page.waitForTimeout(2200);
  expect(await page.evaluate(function () { return localStorage.getItem('afro_cv_data'); })).toBeNull();
  expect(await page.evaluate(function () { return JSON.parse(localStorage.getItem('afro_cv_list') || '[]')[0].id; })).toBe('saved-fixture');

  await page.locator('.cv-workspace-template-select').selectOption('lagos-corporate');
  await expect.poll(async function () {
    return page.evaluate(function () { return window.CVApp.getState().template; });
  }).toBe('lagos-corporate');

  await page.locator('.cv-toolbar-right [data-action="pdf"]').click();
  await expect(page.getByRole('dialog', { name: 'Export CV' })).toBeVisible();
  await expect(page.locator('.cv-export-drawer-shell [data-cv-export="pdf"]')).toBeVisible();
  await expect(page.locator('.cv-export-drawer-shell [data-cv-export="ats"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Export CV' })).not.toBeVisible();

  await page.locator('.cv-more-toggle').click();
  await expect(page.locator('.cv-more-menu [data-action="ats"]')).toBeVisible();
  await page.locator('.cv-more-menu [data-action="ats"]').click();
  const atsMatcher = page.locator('#cv-ats-match-modal.open');
  await expect(atsMatcher).toContainText('ATS and job match');
  await expect(atsMatcher).toContainText('Match your CV to a target role');
  await atsMatcher.locator('[data-ats-close]').click();

  await page.locator('[data-cv-reset]').click();
  await expect(page.locator('[data-cv-sample-status]')).toContainText('Blank CV restored');
  await expect(page.locator('#cvpreview')).not.toContainText('Demo-Only Amina Example');
  await expect.poll(async function () {
    return page.evaluate(function () { return window.CVApp.getState().data.fn; });
  }).toBe('');
  expect(await page.evaluate(function () { return localStorage.getItem('afro_cv_data'); })).toBeNull();
  expect(await page.evaluate(function () { return JSON.parse(localStorage.getItem('afro_cv_list') || '[]')[0].id; })).toBe('saved-fixture');

  const observed = await page.evaluate(function () {
    return JSON.stringify({
      analytics: window.__cvAnalyticsCalls || [],
      dataLayer: window.dataLayer || []
    });
  });
  const leakSurface = JSON.stringify({ analytics: observed, console: consoleText });
  [
    'Demo-Only Amina',
    'sample.cv@example.test',
    'Example Solar Cooperative',
    'Pan-African Demo College',
    '000 000 000',
    'Synthetic Market Desk'
  ].forEach(function (term) {
    expect(leakSurface).not.toContain(term);
  });
  expect(observed).toContain('sample_cv');
  expect(consoleMessages).toEqual([]);
});

test('Starter paths adjust guidance and structure without fake career claims', async ({ page }) => {
  const consoleMessages = installConsoleGuard(page);
  await installNetworkGate(page);
  await installAnalyticsRecorder(page);

  const response = await page.goto('/tools/cv-builder/', { waitUntil: 'domcontentloaded' });
  expect(response && response.status()).toBe(200);
  await page.waitForFunction(function () {
    return window.CVApp && window.CVSampleMode && window.CVStarterPaths && window.CVTemplateRegistry;
  });
  await page.evaluate(function () {
    localStorage.clear();
    sessionStorage.clear();
    window.CVSampleMode.resetBlank();
    localStorage.setItem('afro_cv_list', JSON.stringify([{
      id: 'starter-saved-fixture',
      title: 'Saved starter boundary',
      data: { fn: 'Saved', ln: 'Starter' },
      template: 'ats-classic',
      updatedAt: Date.now()
    }]));
  });

  await expect(page.locator('[data-cv-preset]')).toHaveCount(6);
  await expect(page.locator('[data-cv-preset="trade"]')).toContainText('Best for:');
  await expect(page.locator('[data-cv-preset="graduate"]')).toContainText('Best for:');

  await page.locator('[data-cv-preset="graduate"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cv-starter-panel]')).toContainText('Graduate / No Experience starter');
  await expect(page.locator('[data-cv-starter-panel]')).toContainText('Focus first: personal details, summary, education, skills, projects, languages.');
  await expect.poll(async function () {
    return page.evaluate(function () {
      var state = window.CVApp.getState();
      return {
        active: window.CVStarterPaths.getActive().id,
        country: state.country,
        template: state.template,
        title: state.data.title,
        summary: state.data.summary,
        showProjs: state.data.showProjs,
        showRefs: state.data.showRefs
      };
    });
  }).toEqual({
    active: 'graduate',
    country: 'GH',
    template: 'accra-graduate',
    title: '',
    summary: '',
    showProjs: true,
    showRefs: false
  });

  const expected = {
    professional: { country: 'NG', template: 'lagos-corporate' },
    tech: { country: 'KE', template: 'nairobi-tech' },
    government: { country: 'NG', template: 'ngo-development' },
    diaspora: { country: 'INTL', template: 'diaspora-international' },
    trade: { country: 'ZA', template: 'ats-classic' }
  };
  for (const id of Object.keys(expected)) {
    const card = page.locator('[data-cv-preset="' + id + '"]');
    if (id === 'trade') {
      await card.focus();
      await page.keyboard.press('Space');
    } else {
      await card.click();
    }
    await expect.poll(async function () {
      return page.evaluate(function () {
        var state = window.CVApp.getState();
        return {
          active: window.CVStarterPaths.getActive().id,
          country: state.country,
          template: state.template,
          title: state.data.title,
          summary: state.data.summary
        };
      });
    }).toEqual({
      active: id,
      country: expected[id].country,
      template: expected[id].template,
      title: '',
      summary: ''
    });
    await expect(page.locator('[data-cv-starter-panel]')).toContainText('Best for:');
    await expect(page.locator('[data-cv-starter-panel]')).toContainText('when you have real evidence');
  }

  await page.locator('[data-cv-preset="tech"]').click();
  await page.evaluate(function () {
    var state = window.CVApp.getState();
    Object.assign(state.data, {
      fn: 'Starter',
      ln: 'Fixture',
      title: 'Developer Candidate',
      summary: 'Synthetic starter fixture for testing preview structure only. It uses fake data so no private CV content is needed.',
      skills: {
        h: 'JavaScript, SQL, API testing',
        s: 'Problem solving, documentation',
        t: 'Git, Node.js, Playwright'
      },
      projs: [{
        n: 'Starter Demo App',
        url: '',
        tech: 'JavaScript, Node.js',
        d: 'Built a synthetic test project entry for preview validation.'
      }]
    });
    state.data.showProjs = true;
    window.CVApp.renderAll();
    window.CVStarterPaths.applyStarter('tech', { silent: true, noScroll: true });
  });
  await expect(page.locator('#cvpreview')).toContainText('Starter Fixture');
  await expect(page.locator('#cvpreview')).toContainText('Projects');
  await expect(page.locator('#cvpreview')).toContainText('Starter Demo App');
  expect(await page.locator('.cv-section.cv-starter-priority').count()).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('.cv-quick-start')).toBeVisible();
  await expect(page.locator('[data-cv-starter-panel]')).toBeVisible();

  expect(await page.evaluate(function () { return JSON.parse(localStorage.getItem('afro_cv_list') || '[]')[0].id; })).toBe('starter-saved-fixture');
  expect(consoleMessages).toEqual([]);
});

test('Privacy-preserving handoff links use local JSON and clean routes', async ({ page }) => {
  const consoleMessages = installConsoleGuard(page);
  await installNetworkGate(page);
  await installAnalyticsRecorder(page);

  const response = await page.goto('/tools/cv-builder/', { waitUntil: 'domcontentloaded' });
  expect(response && response.status()).toBe(200);
  await page.waitForFunction(function () {
    return window.CVApp && window.CVSampleMode && window.CVPrivacyHandoff;
  });
  await page.evaluate(function () {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.locator('[data-cv-sample]').click();
  await expect(page.locator('[data-cv-handoff-panel]')).toContainText('Local-only handoff');
  await expect.poll(async function () {
    return page.evaluate(function () {
      return {
        ready: window.CVPrivacyHandoff.isReady(),
        disabled: Array.from(document.querySelectorAll('[data-cv-handoff-link]')).some(function (link) {
          return link.getAttribute('aria-disabled') === 'true';
        })
      };
    });
  }).toEqual({ ready: true, disabled: false });

  const routes = await page.evaluate(function () {
    return Array.from(document.querySelectorAll('[data-cv-handoff-link]')).map(function (link) {
      var url = new URL(link.href);
      return {
        label: link.textContent.trim(),
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        href: link.getAttribute('href')
      };
    });
  });
  expect(routes).toEqual(expect.arrayContaining([
    expect.objectContaining({ label: 'Create matching cover letter', pathname: '/tools/cover-letter-generator/app.html', search: '', hash: '' }),
    expect.objectContaining({ label: 'Evaluate job offer', pathname: '/tools/job-offer-evaluator/', search: '', hash: '' }),
    expect.objectContaining({ label: 'Estimate salary/tax', pathname: '/salary-tax/', search: '', hash: '' }),
    expect.objectContaining({ label: 'Find scholarships', pathname: '/tools/scholarship-finder/', search: '', hash: '' })
  ]));
  ['Demo-Only Amina', 'sample.cv@example.test', 'Example Solar Cooperative', 'Synthetic Market Desk'].forEach(function (term) {
    routes.forEach(function (route) {
      expect(route.href).not.toContain(term);
    });
  });

  await page.locator('[data-cv-handoff-copy]').click();
  await expect(page.locator('[data-cv-handoff-status]')).toContainText(/Local JSON copied|Local handoff/);
  const localPacket = await page.evaluate(function () {
    return {
      handoff: JSON.parse(localStorage.getItem('afro_cv_handoff_v1') || 'null'),
      cover: localStorage.getItem('afrotools-cover-letter-current-v2')
    };
  });
  expect(localPacket.handoff.target).toBe('manual');
  expect(localPacket.handoff.payload.fullName).toBe('Demo-Only Amina Example');
  expect(localPacket.handoff.payload._handoff.privacy).toBe('local-only');
  expect(localPacket.cover).toBeNull();

  await page.locator('[data-cv-handoff-link="cover"]').click();
  await page.waitForURL('**/tools/cover-letter-generator/app.html', { waitUntil: 'domcontentloaded' });
  expect(new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).hash).toBe('');
  await expect(page.locator('#fullName')).toHaveValue('Demo-Only Amina Example');
  await expect(page.locator('#resumeSummary')).toHaveValue(/This is a clearly synthetic sample CV/);
  const coverPacket = await page.evaluate(function () {
    return {
      handoff: JSON.parse(localStorage.getItem('afro_cv_handoff_v1') || 'null'),
      cover: JSON.parse(localStorage.getItem('afrotools-cover-letter-current-v2') || 'null')
    };
  });
  expect(coverPacket.handoff.target).toBe('cover-letter');
  expect(coverPacket.handoff.payload._handoff.note).toContain('No raw CV text was added to the URL');
  expect(coverPacket.cover.fullName).toBe('Demo-Only Amina Example');

  expect(consoleMessages).toEqual([]);
});
