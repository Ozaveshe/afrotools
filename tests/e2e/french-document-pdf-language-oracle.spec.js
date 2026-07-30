const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
const config = require('../../data/localization/fr-document-pdf-parity.json');
const { signals } = require('../../scripts/audit-french-document-pdf-language.js');
const {
  PDFDocument,
  StandardFonts
} = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

let pdfFixture;
const runtimeReceipts = new Map();
const receiptFile = path.resolve(__dirname, '../../reports/french-document-pdf-runtime-language-receipts.json');

test.describe.configure({ mode: 'parallel' });

test.beforeAll(async ({ request }) => {
  const servedContract = await request.get('/data/localization/fr-document-pdf-parity.json');
  expect(servedContract.ok()).toBe(true);
  const servedApps = (await servedContract.json()).apps;
  expect(servedApps.map((app) => app.id)).toEqual(config.apps.map((app) => app.id));

  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage([420, 594]);
  page.drawText('DONNEE_SYNTHETIQUE_FR_2026', { x: 42, y: 520, size: 18, font });
  pdfFixture = Buffer.from(await document.save());
});

test.afterAll(() => {
  const rows = config.apps.map((app) => {
    const receipt = runtimeReceipts.get(app.id) || {};
    const publicRoute = receipt.publicRoute || {
      route: app.frenchRoute,
      accepted: false,
      findingCount: null,
      privacyLeakCount: null,
      reason: 'not-run'
    };
    const workspace = app.frenchWorkspaceRoute
      ? receipt.workspace || {
        route: app.frenchWorkspaceRoute,
        accepted: false,
        findingCount: null,
        privacyLeakCount: null,
        reason: 'not-run'
      }
      : null;
    return {
      id: app.id,
      publicRoute,
      workspace,
      accepted: publicRoute.accepted === true && (!workspace || workspace.accepted === true)
    };
  });
  const report = {
    schemaVersion: 1,
    locale: 'fr',
    category: 'document-pdf',
    denominator: rows.length,
    browserCases: rows.length + rows.filter((row) => row.workspace).length,
    accepted: rows.filter((row) => row.accepted).length,
    rows
  };
  fs.mkdirSync(path.dirname(receiptFile), { recursive: true });
  fs.writeFileSync(receiptFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
});

function browserFindings(snapshot, appId) {
  return snapshot
    .map((entry) => ({ ...entry, result: signals(entry.value, appId) }))
    .filter((entry) => entry.result)
    .map((entry) => ({
      surface: entry.surface,
      source: entry.value,
      text: entry.result.text.slice(0, 220),
      words: entry.result.words,
      strongPatterns: entry.result.strong,
      owner: entry.owner
    }));
}

async function exercise(page, app) {
  const sensitiveMarker = 'DONNEE_SYNTHETIQUE_FR_2026';
  const leaks = [];
  const dialogs = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  page.on('console', (message) => {
    if (message.text().includes(sensitiveMarker)) leaks.push(`console:${message.type()}`);
  });
  page.on('request', (request) => {
    if (request.url().includes(sensitiveMarker) || (request.postData() || '').includes(sensitiveMarker)) {
      leaks.push(`network:${request.method()}:${new URL(request.url()).pathname}`);
    }
  });

  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.goto(app.frenchRoute, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.documentElement.dataset.frDocumentPdfReady === 'true',
    null,
    { timeout: 10000 }
  );
  await page.locator('details').evaluateAll((items) => items.forEach((item) => { item.open = true; }));

  if (app.id !== 'cv-builder') {
    const fileInputs = page.locator('input[type="file"]');
    for (let index = 0; index < await fileInputs.count(); index += 1) {
      const input = fileInputs.nth(index);
      const accept = (await input.getAttribute('accept')) || '';
      if (accept && !/pdf|\*\/\*/i.test(accept)) continue;
      try {
        await input.setInputFiles({
          name: 'preuve-synthetique.pdf',
          mimeType: 'application/pdf',
          buffer: pdfFixture
        });
      } catch {
        // A route may deliberately constrain a non-PDF secondary input.
      }
    }
  }

  if (app.id === 'cv-builder') {
    await page.waitForFunction(
      () => window.CVApp
        && window.CVBuilderPolish
        && window.CVApp.renderAll.__frLocalizedOwner
        && window.CVBuilderPolish.openExportPanel.__frLocalizedOwner
    );
    await page.evaluate((marker) => {
      const state = window.CVApp.getState();
      Object.assign(state.data, {
        fn: 'Amina',
        ln: marker,
        title: 'Analyste',
        email: 'preuve@example.invalid',
        summary: `Profil synthétique ${marker}`,
        exps: [{ t: 'Analyste', c: 'Entreprise', d: 'Résultat synthétique vérifiable.' }],
        edus: [{ deg: 'Licence', sch: 'Université' }],
        skills: { h: 'Excel, SQL' }
      });
      window.CVApp.renderAll();
      window.CVBuilderPolish.openExportPanel();
    }, sensitiveMarker);
    await expect(page.locator('.cv-export-drawer-shell')).toBeVisible();
    await page.locator('body').dispatchEvent('click');
  } else {
    const textInputs = page.locator('input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="tel"], input[type="url"], textarea');
    for (let index = 0; index < Math.min(await textInputs.count(), 80); index += 1) {
      const input = textInputs.nth(index);
      if (!(await input.isVisible()) || !(await input.isEditable())) continue;
      const type = (await input.getAttribute('type')) || '';
      const value = type === 'email'
        ? 'preuve@example.invalid'
        : type === 'url'
          ? 'https://example.invalid/preuve'
          : sensitiveMarker;
      try {
        await input.fill(value);
      } catch {
        // Some accepted owners expose readonly mirrors through textarea elements.
      }
    }

    const checkboxes = page.locator('input[type="checkbox"], input[type="radio"]');
    for (let index = 0; index < Math.min(await checkboxes.count(), 30); index += 1) {
      const control = checkboxes.nth(index);
      if (!(await control.isVisible()) || !(await control.isEnabled())) continue;
      try {
        await control.check();
      } catch {
        // Radio/checkbox groups can be controlled by custom widgets.
      }
    }

    const buttons = page.getByRole('button');
    for (let index = 0; index < Math.min(await buttons.count(), 24); index += 1) {
      const button = buttons.nth(index);
      if (!(await button.isVisible()) || !(await button.isEnabled())) continue;
      const label = `${await button.innerText().catch(() => '')} ${await button.getAttribute('aria-label') || ''}`;
      if (/cookie|th[eè]me|menu|supprimer le compte|envoyer .*ia|assistance ia|partager/i.test(label)) continue;
      try {
        await button.evaluate((element) => element.click());
        await page.waitForTimeout(20);
      } catch {
        // Downloads, transient canvases and route-specific modal locks are covered
        // by the format suite; this pass is only opening runtime language states.
      }
    }
  }

  await page.waitForTimeout(app.id === 'cv-builder' ? 800 : 300);
  await page.locator('details').evaluateAll((items) => items.forEach((item) => { item.open = true; }));
  const snapshot = await page.evaluate(() => {
    const output = [];
    const ignored = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CODE', 'PRE']);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || ignored.has(parent.tagName)) continue;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const value = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
      if (value) output.push({
        surface: 'runtime.text',
        value,
        owner: parent.outerHTML.slice(0, 320)
      });
    }
    document.querySelectorAll('[placeholder],[title],[aria-label],[aria-description],[alt]').forEach((element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      ['placeholder', 'title', 'aria-label', 'aria-description', 'alt'].forEach((name) => {
        const value = element.getAttribute(name);
        if (value) output.push({ surface: `runtime.${name}`, value });
      });
    });
    document.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]').forEach((element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const value = String(element.value == null ? element.textContent : element.value).trim();
      if (value) output.push({ surface: 'runtime.value', value, owner: element.outerHTML.slice(0, 320) });
    });
    return output;
  });
  dialogs.forEach((value) => snapshot.push({ surface: 'runtime.dialog', value }));
  return { findings: browserFindings(snapshot, app.id), leaks };
}

for (const app of config.apps) {
  test(`${app.id}: runtime language oracle after exercising controls`, async ({ page }) => {
    if (app.id === 'cv-builder') test.setTimeout(180_000);
    const result = await exercise(page, app);
    if (process.env.FRENCH_LANGUAGE_DEBUG === '1' && result.findings.length) {
      const unique = [...new Map(
        result.findings.map((finding) => [
          `${finding.surface}\u0000${finding.text}`,
          { surface: finding.surface, source: finding.source, text: finding.text }
        ])
      ).values()];
      console.log(JSON.stringify(unique, null, 2));
      expect(result.leaks, 'synthetic sensitive marker leaked outside page state').toEqual([]);
      return;
    }
    expect(result.leaks, 'synthetic sensitive marker leaked outside page state').toEqual([]);
    const receipt = runtimeReceipts.get(app.id) || {};
    receipt.publicRoute = {
      route: app.frenchRoute,
      accepted: result.leaks.length === 0 && result.findings.length === 0,
      findingCount: result.findings.length,
      privacyLeakCount: result.leaks.length
    };
    runtimeReceipts.set(app.id, receipt);
    expect(result.findings, 'visible runtime English after interaction').toEqual([]);
  });
}

for (const app of config.apps.filter((entry) => entry.frenchWorkspaceRoute)) {
  test(`${app.id}: private workspace runtime language and privacy oracle`, async ({ page }) => {
    const workspace = { ...app, frenchRoute: app.frenchWorkspaceRoute };
    const result = await exercise(page, workspace);
    expect(result.leaks, 'synthetic sensitive marker leaked outside private workspace state').toEqual([]);
    const receipt = runtimeReceipts.get(app.id) || {};
    receipt.workspace = {
      route: app.frenchWorkspaceRoute,
      accepted: result.leaks.length === 0 && result.findings.length === 0,
      findingCount: result.findings.length,
      privacyLeakCount: result.leaks.length
    };
    runtimeReceipts.set(app.id, receipt);
    expect(result.findings, 'visible private-workspace runtime English after interaction').toEqual([]);
  });
}
