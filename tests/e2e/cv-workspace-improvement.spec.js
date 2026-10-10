const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const locales = [
  { lang: 'en', route: '/tools/cv-builder/', button: 'Improve wording', experience: 'Experience to improve', option: 'Rewrite option 1', unavailable: 'still loading', missing: 'Enable projects' },
  { lang: 'fr', route: '/fr/tools/generateur-cv/', button: 'Améliorer la formulation', experience: 'Expérience à améliorer', option: 'Proposition de reformulation 1', unavailable: 'en cours de chargement', missing: 'Activez les projets' },
  { lang: 'sw', route: '/sw/zana/mjenzi-cv/', button: 'Boresha maneno', experience: 'Uzoefu wa kuboresha', option: 'Chaguo la kuandika upya 1', unavailable: 'bado anapakiwa', missing: 'Washa miradi' }
];

async function openWorkspace(page, baseURL, locale, width) {
  await page.setViewportSize({ width, height: 844 });
  const observed = { sends: 0, errors: [] };
  page.on('pageerror', error => observed.errors.push(error.name));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { observed.sends++; return route.abort(); }
    if (url.origin !== new URL(baseURL).origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return route.abort();
    return route.continue();
  });
  await page.goto(locale.route);
  await page.waitForFunction(() => window.CVApp && window.CVImproveAssistant);
  if (!await page.locator('.cv-app').isVisible()) {
    await page.locator('[data-cv-entry]:visible').first().click();
    await expect(page.locator('[data-path="fn"]')).toBeFocused();
  }
  await page.evaluate(() => {
    const state = CVApp.getState();
    Object.assign(state.data, {
      fn: 'Synthetic', ln: 'Applicant', title: 'Synthetic Analyst', summary: 'Synthetic summary Ɗ ƙ ƴ',
      exps: [{ t: 'First role', c: 'Example A', d: 'First experience remains intact' }, { t: 'Second role', c: 'Example B', d: 'Second experience to improve' }],
      projs: [{ n: 'First project', d: 'First project remains intact' }, { n: 'Second project', d: 'Second project to improve' }],
      showProjs: true, skills: { h: 'Synthetic technical skills', s: 'Synthetic teamwork', t: 'Synthetic software' }
    });
    for (const key of Object.keys(state.colOpen)) state.colOpen[key] = true;
    CVApp.renderAll();
    window.__workspaceToasts = [];
    CVApp.showToast = message => window.__workspaceToasts.push(message);
  });
  await expect(page.locator('[data-section="exp"] .cv-ai-placeholder')).toHaveText(locale.button);
  return observed;
}

async function triggerDialog(page, section) {
  const trigger = page.locator(`[data-section="${section}"] .cv-ai-placeholder`);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cv-improve-input')).toBeFocused();
  return trigger;
}

for (const locale of locales) for (const width of [320, 1280]) {
  test(`workspace rewrites only the selected field after Apply: ${locale.lang} ${width}`, async ({ page, baseURL }) => {
    const observed = await openWorkspace(page, baseURL, locale, width);
    for (const item of [
      { section: 'summary', path: 'summary', input: 'Synthetic summary Ɗ ƙ ƴ' },
      { section: 'exp', path: 'exps.1.d', input: 'Second experience to improve' },
      { section: 'skills', path: 'skills.h', input: 'Synthetic technical skills, Synthetic teamwork, Synthetic software' },
      { section: 'projs', path: 'projs.1.d', input: 'Second project to improve' }
    ]) {
      const before = await page.evaluate(() => CVApp.getState().data);
      if (item.section === 'exp' || item.section === 'projs') {
        const select = page.locator(`[data-workspace-improve-entry="${item.section}"]`);
        await expect(select.locator('option')).toHaveCount(2);
        expect(await select.evaluate(el => el.labels.length)).toBeGreaterThan(0);
        if (item.section === 'exp') await expect(select).toHaveAccessibleName(locale.experience);
        await select.focus();
        await page.keyboard.press('Home');
        await page.keyboard.press('ArrowDown');
        await expect(select).toHaveValue(item.path);
      }
      const trigger = await triggerDialog(page, item.section);
      await expect(page.locator('#cv-improve-input')).toHaveValue(item.input);
      await expect(page.locator('[data-option-edit]')).toHaveCount(3);
      await expect(page.locator('[data-option-edit="0"]')).toHaveAccessibleName(locale.option);
      expect(await page.evaluate(() => CVApp.getState().data)).toEqual(before);
      const consent = page.waitForEvent('dialog').then(async dialog => {
        expect(dialog.type()).toBe('confirm');
        await dialog.dismiss();
      });
      await Promise.all([consent, page.locator('[data-ai-options]').click()]);
      await expect(page.locator('[data-improve-status]')).toContainText(/Template|modèle|kiolezo|Violezo/i);
      expect(observed.sends).toBe(0);
      expect(await page.evaluate(() => CVApp.getState().data)).toEqual(before);
      const value = `Reviewed synthetic ${item.section} Ɗ ƙ ƴ`;
      await page.locator('[data-option-edit="0"]').fill(value);
      await page.locator('[data-apply-option="0"]').click();
      const expected = structuredClone(before), keys = item.path.split('.');
      let target = expected;
      for (const key of keys.slice(0, -1)) target = target[key];
      target[keys.at(-1)] = value;
      expect(await page.evaluate(() => CVApp.getState().data)).toEqual(expected);
      await expect(trigger).toBeFocused();
    }
    await page.evaluate(() => {
      const state = CVApp.getState();
      state.data.showProjs = false;
      state.colOpen.projs = true;
      CVApp.renderEditor();
    });
    const beforeMissing = await page.evaluate(() => CVApp.getState().data);
    await page.locator('[data-section="projs"] .cv-ai-placeholder').click();
    await expect(page.locator('#cv-improve-assistant-modal')).not.toHaveClass(/open/);
    expect(await page.evaluate(() => window.__workspaceToasts.at(-1))).toContain(locale.missing);
    await page.evaluate(() => { window.CVImproveAssistant = null; });
    await page.locator('[data-section="skills"] .cv-ai-placeholder').click();
    expect(await page.evaluate(() => window.__workspaceToasts.at(-1))).toContain(locale.unavailable);
    expect(await page.evaluate(() => CVApp.getState().data)).toEqual(beforeMissing);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(observed).toEqual({ sends: 0, errors: [] });
  });

  test(`improvement dialog contains and restores keyboard focus: ${locale.lang} ${width}`, async ({ page, baseURL }) => {
    const observed = await openWorkspace(page, baseURL, locale, width);
    const trigger = await triggerDialog(page, 'summary');
    const overlay = page.locator('#cv-improve-assistant-modal');
    const controls = overlay.locator('button:not([disabled]):visible,input:not([disabled]):visible,select:not([disabled]):visible,textarea:not([disabled]):visible,a[href]:visible,[tabindex="0"]:visible');
    await controls.last().focus();
    await page.keyboard.press('Tab');
    await expect(controls.first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(controls.last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
    await expect(trigger).toBeFocused();
    await triggerDialog(page, 'summary');
    await page.locator('[data-improve-close]').click();
    await expect(trigger).toBeFocused();
    await triggerDialog(page, 'summary');
    await page.locator('[data-path="fn"]').focus();
    await expect(page.locator('#cv-improve-input')).toBeFocused();
    await page.locator('[data-improve-tone="shorter"]').click();
    await expect(page.locator('[data-improve-tone="shorter"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-improve-tone="stronger"]')).toHaveAttribute('aria-pressed', 'false');
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    await page.waitForFunction(() => document.querySelector('#cv-improve-assistant-modal').getAnimations({ subtree: true }).every(animation => animation.playState !== 'running'));
    const audit = await page.evaluate(async () => {
      const result = await axe.run({ include: [['#cv-improve-assistant-modal']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
      return { violations: result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), incomplete: result.incomplete.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, checks: n.any.concat(n.all, n.none).map(c => ({ id: c.id, message: c.message, data: c.data })) })) })) };
    });
    expect(audit).toEqual({ violations: [], incomplete: [] });
    expect(await page.locator('[data-improve-close]').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(38);
    expect(await overlay.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const point = await page.evaluate(() => {
      const overlay = document.querySelector('#cv-improve-assistant-modal');
      return [[1, 1], [innerWidth - 2, 1], [1, innerHeight - 2], [innerWidth - 2, innerHeight - 2]].find(([x, y]) => document.elementFromPoint(x, y) === overlay) || null;
    });
    if (width === 1280) expect(point).not.toBeNull();
    if (point) await page.mouse.click(...point);
    else await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
    await expect(trigger).toBeFocused();
    expect(observed).toEqual({ sends: 0, errors: [] });
  });
}
