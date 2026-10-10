'use strict';
const { test, expect } = require('@playwright/test');
const routes = [
  ['en', '/tools/cv-builder/'],
  ['fr', '/fr/tools/generateur-cv/'],
  ['sw', '/sw/zana/mjenzi-cv/']
];

async function focusEdge(modal, last) {
  await modal.evaluate((el, last) => {
    const nodes = [...el.querySelectorAll('button:not([disabled]),textarea:not([disabled]),input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter(e => e.tabIndex >= 0 && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    nodes[last ? nodes.length - 1 : 0].focus();
  }, last);
}
async function checkTrap(page, modal) {
  await focusEdge(modal, true); await page.keyboard.press('Tab');
  expect(await modal.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await focusEdge(modal, false); await page.keyboard.press('Shift+Tab');
  expect(await modal.evaluate(el => el.contains(document.activeElement))).toBe(true);
}

for (const [locale, route] of routes) for (const width of [320, 1280]) {
  test(`${locale} ${width}px native CV keyboard, history and starter repairs`, async ({ page }) => {
    test.setTimeout(90000);
    const errors = [], sensitiveWrites = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.method() !== 'GET' && /Synthetic|Historical summary/.test(request.postData() || '')) sensitiveWrites.push(request.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(route);
    await page.waitForFunction(() => window.CVApp && window.CVATSMatcher && window.CVStarterPaths && typeof CVAdvanced !== 'undefined');
    const build = page.locator('[data-cv-flow-action="build"]:visible').first();
    if (await build.count()) await build.click();
    await page.evaluate(() => {
      const s = CVApp.getState(); s.data.fn = 'Synthetic'; s.data.summary = 'Synthetic draft'; CVApp.renderAll();
    });
    const phoneOutputs = await page.evaluate(() => {
      const data = CVApp.getState().data; data.phoneCode = '+234'; data.phone = '';
      const before = JSON.stringify(data);
      const pack = CVApplicationPack.generatePack(data, { role: 'Synthetic role', company: 'Synthetic company', tone: 'formal' });
      return { phone: CVPrivacyHandoff.buildPayload().phone, letter: pack.coverLetter,
        ats: CVAtsPlainMode.buildText(data), unchanged: JSON.stringify(data) === before };
    });
    expect(phoneOutputs.phone).toBe(''); expect(phoneOutputs.letter).not.toContain('+234');
    expect(phoneOutputs.ats).not.toContain('+234'); expect(phoneOutputs.unchanged).toBe(true);
    const opener = page.locator('.cv-form-panel input:visible').first();
    await opener.focus();
    await page.evaluate(() => { window.__repairOpener = document.activeElement; CVATSMatcher.open(CVApp.getState().data, 'NG'); });
    const ats = page.locator('#cv-ats-match-modal');
    await expect(ats.locator('#cv-ats-jd')).toBeFocused();
    await checkTrap(page, ats);
    await ats.locator('#cv-ats-jd').focus(); await page.keyboard.press('Escape');
    await expect(ats).not.toHaveClass(/open/);
    expect(await page.evaluate(() => document.activeElement === window.__repairOpener)).toBe(true);
    await expect(ats.locator('[data-ats-status]')).toHaveAttribute('role', 'status');
    await page.evaluate(() => CVATSMatcher.open(CVApp.getState().data, 'NG'));
    await ats.locator('[data-ats-close]').click();
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.activeElement === window.__repairOpener)).toBe(true);

    const sampleButton = page.locator('[data-cv-sample]:visible').first();
    await sampleButton.click();
    const sample = page.locator('.cv-sample-panel');
    await expect(sample).toBeVisible(); await expect(sample).toHaveAttribute('role', 'dialog');
    await checkTrap(page, sample);
    const persona = sample.locator('[data-cv-sample-persona]').last();
    const personaId = await persona.getAttribute('data-cv-sample-persona');
    await persona.click();
    await expect(sample.locator(`[data-cv-sample-persona="${personaId}"]`)).toBeFocused();
    await page.keyboard.press('Escape'); await expect(sample).toBeHidden();
    await expect(sampleButton).toBeFocused();
    expect(await page.evaluate(() => CVApp.getState().data.summary)).toBe('Synthetic draft');
    await page.evaluate(() => localStorage.setItem('afro_cv_list', JSON.stringify([{ id: 'retained-synthetic', data: { fn: 'Saved fixture' } }])));
    await sampleButton.click(); await sample.locator('[data-cv-sample-use]').click();
    await expect(sample).toBeHidden();
    expect(await page.evaluate(() => document.activeElement.getClientRects().length > 0 && !!document.activeElement.closest('.cv-app'))).toBe(true);
    await sampleButton.click(); await sample.locator('[data-cv-reset]').click();
    await expect(sample).toBeHidden();
    expect(await page.evaluate(() => document.activeElement.getClientRects().length > 0)).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afro_cv_list'))[0].id)).toBe('retained-synthetic');

    for (const schema of ['manual', 'autosave']) {
      const expected = await page.evaluate(schema => {
        const data = JSON.parse(JSON.stringify(CVApp.getState().data));
        Object.assign(data, { fn: 'Synthetic historical', phone: '', summary: 'Historical summary',
          exps: [], projs: [], certs: [], refs: [], langs: [], showPhoto: false, photo: '', showRefs: false,
          skills: { h: 'Historical SQL', s: '', t: '' }, customSections: [] });
        const row = { data, template: 'slate', country: 'NG' };
        if (schema === 'manual') Object.assign(row, { id: 7, ts: '2026-01-01T00:00:00Z', label: 'Synthetic history' });
        else row.timestamp = 1767225600000;
        localStorage.setItem('afro_cv_versions', JSON.stringify([row]));
        CVApp.setTopState('data', { ...data, summary: 'Newer draft', phone: '000', showRefs: true, refs: [{ n: 'Synthetic referee' }] });
        CVApp.renderAll(); CVAdvanced.openVersionHistory(); return data;
      }, schema);
      const history = page.locator('#cv-adv-versions');
      await expect(history.locator('.cv-modal')).toHaveAttribute('role', 'dialog'); await checkTrap(page, history);
      await history.locator('[data-ver-id]').first().click(); await history.locator('#adv-ver-restore').click();
      expect(await page.evaluate(() => JSON.stringify(CVApp.getState().data))).toBe(JSON.stringify(expected));
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afro_cv_data') || '{}').data)).toEqual(expected);
    }
    for (const invalid of [{ bad: 'root' }, [null, {}, 'invalid', { data: [] }]]) {
      await page.evaluate(value => { localStorage.setItem('afro_cv_versions', JSON.stringify(value)); CVAdvanced.openVersionHistory(); }, invalid);
      await expect(page.locator('#cv-adv-versions [data-ver-id]')).toHaveCount(0);
      await page.keyboard.press('Escape'); await expect(page.locator('#cv-adv-versions')).not.toHaveClass(/open/);
    }
    await page.evaluate(() => {
      const data = JSON.parse(JSON.stringify(CVApp.getState().data));
      localStorage.setItem('afro_cv_versions', JSON.stringify([
        { id: 7, data: { ...data, summary: 'First duplicate' }, ts: 'invalid', label: 'First' },
        { id: 7, data, timestamp: 1767225600000, label: 'Second' }
      ])); CVAdvanced.openVersionHistory();
    });
    const versions = page.locator('#cv-adv-versions [data-ver-id]');
    expect(new Set(await versions.evaluateAll(nodes => nodes.map(n => n.dataset.verId))).size).toBe(2);
    await versions.last().click(); await page.locator('#adv-ver-restore').click();
    expect(await page.evaluate(() => CVApp.getState().data.summary)).toBe('Historical summary');
    for (const id of ['graduate', 'professional', 'tech', 'government', 'diaspora', 'trade']) {
      await page.locator(`[data-cv-preset="${id}"]:visible`).first().click();
      await page.waitForFunction(id => CVStarterPaths.getActive()?.id === id && document.querySelector('[data-cv-starter-panel]')?.dataset.starterId === id, id);
      await page.waitForFunction(() => {
        const guidance = CVStarterPaths.getActive().guidance.summary;
        const localizer = window.AfroTools?.SwahiliDocumentPdfLocalizer;
        const expected = document.documentElement.lang === 'sw' && localizer ? localizer.translate(guidance) : guidance;
        return document.querySelector('[data-section="summary"] .cv-section-guidance p')?.textContent === expected;
      });
      expect(await page.evaluate(() => CVApp.getState().data.summary)).toBe('Historical summary');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(errors).toEqual([]); expect(sensitiveWrites).toEqual([]);
  });
}
